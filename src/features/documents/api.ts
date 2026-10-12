import api from '@/services/api';

/** Firma individual devuelta por GET /documentos/{id}/verificar. */
export interface SignatureVerification {
  slot: string;
  label: string | null;
  signer: string;
  signed_at: string | null;
  fingerprint: string | null;
  valid: boolean;
}

/**
 * Respuesta de InstitutionalDocumentController::verify.
 * `valid` es verdadero solo si el archivo no fue alterado y todas las firmas
 * registradas son válidas (y existe al menos una).
 */
export interface DocumentVerification {
  document_id: number;
  valid: boolean;
  file_integrity_valid: boolean;
  signatures: SignatureVerification[];
}

export const verifyDocument = async (
  documentId: number
): Promise<DocumentVerification> => {
  const response = await api.get<DocumentVerification>(
    `/documentos/${documentId}/verificar`
  );
  return response.data;
};

/** Acepta solo identificadores enteros positivos (como espera el backend). */
export function parseDocumentId(raw: string | null | undefined): number | null {
  const value = (raw ?? '').trim();
  if (!/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}
