import type { ChatsVolumeEntry } from "@/apis/stat";
import { formatDateShort, formatNumber } from "@/lib/format";

const NEW_COLOR = "var(--series-1)";
const RETURNING_COLOR = "var(--ink-muted)";

/** Bar horizontal per hari: percakapan baru vs lanjutan, angka new + returning di kanan. */
export default function ConversationVolume({
  data,
}: {
  data: ChatsVolumeEntry[];
}) {
  const max = Math.max(
    1,
    ...data.map((d) => d.new_conversation_count + d.returning_conversation_count)
  );
  const totalNew = data.reduce((sum, d) => sum + d.new_conversation_count, 0);
  const totalReturning = data.reduce(
    (sum, d) => sum + d.returning_conversation_count,
    0
  );

  return (
    <div>
      <div className="space-y-1.5">
        {data.map((entry) => (
          <div key={entry.date} className="flex items-center gap-3 text-xs">
            <span className="w-14 shrink-0 text-ink-muted">
              {formatDateShort(entry.date)}
            </span>
            <div className="flex h-3 flex-1 overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="h-full"
                style={{
                  width: `${(entry.new_conversation_count / max) * 100}%`,
                  background: NEW_COLOR,
                }}
              />
              <div
                className="h-full"
                style={{
                  width: `${(entry.returning_conversation_count / max) * 100}%`,
                  background: RETURNING_COLOR,
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right tabular-nums text-ink-2">
              {entry.new_conversation_count} + {entry.returning_conversation_count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-hairline pt-3 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ background: NEW_COLOR }}
          />
          Baru {formatNumber(totalNew)}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ background: RETURNING_COLOR }}
          />
          Lanjutan {formatNumber(totalReturning)}
        </span>
        <span>angka kanan: baru + lanjutan per hari</span>
      </div>
    </div>
  );
}
