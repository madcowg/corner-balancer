import type { PropsWithChildren } from "react";

export interface CriticalWarningProps extends PropsWithChildren {
  tone?: "warning" | "danger" | "info";
  title: string;
}

export function CriticalWarning({
  children,
  title,
  tone = "warning"
}: CriticalWarningProps) {
  const className =
    tone === "danger"
      ? "border-danger/20 bg-danger/10 text-danger"
      : tone === "info"
        ? "border-primary/20 bg-primary-tint text-primary"
        : "border-warning/20 bg-warning/10 text-warning";

  return (
    <section className={`rounded-2xl border p-4 ${className}`}>
      <h3 className="text-h3 font-semibold">{title}</h3>
      <p className="mt-2 text-small">{children}</p>
    </section>
  );
}
