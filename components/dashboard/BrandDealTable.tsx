"use client";

import { useMemo, useState } from "react";
import type { NeedsActionEntry } from "@/apis/stat";
import type { LeadStatus } from "@/lib/types";
import {
  formatDateTime,
  formatHoursWaiting,
  formatNumber,
  formatPercent,
  formatPhone,
  formatRupiahCompact,
  firstFilled,
  LEAD_STATUS_LABEL,
} from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import NoteCell from "./NoteCell";
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

/** Urut funnel dipakai untuk sort kolom Stage, bukan alfabet. */
const STAGE_ORDER: Record<LeadStatus, number> = {
  cold: 0,
  qualified: 1,
  rate_card_sent: 2,
  negotiation: 3,
  closed: 4,
};

const STAGES: LeadStatus[] = [
  "cold",
  "qualified",
  "rate_card_sent",
  "negotiation",
  "closed",
];

/** "ours" = bola ada di kita (pesan terakhir dari brand), "theirs" = kita menunggu brand. */
type DirFilter = "ours" | "theirs";

type SortKey = "brand" | "stage" | "value" | "idle" | "winrate";
type SortState = { key: SortKey; dir: "asc" | "desc" };

function brandName(entry: NeedsActionEntry) {
  return firstFilled(entry.brand_name, entry.full_name) ?? "";
}

function compare(a: NeedsActionEntry, b: NeedsActionEntry, key: SortKey): number {
  switch (key) {
    case "brand":
      return brandName(a).localeCompare(brandName(b), "id");
    case "stage":
      return STAGE_ORDER[a.lead_status] - STAGE_ORDER[b.lead_status];
    case "value":
      // Nilai kosong dianggap paling kecil supaya tidak menyalip deal bernilai.
      return (a.project_value ?? -1) - (b.project_value ?? -1);
    case "idle":
      return a.idle_hours - b.idle_hours;
    case "winrate":
      return a.winning_rate - b.winning_rate;
  }
}

const PAGE_SIZE = 25;

const CONTROL =
  "rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink shadow-card focus-ring";
