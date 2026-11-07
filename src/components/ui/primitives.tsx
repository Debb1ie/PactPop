import Link from "next/link";
import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/* ───────── Panels ───────── */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)] dark:shadow-none", className)}
      {...props}
    />
  );
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pb-1 pt-4", className)}>
      <div className="min-w-0">
        <h3 className="text-[1.0625rem] font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-3", className)} {...props} />;
}

/** Small outlined pill used for "See all"-style header actions. */
export function PillLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-7 items-center rounded-full border border-border-strong px-3 text-xs font-semibold text-foreground transition-colors hover:bg-fill">
      {children}
    </Link>
  );
}

/* ───────── Lists ───────── */

/** A titled panel containing a divided list (e.g. "Recent activity"). */
export function ListGroup({ header, footer, children, className, action }: { header?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={className}>
      <Card>
        {(header || action) && (
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
            {header && <h2 className="text-[1rem] font-semibold tracking-tight">{header}</h2>}
            {action}
          </div>
        )}
        <ul className="divide-y divide-border px-2 pb-2 [&>li]:relative">{children}</ul>
      </Card>
      {footer && <p className="mt-2 px-2 text-[0.8125rem] leading-snug text-muted">{footer}</p>}
    </section>
  );
}

type RowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconBg?: string;
  detail?: ReactNode;
  href?: string;
  chevron?: boolean;
  className?: string;
};

export function ListRow({ title, subtitle, icon, iconBg = "bg-accent", detail, href, chevron, className }: RowProps) {
  const inner = (
    <div className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl px-3 py-2.5">
      {icon && <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white", iconBg)}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.9375rem] font-medium">{title}</div>
        {subtitle && <div className="truncate text-[0.8125rem] text-muted">{subtitle}</div>}
      </div>
      {detail && <div className="shrink-0 text-right text-[0.9375rem] text-muted">{detail}</div>}
      {(chevron ?? Boolean(href)) && <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden />}
    </div>
  );
  return (
    <li className={cn("border-border", className)}>
      {href ? (
        <Link href={href} className="block rounded-2xl transition-colors hover:bg-fill">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

/* ───────── Form fields ───────── */

const field =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 text-[0.9375rem] text-foreground placeholder:text-faint transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-ring/40 disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, "h-11 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block px-0.5 text-[0.8125rem] font-medium text-muted", className)} {...props} />;
}

export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 px-0.5 text-[0.8125rem] text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 px-0.5 text-[0.8125rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ───────── Feedback ───────── */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-fill", className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-[pp-shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-accent-soft text-accent">{icon}</div>}
      <h3 className="text-[1.0625rem] font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[0.9375rem] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNotice({ title = "Something went wrong", message }: { title?: string; message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-error/25 bg-error-soft px-4 py-3 text-[0.9375rem]">
      <p className="font-semibold text-error">{title}</p>
      <p className="mt-0.5 text-foreground/80">{message}</p>
    </div>
  );
}

export function Notice({ tone = "info", children, className, icon }: { tone?: "info" | "warning" | "success"; children: ReactNode; className?: string; icon?: ReactNode }) {
  const tones = { info: "border-accent/25 bg-accent-soft", warning: "border-warning/25 bg-warning-soft", success: "border-success/25 bg-success-soft" };
  return (
    <div className={cn("flex gap-3 rounded-2xl border px-4 py-3.5 text-[0.9375rem]", tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ───────── Page chrome ───────── */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-semibold leading-tight sm:text-[2rem]">{title}</h1>
        {description && <div className="mt-1 text-[0.9375rem] text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      title="Seeded demonstration record — not real customer or PayPal data"
      className={cn("inline-flex items-center rounded-full border border-warning/30 bg-warning-soft px-2 py-px align-middle text-[0.6875rem] font-semibold uppercase tracking-wide text-warning", className)}
    >
      Demo
    </span>
  );
}

export type StatTone = "violet" | "mint" | "amber" | "rose" | "sky";

/**
 * KPI tile. With `tone` it renders as a stub (receipt-style ticket): label above the dashed tear
 * line, figure below.
 */
export function Stat({ label, value, sub, icon, tone, iconBg = "bg-accent" }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: StatTone; iconBg?: string }) {
  if (tone) {
    return (
      <div className={cn("stub", `tone-${tone}`)}>
        <div className="flex h-[3.25rem] items-center gap-2.5 px-4 sm:px-5">
          {icon && <span className="tone-bg tone-text grid h-7 w-7 shrink-0 place-items-center rounded-lg">{icon}</span>}
          <p className="truncate text-[0.8125rem] font-medium text-muted">{label}</p>
          <span className="tone-bar ml-auto h-2 w-2 shrink-0 rounded-[2px]" aria-hidden />
        </div>
        <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          <p className="money text-[1.6rem] font-semibold leading-none tracking-[-0.03em] sm:text-[1.875rem]">{value}</p>
          {sub && <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted">{sub}</p>}
        </div>
      </div>
    );
  }
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2">
        {icon && <span className={cn("grid h-7 w-7 place-items-center rounded-full text-white", iconBg)}>{icon}</span>}
        <p className="text-[0.8125rem] font-medium text-muted">{label}</p>
      </div>
      <p className="money mt-3 text-[1.75rem] font-semibold leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-[0.8125rem] text-muted">{sub}</p>}
    </Card>
  );
}
