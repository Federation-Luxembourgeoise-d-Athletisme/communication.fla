"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, signInWithEmailAndPassword, verifyPasswordResetCode } from "firebase/auth";
import { AuthCard } from "@/components/auth-card";
import { auth } from "@/lib/firebase";

// Page cible des e-mails Firebase (URL d'action personnalisée dans la console Firebase).
// Rien n'est vérifié à l'ouverture : les antivirus de messagerie (ex. Microsoft Defender) ouvrent
// les liens avant l'utilisateur, et le code ne doit être utilisé qu'à la validation du formulaire.
export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <AuthAction />
    </Suspense>
  );
}

function AuthAction() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (mode !== "resetPassword" || !code) {
    return (
      <AuthCard title="Lien invalide" description="Ce lien n'est pas complet ou n'est pas pris en charge.">
        <Link href="/login" className="rounded-lg bg-accent px-4 py-2.5 text-center font-semibold text-accent-ink">
          Aller à la connexion
        </Link>
      </AuthCard>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne sont pas identiques.");

    setSubmitting(true);
    try {
      const email = await verifyPasswordResetCode(auth, code);
      await confirmPasswordReset(auth, code, password);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (err) {
      const errorCode = (err as { code?: string }).code ?? "";
      setError(
        errorCode === "auth/weak-password"
          ? "Mot de passe trop faible. Choisissez-en un plus long."
          : errorCode === "auth/expired-action-code" || errorCode === "auth/invalid-action-code"
            ? "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau avec « Mot de passe oublié »."
            : "Impossible d'enregistrer le mot de passe. Réessayez."
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Choisissez votre mot de passe" description="Au moins 8 caractères. Vous serez connecté juste après.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nouveau mot de passe
          <input id="new-password" className="field-input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Confirmer le mot de passe
          <input id="confirm-password" className="field-input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error ? (
          <p className="text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink disabled:opacity-60">
          {submitting ? "Enregistrement…" : "Enregistrer et me connecter"}
        </button>
        <Link href="/mot-de-passe-oublie" className="text-sm text-accent underline underline-offset-4">
          Le lien ne fonctionne pas ? Recevoir un nouveau lien
        </Link>
      </form>
    </AuthCard>
  );
}
