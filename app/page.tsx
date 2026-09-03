import {
  DEFAULT_TARGET_SECONDS,
  DEFAULT_TIMEZONE,
  getChatsVolume,
  getInboundHeatmap,
  getLeadStatus,
  getNeedsAction,
  getResponseTime,
  getSummary,
} from "@/apis/stat";
import {
  DEFAULT_RANGE,
  formatDuration,
  formatDurationTick,
  formatNumber,
  formatPercent,
  formatRangeLabel,
  formatRupiahCompact,
  isRangeValue,
  resolveRange,
  type RangeValue,
} from "@/lib/format";
import VolumeChart from "@/components/charts/VolumeChart";
import ResponseTimeChart from "@/components/charts/ResponseTimeChart";
import LeadStatusChart from "@/components/charts/LeadStatusChart";
import InboundHeatmapChart from "@/components/charts/InboundHeatmapChart";
import FilterBar from "@/components/dashboard/FilterBar";
import NeedsActionTable from "@/components/dashboard/NeedsActionTable";
import StatTile from "@/components/dashboard/StatTile";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LegendKey from "@/components/ui/LegendKey";
import { RESPONSE_SERIES, VOLUME_SERIES } from "@/lib/chart-series";

export const dynamic = "force-dynamic";

function readNumberParam(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return Math.round(parsed);
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  const rawRange = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: RangeValue = isRangeValue(rawRange) ? rawRange : DEFAULT_RANGE;
  const targetSeconds = readNumberParam(
    params.target,
    DEFAULT_TARGET_SECONDS,
    1,
    86_400
  );

  const { startDate, endDate, days } = resolveRange(range, DEFAULT_TIMEZONE);
  const rangeParams = { startDate, endDate, timezone: DEFAULT_TIMEZONE };

  const [
    summaryResult,
    volume,
    responseTime,
    heatmap,
    leadStatus,
    needsAction,
  ] = await Promise.all([
    getSummary({ ...rangeParams, targetSeconds }),
    getChatsVolume(rangeParams),
    getResponseTime({ ...rangeParams, targetSeconds }),
    getInboundHeatmap(rangeParams),
    getLeadStatus(rangeParams),
    getNeedsAction({ pageSize: 10 }),
  ]);

  const summary = summaryResult.data;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Brand Deals — Inbound WhatsApp
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            TRC · {formatRangeLabel(startDate, endDate)} · zona waktu{" "}
            {DEFAULT_TIMEZONE} · sumber: WhatsApp Cloud API (Coexistence)
          </p>
        </div>
        <p className="text-xs text-ink-muted">
          Semua angka di-generate otomatis dari data percakapan — tidak ada
          laporan manual.
        </p>
      </header>

      <div className="mt-6">
        <FilterBar range={range} targetSeconds={targetSeconds} />
      </div>

      {summaryResult.error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-hairline bg-surface p-5"
        >
          <p className="text-sm font-semibold text-ink">
            Data tidak bisa diambil dari API
          </p>
          <p className="mt-1 text-sm text-ink-2">{summaryResult.error}</p>
          <p className="mt-2 text-xs text-ink-muted">
            Cek <code className="font-mono">BASE_URL</code>,{" "}
            <code className="font-mono">CLIENT_SECRET</code>, dan{" "}
            <code className="font-mono">TENANT_ID</code> di{" "}
            <code className="font-mono">.env.local</code>.
          </p>
        </div>
      )}

      {/* Layer 1-2: volume & responsiveness sebagai stat tile, bukan chart —
          story tiap kartu cuma satu angka. */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Inbound / hari"
          value={summary ? formatNumber(summary.inbound_per_day, 2) : "—"}
          detail={
            summary
              ? `${formatNumber(summary.inbound_turn_count)} turn inbound dalam ${days} hari`
              : undefined
          }
        />
        <StatTile
          starred
          label="First response (median)"
          value={summary ? formatDuration(summary.median_response_seconds) : "—"}
          detail={
            summary
              ? `p90 ${formatDuration(summary.p90_response_seconds)} · target ${formatDurationTick(targetSeconds)}`
              : undefined
          }
          detailTone={
            summary?.median_response_seconds != null &&
            summary.median_response_seconds <= targetSeconds
              ? "good"
              : "warning"
          }
        />
        <StatTile
          starred
          label="Tanpa balasan sama sekali"
          value={summary ? formatNumber(summary.unanswered_turn_count) : "—"}
          detail={
            summary
              ? `${formatNumber(summary.unanswered_conversation_count)} percakapan · target 0`
              : undefined
          }
          detailTone={
            summary && summary.unanswered_turn_count === 0 ? "good" : "critical"
          }
        />
        <StatTile
          label="Dibalas dalam target"
          value={summary ? formatPercent(summary.within_target_percent) : "—"}
          detail={
            summary
              ? `${formatNumber(summary.within_target_count)} dari ${formatNumber(summary.replied_turn_count)} turn ≤ ${formatDurationTick(targetSeconds)} · target ≥ 80%`
              : undefined
          }
          detailTone={
            summary && summary.within_target_percent >= 80 ? "good" : "warning"
          }
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card
          className="xl:col-span-8"
          title="Volume percakapan per hari"
          description="Percakapan yang menerima pesan masuk, dipisah baru vs lanjutan"
          aside={
            <LegendKey
              items={VOLUME_SERIES.map((series) => ({
                label: series.label,
                color: series.color,
              }))}
            />
          }
          footnote="Baseline beban kerja. Di bawah 10 percakapan per hari, masalahnya ada di konversi — bukan kapasitas."
        >
          {volume && volume.list.length > 0 ? (
            <VolumeChart data={volume.list} />
          ) : (
            <EmptyState message="Belum ada percakapan pada rentang ini." />
          )}
        </Card>

        <Card
          className="xl:col-span-4"
          title="Funnel lead status"
          description="Percakapan yang dibuat pada rentang ini, per stage"
          aside={
            leadStatus ? (
              <span className="text-xs text-ink-muted">
                Nilai tertahan {formatRupiahCompact(leadStatus.total_project_value)}
              </span>
            ) : undefined
          }
          footnote="Win rate per stage menunjukkan bocornya di mana. Nilai tertahan hanya menghitung percakapan yang project value-nya sudah diisi, bukan estimasi seluruh percakapan di stage itu."
        >
          {leadStatus && leadStatus.total_conversation_count > 0 ? (
            <LeadStatusChart
              data={leadStatus.list}
              total={leadStatus.total_conversation_count}
            />
          ) : (
            <EmptyState message="Belum ada percakapan baru pada rentang ini." />
          )}
        </Card>
      </section>

      <section className="mt-4">
        <Card
          title="First response time — harian"
          description="Median dan p90 waktu balas turn inbound pertama"
          aside={
            <LegendKey
              items={[
                ...RESPONSE_SERIES.map((series) => ({
                  label: series.label,
                  color: series.color,
                })),
                {
                  label: `Target ${formatDurationTick(targetSeconds)}`,
                  color: "var(--ink-muted)",
                  variant: "dash" as const,
                },
              ]}
            />
          }
          footnote="Median dipakai karena rata-rata tertutup outlier; p90 menunjukkan kasus terburuk. Hari tanpa turn yang dibalas sengaja dibiarkan putus, bukan disambung."
        >
          {responseTime && responseTime.list.length > 0 ? (
            <ResponseTimeChart
              data={responseTime.list}
              targetSeconds={responseTime.target_seconds ?? targetSeconds}
            />
          ) : (
            <EmptyState message="Belum ada turn inbound pada rentang ini." />
          )}
        </Card>
      </section>

      <section className="mt-4">
        <Card
          title="Kapan inbound masuk"
          description="Pesan masuk per jam × hari dalam minggu"
          footnote="Menentukan apakah butuh orang kedua atau cukup menggeser jam kerja — response time lambat pada jam padat berarti overload, bukan kelalaian."
        >
          {heatmap && heatmap.total_message_count > 0 ? (
            <InboundHeatmapChart
              data={heatmap.list}
              totalMessages={heatmap.total_message_count}
            />
          ) : (
            <EmptyState message="Belum ada pesan masuk pada rentang ini." />
          )}
        </Card>
      </section>

      <section className="mt-4 grid gap-4">
        <Card
          title="Brand deal yang sedang berjalan"
          description="Semua percakapan yang brand-nya sudah diisi, diurutkan dari yang paling lama diam"
          aside={
            needsAction ? (
              <span className="text-xs text-ink-muted">
                {formatNumber(needsAction.metapaging.total_data)} brand deal ·
                menampilkan {needsAction.list.length} teratas
              </span>
            ) : undefined
          }
          footnote="Daftar ini lepas dari rentang tanggal — deal lama tetap terbaca. Status dibaca dari arah pesan terakhir: kalau dari brand, bola ada di kita."
        >
          {needsAction ? (
            <NeedsActionTable
              entries={needsAction.list}
              timezone={DEFAULT_TIMEZONE}
            />
          ) : (
            <EmptyState message="Data tidak tersedia." />
          )}
        </Card>
      </section>

      <footer className="mt-8 border-t border-hairline pt-4 text-xs leading-relaxed text-ink-muted">
        Metrics menilai proses, bukan menghakimi orang. Lost reason dan cycle
        time inbound → closed belum bisa dihitung — butuh kolom alasan penutupan
        dan timestamp stage closed pada schema percakapan lebih dulu.
      </footer>
    </div>
  );
}
