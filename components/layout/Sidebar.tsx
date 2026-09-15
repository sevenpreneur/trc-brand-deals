"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/auth/actions";
import { Avatar } from "@/components/dashboard/TableParts";
import type { SessionUser } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", hint: "Angka evaluasi 360" },
  { href: "/knowledge", label: "Knowledge", hint: "Tanya kondisi brand deal" },
] as const;

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-[18px]">
      <rect
        x="2.5"
        y="2.5"
        width="6"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2.5"
        y="13"
        width="6"
        height="4.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="11.5"
        y="2.5"
        width="6"
        height="4.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="11.5"
        y="9.5"
        width="6"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function KnowledgeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-[18px]">
      <path
        d="M3 5.5A2.5 2.5 0 0 1 5.5 3H16v11H5.5A2.5 2.5 0 0 0 3 16.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 16.5A2.5 2.5 0 0 1 5.5 14H16v3H5.5A2.5 2.5 0 0 1 3 16.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 6.75h6M6.5 9.75h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICON = {
  "/": DashboardIcon,
  "/knowledge": KnowledgeIcon,
} as const;

/** Dashboard hanya aktif pada "/" persis; Knowledge ikut aktif di semua thread-nya. */
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Tombolnya perlu tahu form induknya sedang jalan — karena itu komponen terpisah. */
function LogoutButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title="Keluar"
      aria-label="Keluar"
      className={
        compact
          ? "flex size-8 items-center justify-center rounded-full text-ink-2 transition hover:bg-surface-sunken hover:text-ink disabled:opacity-50"
          : "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-ink-2 transition hover:bg-surface-sunken hover:text-ink disabled:opacity-50"
      }
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-4">
        <path
          d="M12.5 6V4.5A1.5 1.5 0 0 0 11 3H5.5A1.5 1.5 0 0 0 4 4.5v11A1.5 1.5 0 0 0 5.5 17H11a1.5 1.5 0 0 0 1.5-1.5V14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 10h8.5m0 0-2.5-2.5M17 10l-2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && <span>{pending ? "Keluar…" : "Keluar"}</span>}
    </button>
  );
}

/** Avatar huruf, bukan `user.avatar` — sama seperti baris tabel kontak. */
function UserBlock({ user }: { user: SessionUser }) {
  return (
    <form
      action={logoutAction}
      className="mt-3 flex items-center gap-2.5 border-t border-hairline px-3 pt-3"
    >
      <Avatar name={user.full_name} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-bold text-ink">
          {user.full_name}
        </span>
        <span className="truncate text-[11px] text-ink-muted">{user.role}</span>
      </span>
      <LogoutButton />
    </form>
  );
}

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const items = NAV.map((item) => {
    const active = isActive(pathname, item.href);
    const Icon = ICON[item.href];
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          active
            ? "bg-ink text-surface"
            : "text-ink-2 hover:bg-surface-sunken hover:text-ink"
        }`}
      >
        <Icon />
        <span className="flex min-w-0 flex-col">
          {item.label}
          <span
            className={`truncate text-[11px] font-medium ${
              active ? "text-surface/70" : "text-ink-muted"
            }`}
          >
            {item.hint}
          </span>
        </span>
      </Link>
    );
  });

  return (
    <>
      {/* Desktop: kolom tetap di kiri, tidak ikut scroll konten. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-62 flex-col border-r border-hairline bg-surface px-3 py-5 lg:flex">
        <div className="px-3 pb-5">
          <p className="text-[15px] leading-tight font-extrabold tracking-tight text-ink">
            TRC Brand Deals
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            WhatsApp Cloud API · internal
          </p>
        </div>
        <nav className="flex flex-col gap-1">{items}</nav>
        <p className="mt-auto px-3 text-[11px] leading-relaxed text-ink-muted">
          Angka di dashboard dan jawaban di Knowledge datang dari sumber yang
          sama, jadi keduanya selalu bisa dicek silang.
        </p>
        <UserBlock user={user} />
      </aside>

      {/* Mobile: bar horizontal di atas konten. */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-hairline bg-surface px-4 py-3 lg:hidden">
        <p className="mr-auto text-sm font-extrabold tracking-tight text-ink">
          TRC Brand Deals
        </p>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-ink text-surface" : "text-ink-2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* Bar sempit: nama tidak muat, jadi sisakan tombol keluarnya saja. */}
        <form action={logoutAction} className="flex items-center">
          <LogoutButton compact />
        </form>
      </header>
    </>
  );
}
