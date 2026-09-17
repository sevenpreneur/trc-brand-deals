import {
  DEFAULT_TARGET_SECONDS,
  DEFAULT_TIMEZONE,
  getAllNeedsAction,
  getChatsVolume,
  getInboundHeatmap,
  getLeadStatus,
  getNeedsAction,
  getResponseTime,
  getSummary,
} from "@/apis/stat";
import {
  DEFAULT_RANGE,
  DEFAULT_RESPONSE_MODE,
  formatNumber,
  formatRangeLabel,
  isRangeValue,
  isResponseMode,
  resolveRange,
  type RangeValue,
} from "@/lib/format";
import InboundHeatmapChart from "@/components/charts/InboundHeatmapChart";
import LeadsTabs from "@/components/leads/LeadsTabs";
import LeadsFilterBar from "@/components/leads/LeadsFilterBar";
import SummaryGrid from "@/components/leads/SummaryGrid";
import ReplyTimeTrend from "@/components/leads/ReplyTimeTrend";
import ConversationVolume from "@/components/leads/ConversationVolume";
import LeadFunnel from "@/components/leads/LeadFunnel";
import ConversationsList from "@/components/leads/ConversationsList";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { requireSession } from "@/apis/session";

export const dynamic = "force-dynamic";

const BUILT_VIEWS = new Set(["overview", "conversations"]);

const noop = Promise.resolve(null);

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