const PAGER_BUTTON =
  "rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2 shadow-card transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-2";

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  return (
    <th scope="col" className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Urutkan berdasarkan ${label}`}
        className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap transition-colors ${
          active ? "text-ink" : "text-ink-2 hover:text-ink"
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <span aria-hidden className={`text-[10px] ${active ? "opacity-100" : "opacity-30"}`}>
          {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export default function BrandDealTable({
  entries,
  timezone,
}: {
  entries: NeedsActionEntry[];
  timezone: string;
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LeadStatus | "all">("all");
  const [dir, setDir] = useState<DirFilter | "all">("all");
  const [sort, setSort] = useState<SortState>({ key: "idle", dir: "desc" });
  const [page, setPage] = useState(1);

  /** Semua kontrol balik ke halaman 1 supaya hasil filter tidak "lompat" ke halaman kosong. */
  function resetPage() {
    setPage(1);
  }

  function onSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "brand" ? "asc" : "desc" }
    );
    resetPage();
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = entries.filter((entry) => {
      if (stage !== "all" && entry.lead_status !== stage) return false;
      if (dir !== "all") {
        const entryDir: DirFilter =
          entry.last_message_direction === "inbound" ? "ours" : "theirs";
        if (entryDir !== dir) return false;
      }
      if (needle) {
        const haystack = [
          entry.brand_name,
          entry.full_name,
          entry.phone_number,
          entry.note,
          entry.last_message_preview,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => factor * compare(a, b, sort.key));
  }, [entries, query, stage, dir, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const first = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const last = Math.min(safePage * PAGE_SIZE, filtered.length);
  const isFiltered = query.trim() !== "" || stage !== "all" || dir !== "all";

  function exportCsv() {
    const header = [
      "Brand",
      "Kontak",
      "Nomor",
      "Stage",
      "Nilai project (Rp)",
      "Diam (jam)",
      "Arah pesan terakhir",
      "Win rate (%)",
      "Status",
      "Catatan",
      "Pesan terakhir",
      "Waktu pesan terakhir",
    ];
    const body = filtered.map((entry) => [
      brandName(entry),
      firstFilled(entry.full_name) ?? "",
      formatPhone(entry.phone_number),
      LEAD_STATUS_LABEL[entry.lead_status] ?? entry.lead_status,
      entry.project_value ?? "",
      entry.idle_hours,
      entry.last_message_direction === "inbound" ? "pesan brand" : "balasan kita",
      entry.winning_rate,
      statusFor(entry).label,
      entry.note ?? "",
      entry.last_message_preview || `(${entry.last_message_type})`,
      formatDateTime(entry.last_message_at, timezone),
    ]);

    const csv = [header, ...body]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    // BOM supaya Excel membaca UTF-8 (nama & rupiah tidak jadi mojibake).
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brand-deals-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPage();
          }}
          placeholder="Cari brand, kontak, nomor, catatan…"
          aria-label="Cari brand deal"
          className="min-w-56 flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink shadow-card focus-ring placeholder:text-ink-muted"
        />

        <label className="flex items-center gap-2 text-xs font-medium text-ink-2">
          Stage
          <select
            value={stage}
            onChange={(event) => {
              setStage(event.target.value as LeadStatus | "all");
              resetPage();
            }}
            className={CONTROL}
          >
            <option value="all">Semua</option>
            {STAGES.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABEL[value] ?? value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-ink-2">
          Status
          <select
            value={dir}
            onChange={(event) => {
              setDir(event.target.value as DirFilter | "all");
              resetPage();
            }}
            className={CONTROL}
          >
            <option value="all">Semua</option>
            <option value="ours">Giliran kita</option>
            <option value="theirs">Menunggu brand</option>
          </select>
        </label>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="ml-auto rounded-lg border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-card transition hover:bg-surface-sunken focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState
          message={
            isFiltered
              ? "Tidak ada brand deal yang cocok dengan filter."
              : "Belum ada percakapan yang brand-nya sudah diisi."
          }
        />
      ) : (
        <div className="-mx-3 w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-245 border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                <SortHeader label="Brand" sortKey="brand" sort={sort} onSort={onSort} />
                <SortHeader label="Stage" sortKey="stage" sort={sort} onSort={onSort} />
                <SortHeader
                  label="Nilai project"
                  sortKey="value"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <SortHeader
                  label="Diam sejak"
                  sortKey="idle"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <HeaderCell>Catatan</HeaderCell>
                <SortHeader
                  label="Win rate"
                  sortKey="winrate"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <HeaderCell>Status</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((entry) => {
                const status = statusFor(entry);
                const fromBrand = entry.last_message_direction === "inbound";
                const brand =
                  firstFilled(entry.brand_name, entry.full_name) ??
                  "Brand belum diisi";
                const contact =
                  firstFilled(entry.full_name) ?? "Kontak tanpa nama";
                return (
                  <tr
                    key={entry.conv_id}
                    className="border-b border-hairline/60 transition-colors last:border-0 hover:bg-surface-sunken/60"
                  >
                    <td className="max-w-56 px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact} />
                        <div className="min-w-0">
                          <p
                            title={brand}
                            className="line-clamp-1 text-sm font-semibold break-words text-ink"
                          >
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
                      <NoteCell note={entry.note} />
                      <p className="mt-1 truncate text-xs text-ink-muted">
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
      )}

      <nav
        aria-label="Navigasi halaman"
        className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
      >
        <p className="text-xs text-ink-muted">
          <span className="tabular-nums">
            {formatNumber(first)}–{formatNumber(last)}
          </span>{" "}
          dari <span className="tabular-nums">{formatNumber(filtered.length)}</span>{" "}
          brand deal
          {isFiltered && (
            <span className="text-ink-muted">
              {" "}
              (disaring dari {formatNumber(entries.length)})
            </span>
          )}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={PAGER_BUTTON}
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              Sebelumnya
            </button>
            <span className="px-1 text-xs font-semibold text-ink-2 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className={PAGER_BUTTON}
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Berikutnya
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
