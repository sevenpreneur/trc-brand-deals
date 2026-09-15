"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginFormState } from "@/app/auth/actions";
import { REDIRECT_PARAM } from "@/lib/constants";

const INITIAL_STATE: LoginFormState = {};

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-[18px]">
      <path
        d="M1.8 10S4.7 4.8 10 4.8 18.2 10 18.2 10 15.3 15.2 10 15.2 1.8 10 1.8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      {open && (
        <path
          d="m3.5 3.5 13 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

const FIELD_CLASS =
  "w-full rounded-xl border border-hairline bg-surface-sunken px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-series-1 focus:bg-surface disabled:opacity-60";

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_STATE
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      {/* Tujuan balik ikut di body, bukan dibaca ulang dari URL di server action. */}
      <input type="hidden" name={REDIRECT_PARAM} value={redirectTo} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-[13px] font-semibold text-ink-2"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          maxLength={254}
          defaultValue={state.email}
          disabled={pending}
          placeholder="nama@perusahaan.com"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-[13px] font-semibold text-ink-2"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            disabled={pending}
            placeholder="Masukkan password"
            className={`${FIELD_CLASS} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-muted transition hover:text-ink-2"
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl px-3.5 py-2.5 text-[13px] font-semibold"
          style={{
            background: "var(--tint-critical)",
            color: "var(--tint-critical-ink)",
          }}
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-surface transition hover:opacity-90 disabled:opacity-60"
      >
        {pending && (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="size-4 animate-spin"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
            />
            <path
              d="M14 8a6 6 0 0 0-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
