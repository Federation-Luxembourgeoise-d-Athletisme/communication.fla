"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { AuthCard } from "@/components/auth-card";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    // Même message que le compte existe ou non, pour ne pas révéler qui fait partie de l'équipe.
    await sendPasswordResetEmail(auth, email.trim()).catch(() => undefined);
    setSent(true);
    setSubmitting(false);
  }

  return (
    <AuthCard title="Mot de passe oublié" description="Recevez un lien pour choisir un nouveau mot de passe.">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Si <strong>{email}</strong> fait partie de l&apos;équipe, un e-mail vient de lui être envoyé. Pensez à vérifier les courriers indésirables.
          </p>
          <Link href="/login" className="rounded-lg bg-accent px-4 py-2.5 text-center font-semibold text-accent-ink">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            E-mail
            <input id="reset-email" className="field-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink disabled:opacity-60">
            {submitting ? "Envoi…" : "Envoyer le lien"}
          </button>
          <Link href="/login" className="text-sm text-accent underline underline-offset-4">
            Retour à la connexion
          </Link>
        </form>
      )}
    </AuthCard>
  );
}
