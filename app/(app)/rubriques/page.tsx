"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Dialog, Toast, Toggle, TypeTag, btn } from "@/components/ui";
import { createRubrique, deleteRubrique, importTemplate2026, setRubriqueActive, updateRubrique, type RubriqueData } from "@/lib/calendar-actions";
import { useRubriques, useTeam } from "@/lib/data";
import { JOURS, todayYmd } from "@/lib/dates";
import { CANAUX, CANAL_LABELS, PUB_TYPES, PUB_TYPE_LABELS, fullName, type RecurrenceRule, type Rubrique, type UserProfile } from "@/lib/domain";
import { ruleLabel } from "@/lib/recurrence";
import { useSession } from "@/lib/session";

export default function RubriquesPage() {
  const { profile } = useSession();
  const isManager = profile?.role === "manager";
  const { rubriques, loading } = useRubriques();
  const team = useTeam();
  const teamById = useMemo(() => new Map(team.map((u) => [u.uid, u])), [team]);
  const [editing, setEditing] = useState<Rubrique | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setToast(success);
    } catch (error) {
      console.error(error);
      setToast("L'enregistrement a échoué. Réessayez.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl font-semibold">Rubriques récurrentes</h1>
          <p className="max-w-2xl text-muted">
            Elles remplissent le calendrier automatiquement. Un changement de rythme s&apos;applique à partir d&apos;aujourd&apos;hui : les dates passées ne bougent pas.
            {isManager ? "" : " Seuls les responsables communication peuvent les modifier."}
          </p>
        </div>
        {isManager ? (
          <button type="button" className={btn.primary} onClick={() => setEditing("new")}>
            + Rubrique
          </button>
        ) : null}
      </div>

      {!loading && rubriques.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface p-5">
          <p className="font-semibold">Aucune rubrique pour l&apos;instant.</p>
          <p className="text-muted">
            Le calendrier type 2026 contient 9 rubriques : résultats du week-end, post photos, baromètre, newsletter, calendrier du mois prochain, calendrier des
            formations, Memories, Athlète 360° et tips de l&apos;athlétisme.
          </p>
          {isManager ? (
            <button
              type="button"
              className={btn.primary}
              disabled={importing}
              onClick={async () => {
                setImporting(true);
                await run(importTemplate2026, "Calendrier type 2026 importé");
                setImporting(false);
              }}
            >
              {importing ? "Import…" : "Importer le calendrier type 2026"}
            </button>
          ) : null}
        </div>
      ) : null}

      {rubriques.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Rubrique</th>
                <th className="px-4 py-3 font-semibold">Rythme</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Canaux</th>
                <th className="px-4 py-3 font-semibold">Responsable</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                {isManager ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rubriques.map((r) => {
                const resp = r.responsableUid ? teamById.get(r.responsableUid) : undefined;
                return (
                  <tr key={r.id} className={`border-t border-line ${r.active ? "" : "text-muted"}`}>
                    <td className="px-4 py-3 font-semibold">{r.titre}</td>
                    <td className="px-4 py-3">{ruleLabel(r.rule)}</td>
                    <td className="px-4 py-3">
                      <TypeTag type={r.type} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        {r.canaux.map((c) => (
                          <span key={c} className="rounded border border-line px-1 text-[10.5px] font-semibold text-muted">
                            {CANAL_LABELS[c].short}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {resp ? (
                        <span className="flex items-center gap-2">
                          <Avatar user={resp} />
                          {fullName(resp)}
                        </span>
                      ) : (
                        <span className="text-muted">À définir</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={r.active}
                        aria-label={`Activer ${r.titre}`}
                        disabled={!isManager}
                        onClick={() => run(() => setRubriqueActive(r.id, !r.active), r.active ? "Rubrique désactivée" : "Rubrique activée")}
                        className={`relative h-[22px] w-[38px] rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${r.active ? "bg-ok" : "bg-line"}`}
                      >
                        <span className={`absolute top-[3px] size-4 rounded-full bg-surface transition-all ${r.active ? "left-[19px]" : "left-[3px]"}`} />
                      </button>
                    </td>
                    {isManager ? (
                      <td className="px-4 py-3">
                        <button type="button" className="text-accent underline underline-offset-4" onClick={() => setEditing(r)}>
                          Modifier
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-sm text-muted">
        Autres publications selon l&apos;actualité, à ajouter dans le calendrier : sélections en équipe nationale, compétitions internationales, records et meilleures
        performances nationales, compétitions majeures au Luxembourg, marronniers.
      </p>

      {editing ? (
        <RubriqueForm
          rubrique={editing === "new" ? null : editing}
          team={team}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            if (editing === "new") await run(() => createRubrique(data), "Rubrique créée");
            else await run(() => updateRubrique(editing, data, todayYmd()), "Rubrique mise à jour");
            setEditing(null);
          }}
          onDelete={
            editing === "new"
              ? undefined
              : async () => {
                  await run(() => deleteRubrique(editing.id), "Rubrique supprimée");
                  setEditing(null);
                }
          }
        />
      ) : null}

      <Toast message={toast} />
    </>
  );
}

const ORDINALS = [
  [1, "1re semaine"],
  [2, "2e"],
  [3, "3e"],
  [4, "4e"],
  [5, "5e"],
] as const;

function RubriqueForm({
  rubrique,
  team,
  onClose,
  onSave,
  onDelete,
}: {
  rubrique: Rubrique | null;
  team: UserProfile[];
  onClose: () => void;
  onSave: (data: RubriqueData) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState<RubriqueData>(
    rubrique
      ? { titre: rubrique.titre, type: rubrique.type, canaux: rubrique.canaux, responsableUid: rubrique.responsableUid, rule: rubrique.rule, active: rubrique.active }
      : { titre: "", type: "post", canaux: ["fb", "ig"], responsableUid: null, rule: { kind: "weekly", dow: 1 }, active: true }
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rule = form.rule;
  const setRule = (next: RecurrenceRule) => setForm((f) => ({ ...f, rule: next }));
  const nth = rule.kind === "monthly" ? rule.nth : [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rule.kind === "monthly" && rule.nth.length === 0) return;
    setSaving(true);
    try {
      await onSave({ ...form, titre: form.titre.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog title={rubrique ? "Modifier la rubrique" : "Nouvelle rubrique"} onClose={onClose} wide>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Titre
          <input id="rub-titre" className="field-input" required autoFocus value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Fréquence
            <select
              id="rub-kind"
              className="field-input"
              value={rule.kind}
              onChange={(e) => {
                const kind = e.target.value as RecurrenceRule["kind"];
                setRule(kind === "monthly" ? { kind, dow: rule.dow, nth: [1] } : { kind, dow: rule.dow });
              }}
            >
              <option value="weekly">Chaque semaine</option>
              <option value="monthly">Certaines semaines du mois</option>
              <option value="last">Dernière semaine du mois</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Jour
            <select id="rub-dow" className="field-input" value={rule.dow} onChange={(e) => setRule({ ...rule, dow: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {JOURS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Type
            <select id="rub-type" className="field-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RubriqueData["type"] })}>
              {PUB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PUB_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {rule.kind === "monthly" ? (
          <div className="flex flex-col gap-1.5 text-sm font-medium">
            Semaines du mois
            <div className="flex flex-wrap gap-1.5">
              {ORDINALS.map(([n, label]) => (
                <Toggle key={n} on={nth.includes(n)} onClick={() => setRule({ ...rule, nth: nth.includes(n) ? nth.filter((x) => x !== n) : [...nth, n].sort() })}>
                  {label}
                </Toggle>
              ))}
            </div>
            {nth.length === 0 ? <span className="text-red">Choisissez au moins une semaine.</span> : null}
          </div>
        ) : null}

        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
          Rythme : <strong>{ruleLabel(rule)}</strong>
        </p>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Canaux
          <div className="flex flex-wrap gap-1.5">
            {CANAUX.map((c) => (
              <Toggle
                key={c}
                on={form.canaux.includes(c)}
                onClick={() => setForm((f) => ({ ...f, canaux: f.canaux.includes(c) ? f.canaux.filter((x) => x !== c) : [...f.canaux, c] }))}
              >
                {CANAL_LABELS[c].label}
              </Toggle>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Responsable par défaut
          <select id="rub-resp" className="field-input" value={form.responsableUid ?? ""} onChange={(e) => setForm({ ...form, responsableUid: e.target.value || null })}>
            <option value="">À définir</option>
            {team.map((u) => (
              <option key={u.uid} value={u.uid}>
                {fullName(u)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {onDelete ? (
            confirmDelete ? (
              <span className="flex flex-wrap items-center gap-2 text-sm">
                Supprimer la rubrique ? Les dates déjà personnalisées restent dans le calendrier.
                <button type="button" className={btn.danger} onClick={onDelete}>
                  Confirmer
                </button>
                <button type="button" className={btn.ghost} onClick={() => setConfirmDelete(false)}>
                  Garder
                </button>
              </span>
            ) : (
              <button type="button" className={btn.danger} onClick={() => setConfirmDelete(true)}>
                Supprimer
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className={btn.ghost} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={btn.primary} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
