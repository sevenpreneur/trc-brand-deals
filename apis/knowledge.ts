import "server-only";

import { callApi } from "./api";
import { isSuccessStatus, type Metapaging } from "@/lib/types";

export type ChatRole = "user" | "assistant";

/** Siklus hidup jawaban. Hanya baris assistant yang punya status. */
export type ChatStatus = "queued" | "streaming" | "done" | "failed";

/** Satu langkah retrieval yang benar-benar dijalankan agent. */
export type ChatSource = {
  tool: string;
  arguments: Record<string, unknown>;
  summary: string;
};

export type KnowledgeChat = {
  id: string;
  role: ChatRole;
  message: string;
  status: ChatStatus | null;
  error: string | null;
  sources: ChatSource[] | null;
  created_at: string;
};

export type KnowledgeConversation = {
  conv_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgeConversationDetail = KnowledgeConversation & {
  list: KnowledgeChat[];
};

export type ConversationListEntry = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  chat_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
};

export type ConversationList = {
  list: ConversationListEntry[];
  metapaging: Metapaging;
};

function tenantId() {
  return process.env.TENANT_ID ?? "";
}

/** Kegagalan dikembalikan sebagai pesan supaya halaman tetap bisa render. */
export async function getConversations(
  params: { page?: number; pageSize?: number } = {}
): Promise<{ data: ConversationList | null; error: string | null }> {
  const result = await callApi<ConversationList>(
    "/api/v1/knowledge/conversations/list",
    {
      body: {
        tenant_id: tenantId(),
        page: params.page ?? 1,
        page_size: params.pageSize ?? 50,
      },
    }
  );

  if (!isSuccessStatus(result.status)) {
    return { data: null, error: result.message ?? "Gagal mengambil daftar chat" };
  }
  return { data: result.data ?? null, error: null };
}

export async function getConversation(
  convId: string
): Promise<{ data: KnowledgeConversationDetail | null; error: string | null }> {
  const result = await callApi<KnowledgeConversationDetail>(
    "/api/v1/knowledge/conversations/detail",
    { body: { tenant_id: tenantId(), conv_id: convId } }
  );

  if (!isSuccessStatus(result.status)) {
    return { data: null, error: result.message ?? "Gagal membuka chat" };
  }
  return { data: result.data ?? null, error: null };
}

export async function renameConversation(
  convId: string,
  title: string
): Promise<string | null> {
  const result = await callApi("/api/v1/knowledge/conversations/update", {
    body: { tenant_id: tenantId(), conv_id: convId, title },
  });
  return isSuccessStatus(result.status)
    ? null
    : (result.message ?? "Gagal mengganti judul");
}

export async function deleteConversation(
  convId: string
): Promise<string | null> {
  const result = await callApi("/api/v1/knowledge/conversations/delete", {
    body: { tenant_id: tenantId(), conv_id: convId },
  });
  return isSuccessStatus(result.status)
    ? null
    : (result.message ?? "Gagal menghapus chat");
}

/** Mengembalikan `Response` mentah — bodinya diteruskan route handler, jangan di-`json()` di sini. */
export async function openChatStream(body: {
  conv_id?: string | null;
  message: string;
}): Promise<Response> {
  const baseUrl = process.env.BASE_URL;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!baseUrl || !clientSecret) {
    return Response.json(
      {
        success: false,
        code: 500,
        status: "INTERNAL_SERVER_ERROR",
        message: "BASE_URL atau CLIENT_SECRET belum dikonfigurasi",
      },
      { status: 500 }
    );
  }

  return fetch(
    new URL("/api/v1/knowledge/chat/stream", baseUrl).toString(),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientSecret}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        tenant_id: tenantId(),
        conv_id: body.conv_id || null,
        message: body.message,
      }),
      cache: "no-store",
    }
  );
}
