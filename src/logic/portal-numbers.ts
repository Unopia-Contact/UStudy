export function parsePortalCurrency(value: unknown): number | undefined {
  const text = String(value ?? '').trim().replace(/\s*(?:VNĐ|VND|₫|đ)$/iu, '').trim();
  const normalized = /^-?\d{1,3}(?:[.,\s]\d{3})+$/.test(text)
    ? text.replace(/[.,\s]/g, '') : text.replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return undefined;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

export function parsePortalDecimal(value: unknown): number | undefined {
  const text = String(value ?? '').trim().replace(',', '.');
  return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : undefined;
}
