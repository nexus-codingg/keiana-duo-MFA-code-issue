"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

/** If the current user already has TOTP enabled, sync the mfaComplete flag. */
export async function setMfaCompleteIfEnabled() {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "No logged-in user" };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (user?.totpEnabled && user.publicMetadata?.mfaComplete !== true) {
    await client.users.updateUser(userId, {
      publicMetadata: { ...user.publicMetadata, mfaComplete: true },
    });
  }
  return { ok: true };
}

/** Mark MFA complete for the current user (after successful verify). */
export async function markMfaComplete() {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "No logged-in user" };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  await client.users.updateUser(userId, {
    publicMetadata: { ...user.publicMetadata, mfaComplete: true },
  });

  return { ok: true };
}