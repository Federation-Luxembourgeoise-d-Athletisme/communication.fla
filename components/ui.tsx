"use client";

import { useEffect } from "react";
import { PUB_TYPE_LABELS, STATUT_LABELS, fullName, type PubType, type Statut, type UserProfile } from "@/lib/domain";

// Variable CSS --tc portée par un élément coloré selon son type de publication.
export const typeColor = (type: PubType) => ({ "--tc": `var(--t-${type})` }) as React.CSSProperties;

export function TypeTag({ type }: { type: PubType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ ...typeColor(type), color: "var(--tc)" }}>
      <span className="type-swatch" aria-hidden="true" />
      {PUB_TYPE_LABELS[type]}
    </span>
  );
}

export function StatusPill({ statut }: { statut: Statut }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
      <span className={`st ${statut}`} aria-hidden="true" />
      {STATUT_LABELS[statut]}
    </span>
  );
}

const HUES = [205, 330, 150, 28, 260, 0, 95];
export function Avatar({ user }: { user: UserProfile | undefined }) {
  if (!user) return null;
  const hue = HUES[[...user.uid].reduce((n, c) => n + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span
      title={fullName(user)}
      className="inline-grid size-6 flex-none place-items-center rounded-full border-2 border-surface text-[11px] font-semibold text-white"
      style={{ background: `hsl(${hue} 50% 42%)` }}
    >
      {(user.firstName || user.email).slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Toggle({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm disabled:cursor-default disabled:opacity-70 ${
        on ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

export function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div role="dialog" aria-label={title} className={`relative flex max-h-[calc(100%-2rem)] w-full flex-col gap-4 overflow-auto rounded-2xl bg-surface p-6 shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const btn = {
  primary: "rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-60",
  secondary: "rounded-lg border border-line bg-surface px-4 py-2 font-medium hover:border-muted",
  ghost: "rounded-lg px-3 py-2 font-medium hover:bg-surface-2",
  danger: "rounded-lg border border-red/40 px-4 py-2 font-medium text-red",
};

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg">
      {message}
    </div>
  );
}
