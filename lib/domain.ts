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
