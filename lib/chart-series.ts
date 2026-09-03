/**
 * Definisi seri dipakai chart (client) sekaligus legend di halaman (server),
 * jadi harus tinggal di modul netral — export non-komponen dari modul
 * "use client" tidak menyeberang batas RSC.
 */
export const VOLUME_SERIES = [
  { key: "baru", label: "Percakapan baru", color: "var(--series-1)" },
  { key: "lanjutan", label: "Lanjutan / follow-up", color: "var(--series-2)" },
] as const;

export const RESPONSE_SERIES = [
  { key: "median", label: "Median", color: "var(--series-1)" },
  { key: "p90", label: "p90 (kasus terburuk)", color: "var(--series-2)" },
] as const;

/** Stage funnel itu kategori berurutan, jadi warnanya ramp ordinal satu hue. */
export const LEAD_STATUS_ORDER = [
  "cold",
  "qualified",
  "rate_card_sent",
  "negotiation",
  "closed",
] as const;

export const LEAD_STATUS_COLOR: Record<string, string> = {
  cold: "var(--ord-1)",
  qualified: "var(--ord-2)",
  rate_card_sent: "var(--ord-3)",
  negotiation: "var(--ord-4)",
  closed: "var(--ord-5)",
};
