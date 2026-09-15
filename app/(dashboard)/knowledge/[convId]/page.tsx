import { notFound } from "next/navigation";
import { getConversation } from "@/apis/knowledge";
import { requireSession } from "@/apis/session";
import ChatThread from "@/components/knowledge/ChatThread";

export const dynamic = "force-dynamic";

export default async function KnowledgeChatPage({
  params,
}: PageProps<"/knowledge/[convId]">) {
  await requireSession();

  const { convId } = await params;
  const { data, error } = await getConversation(convId);

  if (!data) {
    // Thread yang sudah dihapus atau milik tenant lain tidak perlu dibedakan.
    if (error?.toLowerCase().includes("not found")) notFound();

    return (
      <div className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-8">
        <div
          role="alert"
          className="rounded-2xl border border-hairline bg-surface p-5 shadow-card"
        >
          <p className="text-sm font-semibold text-ink">Chat tidak bisa dibuka</p>
          <p className="mt-1 text-sm text-ink-2">
            {error ?? "Terjadi kesalahan yang tidak terduga."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatThread
      convId={data.conv_id}
      title={data.title}
      initialMessages={data.list}
    />
  );
}
