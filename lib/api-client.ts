"use client";

import { auth } from "@/lib/firebase";

// Appelle une route API en joignant le jeton Firebase de l'utilisateur connecté.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Une erreur est survenue. Réessayez dans un instant.");
  }

  return payload;
}
