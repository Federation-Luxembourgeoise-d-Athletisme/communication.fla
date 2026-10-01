import { isRole } from "@/lib/domain";
import { errorResponse, HttpError, requireCaller } from "@/lib/server/auth";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

// Changement de rôle ou activation/désactivation d'un membre, réservé aux responsables.
// On ne peut pas modifier son propre compte : il reste ainsi toujours au moins un responsable actif.
export async function PATCH(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const caller = await requireCaller(request, ["manager"]);
    const { uid } = await params;

    if (uid === caller.uid) {
      throw new HttpError(400, "Vous ne pouvez pas modifier votre propre rôle ni désactiver votre compte.");
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!isRole(body.role)) throw new HttpError(400, "Rôle inconnu.");
      update.role = body.role;
    }
    if (body.active !== undefined) {
      if (typeof body.active !== "boolean") throw new HttpError(400, "Statut invalide.");
      update.active = body.active;
    }
    if (!Object.keys(update).length) throw new HttpError(400, "Aucune modification demandée.");

    const ref = adminDb.collection("users").doc(uid);
    if (!(await ref.get()).exists) throw new HttpError(404, "Membre introuvable.");

    await ref.update(update);

    if (typeof update.active === "boolean") {
      await adminAuth.updateUser(uid, { disabled: !update.active });
      // Déconnecte immédiatement un compte désactivé.
      if (!update.active) await adminAuth.revokeRefreshTokens(uid);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
