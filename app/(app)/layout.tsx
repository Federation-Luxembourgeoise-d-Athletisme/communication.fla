"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCard } from "@/components/auth-card";
import { useSession } from "@/lib/session";

// Toutes les pages de l'outil exigent un membre actif de l'équipe.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, user, logout } = useSession();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  if (status === "forbidden") {
    return (
      <AuthCard title="Accès refusé" description={`${user?.email ?? "Ce compte"} ne fait pas partie de l'équipe, ou son accès a été désactivé.`}>
        <p className="text-sm">Demandez à un responsable communication de vous inviter.</p>
        <button type="button" onClick={logout} className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink">
          Se déconnecter
        </button>
      </AuthCard>
    );
  }

  if (status !== "ready") {
    return <p className="p-8 text-muted">Chargement…</p>;
  }

  return <AppShell>{children}</AppShell>;
}
