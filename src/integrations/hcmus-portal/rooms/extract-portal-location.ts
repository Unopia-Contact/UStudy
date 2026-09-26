/** Keep the full Portal location code, including the P.csN: prefix. */
export function extractPortalLocationCode(scheduleEntry: string): string | null {
  const match = scheduleEntry.match(/-\s*(P\.[^;,]+)\s*$/i);
  return match?.[1]?.trim() ?? null;
}
