import { addDays, JOURS, parseYmd, ymd } from "@/lib/dates";
import type { Canal, Publication, PubType, RecurrenceRule, Rubrique, Statut } from "@/lib/domain";

const ORD = ["", "1er", "2e", "3e", "4e", "5e"];

export function occurs(rule: RecurrenceRule, d: Date) {
  if (d.getDay() !== rule.dow) return false;
  if (rule.kind === "weekly") return true;
  if (rule.kind === "monthly") return rule.nth.includes(Math.ceil(d.getDate() / 7));
  return addDays(d, 7).getMonth() !== d.getMonth();
}

// Règle en vigueur à une date donnée (les anciennes règles restent valables pour le passé).
export function ruleAt(rubrique: Pick<Rubrique, "rule" | "history">, ds: string) {
  const old = [...(rubrique.history ?? [])].sort((a, b) => a.until.localeCompare(b.until)).find((h) => ds < h.until);
  return old ? old.rule : rubrique.rule;
}

// Nouvelle règle quand une occurrence passe de `from` à `to` pour toute la série.
export function movedRule(rule: RecurrenceRule, from: Date, to: Date): RecurrenceRule {
  const n0 = Math.ceil(from.getDate() / 7);
  const n1 = Math.ceil(to.getDate() / 7);
  if (rule.kind === "monthly") {
    return { ...rule, dow: to.getDay(), nth: [...new Set(rule.nth.map((n) => (n === n0 ? n1 : n)))].sort() };
  }
  return { ...rule, dow: to.getDay() };
}

export function ruleLabel(rule: RecurrenceRule) {
  if (rule.kind === "weekly") return `Chaque ${JOURS[rule.dow]}`;
  if (rule.kind === "monthly") return `${rule.nth.map((n) => ORD[n]).join(" et ")} ${JOURS[rule.dow]} du mois`;
  return `Dernier ${JOURS[rule.dow]} du mois`;
}

export const occurrenceId = (rubriqueId: string, ds: string) => `r_${rubriqueId}_${ds}`;

export type CalendarItem = {
  id: string; // id du document publications (existant ou à créer pour une occurrence)
  materialized: boolean; // false = occurrence calculée, pas encore enregistrée
  rubriqueId: string | null;
  occurrenceDate: string | null;
  date: string;
  titre: string;
  type: PubType;
  canaux: Canal[];
  statut: Statut;
  assigneUids: string[];
  notes: string;
};

const fromPublication = (p: Publication): CalendarItem => ({
  id: p.id,
  materialized: true,
  rubriqueId: p.rubriqueId,
  occurrenceDate: p.occurrenceDate,
  date: p.date,
  titre: p.titre,
  type: p.type,
  canaux: p.canaux,
  statut: p.statut,
  assigneUids: p.assigneUids,
  notes: p.notes,
});

// Les occurrences des rubriques sont calculées à l'affichage ; seules celles qu'on a modifiées,
// déplacées ou annulées existent dans `publications`, avec un identifiant déterministe.
export function buildCalendarItems(args: {
  rubriques: Rubrique[];
  publications: Publication[];
  start: string;
  end: string;
  today: string;
}) {
  const { rubriques, publications, start, end, today } = args;
  const byId = new Map(publications.map((p) => [p.id, p]));
  const emitted = new Set<string>();
  const items: CalendarItem[] = [];

  for (let d = parseYmd(start); ymd(d) <= end; d = addDays(d, 1)) {
    const ds = ymd(d);
    for (const r of rubriques) {
      if (!r.active || !occurs(ruleAt(r, ds), d)) continue;
      const id = occurrenceId(r.id, ds);
      const saved = byId.get(id);
      if (saved) {
        emitted.add(id);
        if (!saved.annulee && saved.date === ds) items.push(fromPublication(saved));
        // Déplacée : elle sera ajoutée à sa nouvelle date si celle-ci est visible.
        if (saved.date !== ds) emitted.delete(id);
        continue;
      }
      items.push({
        id,
        materialized: false,
        rubriqueId: r.id,
        occurrenceDate: ds,
        date: ds,
        titre: r.titre,
        type: r.type,
        canaux: r.canaux,
        // Par convention, une occurrence passée jamais modifiée est considérée comme publiée.
        statut: ds < today ? "done" : "todo",
        assigneUids: r.responsableUid ? [r.responsableUid] : [],
        notes: "",
      });
    }
  }

  // Publications ponctuelles, occurrences déplacées et occurrences personnalisées dont la règle a changé.
  for (const p of publications) {
    if (p.annulee || emitted.has(p.id) || p.date < start || p.date > end) continue;
    items.push(fromPublication(p));
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || Number(Boolean(b.rubriqueId)) - Number(Boolean(a.rubriqueId)));
}
