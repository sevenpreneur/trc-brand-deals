"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/** Filter ini cuma menyentuh seri response time, jadi kontrolnya menempel di kartunya. */
export default function WeekendToggle({ excluded }: { excluded: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("weekend", "off");
    else params.delete("weekend");
    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-xs font-medium whitespace-nowrap text-ink-2 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={excluded}
        onChange={(event) => toggle(event.target.checked)}
        className="size-3.5 cursor-pointer accent-ink"
      />
      Kecualikan weekend
    </label>
  );
}
