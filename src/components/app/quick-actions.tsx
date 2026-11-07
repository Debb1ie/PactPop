"use client";

import Link from "next/link";
import { Crown, Moon, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toggleTheme } from "@/components/ui/theme";

const tile =
  "group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-fill text-[0.8125rem] font-medium transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-fill-strong";

function Glyph({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full border border-border-strong text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/** Quick Actions grid — every tile does something real. */
export function QuickActions({ showUpgrade }: { showUpgrade: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      <Link href="/app/clients/new" className={tile}>
        <Glyph icon={UserPlus} /> Add client
      </Link>
      <Link href="/app/clients" className={tile}>
        <Glyph icon={Users} /> Clients
      </Link>
      <button type="button" onClick={toggleTheme} className={tile}>
        <Glyph icon={Moon} /> Theme
      </button>
      <Link href="/pricing" className={tile}>
        <Glyph icon={Crown} /> {showUpgrade ? "Upgrade" : "Plans"}
      </Link>
    </div>
  );
}
