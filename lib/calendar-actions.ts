"use client";

import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseYmd } from "@/lib/dates";
import type { Publication, RecurrenceRule, Rubrique } from "@/lib/domain";
import { movedRule, occurrenceId, ruleAt, type CalendarItem } from "@/lib/recurrence";
import { TEMPLATE_2026 } from "@/lib/template-2026";

type PublicationData = Omit<Publication, "id">;

const toData = (item: CalendarItem): PublicationData => ({
  titre: item.titre,
  date: item.date,
  type: item.type,
  canaux: item.canaux,
  statut: item.statut,
  assigneUids: item.assigneUids,
  notes: item.notes,
  rubriqueId: item.rubriqueId,
  occurrenceDate: item.occurrenceDate,
  annulee: false,
});

// Modifie une publication ; une occurrence calculée est enregistrée à sa première modification.
export async function updateItem(item: CalendarItem, patch: Partial<PublicationData>, uid: string) {
  const ref = doc(db, "publications", item.id);
  if (item.materialized) {
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, { ...toData(item), ...patch, createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

export async function createPublication(data: Omit<PublicationData, "rubriqueId" | "occurrenceDate" | "annulee">, uid: string) {
  await addDoc(collection(db, "publications"), {
    ...data,
    rubriqueId: null,
    occurrenceDate: null,
    annulee: false,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const deletePublication = (id: string) => deleteDoc(doc(db, "publications", id));

export const cancelOccurrence = (item: CalendarItem, uid: string) => updateItem(item, { annulee: true }, uid);

// « Toute la récurrence, à partir de cette date » : la règle est découpée à la plus proche des deux dates,
// l'ancienne règle reste valable pour le passé.
export async function moveSeries(item: CalendarItem, rubrique: Rubrique, to: string, uid: string) {
  const orig = item.occurrenceDate ?? item.date;
  const cut = orig < to ? orig : to;
  const current = ruleAt(rubrique, orig);
  const batch = writeBatch(db);

  batch.update(doc(db, "rubriques", rubrique.id), {
    history: [...(rubrique.history ?? []).filter((h) => h.until <= cut), { until: cut, rule: current }],
    rule: movedRule(current, parseYmd(orig), parseYmd(to)),
    updatedAt: serverTimestamp(),
  });

  // Une occurrence déjà personnalisée suit la série à sa nouvelle date.
  if (item.materialized) {
    batch.delete(doc(db, "publications", item.id));
    batch.set(doc(db, "publications", occurrenceId(rubrique.id, to)), {
      ...toData(item),
      date: to,
      occurrenceDate: to,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/* ---------- Rubriques ---------- */

export type RubriqueData = Omit<Rubrique, "id" | "history">;

export async function createRubrique(data: RubriqueData) {
  await addDoc(collection(db, "rubriques"), { ...data, history: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

// Un changement de rythme s'applique à partir d'aujourd'hui : les dates passées gardent l'ancien rythme.
export async function updateRubrique(rubrique: Rubrique, data: RubriqueData, today: string) {
  const ruleChanged = JSON.stringify(rubrique.rule) !== JSON.stringify(data.rule);
  const history = ruleChanged
    ? [...(rubrique.history ?? []).filter((h) => h.until <= today), { until: today, rule: rubrique.rule }]
    : rubrique.history ?? [];
  await updateDoc(doc(db, "rubriques", rubrique.id), { ...data, history, updatedAt: serverTimestamp() });
}

export const setRubriqueActive = (id: string, active: boolean) =>
  updateDoc(doc(db, "rubriques", id), { active, updatedAt: serverTimestamp() });

export const deleteRubrique = (id: string) => deleteDoc(doc(db, "rubriques", id));

export async function importTemplate2026() {
  const batch = writeBatch(db);
  for (const entry of TEMPLATE_2026) {
    batch.set(doc(collection(db, "rubriques")), {
      ...entry,
      rule: entry.rule as RecurrenceRule,
      responsableUid: null,
      active: true,
      history: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
