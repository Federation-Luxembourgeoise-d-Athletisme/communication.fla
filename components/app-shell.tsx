"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, fullName, type Role } from "@/lib/domain";
import { useSession } from "@/lib/session";

type NavItem = { href: string; label: string; ready: boolean; roles?: Role[] };

// Les rubriques non encore construites restent visibles, marquées « bientôt », pour suivre l'avancement de la V1.
const NAV: NavItem[] = [
  { href: "/", label: "Calendrier", ready: true },
  { href: "/taches", label: "Tâches", ready: false },
  { href: "/evenements", label: "Événements", ready: false },
  { href: "/galerie", label: "Galerie photos", ready: false },
  { href: "/presence", label: "Présence photographes", ready: false },
  { href: "/rubriques", label: "Rubriques récurrentes", ready: true },
  { href: "/partenaires", label: "Partenaires", ready: false, roles: ["manager"] },
  { href: "/equipe", label: "Équipe", ready: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useSession();
  if (!profile) return null;

  const items = NAV.filter((item) => !item.roles || item.roles.includes(profile.role));

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-5 border-b border-line bg-surface px-4 py-5 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl font-bold uppercase leading-none">
            Communication <span className="text-accent">FLA</span>
          </p>
          <div className="lanes" aria-hidden="true" />
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            if (!item.ready) {
              return (
                <span key={item.href} className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-muted md:whitespace-normal" aria-disabled="true">
                  {item.label}
                  <span className="shrink-0 rounded-full border border-line px-1.5 text-[11px]">bientôt</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-2.5 py-2 font-medium ${active ? "bg-accent-soft font-semibold text-accent" : "hover:bg-surface-2"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-sm md:flex-col md:items-start">
          <div>
            <p className="font-semibold">{fullName(profile)}</p>
            <p className="text-muted">{ROLE_LABELS[profile.role]}</p>
          </div>
          <button type="button" onClick={logout} className="text-accent underline underline-offset-4">
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex min-w-0 flex-col gap-5 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
