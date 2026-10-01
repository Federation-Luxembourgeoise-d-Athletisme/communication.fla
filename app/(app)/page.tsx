"use client";

import { fullName } from "@/lib/domain";
import { useSession } from "@/lib/session";

export default function CalendarPage() {
  const { profile } = useSession();

  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Calendrier</h1>
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="font-semibold">Bonjour {profile ? fullName(profile) : ""}.</p>
        <p className="text-muted">
          Le calendrier éditorial et les rubriques récurrentes arrivent à l&apos;étape suivante de la V1. En attendant, la
          gestion de l&apos;équipe est disponible dans « Équipe ».
        </p>
      </div>
    </>
  );
}
