import "server-only";

import { callApi } from "./api";
import { DEFAULT_RESPONSE_MODE } from "@/lib/format";
import {
  isSuccessStatus,
  type LeadStatus,
  type Metapaging,
  type ResponseMode,
} from "@/lib/types";

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

/** Target first response time dari dokumen evaluasi: < 15 menit pada jam kerja. */
export const DEFAULT_TARGET_SECONDS = 900;

type RangeParams = {
  startDate: string;
  endDate: string;
  timezone?: string;
};

export type StatSummary = {
  start_date: string;
  end_date: string;
  timezone: string;
  target_seconds: number;
  /** Definisi yang dipakai seluruh angka response di payload ini. */
  response_mode: ResponseMode;
  active_conversation_count: number;
  new_conversation_count: number;
  inbound_per_day: number;
  inbound_turn_count: number;
  replied_turn_count: number;
  unanswered_turn_count: number;
  unanswered_conversation_count: number;
  median_response_seconds: number | null;
  p90_response_seconds: number | null;
  within_target_count: number;
  within_target_percent: number;
  reply_rate_percent: number;
};

export type ChatsVolumeEntry = {
  date: string;
  conversation_count: number;
  new_conversation_count: number;
  returning_conversation_count: number;
};

export type ChatsVolume = {
  start_date: string;
  end_date: string;
  timezone: string;
  total_conversation_count: number;
  list: ChatsVolumeEntry[];
};

export type ResponseTimeEntry = {
  date: string;
  inbound_turn_count: number;
  replied_turn_count: number;
  unanswered_turn_count: number;
  median_response_seconds: number | null;
  p90_response_seconds: number | null;
  within_target_count: number;
  within_target_percent: number;
};

export type ResponseTime = {
  start_date: string;
  end_date: string;
  timezone: string;
  target_seconds: number;
  response_mode: ResponseMode;
  /** Saat true, Sabtu dan Minggu dibuang dari seri, bukan dinolkan. */
  exclude_weekend: boolean;
  list: ResponseTimeEntry[];
};

export type InboundHeatmapEntry = {
  /** ISO day of week: 1 = Senin ... 7 = Minggu. */
  day_of_week: number;
  /** 0–23 pada timezone yang diminta. */
  hour: number;
  inbound_message_count: number;
  outbound_message_count: number;
  /** Percakapan berbeda yang mengirim pesan masuk pada bucket ini. */
  conversation_count: number;
};

export type InboundHeatmap = {
  start_date: string;
  end_date: string;
  timezone: string;
  total_inbound_message_count: number;
  total_outbound_message_count: number;
  /** Bucket tanpa pesan masuk maupun keluar tidak dikirim — klien mengisi nol. */
  list: InboundHeatmapEntry[];
};

export type LeadStatusEntry = {
  lead_status: LeadStatus;
  conversation_count: number;
  mode_ai_count: number;
  mode_human_count: number;
  avg_winning_rate: number;
  /** Percakapan di stage ini yang project_value-nya sudah terisi. */
  valued_conversation_count: number;
  /** Nilai yang tertahan di stage ini, bukan estimasi seluruh percakapan. */
  total_project_value: number;
};

export type LeadStatusFunnel = {
  start_date: string;
  end_date: string;
  timezone: string;
  total_conversation_count: number;
  total_project_value: number;
  /** Selalu lengkap lima stage, urut cold → closed, termasuk yang nol. */
  list: LeadStatusEntry[];
};

export type UnansweredEntry = {
  conv_id: string;
  full_name: string;
  phone_number: string;
  brand_name: string | null;
  lead_status: LeadStatus;
  project_value: number | null;
  note: string | null;
  unanswered_turn_count: number;
  first_unanswered_at: string;
  last_unanswered_at: string;
  waiting_hours: number;
};

export type UnansweredList = {
  start_date: string;
  end_date: string;
  timezone: string;
  list: UnansweredEntry[];
  metapaging: Metapaging;
};

export type NeedsActionEntry = {
  conv_id: string;
  full_name: string;
  /** brand_name selalu terisi di endpoint ini — filternya justru itu. */
  brand_name: string;
  phone_number: string;
  lead_status: LeadStatus;
  project_value: number | null;
  winning_rate: number;
  mode: "ai" | "human";
  note: string | null;
  last_message_at: string;
  /** inbound = bola ada di kita, outbound = kita menunggu brand. */
  last_message_direction: "inbound" | "outbound";
  last_message_type: string;
  last_message_preview: string;
  /** Dibulatkan ke jam terdekat, dari seluruh riwayat — bukan potongan periode. */
  idle_hours: number;
};

export type NeedsActionList = {
  list: NeedsActionEntry[];
  metapaging: Metapaging;
};

function tenantId() {
  return process.env.TENANT_ID ?? "";
}

