import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/apis/session";
import LoginForm from "@/components/auth/LoginForm";
import { getSafeRedirect, REDIRECT_PARAM } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Masuk · TRC Brand Deals",
  description: "Masuk untuk membuka dashboard evaluasi brand deals TRC.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: PageProps<"/auth/login">) {
  const params = await searchParams;
  const raw = params[REDIRECT_PARAM];
  const redirectTo = getSafeRedirect(Array.isArray(raw) ? raw[0] : raw);

  // Proxy cuma melihat cookie-nya ada; di sinilah token itu benar-benar diuji.
  const { user } = await getSession();
  if (user) redirect(redirectTo);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <section className="rounded-lg border border-hairline bg-surface p-7 shadow-card sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            WhatsApp Cloud API · internal
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            TRC Brand Deals
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Masuk untuk melihat angka evaluasi 360 dan menanyakan kondisi brand
            deal lewat Knowledge.
          </p>

          <LoginForm redirectTo={redirectTo} />
        </section>

        <p className="mt-5 px-2 text-center text-xs leading-relaxed text-ink-muted">
          Akun dibuatkan admin. Kalau belum punya akses atau lupa password,
          hubungi admin — belum ada pendaftaran mandiri di dashboard ini.
        </p>
      </div>
    </main>
  );
}