export default async function LeadsPage({ searchParams }: PageProps<"/">) {
  // Page render ulang tiap navigasi client, layout tidak — pagar sesi ada di sini.
  await requireSession();

  const params = await searchParams;

  const rawRange = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: RangeValue = isRangeValue(rawRange) ? rawRange : DEFAULT_RANGE;
  const targetSeconds = readNumberParam(
    params.target,
    DEFAULT_TARGET_SECONDS,
    1,
    86_400
  );

  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const responseMode = isResponseMode(rawMode) ? rawMode : DEFAULT_RESPONSE_MODE;

  const rawView = Array.isArray(params.view) ? params.view[0] : params.view;
  const view = rawView ?? "overview";
  const showOverview = view === "overview";
  const showConversations = view === "conversations";

  const { startDate, endDate, days } = resolveRange(range, DEFAULT_TIMEZONE);
  const rangeParams = { startDate, endDate, timezone: DEFAULT_TIMEZONE };

  const [summaryResult, volume, responseTime, heatmap, leadStatus, needsCount, allNeeds] =
    await Promise.all([
      getSummary({ ...rangeParams, targetSeconds, responseMode }),
      showOverview ? getChatsVolume(rangeParams) : noop,
      showOverview
        ? getResponseTime({ ...rangeParams, targetSeconds, responseMode })
        : noop,
      showOverview ? getInboundHeatmap(rangeParams) : noop,
      showOverview ? getLeadStatus(rangeParams) : noop,
      getNeedsAction({ page: 1, pageSize: 1 }),
      showConversations ? getAllNeedsAction() : noop,
    ]);

  const summary = summaryResult.data;
  const leadsCount = needsCount?.metapaging.total_data;
  const queueCount = summary?.unanswered_conversation_count;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-ink">
          WhatsApp Leads
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-2">
          Lead WhatsApp masuk, kesehatan balasan, funnel, dan peluang cross-sell.
        </p>
      </header>

      <div className="mt-6">
        <LeadsTabs
          counts={{
            leads: leadsCount,
            queue: queueCount,
            conversations: leadsCount,
          }}
        />
      </div>

      {showOverview && (
        <>
          <p className="mt-5 text-xs text-ink-muted">
            Pureva <span className="font-medium text-ink-2">/stats</span> · window{" "}
            <span className="font-medium text-ink-2">
              {formatRangeLabel(startDate, endDate)}
            </span>{" "}
            · Asia/Jakarta
            {summary && (
              <>
                {" · "}
                {formatNumber(summary.unanswered_conversation_count)} belum dibalas
              </>
            )}
          </p>

          <div className="mt-4">
            <LeadsFilterBar
              range={range}
              responseMode={responseMode}
              targetSeconds={targetSeconds}
            />
          </div>

          {summaryResult.error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-hairline bg-surface p-5"
            >
              <p className="text-sm font-semibold text-ink">
                Data tidak bisa diambil dari API
              </p>
              <p className="mt-1 text-sm text-ink-2">{summaryResult.error}</p>
              <p className="mt-2 text-xs text-ink-muted">
                Cek <code className="font-mono">BASE_URL</code>,{" "}
                <code className="font-mono">CLIENT_SECRET</code>, dan{" "}
                <code className="font-mono">TENANT_ID</code>.
              </p>
            </div>
          )}

          {summary && (
            <section className="mt-6">
              <SummaryGrid
                summary={summary}
                days={days}
                targetSeconds={targetSeconds}
              />
            </section>
          )}

          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card
              title="Reply time trend"
              info="Median dan P90 waktu balas per hari, plus persentase turn yang dibalas dalam target. P90 diredupkan di bawah 10 turn karena sampelnya terlalu kecil."
              description="Median · P90 · % dibalas ≤ target"
            >
              {responseTime && responseTime.list.length > 0 ? (
                <ReplyTimeTrend data={responseTime.list} />
              ) : (
                <EmptyState message="Belum ada turn inbound pada rentang ini." />
              )}
            </Card>

            <Card
              title="Conversation volume"
              info="Jumlah percakapan aktif per hari, dipisah percakapan baru vs lanjutan. Satu percakapan bisa terhitung di lebih dari satu hari."
              description="Percakapan aktif per hari — baru vs lanjutan"
            >
              {volume && volume.list.length > 0 ? (
                <ConversationVolume data={volume.list} />
              ) : (
                <EmptyState message="Belum ada percakapan pada rentang ini." />
              )}
            </Card>
          </section>

          <section className="mt-4">
            <Card
              title="Inbound message hours"
              info="Kapan pesan masuk paling sering, per jam × hari. Semua Senin digabung; yang dihitung jumlah pesan, bukan percakapan."
              description="Pesan masuk per jam × hari dalam minggu — Asia/Jakarta"
            >
              {heatmap && heatmap.total_inbound_message_count > 0 ? (
                <InboundHeatmapChart
                  data={heatmap.list}
                  totalInbound={heatmap.total_inbound_message_count}
                  totalOutbound={heatmap.total_outbound_message_count}
                />
              ) : (
                <EmptyState message="Belum ada pesan masuk pada rentang ini." />
              )}
            </Card>
          </section>

          <section className="mt-4">
            <Card
              title="Lead funnel"
              info="Jumlah percakapan di tiap stage, dari cold sampai closed, dengan nilai tertahan dan split AI/Human. 'Closed' berarti percakapan berakhir, bukan deal menang."
              description="Percakapan yang dibuat pada rentang ini, per stage"
            >
              {leadStatus && leadStatus.total_conversation_count > 0 ? (
                <LeadFunnel funnel={leadStatus} />
              ) : (
                <EmptyState message="Belum ada percakapan baru pada rentang ini." />
              )}
            </Card>
          </section>
        </>
      )}

      {showConversations && (
        <section className="mt-6">
          <Card
            title="Conversations"
            info="Percakapan yang ditandai perlu aksi oleh Pureva, ditambah yang belum dibalas — bukan seluruh percakapan. Filter di bawah instan, tanpa memanggil Pureva lagi."
            description="Semua percakapan yang brand-nya sudah diisi, lepas dari rentang tanggal"
            aside={
              allNeeds ? (
                <span className="text-xs text-ink-muted">
                  {formatNumber(allNeeds.total)} percakapan
                </span>
              ) : undefined
            }
          >
            {allNeeds ? (
              <ConversationsList entries={allNeeds.list} />
            ) : (
              <EmptyState message="Data tidak tersedia." />
            )}
          </Card>
        </section>
      )}

      {!BUILT_VIEWS.has(view) && (
        <div className="mt-6">
          <EmptyState
            message={`Tab "${view}" sedang dibangun — untuk sekarang baru Overview dan Conversations yang siap. Leads dan Queue menyusul.`}
          />
        </div>
      )}
    </div>
  );
}
