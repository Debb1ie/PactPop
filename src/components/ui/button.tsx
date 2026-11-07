import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline" | "gray" | "white";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-1.5 font-semibold tracking-[-0.01em] transition-[transform,background-color,box-shadow,filter,opacity] duration-200 ease-[var(--ease-ios)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#7d70ff] to-[#5a4af2] text-white shadow-[0_8px_24px_-8px_rgb(108_92_255/0.75),inset_0_1px_0_rgb(255_255_255/0.25)] hover:brightness-110",
  secondary: "bg-accent-soft text-accent hover:brightness-110",
  gray: "bg-fill text-foreground hover:bg-fill-strong",
  outline: "border border-border-strong bg-surface/60 text-foreground hover:bg-fill",
  ghost: "text-muted hover:bg-fill hover:text-foreground",
  white: "bg-white text-[#111118] shadow-[0_8px_24px_-10px_rgb(0_0_0/0.4)] hover:bg-[#f1efff]",
  danger: "bg-error text-white hover:brightness-110",
  success: "bg-success text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-xl px-3.5 text-[0.8125rem]",
  md: "h-11 rounded-xl px-4 text-[0.9375rem]",
  lg: "h-12 rounded-2xl px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent opacity-80", className)} aria-hidden />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
