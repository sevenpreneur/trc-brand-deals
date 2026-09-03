import type { NeedsActionEntry } from "@/apis/stat";
import {
  formatDateTime,
  formatHoursWaiting,
  formatPercent,
  formatPhone,
  formatRupiahCompact,
  firstFilled,
} from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "./StatusBadge";
import { Avatar, HeaderCell, StageChip } from "./TableParts";

/** Urgensi dibaca dari arah pesan terakhir, bukan dari satu ambang idle. */
const OURS_SERIOUS_HOURS = 4;
const OURS_CRITICAL_HOURS = 24;
const THEIRS_WARNING_HOURS = 72;
const THEIRS_SERIOUS_HOURS = 168;

function statusFor(entry: NeedsActionEntry) {
  if (entry.last_message_direction === "inbound") {
    if (entry.idle_hours >= OURS_CRITICAL_HOURS)
      return { tone: "critical" as const, label: "Belum dibalas" };
    if (entry.idle_hours >= OURS_SERIOUS_HOURS)
      return { tone: "serious" as const, label: "Giliran kita" };
    return { tone: "warning" as const, label: "Giliran kita" };
  }
  if (entry.idle_hours >= THEIRS_SERIOUS_HOURS)
    return { tone: "serious" as const, label: "Perlu di-follow up" };
  if (entry.idle_hours >= THEIRS_WARNING_HOURS)
    return { tone: "warning" as const, label: "Menunggu brand" };
  return { tone: "neutral" as const, label: "Menunggu brand" };
}

export default function NeedsActionTable({
  entries,
  timezone,
}: {
  entries: NeedsActionEntry[];
  timezone: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState message="Belum ada percakapan yang brand-nya sudah diisi." />
    );
  }

  return (
    <div className="-mx-3 w-full min-w-0 overflow-x-auto">
      <table className="w-full min-w-245 border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <HeaderCell>Brand</HeaderCell>
            <HeaderCell>Stage</HeaderCell>
            <HeaderCell align="right">Nilai project</HeaderCell>
            <HeaderCell align="right">Diam sejak</HeaderCell>
            <HeaderCell>Catatan</HeaderCell>
            <HeaderCell align="right">Win rate</HeaderCell>
            <HeaderCell>Status</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const status = statusFor(entry);
            const fromBrand = entry.last_message_direction === "inbound";
            const brand =
              firstFilled(entry.brand_name, entry.full_name) ??
              "Brand belum diisi";
            const contact = firstFilled(entry.full_name) ?? "Kontak tanpa nama";
            return (
              <tr
                key={entry.conv_id}
                className="border-b border-hairline/60 transition-colors last:border-0 hover:bg-surface-sunken/60"
              >
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={contact} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {brand}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {contact} ·{" "}
                        <span className="tabular-nums">
                          {formatPhone(entry.phone_number)}
                        </span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <StageChip status={entry.lead_status} />
                </td>
                <td className="px-3 py-3.5 text-right text-sm font-bold whitespace-nowrap text-ink tabular-nums">
                  {formatRupiahCompact(entry.project_value)}
                </td>
                <td className="px-3 py-3.5 text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {formatHoursWaiting(entry.idle_hours)}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {fromBrand ? "pesan brand" : "balasan kita"}
                  </p>
                </td>
                <td className="max-w-80 px-3 py-3.5">
                  <p className="line-clamp-3 text-sm text-ink-2">
                    {entry.note ?? "Belum ada catatan"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {entry.last_message_preview ||
                      `(${entry.last_message_type})`}{" "}
                    · {formatDateTime(entry.last_message_at, timezone)}
                  </p>
                </td>
                <td className="px-3 py-3.5 text-right text-sm text-ink-2 tabular-nums">
                  {formatPercent(entry.winning_rate, 0)}
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge tone={status.tone} label={status.label} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
