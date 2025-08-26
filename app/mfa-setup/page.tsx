
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import type { TOTPResource } from "@clerk/types";
import { QRCodeSVG } from "qrcode.react";
import { setMfaCompleteIfEnabled, markMfaComplete } from "./_actions";

export default function MfaSetup() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("return") || "/";

  const { isLoaded, isSignedIn, user } = useUser();

  // UI state (hooks always at top-level)
  const [totp, setTOTP] = React.useState<TOTPResource | null>(null);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Idempotency guards (prevent double effects in React Strict Mode)
  const createdOnceRef = React.useRef(false);
  const redirectOnceRef = React.useRef(false);

  // One effect handles both:
  // 1) If TOTP already enabled (legacy users), sync metadata & skip setup
  // 2) Otherwise create a TOTP secret exactly once
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    let cancelled = false;

    // (1) Legacy users: already have TOTP => mark metadata & leave
    if (user.totpEnabled) {
      if (!redirectOnceRef.current) {
        redirectOnceRef.current = true;
        (async () => {
          try {
            await setMfaCompleteIfEnabled();
          } finally {
            router.replace(returnTo);
            router.refresh(); // next request sees updated claims
          }
        })();
      }
      return;
    }

    // (2) New users: create TOTP once
    if (!createdOnceRef.current) {
      createdOnceRef.current = true;
      setLoading(true);
      setError(null);
      user
        .createTOTP()
        .then((t) => {
          if (!cancelled) setTOTP(t);
        })
        .catch((e: any) => {
          if (!cancelled) setError(e?.errors?.[0]?.message ?? "Could not create TOTP.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user, router, returnTo]);

  const verify = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Confirm enrollment with 6-digit code
      await user.verifyTOTP({ code });
      await user.reload(); // reflect totpEnabled=true on the client

      // Mark onboarding flag so middleware allows access going forward
      await markMfaComplete();

      router.replace(returnTo);
      router.refresh();
    } catch (e: any) {
      setError(e?.errors?.[0]?.message ?? "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-xl font-semibold">Set up your Authenticator</h1>
      <p className="mb-4 text-sm text-neutral-600">
        Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
      </p>

      {loading && <p className="mb-4">Loading…</p>}
      {!!error && <p className="mb-4 text-red-600">{error}</p>}

      {totp && (
        <div className="mb-4 rounded border p-4">
          <div className="flex justify-center">
            <QRCodeSVG value={totp.uri ?? ""} size={200} />
          </div>
          <code className="mt-3 block break-all rounded bg-neutral-100 p-2 text-xs">
            {totp.uri ?? "URI unavailable"}
          </code>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          className="w-36 flex-1 rounded border p-3 text-center tracking-widest"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
        <button
          onClick={verify}
          disabled={loading || code.length !== 6}
          className="rounded bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </div>
    </main>
  );
}
