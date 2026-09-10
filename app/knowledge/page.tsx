import ChatThread from "@/components/knowledge/ChatThread";

export const dynamic = "force-dynamic";

/** Thread baru; backend yang membuat percakapannya saat pertanyaan pertama dikirim. */
export default function NewKnowledgeChatPage() {
  return <ChatThread convId={null} title="" initialMessages={[]} />;
}
