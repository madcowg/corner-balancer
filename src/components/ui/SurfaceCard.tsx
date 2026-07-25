import type { HTMLAttributes, PropsWithChildren } from "react";

export interface SurfaceCardProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
}

export function SurfaceCard({
  children,
  className = "",
  title,
  eyebrow,
  ...props
}: SurfaceCardProps) {
  return (
    <section
      {...props}
      className={`rounded-card border border-border bg-surface p-4 shadow-panel ${className}`}
    >
      {eyebrow ? (
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      {title ? <h2 className="mt-2 text-h2 font-semibold text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}
