"use client";

import { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { apiFetch } from "@/lib/api-client";
import { ROLES, ROLE_LABELS, fullName, type Role, type UserProfile } from "@/lib/domain";
import { auth, db } from "@/lib/firebase";
import { useSession } from "@/lib/session";

export default function TeamPage() {
  const { profile } = useSession();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const isManager = profile?.role === "manager";

  useEffect(
    () =>
      onSnapshot(collection(db, "users"), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as UserProfile);
        list.sort((a, b) => Number(b.active) - Number(a.active) || fullName(a).localeCompare(fullName(b), "fr"));
        setMembers(list);
      }),
    []
  );

  async function run(action: () => Promise<void>, success: string) {
    setMessage(null);
    try {
      await action();
      setMessage({ tone: "ok", text: success });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Action impossible." });
    }
  }

  const update = (member: UserProfile, patch: { role?: Role; active?: boolean }) =>
    run(
      () => apiFetch(`/api/users/${member.uid}`, { method: "PATCH", body: JSON.stringify(patch) }).then(() => undefined),
      patch.active === false ? `${fullName(member)} n'a plus accès à l'outil.` : patch.active ? `${fullName(member)} a de nouveau accès.` : "Rôle mis à jour."
    );

  const resendEmail = (member: UserProfile) =>
    run(() => sendPasswordResetEmail(auth, member.email), `E-mail envoyé à ${member.email}.`);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-semibold">Équipe</h1>
        <p className="text-muted">Seules les personnes listées ici peuvent se connecter à l&apos;outil.</p>
      </div>

      {message ? (
        <p role="status" className={`rounded-lg border px-4 py-2.5 text-sm ${message.tone === "ok" ? "border-ok/40 text-ok" : "border-red/40 text-red"}`}>
          {message.text}
        </p>
      ) : null}

      {isManager ? <InviteForm onDone={(text, tone) => setMessage({ text, tone })} /> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Rôle</th>
              <th className="px-4 py-3 font-semibold">Accès</th>
              {isManager ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const self = member.uid === profile?.uid;
              return (
                <tr key={member.uid} className={`border-t border-line ${member.active ? "" : "text-muted"}`}>
                  <td className="px-4 py-3 font-semibold">
                    {fullName(member)} {self ? <span className="font-normal text-muted">(vous)</span> : null}
                  </td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">
                    {isManager && !self ? (
                      <select
                        id={`role-${member.uid}`}
                        aria-label={`Rôle de ${fullName(member)}`}
                        className="field-input py-1.5"
                        value={member.role}
                        onChange={(e) => update(member, { role: e.target.value as Role })}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      ROLE_LABELS[member.role]
                    )}
                  </td>
                  <td className="px-4 py-3">{member.active ? "Actif" : "Désactivé"}</td>
                  {isManager ? (
                    <td className="px-4 py-3">
                      {self ? null : (
                        <div className="flex flex-wrap gap-3 whitespace-nowrap">
                          <button type="button" className="text-accent underline underline-offset-4" onClick={() => resendEmail(member)}>
                            Renvoyer l&apos;e-mail
                          </button>
                          <button
                            type="button"
                            className={`underline underline-offset-4 ${member.active ? "text-red" : "text-accent"}`}
                            onClick={() => update(member, { active: !member.active })}
                          >
                            {member.active ? "Désactiver" : "Réactiver"}
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InviteForm({ onDone }: { onDone: (text: string, tone: "ok" | "error") => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "team" as Role });
  const [submitting, setSubmitting] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { email } = await apiFetch<{ email: string }>("/api/users", { method: "POST", body: JSON.stringify(form) });
      // L'e-mail Firebase « réinitialiser le mot de passe » sert d'invitation : la personne choisit son mot de passe.
      await sendPasswordResetEmail(auth, email);
      onDone(`Invitation envoyée à ${email}.`, "ok");
      setForm({ firstName: "", lastName: "", email: "", role: "team" });
    } catch (error) {
      onDone(error instanceof Error ? error.message : "Invitation impossible.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl font-semibold">Inviter une personne</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Prénom
          <input id="invite-first" className="field-input" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nom
          <input id="invite-last" className="field-input" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          E-mail
          <input id="invite-email" className="field-input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Rôle
          <select id="invite-role" className="field-input" value={form.role} onChange={(e) => set("role", e.target.value)}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-60">
          {submitting ? "Envoi…" : "Envoyer l'invitation"}
        </button>
        <span className="text-sm text-muted">La personne reçoit un e-mail pour choisir son mot de passe.</span>
      </div>
    </form>
  );
}
