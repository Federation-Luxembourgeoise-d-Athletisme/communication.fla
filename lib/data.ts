"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fullName, type Publication, type Rubrique, type UserProfile } from "@/lib/domain";

// Membres actifs de l'équipe, triés par nom (listes « Assigné à », responsables de rubriques).
export function useTeam() {
  const [team, setTeam] = useState<UserProfile[]>([]);
  useEffect(
    () =>
      onSnapshot(collection(db, "users"), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ ...d.data(), uid: d.id }) as UserProfile).filter((u) => u.active);
        setTeam(list.sort((a, b) => fullName(a).localeCompare(fullName(b), "fr")));
      }),
    []
  );
  return team;
}

export function useRubriques() {
  const [state, setState] = useState<{ rubriques: Rubrique[]; loading: boolean }>({ rubriques: [], loading: true });
  useEffect(
    () =>
      onSnapshot(collection(db, "rubriques"), (snapshot) => {
        const rubriques = snapshot.docs.map((d) => ({ history: [], ...d.data(), id: d.id }) as unknown as Rubrique);
        setState({ rubriques: rubriques.sort((a, b) => a.titre.localeCompare(b.titre, "fr")), loading: false });
      }),
    []
  );
  return state;
}

// Publications visibles sur une période : par date affichée, et par date d'origine
// (une occurrence déplacée hors de la période doit quand même masquer sa place d'origine).
export function usePublications(start: string, end: string) {
  const [byDate, setByDate] = useState<Publication[]>([]);
  const [byOccurrence, setByOccurrence] = useState<Publication[]>([]);

  useEffect(() => {
    const ref = collection(db, "publications");
    const toList = (docs: { id: string; data: () => object }[]) => docs.map((d) => ({ ...d.data(), id: d.id }) as Publication);
    const unsubDate = onSnapshot(query(ref, where("date", ">=", start), where("date", "<=", end)), (s) => setByDate(toList(s.docs)));
    const unsubOcc = onSnapshot(query(ref, where("occurrenceDate", ">=", start), where("occurrenceDate", "<=", end)), (s) =>
      setByOccurrence(toList(s.docs))
    );
    return () => {
      unsubDate();
      unsubOcc();
    };
  }, [start, end]);

  const merged = new Map<string, Publication>();
  [...byDate, ...byOccurrence].forEach((p) => merged.set(p.id, p));
  return [...merged.values()];
}
