export const ROLES = ["manager", "team"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  manager: "Responsable communication",
  team: "Équipe communication",
};

export type UserProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
  avatarUrl?: string | null;
  invitedBy?: string | null;
  createdAt?: unknown;
};

export function fullName(profile: Pick<UserProfile, "firstName" | "lastName" | "email">) {
  return `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/* ---------- Publications ---------- */

export const PUB_TYPES = ["post", "story", "video", "cp", "newsletter", "article"] as const;
export type PubType = (typeof PUB_TYPES)[number];
export const PUB_TYPE_LABELS: Record<PubType, string> = {
  post: "Post",
  story: "Story",
  video: "Vidéo / Reel",
  cp: "Communiqué de presse",
  newsletter: "Newsletter",
  article: "Article site",
};

export const CANAUX = ["fb", "ig", "li", "web", "presse", "email"] as const;
export type Canal = (typeof CANAUX)[number];
export const CANAL_LABELS: Record<Canal, { label: string; short: string }> = {
  fb: { label: "Facebook", short: "FB" },
  ig: { label: "Instagram", short: "IG" },
  li: { label: "LinkedIn", short: "IN" },
  web: { label: "Site web", short: "WEB" },
  presse: { label: "Presse", short: "PRESSE" },
  email: { label: "E-mail", short: "MAIL" },
};

export const STATUTS = ["todo", "doing", "review", "scheduled", "done"] as const;
export type Statut = (typeof STATUTS)[number];
export const STATUT_LABELS: Record<Statut, string> = {
  todo: "À faire",
  doing: "En cours",
  review: "À valider",
  scheduled: "Programmé",
  done: "Publié",
};

// Une publication ponctuelle, ou une occurrence de rubrique personnalisée (id = r_{rubriqueId}_{occurrenceDate}).
export type Publication = {
  id: string;
  titre: string;
  date: string;
  type: PubType;
  canaux: Canal[];
  statut: Statut;
  assigneUids: string[];
  notes: string;
  rubriqueId: string | null;
  occurrenceDate: string | null;
  annulee: boolean;
  createdBy?: string;
};

/* ---------- Rubriques récurrentes ---------- */

export type RecurrenceRule =
  | { kind: "weekly"; dow: number }
  | { kind: "monthly"; dow: number; nth: number[] }
  | { kind: "last"; dow: number };

export type Rubrique = {
  id: string;
  titre: string;
  type: PubType;
  canaux: Canal[];
  responsableUid: string | null;
  rule: RecurrenceRule;
  // Anciennes règles, chacune valable pour les dates strictement antérieures à `until`.
  history: { until: string; rule: RecurrenceRule }[];
  active: boolean;
};
