/** Dipakai proxy, server component, dan client — jangan tarik "server-only". */

/** JWT dari /auth/login disimpan di sini, httpOnly, tidak pernah menyentuh JavaScript browser. */
export const SESSION_COOKIE_NAME = "trc_session";

export const LOGIN_PATH = "/auth/login";
export const HOME_PATH = "/";

/** Query param tujuan balik setelah login berhasil. */
export const REDIRECT_PARAM = "redirectTo";

/** Proxy menitipkan path asli lewat header ini; server component tidak punya akses ke pathname. */
export const PATHNAME_HEADER = "x-pathname";

/** Hanya path internal; "//evil.com" itu protocol-relative dan ikut ditolak. */
export function getSafeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return HOME_PATH;
  }
  // Balik ke halaman login sehabis login cuma memutar orang di tempat.
  if (value.startsWith(LOGIN_PATH)) return HOME_PATH;
  return value;
}

/** Satu-satunya tempat URL login dirakit, supaya nama paramnya tidak tercecer. */
export function buildLoginUrl(redirectTo?: string) {
  const target = redirectTo && redirectTo !== HOME_PATH ? redirectTo : null;
  if (!target) return LOGIN_PATH;
  return `${LOGIN_PATH}?${REDIRECT_PARAM}=${encodeURIComponent(target)}`;
}
