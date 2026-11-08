"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create account" },
];

/** Centre pill: a black Menu button with a working dropdown, plus a tagline chip. */
export function MenuPill() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <div className="flex items-center gap-1 rounded-2xl border border-[#0d0d10] bg-white p-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="site-menu"
          className="flex h-10 items-center gap-2 rounded-xl bg-[#0d0d10] px-3.5 text-[0.875rem] font-medium text-white transition hover:bg-[#2a2a30]"
        >
          {open ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />} Menu
        </button>
        <span className="hidden items-center gap-2 px-3 text-[0.875rem] text-[#3a3a42] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0d0d10]" aria-hidden /> Make promises. Make progress.
        </span>
      </div>
      {open && (
        <nav id="site-menu" aria-label="Site" className="animate-drop absolute left-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-[#ececf0] bg-white p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.25)]">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === l.href ? "page" : undefined}
              className="block rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-[#0d0d10] transition-colors hover:bg-[#f5f5f7] aria-[current=page]:bg-[#f5f5f7]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
