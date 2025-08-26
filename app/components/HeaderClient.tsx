// app/HeaderClient.tsx
"use client";

import {
  SignedIn, SignedOut, SignInButton, SignUpButton, UserButton,
  ClerkLoaded, useUser,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";

function onRoute(pathname: string | null | undefined, prefixes: string[]) {
  if (!pathname) return false;
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function HeaderClient() {
  const pathname = usePathname();
  const { isLoaded: userLoaded, user } = useUser();

  // Treat these as auth-ish pages
  const isMfaRoute  = onRoute(pathname, ["/mfa", "/mfa-setup"]);
  const isAuthRoute = onRoute(pathname, ["/sign-in", "/sign-up", "/sso-callback"]);

  const mfaEnabled = !!user?.totpEnabled;

  const showUserControls      = !isMfaRoute && mfaEnabled;
  const showSignedOutButtons  = !(isAuthRoute || isMfaRoute); // <-- hide on MFA too

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      <ClerkLoaded>
        <SignedOut>
          {userLoaded && showSignedOutButtons ? (
            <>
              <SignInButton />
              <SignUpButton />
            </>
          ) : null}
        </SignedOut>

        <SignedIn>
          {userLoaded && showUserControls ? <UserButton /> : null}
        </SignedIn>
      </ClerkLoaded>
    </header>
  );
}
