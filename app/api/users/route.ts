import { FieldValue } from "firebase-admin/firestore";
import { isRole } from "@/lib/domain";
import { errorResponse, HttpError, requireCaller } from "@/lib/server/auth";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Invitation : crée le compte Firebase (sans mot de passe) et la fiche d'équipe.
// Le navigateur du responsable déclenche ensuite l'e-mail Firebase « choisir son mot de passe ».
export async function POST(request: Request) {
  try {
    const caller = await requireCaller(request, ["manager"]);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const email = String(body.email ?? "").trim().toLowerCase();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const role = body.role;

    if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, "Adresse e-mail invalide.");
    if (!firstName || !lastName) throw new HttpError(400, "Prénom et nom sont obligatoires.");
    if (!isRole(role)) throw new HttpError(400, "Rôle inconnu.");

    let uid: string;
    try {
      uid = (await adminAuth.getUserByEmail(email)).uid;
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
      uid = (await adminAuth.createUser({ email, displayName: `${firstName} ${lastName}` })).uid;
    }

    const ref = adminDb.collection("users").doc(uid);
    if ((await ref.get()).exists) {
      throw new HttpError(409, "Cette personne fait déjà partie de l'équipe.");
    }

    await ref.set({
      uid,
      email,
      firstName,
      lastName,
      role,
      active: true,
      avatarUrl: null,
      invitedBy: caller.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ uid, email }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
