import { getConversations } from "@/apis/knowledge";
import ThreadList from "@/components/knowledge/ThreadList";

export const dynamic = "force-dynamic";

export default async function KnowledgeLayout({
  children,
}: LayoutProps<"/knowledge">) {
  const { data, error } = await getConversations({ pageSize: 50 });
  const entries = data?.list ?? [];

  return (
    <div className="flex min-h-0 flex-1">
      {/* Layar lebar: riwayat jadi kolomnya sendiri. */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-hairline bg-surface py-5 xl:flex">
        <ThreadList entries={entries} error={error} />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Layar sempit: riwayat disembunyikan di balik disclosure, tanpa JS. */}
        <details className="group border-b border-hairline bg-surface xl:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs font-semibold text-ink-2">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="size-3.5 transition group-open:rotate-90"
            >
              <path
                d="m6 3.5 4.5 4.5L6 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Riwayat chat ({entries.length})
          </summary>
          <div className="max-h-72 overflow-y-auto pb-3">
            <ThreadList entries={entries} error={error} />
          </div>
        </details>

        {children}
      </main>
    </div>
  );
}
