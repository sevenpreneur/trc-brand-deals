import { openChatStream } from "@/apis/knowledge";
import { getSession } from "@/apis/session";

/** Proxy stream Knowledge supaya `CLIENT_SECRET` dan `TENANT_ID` tidak pernah sampai ke browser. */
export async function POST(request: Request) {
  // Proxy melewati /api supaya fetch tidak dibalas HTML login, jadi dicek di sini.
  const { user } = await getSession();
  if (!user) {
    return Response.json(
      { success: false, code: 401, message: "Sesi berakhir. Silakan masuk lagi." },
      { status: 401 }
    );
  }

  let body: { conv_id?: string | null; message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, code: 400, message: "Body bukan JSON yang valid" },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json(
      { success: false, code: 400, message: "Pertanyaan tidak boleh kosong" },
      { status: 400 }
    );
  }

  const upstream = await openChatStream({
    conv_id: body.conv_id ?? null,
    message,
  });

  // Penolakan sebelum stream dibuka (429, 404, 503) datang sebagai envelope JSON.
  if (!upstream.ok || !upstream.body) {
    return upstream;
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
