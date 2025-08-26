// app/mfa/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

type MinimalSignInLike = { createdSessionId?: string | null; status?: string };

export default function MfaPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const activatedOnceRef = React.useRef(false);
  const redirectOnceRef = React.useRef(false);
  const navigatingRef = React.useRef(false);

  const pickSessionId = (...xs: Array<string | null | undefined>) =>
    xs.find((v): v is string => typeof v === "string");

  const waitForSessionId = React.useCallback(
    async (initial?: MinimalSignInLike, tries = 8, delayMs = 125) => {
      if (!signIn) return undefined;
      let id = pickSessionId(initial?.createdSessionId, signIn.createdSessionId);
      for (let i = 0; !id && i < tries; i++) {
        try {
          await signIn.reload();
        } catch {}
        id = pickSessionId(signIn.createdSessionId);
        if (!id) await new Promise((r) => setTimeout(r, delayMs));
      }
      return id;
    },
    [signIn]
  );

  const finalizeAndGoHome = React.useCallback(
    async (maybeRes?: MinimalSignInLike) => {
      if (!signIn) return;

      const sessionId = await waitForSessionId(maybeRes);
      console.log("[MFA] finalize sessionId =", sessionId, "signIn.status=", signIn.status);
      if (!sessionId) {
        setError("Could not finalize session after verification.");
        return;
      }

      navigatingRef.current = true;

      await setActive?.({ session: sessionId });
      await new Promise((r) => setTimeout(r, 0)); // let cookies commit

router.replace("/");
setTimeout(() => router.refresh(), 0);
    },
    [router, setActive, signIn, waitForSessionId]
  );

  React.useEffect(() => {
    if (!isLoaded || !signIn || navigatingRef.current) return;

    if (signIn.status === "complete" && signIn.createdSessionId) {
      if (!activatedOnceRef.current) {
        activatedOnceRef.current = true;
        void finalizeAndGoHome();
      }
      return;
    }

    if (typeof signIn.supportedSecondFactors === "undefined") return;

    const hasSecondFactor =
      Array.isArray(signIn.supportedSecondFactors) &&
      signIn.supportedSecondFactors.length > 0;

    if (hasSecondFactor) return;

    if (!redirectOnceRef.current) {
      redirectOnceRef.current = true;
      router.replace("/sign-in");
    }
  }, [isLoaded, signIn, finalizeAndGoHome, router]);

  const verifyTotp = async () => {
    if (!isLoaded || !signIn) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await signIn.attemptSecondFactor({ strategy: "totp", code });
      console.log("[MFA] attemptSecondFactor ->", res.status, "createdSessionId=", (res as any).createdSessionId);
      if (res.status === "complete") {
        await finalizeAndGoHome(res as MinimalSignInLike);
      } else if (res.status === "needs_second_factor") {
        setError("Invalid or expired code. Try again.");
      } else {
        setError("Could not complete verification. Please try again.");
      }
    } catch (e: any) {
      console.error("[MFA] attemptSecondFactor error", e);
      setError(e?.errors?.[0]?.message ?? "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-3">Enter your 6-digit code</h1>
      <input
        className="w-full rounded border p-3 tracking-widest text-center"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="••••••"
      />
      <button
        className="mt-4 w-full rounded bg-black p-3 text-white disabled:opacity-50"
        onClick={verifyTotp}
        disabled={submitting || code.length !== 6}
      >
        {submitting ? "Verifying…" : "Verify"}
      </button>
      {!!error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </main>
  );
}
