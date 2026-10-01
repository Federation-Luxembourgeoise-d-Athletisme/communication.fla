"use client";

import { fmtLong, parseYmd } from "@/lib/dates";
import type { Rubrique } from "@/lib/domain";
import { movedRule, ruleAt, ruleLabel, type CalendarItem } from "@/lib/recurrence";
import { Dialog, btn } from "@/components/ui";

// Déplacement d'une occurrence : cette date seulement, ou toute la récurrence à partir de cette date.
export function MoveDialog({
  item,
  rubrique,
  to,
  onOnly,
  onSeries,
  onClose,
}: {
  item: CalendarItem;
  rubrique: Rubrique;
  to: string;
  onOnly: () => void;
  onSeries: () => void;
  onClose: () => void;
}) {
  const orig = item.occurrenceDate ?? item.date;
  const current = ruleAt(rubrique, orig);
  const next = movedRule(current, parseYmd(orig), parseYmd(to));

  return (
    <Dialog title="Déplacer une rubrique récurrente" onClose={onClose}>
      <p>
        <strong>{item.titre}</strong> passe du <strong>{fmtLong(item.date)}</strong> au <strong>{fmtLong(to)}</strong>.
      </p>
      <div className="flex flex-col gap-2">
        <button type="button" className={`${btn.secondary} text-left`} onClick={onOnly}>
          <strong>Seulement cette date</strong>
          <br />
          <span className="text-sm text-muted">Les autres semaines restent : {ruleLabel(current).toLowerCase()}.</span>
        </button>
        <button type="button" className={`${btn.secondary} text-left`} onClick={onSeries}>
          <strong>Toute la récurrence, à partir de cette date</strong>
          <br />
          <span className="text-sm text-muted">Nouveau rythme : {ruleLabel(next).toLowerCase()}. Les dates passées ne bougent pas.</span>
        </button>
      </div>
      <div className="flex justify-end">
        <button type="button" className={btn.ghost} onClick={onClose}>
          Annuler
        </button>
      </div>
    </Dialog>
  );
}
