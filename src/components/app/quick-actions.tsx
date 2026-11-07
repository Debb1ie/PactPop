"use client";

import Link from "next/link";
import { ArrowUpRight, Link2, Moon, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toggleTheme } from "@/components/ui/theme";
import { useCopyRequestLink } from "./shell";

const row = "group flex w-full items-center gap-3 border-t border-border py-3 text-left first:border-t-0 first:pt-0 last:pb-0";

function Item({ icon: Icon, title, hint }: { icon: LucideIcon; title: ReactNode; hint: string }) {
  return (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0 text-faint transition-colors group-hover:text-foreground" strokeWidth={1.8} />
      <span className="flex-1 text-[0.9375rem] font-medium">{title}</span>
      <span className="hidden text-[0.8125rem] text-muted sm:inline">{hint}</span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </>
  );
}

/** Quick actions: plain rows, every one does something real. */
export function QuickActions({ requestPath }: { requestPath: string }) {
  const { copy, copied } = useCopyRequestLink(requestPath);
  return (
    <div>
      <Link href="/app/clients/new" className={row}>
        <Item icon={UserPlus} title="Add a client" hint="New profile" />
      </Link>
      <button type="button" onClick={copy} className={row}>
        <Item icon={Link2} title={copied ? "Link copied" : "Copy request link"} hint="For new enquiries" />
      </button>
      <Link href="/app/clients" className={row}>
        <Item icon={Users} title="View clients" hint="Balances & history" />
      </Link>
      <button type="button" onClick={toggleTheme} className={row}>
        <Item icon={Moon} title="Switch theme" hint="Light / dark" />
      </button>
    </div>
  );
}
