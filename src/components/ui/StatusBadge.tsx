import type { ReactNode } from "react";

export interface StatusBadgeProps {
  tone: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  const className =
    tone === "success"
      ? "border-success/20 bg-success/10 text-success"
      : tone === "warning"
        ? "border-warning/20 bg-warning/10 text-warning"
        : tone === "danger"
          ? "border-danger/20 bg-danger/10 text-danger"
          : tone === "info"
            ? "border-primary/20 bg-primary-tint text-primary"
            : "border-border bg-surface text-muted";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-caption font-semibold ${className}`}>
      {children}
    </span>
  );
}
