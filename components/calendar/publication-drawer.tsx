"use client";

import { useEffect, useState } from "react";
import { fmtLong } from "@/lib/dates";
import { CANAUX, CANAL_LABELS, STATUTS, STATUT_LABELS, fullName, type Rubrique, type UserProfile } from "@/lib/domain";
import { ruleAt, ruleLabel, type CalendarItem } from "@/lib/recurrence";
import { Avatar, StatusPill, Toggle, TypeTag, btn } from "@/components/ui";
import type { Publication } from "@/lib/domain";

type Patch = Partial<Omit<Publication, "id">>;

export function PublicationDrawer({
  item,
  rubrique,
  team,
  onClose,
  onUpdate,
  onMove,
  onRemove,
}: {
  item: CalendarItem;
  rubrique: Rubrique | undefined;
  team: UserProfile[];
  onClose: () => void;
  onUpdate: (patch: Patch) => void;
  onMove: (to: string) => void;
  onRemove: () => void;
}) {
  // Les champs texte sont enregistrés à la sortie du champ, pas à chaque frappe.
  // Le parent remonte le panneau (key) quand on ouvre une autre publication.
  const [titre, setTitre] = useState(item.titre);
  const [notes, setNotes] = useState(item.notes);
  const [confirming, setConfirming] = useState(false);
  const isOccurrence = Boolean(item.rubriqueId);
  const moved = isOccurrence && item.occurrenceDate !== item.date;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = <K extends "canaux" | "assigneUids">(key: K, value: CalendarItem[K][number]) => {
    const list = item[key] as string[];
    onUpdate({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } as Patch);
  };

  return (
    <>
      <div className="fixed inset-0 z-20 bg-black/35" onClick={onClose} />
      <aside role="dialog" aria-label={item.titre} className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <TypeTag type={item.type} />
          <button type="button" className={btn.ghost} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
          <div className="flex flex-col gap-2">
            {isOccurrence ? (
              <h2 className="font-display text-3xl font-semibold leading-tight">{item.titre}</h2>
            ) : (
              <input
                id="drawer-titre"
                aria-label="Titre"
                className="-ml-2 rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-3xl font-semibold hover:border-line focus:border-line"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                onBlur={(e) => {
                  const value = e.currentTarget.value.trim();
                  if (value && value !== item.titre) onUpdate({ titre: value });
                }}
              />
            )}
            <label className="flex items-center gap-2 text-sm text-muted">
              Date
              <input
                id="drawer-date"
                type="date"
                className="field-input w-auto py-1"
                value={item.date}
                onChange={(e) => e.target.value && e.target.value !== item.date && onMove(e.target.value)}
              />
            </label>
          </div>

          {rubrique ? (
            <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">
              ↻ Occurrence de la rubrique <strong className="text-ink">{rubrique.titre}</strong> (
              {ruleLabel(ruleAt(rubrique, item.occurrenceDate ?? item.date)).toLowerCase()}). Les changements faits ici ne concernent que cette date.
              {moved && item.occurrenceDate ? ` Déplacée depuis le ${fmtLong(item.occurrenceDate)}.` : ""}
            </p>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Statut</legend>
            <div className="flex flex-wrap gap-1.5">
              {STATUTS.map((s) => (
                <Toggle key={s} on={item.statut === s} onClick={() => onUpdate({ statut: s })}>
                  <span className={`st ${s}`} aria-hidden="true" />
                  {STATUT_LABELS[s]}
                </Toggle>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Canaux</legend>
            <div className="flex flex-wrap gap-1.5">
              {CANAUX.map((c) => (
                <Toggle key={c} on={item.canaux.includes(c)} onClick={() => toggle("canaux", c)}>
                  {CANAL_LABELS[c].label}
                </Toggle>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Assigné à</legend>
            <div className="flex flex-wrap gap-1.5">
              {team.map((u) => (
                <Toggle key={u.uid} on={item.assigneUids.includes(u.uid)} onClick={() => toggle("assigneUids", u.uid)}>
                  <Avatar user={u} />
                  {fullName(u)}
                </Toggle>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Notes, liens vers les visuels</span>
            <textarea
              id="drawer-notes"
              className="field-input min-h-28"
              placeholder="Texte du post, lien Drive ou Canva, consignes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={(e) => e.currentTarget.value !== item.notes && onUpdate({ notes: e.currentTarget.value })}
            />
          </label>

          <p className="text-xs text-muted">
            Statut actuel : <StatusPill statut={item.statut} />
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5">
          {confirming ? (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              {isOccurrence ? "Retirer cette date du calendrier ?" : "Supprimer définitivement ?"}
              <button type="button" className={btn.danger} onClick={onRemove}>
                Confirmer
              </button>
              <button type="button" className={btn.ghost} onClick={() => setConfirming(false)}>
                Garder
              </button>
            </span>
          ) : (
            <button type="button" className={btn.danger} onClick={() => setConfirming(true)}>
              {isOccurrence ? "Annuler cette date" : "Supprimer"}
            </button>
          )}
          <button type="button" className={btn.secondary} onClick={onClose}>
            Fermer
          </button>
        </div>
      </aside>
    </>
  );
}
