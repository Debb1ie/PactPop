"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FileDown, ImageDown } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const pill = "pure inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-medium text-foreground transition-opacity hover:opacity-80 disabled:opacity-50";

/** Back link + "Download PDF" (browser print) + "Save as image" for the document in #print-area. */
export function DocToolbar({ back, backLabel, fileName }: { back: string; backLabel: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const saveImage = async () => {
    const node = document.getElementById("print-area");
    if (!node) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.png`;
      a.click();
    } catch {
      toast({ tone: "error", title: "Couldn't create the image", description: "Use Download PDF instead." });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="no-print mb-5 flex flex-wrap items-center gap-2">
      <Link href={back} className={pill}>
        <ArrowLeft className="h-4 w-4 text-muted" /> {backLabel}
      </Link>
      <div className="ml-auto flex flex-wrap gap-2">
        <button type="button" onClick={() => window.print()} className={pill}>
          <FileDown className="h-4 w-4 text-[#6c4ef5]" /> Download PDF
        </button>
        <button type="button" onClick={saveImage} disabled={busy} className={pill}>
          <ImageDown className="h-4 w-4 text-[#0f9182]" /> {busy ? "Saving…" : "Save as image"}
        </button>
      </div>
    </div>
  );
}
