"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback
      secondFactorUrl="/mfa"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/mfa-setup"
    />
  );
}
