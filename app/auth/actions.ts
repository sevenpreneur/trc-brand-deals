"use server";

import { redirect } from "next/navigation";
import { login } from "@/apis/auth";
import { logoutUser, setSessionCookie } from "@/apis/session";
import { getSafeRedirect, LOGIN_PATH } from "@/lib/constants";
import { isSuccessStatus, type StatusName } from "@/lib/types";

export type LoginFormState = {
  error?: string;
  /** Dikembalikan supaya kolom email tidak ikut kosong setelah percobaan yang gagal. */
  email?: string;
};

/** Validator backend menolak domain special-use (.test, .local, .invalid) dengan 400. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PASSWORD_LENGTH = 128;

/** Satu 401 dipakai dua arti: kredensial pengguna, atau CLIENT_SECRET aplikasi. */
function loginErrorMessage(status: StatusName | undefined, message?: string) {
  if (status === "UNAUTHORIZED") {
    return message?.includes("authorization header")
      ? "Aplikasi belum bisa menghubungi server. Hubungi admin."
      : "Email atau password salah.";
  }
  if (status === "BAD_REQUEST") return "Email atau password tidak valid.";
  return message ?? "Login gagal. Coba lagi sebentar lagi.";
}

/** Endpoint POST publik: validasi di form tidak mengikat pemanggil langsung. */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = getSafeRedirect(String(formData.get("redirectTo") ?? ""));

  if (!email || !password) {
    return { error: "Email dan password wajib diisi.", email };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Format email tidak valid.", email };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: "Password maksimal 128 karakter.", email };
  }

  const result = await login(email, password);
  const data = result.data;

  if (!isSuccessStatus(result.status) || !data?.token) {
    return { error: loginErrorMessage(result.status, result.message), email };
  }

  await setSessionCookie(data.token, data.expires_at);

  // redirect() bekerja dengan melempar, jadi jangan taruh di dalam try/catch.
  redirect(redirectTo);
}

export async function logoutAction() {
  await logoutUser();
  redirect(LOGIN_PATH);
}
