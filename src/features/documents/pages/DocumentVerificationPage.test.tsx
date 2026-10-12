import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentVerificationPage from './DocumentVerificationPage';
import { parseDocumentId, verifyDocument } from '../api';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();
  return { ...actual, verifyDocument: vi.fn() };
});

const mockedVerify = vi.mocked(verifyDocument);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/verificar" element={<DocumentVerificationPage />} />
        <Route path="/app/verificar/:id" element={<DocumentVerificationPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('parseDocumentId', () => {
  it('acepta solo enteros positivos', () => {
    expect(parseDocumentId('15')).toBe(15);
    expect(parseDocumentId(' 7 ')).toBe(7);
    expect(parseDocumentId('0')).toBeNull();
    expect(parseDocumentId('-3')).toBeNull();
    expect(parseDocumentId('1e3')).toBeNull();
    expect(parseDocumentId('abc')).toBeNull();
    expect(parseDocumentId(undefined)).toBeNull();
  });
});

describe('DocumentVerificationPage', () => {
  beforeEach(() => {
    mockedVerify.mockReset();
  });

  it('muestra un documento válido con sus firmas', async () => {
    mockedVerify.mockResolvedValue({
      document_id: 5,
      valid: true,
      file_integrity_valid: true,
      signatures: [
        {
          slot: 'secretaria',
          label: 'Secretaría',
          signer: 'Ana Pérez',
          signed_at: '2026-10-01T10:00:00-05:00',
          fingerprint: 'abc',
          valid: true,
        },
      ],
    });

    renderAt('/app/verificar/5');

    expect(await screen.findByText('Documento #5 válido')).toBeInTheDocument();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Válida')).toBeInTheDocument();
    expect(mockedVerify).toHaveBeenCalledWith(5);
  });

  it('marca como no válido un documento alterado', async () => {
    mockedVerify.mockResolvedValue({
      document_id: 9,
      valid: false,
      file_integrity_valid: false,
      signatures: [],
    });

    renderAt('/app/verificar/9');

    expect(await screen.findByText('Documento #9 no válido')).toBeInTheDocument();
    expect(screen.getByText(/fue modificado/)).toBeInTheDocument();
  });

  it('explica cuando la cuenta no tiene acceso (403)', async () => {
    mockedVerify.mockRejectedValue({ response: { status: 403 } });
    renderAt('/app/verificar/3');
    expect(await screen.findByText(/no tiene acceso a este documento/)).toBeInTheDocument();
  });

  it('valida el número ingresado sin llamar al API', async () => {
    renderAt('/app/verificar');
    await userEvent.type(screen.getByLabelText('Número de documento'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('número de documento válido');
    expect(mockedVerify).not.toHaveBeenCalled();
  });
});
