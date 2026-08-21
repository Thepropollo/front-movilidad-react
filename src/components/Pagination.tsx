import Button from './Button';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface PaginationProps {
  meta: PaginationMeta | null;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  meta,
  loading = false,
  onPageChange,
}: PaginationProps) {
  if (!meta || meta.total === 0) {
    return null;
  }

  const { current_page, last_page, per_page, total, from, to } = meta;

  return (
    <div className="pagination">
      <p className="ops-muted">
        Mostrando {from ?? 0}–{to ?? 0} de {total} ({per_page} por página)
      </p>
      <div className="pagination-actions">
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          disabled={current_page <= 1 || loading}
          onClick={() => onPageChange(current_page - 1)}
        >
          Anterior
        </Button>
        <span className="ops-muted">
          Página {current_page} de {last_page}
        </span>
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          disabled={current_page >= last_page || loading}
          onClick={() => onPageChange(current_page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
