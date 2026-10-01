"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthCard } from "@/components/auth-card";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "ready") router.replace("/");
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Se connecter" description="Outil interne de l'équipe communication.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          E-mail
          <input id="login-email" className="field-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Mot de passe
          <input id="login-password" className="field-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="text-sm text-red" role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink disabled:opacity-60">
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
        <Link href="/mot-de-passe-oublie" className="text-sm text-accent underline underline-offset-4">
          Mot de passe oublié ?
        </Link>
      </form>
    </AuthCard>
  );
}
