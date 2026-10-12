import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RoleRoute from './RoleRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

type AuthValue = ReturnType<typeof useAuth>;

function mockAuth(value: Partial<AuthValue>) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    roleIds: [],
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    fetchCurrentUser: vi.fn(),
    ...value,
  } as AuthValue);
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/app" element={<RoleRoute roles={['secretaria']} />}>
          <Route path="verificar/:id" element={<p>Contenido protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('RoleRoute', () => {
  it('envía al login y recuerda el destino si no hay sesión', () => {
    mockAuth({ isAuthenticated: false });
    renderAt('/app/verificar/8?x=1');
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(sessionStorage.getItem('auth_redirect_to')).toBe('/app/verificar/8?x=1');
  });

  it('bloquea a un rol sin permiso', () => {
    mockAuth({ isAuthenticated: true, token: 't', roleIds: ['estudiante'] });
    renderAt('/app/verificar/8');
    expect(screen.getByText('No tienes permiso para ver este módulo')).toBeInTheDocument();
  });

  it('muestra el contenido al rol permitido', () => {
    mockAuth({ isAuthenticated: true, token: 't', roleIds: ['secretaria'] });
    renderAt('/app/verificar/8');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
