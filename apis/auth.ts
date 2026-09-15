import "server-only";

import { callApi, type ApiEnvelope } from "./api";
import type { SessionUser } from "@/lib/types";

export type LoginResult = {
  token: string;
  token_type: string;
  expires_at: string;
  user: SessionUser;
};

/** Dijaga CLIENT_SECRET, bukan JWT — pemanggilnya memang belum punya sesi. */
export function login(email: string, password: string) {
  return callApi<LoginResult>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/** Profil dibaca ulang dari database tiap panggilan, bukan dari isi JWT. */
export function checkSession(token: string) {
  return callApi<SessionUser>("/api/v1/auth/check-session", {
    method: "GET",
    token,
  });
}

/** Mencabut satu sesi; sesi lain milik user yang sama tetap hidup. */
export function logout(token: string): Promise<ApiEnvelope> {
  return callApi("/api/v1/auth/logout", { method: "POST", token });
}
