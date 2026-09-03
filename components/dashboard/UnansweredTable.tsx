import type { UnansweredEntry } from "@/apis/stat";
import {
  formatDateTime,
  formatHoursWaiting,
  formatNumber,
  formatPhone,
  formatRupiahCompact,
  firstFilled,
  LEAD_STATUS_LABEL,
} from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "./StatusBadge";
import { HeaderCell } from "./TableParts";

export default function UnansweredTable({
  entries,
  timezone,
}: {
  entries: UnansweredEntry[];
  timezone: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState message="Tidak ada chat yang dibiarkan tanpa balasan. Ini satu-satunya angka yang bisa diterima." />
    );
  }

  return (
    <div className="-mx-1 w-full min-w-0 overflow-x-auto">
      <table className="w-full min-w-235 border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <HeaderCell>Brand</HeaderCell>
            <HeaderCell>Stage</HeaderCell>
            <HeaderCell align="right">Nilai project</HeaderCell>
            <HeaderCell align="right">Turn tanpa balasan</HeaderCell>
            <HeaderCell align="right">Menunggu</HeaderCell>
            <HeaderCell>Catatan</HeaderCell>
            <HeaderCell>Status</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.conv_id} className="border-b border-hairline/60">
              <td className="px-1 py-3">
                <p className="text-sm font-semibold text-ink">
                  {firstFilled(entry.brand_name, entry.full_name) ??
                    "Brand belum diisi"}
                </p>
                <p className="text-xs text-ink-muted">
                  {firstFilled(entry.full_name) ?? "Kontak tanpa nama"} ·{" "}
                  <span className="tabular-nums">
                    {formatPhone(entry.phone_number)}
                  </span>
                </p>
              </td>
              <td className="px-1 py-3 text-sm whitespace-nowrap text-ink-2">
                {LEAD_STATUS_LABEL[entry.lead_status] ?? entry.lead_status}
              </td>
              <td className="px-1 py-3 text-right text-sm font-semibold whitespace-nowrap text-ink tabular-nums">
                {formatRupiahCompact(entry.project_value)}
              </td>
              <td className="px-1 py-3 text-right text-sm text-ink-2 tabular-nums">
                {formatNumber(entry.unanswered_turn_count)}
              </td>
              <td className="px-1 py-3 text-right whitespace-nowrap">
                <p className="text-sm font-semibold text-ink tabular-nums">
                  {formatHoursWaiting(entry.waiting_hours)}
                </p>
                <p className="text-xs text-ink-muted">
                  sejak {formatDateTime(entry.first_unanswered_at, timezone)}
                </p>
              </td>
              <td className="max-w-72 px-1 py-3">
                <p className="truncate text-sm text-ink-2">
                  {entry.note ?? "Belum ada catatan"}
                </p>
              </td>
              <td className="px-1 py-3">
                <StatusBadge
                  tone={entry.waiting_hours >= 24 ? "critical" : "serious"}
                  label={
                    entry.waiting_hours >= 24 ? "Lewat 24 jam" : "Belum dibalas"
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