function rangeBody({ startDate, endDate, timezone = DEFAULT_TIMEZONE }: RangeParams) {
  return {
    tenant_id: tenantId(),
    start_date: startDate,
    end_date: endDate,
    timezone,
  };
}

async function getStat<T>(path: string, body: unknown): Promise<T | null> {
  const result = await callApi<T>(path, { body });
  return isSuccessStatus(result.status) ? (result.data ?? null) : null;
}

/**
 * Summary sekaligus jadi health check dashboard, jadi pesan errornya
 * diteruskan — kalau tenant/secret salah, halaman harus bisa bilang kenapa.
 */
export async function getSummary(
  params: RangeParams & { targetSeconds?: number; responseMode?: ResponseMode }
): Promise<{ data: StatSummary | null; error: string | null }> {
  const result = await callApi<StatSummary>("/api/v1/stats/summary", {
    body: {
      ...rangeBody(params),
      target_seconds: params.targetSeconds ?? DEFAULT_TARGET_SECONDS,
      response_mode: params.responseMode ?? DEFAULT_RESPONSE_MODE,
    },
  });

  if (!isSuccessStatus(result.status)) {
    return {
      data: null,
      error: result.message ?? "Gagal mengambil data ringkasan",
    };
  }
  return { data: result.data ?? null, error: null };
}

export async function getChatsVolume(
  params: RangeParams
): Promise<ChatsVolume | null> {
  return getStat<ChatsVolume>("/api/v1/stats/chats-volume", rangeBody(params));
}

export async function getResponseTime(
  params: RangeParams & {
    targetSeconds?: number;
    excludeWeekend?: boolean;
    responseMode?: ResponseMode;
  }
): Promise<ResponseTime | null> {
  return getStat<ResponseTime>("/api/v1/stats/response-time", {
    ...rangeBody(params),
    target_seconds: params.targetSeconds ?? DEFAULT_TARGET_SECONDS,
    response_mode: params.responseMode ?? DEFAULT_RESPONSE_MODE,
    exclude_weekend: params.excludeWeekend ?? false,
  });
}

export async function getInboundHeatmap(
  params: RangeParams
): Promise<InboundHeatmap | null> {
  return getStat<InboundHeatmap>(
    "/api/v1/stats/inbound-heatmap",
    rangeBody(params)
  );
}

export async function getLeadStatus(
  params: RangeParams
): Promise<LeadStatusFunnel | null> {
  return getStat<LeadStatusFunnel>(
    "/api/v1/stats/lead-status",
    rangeBody(params)
  );
}

export async function getUnanswered(
  params: RangeParams & { page?: number; pageSize?: number }
): Promise<UnansweredList | null> {
  return getStat<UnansweredList>("/api/v1/stats/unanswered/list", {
    ...rangeBody(params),
    page: params.page ?? 1,
    page_size: params.pageSize ?? 20,
  });
}

/**
 * Daftar brand deal yang sedang berjalan — semua percakapan yang brand_name-nya
 * sudah terisi, bukan potongan periode. Karena itu tidak menerima rentang
 * tanggal maupun ambang idle.
 */
export async function getNeedsAction(
  params: { page?: number; pageSize?: number } = {}
): Promise<NeedsActionList | null> {
  return getStat<NeedsActionList>("/api/v1/stats/needs-action/list", {
    tenant_id: tenantId(),
    page: params.page ?? 1,
    page_size: params.pageSize ?? 20,
  });
}

/** Batas aman: search/filter/sort di client tidak boleh bikin server ditembak tanpa henti. */
const NEEDS_ACTION_MAX_ROWS = 5000;
const NEEDS_ACTION_FETCH_PAGE_SIZE = 100;

/**
 * Semua brand deal sekaligus untuk tabel yang search, filter, dan sort-nya
 * dikerjakan di client. Endpoint hanya paginasi, jadi halaman pertama diambil
 * dulu untuk tahu total, sisanya ditarik paralel sampai cap.
 */
export async function getAllNeedsAction(): Promise<{
  list: NeedsActionEntry[];
  total: number;
} | null> {
  const first = await getNeedsAction({
    page: 1,
    pageSize: NEEDS_ACTION_FETCH_PAGE_SIZE,
  });
  if (!first) return null;

  const rows = [...first.list];
  const maxPage = Math.min(
    first.metapaging.total_page,
    Math.ceil(NEEDS_ACTION_MAX_ROWS / NEEDS_ACTION_FETCH_PAGE_SIZE)
  );

  if (maxPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: maxPage - 1 }, (_, index) =>
        getNeedsAction({ page: index + 2, pageSize: NEEDS_ACTION_FETCH_PAGE_SIZE })
      )
    );
    for (const chunk of rest) {
      if (chunk) rows.push(...chunk.list);
    }
  }

  return { list: rows, total: first.metapaging.total_data };
}
