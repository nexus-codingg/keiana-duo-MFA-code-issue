// app/(auth)/oauth-button.tsx
"use client";

import { useSignIn } from "@clerk/nextjs";

export default function OAuthButton() {
  const { isLoaded, signIn } = useSignIn();

  const startGoogle = async () => {
    if (!isLoaded) return;
    await signIn!.authenticateWithRedirect({
      strategy: "oauth_google",               // or oauth_github, etc.
      redirectUrl: "/sso-callback",           // where Clerk will POST back
      redirectUrlComplete: "/mfa",            // where you’ll take the TOTP
    });
  };

  return <button onClick={startGoogle}>Continue with Google</button>;
}
