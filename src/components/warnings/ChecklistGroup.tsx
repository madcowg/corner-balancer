import type { ChangeEvent } from "react";

import type { ChecklistRecord } from "../../domain/types";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

export interface ChecklistGroupProps {
  title: string;
  checklist: ChecklistRecord[];
  onToggle(item: ChecklistRecord, checked: boolean): void;
  onOverrideReasonChange(item: ChecklistRecord, reason: string): void;
}

function toneForSeverity(severity: ChecklistRecord["severity"]) {
  return severity === "blocked"
    ? "danger"
    : severity === "critical"
      ? "warning"
      : severity === "caution"
        ? "info"
        : "neutral";
}

export function checklistIsResolved(checklist: ChecklistRecord[]) {
  return checklist.every(
    (item) => item.checked || item.severity === "info" || (item.overrideReason?.trim().length ?? 0) > 0
  );
}

export function ChecklistGroup({
  title,
  checklist,
  onToggle,
  onOverrideReasonChange
}: ChecklistGroupProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-h3 font-semibold text-ink">{title}</h3>
      <ul className="space-y-3">
        {checklist.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-canvas p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <label className="flex flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => onToggle(item, event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-border"
                />
                <span className="space-y-1">
                  <span className="block font-medium text-ink">{item.label}</span>
                  <span className="block text-small text-muted">
                    Checked items are resolved. Critical and blocked items need a documented reason if left unchecked.
                  </span>
                </span>
              </label>
              <StatusBadge tone={toneForSeverity(item.severity)}>{item.severity}</StatusBadge>
            </div>
            {!item.checked && item.severity !== "info" ? (
              <div className="mt-3 space-y-2">
                <label className="flex flex-col gap-2 text-small text-ink">
                  <span className="font-medium">Override reason</span>
                  <textarea
                    value={item.overrideReason ?? ""}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      onOverrideReasonChange(item, event.target.value)
                    }
                    rows={3}
                    className="rounded-2xl border border-border bg-white px-3 py-3 text-body text-ink"
                    placeholder="Required if you need to proceed with this unresolved item."
                  />
                </label>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => onOverrideReasonChange(item, "")}
                  >
                    Clear reason
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
