import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, FileSearch, ShieldAlert, XCircle } from 'lucide-react';
import { formatDateTimeReadable } from '@/lib/datetime';
import {
  parseDocumentId,
  verifyDocument,
  type DocumentVerification,
} from '../api';

type State =
  | { status: 'idle' }
  | { status: 'loading'; id: number }
  | { status: 'done'; id: number; result: DocumentVerification }
  | { status: 'error'; id: number; message: string };

function errorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 404) return 'No existe un documento con ese número.';
  if (status === 403) {
    return 'Su cuenta no tiene acceso a este documento. Solo pueden verificarlo quienes participan en el trámite o lo generaron.';
  }
  return 'No se pudo verificar el documento. Intente nuevamente.';
}

/**
 * Verificación de autenticidad e integridad de un documento institucional
 * (GET /documentos/{id}/verificar). Aunque openapi.yaml la describe como
 * "pública", en routes/api.php el endpoint está dentro del grupo
 * auth:sanctum y además exige permiso sobre el documento, por eso esta
 * pantalla vive dentro de /app y requiere sesión.
 */
export default function DocumentVerificationPage() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const documentId = parseDocumentId(idParam);
  const [input, setInput] = useState(idParam ?? '');
  const [inputError, setInputError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    if (documentId === null) return;
    let active = true;
    // Se programa en microtarea para no actualizar estado de forma síncrona
    // dentro del efecto.
    void Promise.resolve()
      .then(() => {
        if (active) setState({ status: 'loading', id: documentId });
        return verifyDocument(documentId);
      })
      .then((result) => {
        if (active) setState({ status: 'done', id: documentId, result });
      })
      .catch((err: unknown) => {
        if (active) {
          setState({ status: 'error', id: documentId, message: errorMessage(err) });
        }
      });
    return () => {
      active = false;
    };
  }, [documentId]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseDocumentId(input);
    if (parsed === null) {
      setInputError('Ingrese un número de documento válido (solo dígitos).');
      return;
    }
    setInputError(null);
    navigate(`/app/verificar/${parsed}`);
  };

  const invalidParam = idParam !== undefined && documentId === null;

  return (
    <section
      className="glass-panel wide-container mx-auto"
      style={{ textAlign: 'left' }}
      aria-labelledby="verify-title"
    >
      <h1 id="verify-title" className="title-primary flex items-center gap-3">
        <FileSearch size={28} aria-hidden /> Verificar documento
      </h1>
      <p className="text-muted mt-1 mb-6">
        Compruebe que un documento institucional no fue alterado y que sus
        firmas son válidas.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 mb-6" noValidate>
        <label htmlFor="document-id" className="sr-only">
          Número de documento
        </label>
        <input
          id="document-id"
          className="input"
          inputMode="numeric"
          placeholder="Número de documento"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-invalid={inputError ? true : undefined}
          aria-describedby={inputError ? 'document-id-error' : undefined}
        />
        <button type="submit" className="btn btn-primary">
          Verificar
        </button>
      </form>
      {(inputError || invalidParam) && (
        <p id="document-id-error" className="text-danger-text text-sm mb-4" role="alert">
          {inputError ?? 'El número de documento de la dirección no es válido.'}
        </p>
      )}

      {state.status === 'loading' && (
        <p role="status" className="text-muted">
          Verificando documento #{state.id}…
        </p>
      )}

      {state.status === 'error' && (
        <div className="error-banner flex items-start gap-3" role="alert">
          <ShieldAlert size={18} className="text-danger flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-danger-text text-sm">{state.message}</p>
        </div>
      )}

      {state.status === 'done' && <VerificationResult result={state.result} />}
    </section>
  );
}

function VerificationResult({ result }: { result: DocumentVerification }) {
  const signatures = Array.isArray(result.signatures) ? result.signatures : [];
  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          result.valid
            ? 'border-green-200 bg-green-50 text-green-900'
            : 'border-red-200 bg-red-50 text-red-900'
        }`}
      >
        {result.valid ? (
          <CheckCircle2 size={22} aria-hidden />
        ) : (
          <XCircle size={22} aria-hidden />
        )}
        <div>
          <p className="font-bold">
            {result.valid
              ? `Documento #${result.document_id} válido`
              : `Documento #${result.document_id} no válido`}
          </p>
          <p className="text-sm mt-1">
            {result.file_integrity_valid
              ? 'El archivo no fue modificado desde que se generó.'
              : 'El archivo fue modificado o no se pudo comprobar su integridad.'}
          </p>
          {signatures.length === 0 && (
            <p className="text-sm mt-1">El documento todavía no tiene firmas registradas.</p>
          )}
        </div>
      </div>

      {signatures.length > 0 && (
        <table className="w-full text-sm">
          <caption className="text-left font-semibold mb-2">Firmas</caption>
          <thead>
            <tr className="text-left text-slate-500">
              <th scope="col">Cargo</th>
              <th scope="col">Firmante</th>
              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {signatures.map((sig) => (
              <tr key={sig.slot} className="border-t border-slate-200">
                <td>{sig.label || sig.slot}</td>
                <td>{sig.signer || '—'}</td>
                <td>{formatDateTimeReadable(sig.signed_at)}</td>
                <td className={sig.valid ? 'text-green-700' : 'text-red-700'}>
                  {sig.valid ? 'Válida' : 'No válida'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
