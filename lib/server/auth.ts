import "server-only";

import type { Role, UserProfile } from "@/lib/domain";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// Vérifie le jeton de l'appelant et son appartenance active à l'équipe (rôle requis optionnel).
export async function requireCaller(request: Request, roles?: Role[]): Promise<UserProfile> {
  const match = (request.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError(401, "Connexion requise.");
  }

  let uid: string;
  try {
    ({ uid } = await adminAuth.verifyIdToken(match[1]!, true));
  } catch {
    throw new HttpError(401, "Session expirée. Reconnectez-vous.");
  }

  const snapshot = await adminDb.collection("users").doc(uid).get();
  const profile = snapshot.exists ? ({ ...snapshot.data(), uid } as UserProfile) : null;

  if (!profile?.active) {
    throw new HttpError(403, "Ce compte n'a pas accès à Communication FLA.");
  }
  if (roles && !roles.includes(profile.role)) {
    throw new HttpError(403, "Action réservée aux responsables communication.");
  }

  return profile;
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Erreur interne. Réessayez dans un instant." }, { status: 500 });
}
