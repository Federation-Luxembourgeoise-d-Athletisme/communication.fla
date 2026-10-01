// Dates manipulées en chaînes locales « AAAA-MM-JJ » : pas de fuseau horaire, tri lexicographique = tri chronologique.

export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const todayYmd = () => ymd(new Date());
export const isYmd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
// Indexé comme Date.getDay() : 0 = dimanche.
export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const JOURS_GRILLE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const jourNum = (d: Date) => (d.getDate() === 1 ? "1er" : String(d.getDate()));
export const fmtLong = (s: string) => {
  const d = parseYmd(s);
  return `${JOURS[d.getDay()]} ${jourNum(d)} ${MOIS[d.getMonth()]}`;
};
export const fmtShort = (s: string) => {
  const d = parseYmd(s);
  return `${jourNum(d)} ${MOIS_COURTS[d.getMonth()]}`;
};

// Jours affichés dans la grille d'un mois : semaines complètes, du lundi au dimanche.
export function monthGridDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const start = addDays(first, -offset);
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}
