import { NextResponse, type NextRequest } from "next/server";
import {
  LOGIN_PATH,
  PATHNAME_HEADER,
  REDIRECT_PARAM,
  SESSION_COOKIE_NAME,
} from "@/lib/constants";

/** Cek keberadaan cookie saja: proxy jalan di tiap request, termasuk prefetch. */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  if (!hasSessionCookie && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    url.searchParams.set(REDIRECT_PARAM, `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Server component tidak tahu pathname; `requireSession()` memakainya untuk ?redirectTo=.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, `${pathname}${search}`);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  /** /api dilewati supaya fetch tidak dibalas HTML login; aset statis supaya tidak dialihkan. */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
