"use client";

import { useState } from "react";
import { CANAUX, CANAL_LABELS, PUB_TYPES, PUB_TYPE_LABELS, fullName, type Canal, type PubType, type UserProfile } from "@/lib/domain";
import { Avatar, Dialog, Toggle, btn } from "@/components/ui";

export type NewPublication = { titre: string; date: string; type: PubType; canaux: Canal[]; assigneUids: string[] };

export function NewPublicationDialog({
  date,
  team,
  onClose,
  onCreate,
}: {
  date: string;
  team: UserProfile[];
  onClose: () => void;
  onCreate: (data: NewPublication) => Promise<void>;
}) {
  const [form, setForm] = useState<NewPublication>({ titre: "", date, type: "post", canaux: ["fb", "ig"], assigneUids: [] });
  const [submitting, setSubmitting] = useState(false);
  const toggle = <K extends "canaux" | "assigneUids">(key: K, value: string) =>
    setForm((f) => {
      const list = f[key] as string[];
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ ...form, titre: form.titre.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title="Nouvelle publication" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Titre
          <input id="new-titre" className="field-input" required autoFocus placeholder="Ex. Podiums des championnats" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Date
            <input id="new-date" type="date" className="field-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Type
            <select id="new-type" className="field-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PubType })}>
              {PUB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PUB_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Canaux
          <div className="flex flex-wrap gap-1.5">
            {CANAUX.map((c) => (
              <Toggle key={c} on={form.canaux.includes(c)} onClick={() => toggle("canaux", c)}>
                {CANAL_LABELS[c].label}
              </Toggle>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Assigné à
          <div className="flex flex-wrap gap-1.5">
            {team.map((u) => (
              <Toggle key={u.uid} on={form.assigneUids.includes(u.uid)} onClick={() => toggle("assigneUids", u.uid)}>
                <Avatar user={u} />
                {fullName(u)}
              </Toggle>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn.ghost} onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className={btn.primary} disabled={submitting}>
            {submitting ? "Ajout…" : "Ajouter au calendrier"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
