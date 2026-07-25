import type { ChecklistRecord } from "../../domain/types";

export function checklistIsResolved(checklist: ChecklistRecord[]) {
  return checklist.every(
    (item) => item.checked || item.severity === "info" || (item.overrideReason?.trim().length ?? 0) > 0
  );
}
