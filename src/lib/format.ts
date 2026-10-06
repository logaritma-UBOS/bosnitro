export function formatNumber(value: number | string): string {
  if (value === null || value === undefined || value === '') return "0"
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat('id-ID').format(num)
}

export function formatRupiah(value: number | string): string {
  return "Rp " + formatNumber(value)
}

export function parseNumber(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}