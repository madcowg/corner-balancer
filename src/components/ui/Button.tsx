import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "text";

export interface ButtonProps
  extends PropsWithChildren,
    ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  children,
  className = "",
  fullWidth = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantClassName =
    variant === "primary"
      ? "bg-primary text-white hover:bg-[#1e558f]"
      : variant === "secondary"
        ? "border border-border bg-surface text-ink hover:border-primary hover:text-primary"
        : variant === "danger"
          ? "bg-danger text-white hover:bg-[#9e1d25]"
          : "bg-transparent text-primary hover:text-[#1e558f]";

  return (
    <button
      {...props}
      className={[
        "min-h-11 rounded-2xl px-4 py-3 text-body font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth ? "w-full" : "",
        variantClassName,
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}
