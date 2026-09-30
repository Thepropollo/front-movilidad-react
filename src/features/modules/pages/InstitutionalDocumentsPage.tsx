import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Download, Eye, FileUp, FileText, PenLine, Eraser } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { downloadApiFile, fetchApiBlob } from '@/services/download';
import { modulesApi } from '../api';
import Modal from '@/components/Modal';

type Catalog = Record<string, { code: string; label: string }>;

type SignatureSlot = {
  slot: string;
  label: string;
  signed: boolean;
  signer?: string | null;
  signed_at?: string | null;
  can_sign: boolean;
  valid?: boolean | null;
  fingerprint?: string | null;
};

type DocRow = {
  id: number;
  document_type: string;
  source: string;
  request_id: number | null;
  work_order_id: number | null;
  issue_log_id: number | null;
  original_filename: string;
  created_at?: string;
  author?: { first_name: string; last_name: string };
  request?: { destination?: string };
  signature_slots?: SignatureSlot[];
};

export default function InstitutionalDocumentsPage() {
  const { roleIds } = useAuth();
  const [catalog, setCatalog] = useState<Catalog>({});
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [solicitudes, setSolicitudes] = useState<Array<{ id: number; destination: string }>>([]);
  const [orders, setOrders] = useState<Array<{ id: number }>>([]);
  const [issues, setIssues] = useState<Array<{ id: number }>>([]);
  const [type, setType] = useState('orden_movilizacion');
  const [requestId, setRequestId] = useState<number | ''>('');
  const [workOrderId, setWorkOrderId] = useState<number | ''>('');
  const [issueLogId, setIssueLogId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<DocRow | null>(null);
  const [mode, setMode] = useState<'view' | 'sign'>('view');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [signSlot, setSignSlot] = useState('');
  const [signPassword, setSignPassword] = useState('');
  const [signOk, setSignOk] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const isSecretaria = roleIds.includes('secretaria');
  const isMechanic = roleIds.includes('mecanico');
  const isDriver = roleIds.includes('conductor');

  const allowedTypes = useMemo(() => {
    const keys = Object.keys(catalog);
    if (isSecretaria) return keys;
    return keys.filter((key) => {
      if (['orden_movilizacion', 'hoja_ruta'].includes(key)) return true;
      if (['acta_entrega', 'orden_taller', 'provision_lubricantes', 'control_aceite'].includes(key))
        return isMechanic;
      if (key === 'libro_novedades') return isMechanic || isDriver;
      if (key === 'informe_mensual') return roleIds.includes('vicerrector');
      return false;
    });
  }, [catalog, isSecretaria, isMechanic, isDriver, roleIds]);

  const load = async () => {
    const [{ data: cat }, { data: list }, solicitudesRes] = await Promise.all([
      api.get('/documentos/catalogo'),
      api.get('/documentos'),
      modulesApi.listSolicitudes().catch(() => ({ data: [] })),
    ]);
    setCatalog(cat || {});
    setDocs(list || []);
    setSolicitudes(solicitudesRes.data || []);
    if (isMechanic || isSecretaria) {
      const { data: ot } = await modulesApi.workOrders().catch(() => ({ data: [] }));
      setOrders(ot || []);
      const { data: nov } = await modulesApi.listNovelties().catch(() => ({ data: { issues: [] } }));
      setIssues(nov?.issues || []);
    }
  };

  useEffect(() => {
    void load().catch(() => setError('No se pudieron cargar documentos.'));
  }, []);

  useEffect(() => {
    if (allowedTypes.length && !allowedTypes.includes(type)) {
      setType(allowedTypes[0]);
    }
  }, [allowedTypes, type]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchBlob = async (id: number) => {
    return fetchApiBlob(`/documentos/${id}/archivo`);
  };

  const openDocument = async (doc: DocRow, nextMode: 'view' | 'sign') => {
    setError(null);
    setBusy(true);
    try {
      const blob = await fetchBlob(doc.id);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setActive(doc);
      setMode(nextMode);
      const first = (doc.signature_slots || []).find((s) => s.can_sign);
      setSignSlot(first?.slot || '');
      setSignPassword('');
      setSignOk(false);
      setHasStroke(false);
    } catch {
      setError('No se pudo visualizar el PDF.');
    } finally {
      setBusy(false);
    }
  };

  const downloadById = async (id: number, filename: string) => {
    await downloadApiFile(`/documentos/${id}/archivo`, filename);
  };

  const generate = async () => {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const { data } = await api.post('/documentos/generar', {
        type,
        request_id: requestId || undefined,
        work_order_id: workOrderId || undefined,
        issue_log_id: issueLogId || undefined,
      });
      setMsg('Documento listo. Revíselo y firme encima si le corresponde.');
      await load();
      if (data.document) {
        const canSign = (data.document.signature_slots || []).some(
          (s: SignatureSlot) => s.can_sign
        );
        await openDocument(data.document, canSign ? 'sign' : 'view');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setError(
        err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {}).flat()[0] ||
          'No se pudo generar el PDF.'
      );
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (!file) {
      setError('Seleccione el PDF o imagen escaneada.');
      return;
    }
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const body = new FormData();
      body.append('type', type);
      body.append('file', file);
      if (requestId) body.append('request_id', String(requestId));
      if (workOrderId) body.append('work_order_id', String(workOrderId));
      if (issueLogId) body.append('issue_log_id', String(issueLogId));
      const { data } = await api.post('/documentos/adjuntar', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(data.message);
      setFile(null);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo adjuntar.');
    } finally {
      setBusy(false);
    }
  };

  const canvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event: PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    const point = canvasPoint(event);
    if (!ctx || !point) return;
    drawing.current = true;
    ctx.strokeStyle = '#102a56';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDraw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const point = canvasPoint(event);
    if (!ctx || !point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    setHasStroke(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const closePreview = () => {
    setActive(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const submitSign = async () => {
    if (!active) return;
    if (!signSlot) {
      setError('Seleccione el espacio de firma.');
      return;
    }
    if (!signOk) {
      setError('Debe aceptar que revisó el documento.');
      return;
    }
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const image = hasStroke ? canvasRef.current?.toDataURL('image/png') : undefined;
      const { data } = await api.post(`/documentos/${active.id}/firmar`, {
        slot: signSlot,
        password: signPassword,
        declaration: true,
        signature_image: image,
      });
      setMsg(data.message);
      closePreview();
      await load();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
      setError(
        err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {}).flat()[0] ||
          'No se pudo firmar el documento.'
      );
    } finally {
      setBusy(false);
    }
  };

  const canSignActive = (active?.signature_slots || []).some((s) => s.can_sign);

  return (
    <section className="module-page" aria-labelledby="docs-title">
      <header className="module-header">
        <p className="module-kicker">Formatos institucionales</p>
        <h1 id="docs-title">Documentos PDF</h1>
        <p className="module-lead">
          Abra el documento, revíselo en pantalla y firme encima. También puede
          adjuntar el papel ya sellado por ULEAM.
        </p>
      </header>

      {msg && (
        <div className="alert alert-success" role="status">
          {msg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="module-panel report-filters">
        <label htmlFor="doc-type">
          Formato
          <select
            id="doc-type"
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {allowedTypes.map((key) => (
              <option key={key} value={key}>
                {catalog[key]?.code} · {catalog[key]?.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="doc-request">
          Solicitud
          <select
            id="doc-request"
            className="form-select"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">—</option>
            {solicitudes.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} · {s.destination}
              </option>
            ))}
          </select>
        </label>
        {(isMechanic || isSecretaria) && (
          <>
            <label htmlFor="doc-ot">
              Orden de taller
              <select
                id="doc-ot"
                className="form-select"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">—</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    OT #{o.id}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="doc-issue">
              Novedad
              <select
                id="doc-issue"
                className="form-select"
                value={issueLogId}
                onChange={(e) => setIssueLogId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">—</option>
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    Nov. #{i.id}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button type="button" className="btn btn-primary" onClick={() => void generate()} disabled={busy}>
          <FileText size={16} /> {busy ? 'Generando…' : 'Generar y revisar'}
        </button>
      </div>

      <div className="module-panel" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Adjuntar escaneado</h2>
        <p className="ops-muted" style={{ marginBottom: 12 }}>
          Si ya está firmado en papel o con certificado ULEAM, súbalo aquí.
        </p>
        <div className="report-filters">
          <label htmlFor="doc-scan">
            Archivo PDF o imagen
          </label>
          <input
            id="doc-scan"
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" className="btn btn-uleam-sso" onClick={() => void upload()} disabled={busy}>
            <FileUp size={16} /> Archivar
          </button>
        </div>
      </div>

      <div className="module-panel" style={{ marginTop: 16, overflowX: 'auto' }}>
        {docs.length === 0 ? (
          <p className="ops-muted">Aún no hay documentos emitidos o archivados.</p>
        ) : (
          <table className="ops-table">
            <caption className="sr-only">
              Documentos institucionales emitidos o archivados
            </caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Formato</th>
                <th scope="col">Solicitud</th>
                <th scope="col">Firmas</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const slots = d.signature_slots || [];
                const signedCount = slots.filter((s) => s.signed).length;
                const canSign = slots.some((s) => s.can_sign);
                return (
                  <tr key={d.id}>
                    <td>#{d.id}</td>
                    <td>{catalog[d.document_type]?.label || d.document_type}</td>
                    <td>{d.request_id ? `#${d.request_id} ${d.request?.destination || ''}` : '—'}</td>
                    <td>
                      {slots.length === 0 ? '—' : `${signedCount}/${slots.length}`}
                      <div className="ops-muted" style={{ fontSize: 12 }}>
                        {slots.filter((s) => s.signed).map((s) => `${s.label}${s.valid ? ' ✓' : ''}`).join(' · ') ||
                          'Sin firmar'}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                      <button type="button" className="btn btn-outline" onClick={() => void openDocument(d, 'view')}>
                        <Eye size={14} aria-hidden /> Ver
                      </button>
                      {canSign && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void openDocument(d, 'sign')}
                        >
                          <PenLine size={14} aria-hidden /> Firmar
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => void downloadById(d.id, d.original_filename)}
                      >
                        <Download size={14} aria-hidden /> PDF
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={!!active}
        onClose={closePreview}
        title={mode === 'sign' ? 'Revisar y firmar' : 'Vista del documento'}
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closePreview}>
              Cerrar
            </button>
            {canSignActive && mode !== 'sign' && (
              <button type="button" className="btn btn-uleam-sso" onClick={() => setMode('sign')}>
                <PenLine size={16} /> Pasar a firmar
              </button>
            )}
            {mode === 'sign' && (
              <button type="button" className="btn btn-primary" onClick={() => void submitSign()} disabled={busy}>
                <PenLine size={16} /> Confirmar firma digital
              </button>
            )}
          </>
        }
      >
        <div className="sign-desk">
          <div className="sign-preview">
            {previewUrl ? (
              <iframe title="Documento institucional" src={previewUrl} />
            ) : (
              <p className="ops-muted">Cargando documento…</p>
            )}
            {mode === 'sign' && (
              <div className="sign-overlay">
                <div className="sign-overlay-head">
                  <strong>Firme aquí, encima del documento</strong>
                  <button type="button" className="btn btn-outline" onClick={clearSignature}>
                    <Eraser size={14} /> Borrar
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={110}
                  aria-label="Área para firmar encima del documento"
                  onPointerDown={startDraw}
                  onPointerMove={moveDraw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
              </div>
            )}
          </div>
          <aside className="sign-side">
            <p className="ops-muted">
              {catalog[active?.document_type || '']?.label || 'Documento'} ·{' '}
              {active?.request?.destination || 'Sin solicitud'}
            </p>
            <ul className="sign-slots">
              {(active?.signature_slots || []).map((slot) => (
                <li key={slot.slot} className={slot.signed ? 'is-signed' : ''}>
                  <strong>{slot.label}</strong>
                  <span>{slot.signed ? slot.signer : 'Pendiente'}</span>
                </li>
              ))}
            </ul>
            {mode === 'sign' && (
              <>
                <label className="form-label" htmlFor="sign-slot">
                  Firmar como
                  <select
                    id="sign-slot"
                    className="form-select"
                    value={signSlot}
                    onChange={(e) => setSignSlot(e.target.value)}
                  >
                    {(active?.signature_slots || [])
                      .filter((s) => s.can_sign)
                      .map((s) => (
                        <option key={s.slot} value={s.slot}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="form-label" htmlFor="sign-password">
                  Contraseña
                  <input
                    id="sign-password"
                    type="password"
                    className="form-input"
                    value={signPassword}
                    onChange={(e) => setSignPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
                <label className="sign-check">
                  <input
                    type="checkbox"
                    checked={signOk}
                    onChange={(e) => setSignOk(e.target.checked)}
                  />
                  Revisé el documento en pantalla y firmo en representación de mi cargo.
                </label>
              </>
            )}
          </aside>
        </div>
      </Modal>
    </section>
  );
}
