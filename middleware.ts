// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/mfa(.*)",
  "/mfa-setup(.*)",
]);
const isMfaSetupRoute = createRouteMatcher(["/mfa-setup(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const url = new URL(req.url);



  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: url.toString() });
  }
  if (userId && isMfaSetupRoute(req)) {
    return NextResponse.next();
  }

  const requireMfa = (sessionClaims as any)?.metadata?.requireMfa ?? true;
  const mfaComplete = (sessionClaims as any)?.metadata?.mfaComplete === true;

  // v2: fva, v1: factorVerificationAge
  const fva = (sessionClaims as any)?.fva;
  const fvaV1 = (sessionClaims as any)?.factorVerificationAge;

  const sessionUsedSecondFactor =
    (Array.isArray(fva) &&
      fva.length >= 2 &&
      typeof fva[1] === "number" &&
      fva[1] >= 0) ||
    (Array.isArray(fvaV1) &&
      fvaV1.length >= 2 &&
      typeof fvaV1[1] === "number" &&
      fvaV1[1] >= 0);

  if (userId && requireMfa && !mfaComplete && !sessionUsedSecondFactor && !isPublicRoute(req)) {
    const returnTo = encodeURIComponent(url.pathname + url.search);
    return NextResponse.redirect(new URL(`/mfa-setup`, url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
