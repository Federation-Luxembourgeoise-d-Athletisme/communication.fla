"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MoveDialog } from "@/components/calendar/move-dialog";
import { NewPublicationDialog, type NewPublication } from "@/components/calendar/new-publication-dialog";
import { PublicationDrawer } from "@/components/calendar/publication-drawer";
import { Avatar, StatusPill, Toast, TypeTag, btn, typeColor } from "@/components/ui";
import { cancelOccurrence, createPublication, deletePublication, moveSeries, updateItem } from "@/lib/calendar-actions";
import { usePublications, useRubriques, useTeam } from "@/lib/data";
import { JOURS, JOURS_GRILLE, MOIS, fmtLong, monthGridDays, todayYmd, ymd } from "@/lib/dates";
import { CANAUX, CANAL_LABELS, PUB_TYPES, PUB_TYPE_LABELS, STATUTS, STATUT_LABELS, fullName, type Canal, type Publication, type PubType } from "@/lib/domain";
import { buildCalendarItems, type CalendarItem } from "@/lib/recurrence";
import { useSession } from "@/lib/session";

type Filters = { type: PubType | ""; canal: Canal | ""; personne: string; recurrentes: boolean };

export default function CalendarPage() {
  const { profile } = useSession();
  const today = todayYmd();
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  // Vue liste par défaut sur téléphone (le glisser-déposer n'y fonctionne pas). La page n'est rendue
  // qu'après la connexion, donc côté navigateur : window est disponible.
  const [mode, setMode] = useState<"mois" | "liste">(() => (typeof window !== "undefined" && window.innerWidth < 760 ? "liste" : "mois"));
  const [filters, setFilters] = useState<Filters>({ type: "", canal: "", personne: "", recurrentes: true });
  const [openId, setOpenId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [moveReq, setMoveReq] = useState<{ item: CalendarItem; to: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const days = useMemo(() => monthGridDays(month.y, month.m), [month]);
  const start = ymd(days[0]!);
  const end = ymd(days[days.length - 1]!);

  const { rubriques, loading: loadingRubriques } = useRubriques();
  const team = useTeam();
  const publications = usePublications(start, end);
  const teamById = useMemo(() => new Map(team.map((u) => [u.uid, u])), [team]);
  const rubriqueById = useMemo(() => new Map(rubriques.map((r) => [r.id, r])), [rubriques]);

  const items = useMemo(
    () =>
      buildCalendarItems({ rubriques, publications, start, end, today }).filter(
        (i) =>
          (!filters.type || i.type === filters.type) &&
          (!filters.canal || i.canaux.includes(filters.canal)) &&
          (!filters.personne || i.assigneUids.includes(filters.personne)) &&
          (filters.recurrentes || !i.rubriqueId)
      ),
    [rubriques, publications, start, end, today, filters]
  );
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((i) => map.set(i.date, [...(map.get(i.date) ?? []), i]));
    return map;
  }, [items]);

  const openItem = openId ? items.find((i) => i.id === openId) : undefined;
  const uid = profile?.uid ?? "";

  async function run(action: () => Promise<unknown>, success?: string) {
    try {
      await action();
      if (success) setToast(success);
    } catch (error) {
      console.error(error);
      setToast("L'enregistrement a échoué. Réessayez.");
    }
  }

  // Glisser-déposer ou changement de date : une occurrence demande « cette date » ou « toute la série ».
  function requestMove(item: CalendarItem, to: string) {
    if (to === item.date) return;
    if (item.rubriqueId && rubriqueById.has(item.rubriqueId)) {
      setMoveReq({ item, to });
      return;
    }
    run(() => updateItem(item, { date: to }, uid), `Déplacée au ${fmtLong(to)}`);
  }

  const goMonth = (delta: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className={btn.secondary} onClick={() => goMonth(-1)} aria-label="Mois précédent">
            ‹
          </button>
          <h1 className="min-w-48 text-center font-display text-4xl font-semibold capitalize">
            {MOIS[month.m]} {month.y}
          </h1>
          <button type="button" className={btn.secondary} onClick={() => goMonth(1)} aria-label="Mois suivant">
            ›
          </button>
          <button type="button" className={btn.ghost} onClick={() => setMonth({ y: now.getFullYear(), m: now.getMonth() })}>
            Aujourd&apos;hui
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-line bg-surface">
            {(["mois", "liste"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-2 font-medium capitalize ${mode === m ? "bg-ink text-bg" : ""}`}>
                {m}
              </button>
            ))}
          </div>
          <button type="button" className={btn.primary} onClick={() => setNewDate(today)}>
            + Publication
          </button>
        </div>
      </div>

      {!loadingRubriques && rubriques.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          Aucune rubrique récurrente pour l&apos;instant.{" "}
          <Link href="/rubriques" className="font-semibold text-accent underline underline-offset-4">
            Importer le calendrier type 2026
          </Link>{" "}
          pour remplir le calendrier automatiquement.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select id="f-type" aria-label="Type" className="field-input w-auto py-1.5" value={filters.type} onChange={(e) => setFilter("type", e.target.value as PubType | "")}>
          <option value="">Tous les types</option>
          {PUB_TYPES.map((t) => (
            <option key={t} value={t}>
              {PUB_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select id="f-canal" aria-label="Canal" className="field-input w-auto py-1.5" value={filters.canal} onChange={(e) => setFilter("canal", e.target.value as Canal | "")}>
          <option value="">Tous les canaux</option>
          {CANAUX.map((c) => (
            <option key={c} value={c}>
              {CANAL_LABELS[c].label}
            </option>
          ))}
        </select>
        <select id="f-personne" aria-label="Personne" className="field-input w-auto py-1.5" value={filters.personne} onChange={(e) => setFilter("personne", e.target.value)}>
          <option value="">Toute l&apos;équipe</option>
          {team.map((u) => (
            <option key={u.uid} value={u.uid}>
              {fullName(u)}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-muted">
          <input id="f-rec" type="checkbox" checked={filters.recurrentes} onChange={(e) => setFilter("recurrentes", e.target.checked)} />
          Afficher les rubriques récurrentes
        </label>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {PUB_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5" style={typeColor(t)}>
            <span className="type-swatch" aria-hidden="true" />
            {PUB_TYPE_LABELS[t]}
          </span>
        ))}
        <span>↻ récurrent</span>
        {STATUTS.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`st ${s}`} aria-hidden="true" />
            {STATUT_LABELS[s]}
          </span>
        ))}
        {mode === "mois" ? <span>Glissez une publication sur un autre jour pour la déplacer.</span> : null}
      </div>

      {mode === "mois" ? (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {JOURS_GRILLE.map((j) => (
            <div key={j} className="bg-surface-2 px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
              {j}
            </div>
          ))}
          {days.map((d) => {
            const ds = ymd(d);
            const out = d.getMonth() !== month.m;
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={ds}
                onClick={() => setNewDate(ds)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOver !== ds) setDragOver(ds);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((o) => (o === ds ? null : o));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const item = items.find((i) => i.id === e.dataTransfer.getData("text/plain"));
                  if (item) requestMove(item, ds);
                }}
                className={`flex min-h-28 min-w-0 cursor-pointer flex-col gap-1 p-1.5 ${out ? "bg-bg" : weekend ? "bg-[color-mix(in_srgb,var(--surface-2)_45%,var(--surface))]" : "bg-surface"} ${dragOver === ds ? "cell-over" : ""}`}
              >
                <span className={`w-fit rounded-md px-1.5 py-0.5 font-display text-lg font-semibold leading-none ${ds === today ? "bg-red text-white" : out ? "opacity-45" : ""}`}>
                  {d.getDate()}
                </span>
                {(byDate.get(ds) ?? []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", item.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenId(item.id);
                    }}
                    title={`${item.titre} · ${STATUT_LABELS[item.statut]}`}
                    className={`chip ${item.date < today ? "past" : ""}`}
                    style={typeColor(item.type)}
                  >
                    <span className={`st ${item.statut}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.titre}</span>
                    {item.rubriqueId ? <span className="text-xs text-muted" aria-label="récurrent">↻</span> : null}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
          {days
            .filter((d) => d.getMonth() === month.m && (byDate.has(ymd(d)) || ymd(d) === today))
            .map((d) => {
              const ds = ymd(d);
              return (
                <div key={ds} className={`grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-t border-line px-4 py-3 first:border-t-0 ${ds === today ? "bg-[color-mix(in_srgb,var(--red)_6%,var(--surface))]" : ""}`}>
                  <div className="flex flex-col">
                    <span className={`font-display text-3xl font-semibold leading-none ${ds === today ? "text-red" : ""}`}>{d.getDate()}</span>
                    <span className="text-xs uppercase tracking-wider text-muted">{JOURS[d.getDay()]!.slice(0, 3)}.</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    {(byDate.get(ds) ?? []).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOpenId(item.id)}
                        style={typeColor(item.type)}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg border border-line border-l-[3px] border-l-[var(--tc)] px-3 py-2 text-left hover:border-muted hover:border-l-[var(--tc)]"
                      >
                        <span className="truncate font-semibold">{item.titre}</span>
                        <span className="flex">
                          {item.assigneUids.map((id) => (
                            <Avatar key={id} user={teamById.get(id)} />
                          ))}
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <TypeTag type={item.type} />
                          {item.canaux.map((c) => (
                            <span key={c} className="rounded border border-line px-1 text-[10.5px] font-semibold">
                              {CANAL_LABELS[c].short}
                            </span>
                          ))}
                          {item.rubriqueId ? <span>↻ récurrent</span> : null}
                        </span>
                        <StatusPill statut={item.statut} />
                      </button>
                    ))}
                    {!byDate.has(ds) ? <span className="text-sm text-muted">Rien de prévu aujourd&apos;hui.</span> : null}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {openItem ? (
        <PublicationDrawer
          key={openItem.id}
          item={openItem}
          rubrique={openItem.rubriqueId ? rubriqueById.get(openItem.rubriqueId) : undefined}
          team={team}
          onClose={() => setOpenId(null)}
          onUpdate={(patch: Partial<Omit<Publication, "id">>) => run(() => updateItem(openItem, patch, uid))}
          onMove={(to) => requestMove(openItem, to)}
          onRemove={() => {
            setOpenId(null);
            if (openItem.rubriqueId) run(() => cancelOccurrence(openItem, uid), "Date retirée du calendrier");
            else run(() => deletePublication(openItem.id), "Publication supprimée");
          }}
        />
      ) : null}

      {newDate ? (
        <NewPublicationDialog
          date={newDate}
          team={team}
          onClose={() => setNewDate(null)}
          onCreate={async (data: NewPublication) => {
            await run(() => createPublication({ ...data, statut: "todo", notes: "" }, uid), "Publication ajoutée au calendrier");
            setNewDate(null);
          }}
        />
      ) : null}

      {moveReq && moveReq.item.rubriqueId && rubriqueById.get(moveReq.item.rubriqueId) ? (
        <MoveDialog
          item={moveReq.item}
          rubrique={rubriqueById.get(moveReq.item.rubriqueId)!}
          to={moveReq.to}
          onClose={() => setMoveReq(null)}
          onOnly={() => {
            const { item, to } = moveReq;
            setMoveReq(null);
            run(() => updateItem(item, { date: to }, uid), `Déplacée au ${fmtLong(to)}, cette date seulement`);
          }}
          onSeries={() => {
            const { item, to } = moveReq;
            setMoveReq(null);
            setOpenId(null);
            run(() => moveSeries(item, rubriqueById.get(item.rubriqueId!)!, to, uid), "Récurrence déplacée à partir de cette date");
          }}
        />
      ) : null}

      <Toast message={toast} />
    </>
  );
}
