"use client";

import { useMemo, useState } from "react";
import type { NeedsActionEntry } from "@/apis/stat";
import type { LeadStatus } from "@/lib/types";
import {
  LEAD_STATUS_LABEL,
  firstFilled,
  formatDateTime,
  formatHoursWaiting,
  formatNumber,
  formatRupiahCompact,
} from "@/lib/format";
import { LEAD_STATUS_COLOR } from "@/lib/chart-series";
import EmptyState from "@/components/ui/EmptyState";

const STAGES: LeadStatus[] = [
  "cold",
  "qualified",
  "rate_card_sent",
  "negotiation",
  "closed",
];

type Handler = "all" | "ai" | "human";
type LastMsg = "any" | "inbound" | "outbound";
type SortKey = "latest" | "idle" | "value";

const PAGE = 25;

const CONTROL =
  "rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink shadow-card focus-ring";

/** 6281234115 → 6281••••••115: cukup untuk mengenali, tidak membeberkan nomornya. */
function maskPhone(phone: string) {
  const clean = phone.replace(/[^\d]/g, "");
  if (clean.length <= 7) return phone;
  return `${clean.slice(0, 4)}••••••${clean.slice(-3)}`;
}

function StageDot({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2">
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: LEAD_STATUS_COLOR[status] ?? "var(--ink-muted)" }}
      />
      {LEAD_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function ConversationsList({
  entries,
}: {
  entries: NeedsActionEntry[];
}) {
  const [stage, setStage] = useState<LeadStatus | "all">("all");
  const [handler, setHandler] = useState<Handler>("all");
  const [last, setLast] = useState<LastMsg>("any");
  const [sort, setSort] = useState<SortKey>("latest");
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    const rows = entries.filter((entry) => {
      if (stage !== "all" && entry.lead_status !== stage) return false;
      if (handler !== "all" && entry.mode !== handler) return false;
      if (last !== "any" && entry.last_message_direction !== last) return false;
      return true;
    });
    const sorted = [...rows];
    if (sort === "latest") {
      sorted.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
      );
    } else if (sort === "idle") {
      sorted.sort((a, b) => b.idle_hours - a.idle_hours);
    } else {
      sorted.sort((a, b) => (b.project_value ?? -1) - (a.project_value ?? -1));
    }
    return sorted;
  }, [entries, stage, handler, last, sort]);

  const shown = filtered.slice(0, visible);

  function reset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setVisible(PAGE);
    };
  }

  const setStageR = reset(setStage);
  const setHandlerR = reset(setHandler);
  const setLastR = reset(setLast);
  const setSortR = reset(setSort);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={stage}
          onChange={(e) => setStageR(e.target.value as LeadStatus | "all")}
          className={CONTROL}
          aria-label="Filter stage"
        >
          <option value="all">Semua stage</option>
          {STAGES.map((value) => (
            <option key={value} value={value}>
              {LEAD_STATUS_LABEL[value] ?? value}
            </option>
          ))}
        </select>

        <select
          value={handler}
          onChange={(e) => setHandlerR(e.target.value as Handler)}
          className={CONTROL}
          aria-label="Filter handler"
        >
          <option value="all">AI + Human</option>
          <option value="ai">Ditangani AI</option>
          <option value="human">Ditangani human</option>
        </select>

        <select
          value={last}
          onChange={(e) => setLastR(e.target.value as LastMsg)}
          className={CONTROL}
          aria-label="Filter pesan terakhir"
        >
          <option value="any">Pesan terakhir: semua</option>
          <option value="inbound">Terakhir: dari brand</option>
          <option value="outbound">Terakhir: dari kita</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSortR(e.target.value as SortKey)}
          className={`${CONTROL} ml-auto`}
          aria-label="Urutkan"
        >
          <option value="latest">Sort: pesan terbaru</option>
          <option value="idle">Sort: paling lama diam</option>
          <option value="value">Sort: nilai project</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <EmptyState message="Tidak ada percakapan yang cocok dengan filter." />
      ) : (
        <ul className="divide-y divide-hairline/60">
          {shown.map((entry) => {
            const brand =
              firstFilled(entry.brand_name, entry.full_name) ??
              "Brand belum diisi";
            const contact = firstFilled(entry.full_name) ?? "Kontak tanpa nama";
            const waiting = entry.last_message_direction === "inbound";
            return (
              <li
                key={entry.conv_id}
                className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span
                      title={brand}
                      className="max-w-full truncate text-sm font-semibold text-ink"
                    >
                      {brand}
                    </span>
                    <StageDot status={entry.lead_status} />
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                      {entry.mode === "ai" ? "AI" : "Human"}
                    </span>
                    {waiting && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
                        style={{
                          background: "var(--tint-warning)",
                          color: "var(--tint-warning-ink)",
                        }}
                      >
                        Menunggu kita
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {contact} ·{" "}
                    <span className="tabular-nums">
                      {maskPhone(entry.phone_number)}
                    </span>
                    {entry.project_value != null && (
                      <> · {formatRupiahCompact(entry.project_value)}</>
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-ink-2">
                    {entry.last_message_preview || `(${entry.last_message_type})`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-ink tabular-nums">
                    diam {formatHoursWaiting(entry.idle_hours)}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {formatDateTime(entry.last_message_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {visible < filtered.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE)}
            className="rounded-lg border border-hairline bg-surface px-4 py-2 text-xs font-semibold text-ink-2 shadow-card transition hover:text-ink"
          >
            Tampilkan {Math.min(PAGE, filtered.length - visible)} lagi ·{" "}
            {formatNumber(filtered.length - visible)} tersisa
          </button>
        </div>
      )}
    </div>
  );
}
