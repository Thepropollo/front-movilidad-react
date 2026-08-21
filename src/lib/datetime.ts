const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-EC', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-EC', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function parseDate(value?: string | null): Date | null {
  if (!value) return null;

  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTimeReadable(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '—';
  return DATE_TIME_FORMATTER.format(date).replace(',', ' ·');
}

export function formatDateReadable(value?: string | null): string {
  const date = parseDate(value);
  if (!date) return '—';
  return DATE_FORMATTER.format(date);
}
