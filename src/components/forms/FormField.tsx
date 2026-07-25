import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldShellProps {
  label: string;
  helperText?: string | undefined;
  children: ReactNode;
}

function FieldShell({ label, helperText, children }: FieldShellProps) {
  return (
    <label className="flex flex-col gap-2 text-body text-ink">
      <span className="font-medium">{label}</span>
      {children}
      {helperText ? <span className="text-small text-muted">{helperText}</span> : null}
    </label>
  );
}

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string | undefined;
}

export function InputField({ label, helperText, className = "", ...props }: InputFieldProps) {
  return (
    <FieldShell label={label} helperText={helperText}>
      <input
        {...props}
        className={`min-h-11 rounded-2xl border border-border bg-white px-3 py-3 text-body text-ink ${className}`}
      />
    </FieldShell>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string | undefined;
}

export function SelectField({ label, helperText, className = "", children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} helperText={helperText}>
      <select
        {...props}
        className={`min-h-11 rounded-2xl border border-border bg-white px-3 py-3 text-body text-ink ${className}`}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string | undefined;
}

export function TextAreaField({
  label,
  helperText,
  className = "",
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} helperText={helperText}>
      <textarea
        {...props}
        className={`min-h-28 rounded-2xl border border-border bg-white px-3 py-3 text-body text-ink ${className}`}
      />
    </FieldShell>
  );
}
