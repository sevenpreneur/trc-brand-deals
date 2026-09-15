import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { checkSession, logout } from "./auth";
import { isSuccessStatus, type SessionUser } from "@/lib/types";
import {
  buildLoginUrl,
  PATHNAME_HEADER,
  SESSION_COOKIE_NAME,
} from "@/lib/constants";

/** Cadangan kalau `expires_at` tidak terbaca; JWT_TTL_DAYS di backend default 365 hari. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

/** Umur cookie dipatok ke `expires_at` supaya tidak hidup lebih lama dari tokennya. */
export async function setSessionCookie(token: string, expiresAt?: string) {
  const cookieStore = await cookies();
  const expires = expiresAt ? new Date(expiresAt) : null;
  const usable = expires && !Number.isNaN(expires.getTime()) && expires > new Date();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    // Isi tabel `tokens` setara daftar password: jangan sampai terbaca JavaScript.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(usable ? { expires } : { maxAge: SESSION_MAX_AGE }),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type Session = {
  token?: string;
  user: SessionUser | null;
};

/** `cache` membuat layout dan page berbagi satu panggilan check-session per render. */
export const getSession = cache(async (): Promise<Session> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return { user: null };

  const result = await checkSession(token);

  if (!isSuccessStatus(result.status) || !result.data) {
    return { user: null };
  }

  return { token, user: result.data };
});

/** Path yang sedang dibuka, dititipkan proxy — server component tidak tahu pathname-nya. */
async function currentPath() {
  const headerStore = await headers();
  return headerStore.get(PATHNAME_HEADER) ?? undefined;
}

/** Dipanggil di page, bukan cuma layout: layout tidak render ulang tiap navigasi. */
export async function requireSession(): Promise<SessionUser> {
  const { user } = await getSession();

  if (!user) {
    // Cookie basi dibiarkan: menghapusnya cuma bisa dari server action atau route handler.
    redirect(buildLoginUrl(await currentPath()));
  }

  return user;
}

/** Cookie dibuang apa pun hasil panggilan backend. */
export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) await logout(token);

  cookieStore.delete(SESSION_COOKIE_NAME);
}
