export const TIMEZONE = "Asia/Jakarta";

/* ── Tanggal ─────────────────────────────────────────────────────────── */

/** Tanggal hari ini (YYYY-MM-DD) pada zona waktu tertentu, bukan UTC. */
export function todayIn(timezone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function shiftDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatRangeLabel(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDateLong(startDate);
  return `${formatDateShort(startDate)} – ${formatDateLong(endDate)}`;
}

export function formatDateTime(
  isoTimestamp: string,
  timezone: string = TIMEZONE
): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(parsed);
}

/* ── Durasi ──────────────────────────────────────────────────────────── */

/** 813 → "13m 33d", 4038 → "1j 7m". Format panjang untuk tile & tooltip. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}d`;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  if (hours > 0) return minutes > 0 ? `${hours}j ${minutes}m` : `${hours}j`;
  return rest > 0 ? `${minutes}m ${rest}d` : `${minutes}m`;
}

/** Versi ringkas untuk tick sumbu: 900 → "15m", 7200 → "2j". */
export function formatDurationTick(seconds: number): string {
  if (seconds <= 0) return "0";
  if (seconds < 60) return `${Math.round(seconds)}d`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = seconds / 3600;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)}j`;
}

/**
 * Tick durasi yang "bulat" secara waktu (15m, 30m, 1j, 2j, ...), bukan hasil
 * pembagian linear recharts yang menghasilkan angka seperti 10,6j.
 */
const DURATION_STEPS = [
  60, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800,
];

export function durationTicks(maxSeconds: number, maxTicks = 6): number[] {
  const safeMax = Math.max(maxSeconds, 60);
  const step =
    DURATION_STEPS.find((candidate) => safeMax / candidate <= maxTicks) ??
    DURATION_STEPS[DURATION_STEPS.length - 1];
  const top = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}

export function formatHoursWaiting(hours: number): string {
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest > 0 ? `${days} hari ${rest} jam` : `${days} hari`;
}

/* ── Angka ───────────────────────────────────────────────────────────── */

/** Tick bilangan bulat yang enak dibaca: kelipatan 1/2/5 × 10^n. */
export function countTicks(maxValue: number, maxTicks = 5): number[] {
  const safeMax = Math.max(maxValue, 1);
  const rough = safeMax / maxTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const factor = [1, 2, 5, 10].find((item) => item * magnitude >= rough) ?? 10;
  const step = Math.max(1, Math.round(factor * magnitude));
  const top = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${formatNumber(value, fractionDigits)}%`;
}

/** 75000000 → "Rp 75 jt"; null → "—". Rupiah penuh, tanpa desimal. */
export function formatRupiahCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value === 0) return "Rp 0";
  const units: { limit: number; suffix: string }[] = [
    { limit: 1_000_000_000_000, suffix: " T" },
    { limit: 1_000_000_000, suffix: " M" },
    { limit: 1_000_000, suffix: " jt" },
    { limit: 1_000, suffix: " rb" },
  ];
  for (const unit of units) {
    if (Math.abs(value) >= unit.limit) {
      const scaled = value / unit.limit;
      const digits = Math.abs(scaled) >= 100 ? 0 : 1;
      return `Rp ${formatNumber(scaled, digits).replace(/,0$/, "")}${unit.suffix}`;
    }
  }
  return `Rp ${formatNumber(value)}`;
}

/**
 * Ambil teks pertama yang benar-benar terisi. Nama profil WhatsApp kadang
 * hanya berisi karakter tak terlihat (zero-width, bidi mark) — kalau cuma
 * di-trim, hasilnya sel kosong yang kelihatan seperti bug.
 */
const INVISIBLE_CHARS = /[\p{Cf}\p{Zs}\p{Zl}\p{Zp}]/gu;

export function firstFilled(
  ...values: (string | null | undefined)[]
): string | null {
  for (const value of values) {
    if (!value) continue;
    // Versi tanpa karakter tak terlihat hanya dipakai untuk mengecek kosong;
    // yang dikembalikan tetap teks aslinya, spasi antar kata utuh.
    if (value.replace(INVISIBLE_CHARS, "").trim()) return value.trim();
  }
  return null;
}

export function formatPhone(phone: string): string {
  return phone.startsWith("62") ? `+${phone}` : phone;
}

/* ── Rentang tanggal (filter) ────────────────────────────────────────── */

export const RANGE_PRESETS = [
  { value: "today", label: "Hari ini", days: 1 },
  { value: "7d", label: "7 hari", days: 7 },
  { value: "14d", label: "14 hari", days: 14 },
  { value: "30d", label: "30 hari", days: 30 },
  { value: "90d", label: "90 hari", days: 90 },
] as const;

export type RangeValue = (typeof RANGE_PRESETS)[number]["value"];

export const DEFAULT_RANGE: RangeValue = "30d";

export function isRangeValue(value: string | undefined): value is RangeValue {
  return RANGE_PRESETS.some((preset) => preset.value === value);
}

export function resolveRange(
  range: RangeValue,
  timezone: string = TIMEZONE
): { startDate: string; endDate: string; days: number; label: string } {
  const preset =
    RANGE_PRESETS.find((item) => item.value === range) ?? RANGE_PRESETS[3];
  const endDate = todayIn(timezone);
  return {
    startDate: shiftDays(endDate, -(preset.days - 1)),
    endDate,
    days: preset.days,
    label: preset.label,
  };
}

/* ── Label domain ────────────────────────────────────────────────────── */

export const LEAD_STATUS_LABEL: Record<string, string> = {
  cold: "Inbound masuk",
  qualified: "Qualified",
  rate_card_sent: "Rate card dikirim",
  negotiation: "Nego",
  closed: "Closed",
};

export const DAY_LABEL = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
