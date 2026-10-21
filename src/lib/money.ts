const formatter = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

/** Kuruş cinsinden tutarı "₺1.234,50" biçiminde gösterir. */
export const formatTL = (kurus: number) => formatter.format(kurus / 100);

/** "125,50" veya "125.5" gibi kullanıcı girdisini kuruşa çevirir. */
export function parseTL(input: string): number | null {
  const n = Number(input.trim().replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
