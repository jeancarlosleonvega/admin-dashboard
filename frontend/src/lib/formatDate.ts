/**
 * Formatea una fecha ISO sin conversión de timezone.
 * Toma los primeros 10 caracteres (YYYY-MM-DD) y los convierte a DD/MM/YYYY.
 */
export function formatDate(isoString: string | Date | null | undefined): string {
  if (!isoString) return '—';
  const str = typeof isoString === 'string' ? isoString : isoString.toISOString();
  const [y, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formatea un datetime ISO sin conversión de timezone.
 * Retorna DD/MM/YYYY HH:MM tomando los valores directamente del string.
 */
export function formatDateTime(isoString: string | Date | null | undefined): string {
  if (!isoString) return '—';
  const str = typeof isoString === 'string' ? isoString : isoString.toISOString();
  const [y, m, d] = str.slice(0, 10).split('-');
  const time = str.slice(11, 16);
  return `${d}/${m}/${y} ${time}`;
}

/**
 * Formatea una fecha ISO para mostrar con nombre del día.
 * Ej: "Lunes 31/12/2026"
 */
export function formatDateLong(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const str = typeof isoString === 'string' ? isoString : (isoString as Date).toISOString();
  const [year, month, day] = str.slice(0, 10).split('-').map(Number);
  // Usar mediodía UTC para evitar cualquier desfase
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formatea una fecha ISO para mostrar día y mes corto.
 * Ej: "31 dic."
 */
export function formatDateShort(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const [year, month, day] = isoString.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
