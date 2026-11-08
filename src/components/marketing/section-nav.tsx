"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/cn";

export const SECTIONS = [
  { id: "product", label: "Product" },
  { id: "features", label: "Features" },
  { id: "agents", label: "Agents" },
  { id: "paypal", label: "PayPal" },
  { id: "security", label: "Security" },
  { id: "faq", label: "FAQ" },
];

/**
 * Header navigation: one button per landing section, highlighted as you scroll (scrollspy).
 * On small screens the same links live in the Menu dropdown.
 */
export function SectionNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onHome) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [onHome]);

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

  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <div ref={box} className="relative">
      <nav aria-label="Sections" className="flex items-center gap-1 rounded-2xl border border-[#0d0d10] bg-white p-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="site-menu"
          className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0d0d10] px-2.5 text-[0.8125rem] font-medium text-white transition hover:bg-[#2a2a30] sm:gap-2 sm:px-3 lg:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />} Menu
        </button>
        <ul className="hidden items-center gap-0.5 lg:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={href(s.id)}
                aria-current={active === s.id ? "true" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-xl px-3.5 text-[0.8125rem] font-medium transition-colors",
                  active === s.id ? "bg-[#0d0d10] text-white" : "text-[#3a3a42] hover:bg-[#f2f2f5] hover:text-[#0d0d10]",
                )}
              >
                {s.label}
              </a>
            </li>
          ))}
          <li className="ml-0.5 border-l border-[#ececf0] pl-1">
            <Link href="/how-it-works" className="flex h-9 items-center rounded-xl px-3.5 text-[0.8125rem] font-medium text-[#3a3a42] hover:bg-[#f2f2f5] hover:text-[#0d0d10]">
              How it works
            </Link>
          </li>
        </ul>
      </nav>
      {open && (
        <div id="site-menu" className="animate-drop absolute left-1/2 top-[calc(100%+8px)] z-50 w-60 -translate-x-1/2 overflow-hidden rounded-2xl border border-[#ececf0] bg-white p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.25)] lg:hidden">
          {SECTIONS.map((s) => (
            <a key={s.id} href={href(s.id)} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-[#0d0d10] hover:bg-[#f5f5f7]">
              {s.label}
            </a>
          ))}
          <div className="my-1 h-px bg-[#ececf0]" />
          {[
            ["/how-it-works", "How it works"],
            ["/login", "Log in"],
          ].map(([h, l]) => (
            <Link key={h} href={h} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-[#0d0d10] hover:bg-[#f5f5f7]">
              {l}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
