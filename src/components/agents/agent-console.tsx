"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Ban, Check, CircleDashed, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { ApprovalCard } from "./approval-card";

type Ev =
  | { type: "start"; executionId: string; mode: "ai" | "heuristic"; model: string | null }
  | { type: "thinking"; agent: string; text: string }
  | { type: "tool_call"; id: string; tool: string; agent: string; label: string; decision: "allowed" | "approval_required" | "denied" }
  | { type: "tool_result"; id: string; ok: boolean; summary: string }
  | { type: "approval"; approvalId: string; title: string; amount: string | null; reason: string }
  | { type: "message"; agent: string; text: string }
  | { type: "done"; status: string }
  | { type: "error"; message: string };

type Run = { id: number; input: string; events: Ev[]; done: boolean };

/** Fire this event from anywhere (e.g. briefing "Run" buttons) to send a command to the console. */
export const AGENT_COMMAND_EVENT = "pactpop:agent-command";
export function sendAgentCommand(text: string) {
  window.dispatchEvent(new CustomEvent(AGENT_COMMAND_EVENT, { detail: text }));
}

const AGENT_HUE: Record<string, string> = {
  Orchestrator: "bg-foreground text-background",
  "Intake Agent": "bg-[#4a8fdb] text-white",
  "Scope Agent": "bg-[#d9932a] text-white",
  "Pricing Agent": "bg-[#2f9e6e] text-white",
  "Proposal Agent": "bg-[#7a6be6] text-white",
  "Operations Agent": "bg-[#6b6880] text-white",
  "Finance Agent": "bg-[#1e8a5a] text-white",
  "PayFlow Agent": "bg-[#2a6fd6] text-white",
  "ProofFlow Agent": "bg-[#c2477a] text-white",
};

function AgentBadge({ name }: { name: string }) {
  const initials = name === "Orchestrator" ? "PP" : name.split(" ")[0].slice(0, 2);
  return <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md text-[0.6rem] font-bold uppercase", AGENT_HUE[name] ?? "bg-fill text-muted")}>{initials}</span>;
}

const DECISION = {
  allowed: { label: "Allowed", cls: "bg-success-soft text-success", icon: Check },
  approval_required: { label: "Needs approval", cls: "bg-warning-soft text-warning", icon: ShieldAlert },
  denied: { label: "Blocked", cls: "bg-error-soft text-error", icon: Ban },
};

function RunView({ run }: { run: Run }) {
  const start = run.events.find((e) => e.type === "start") as Extract<Ev, { type: "start" }> | undefined;
  const results = new Map(run.events.filter((e): e is Extract<Ev, { type: "tool_result" }> => e.type === "tool_result").map((e) => [e.id, e]));
  return (
    <li className="space-y-3">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-[4px] rounded-br-md bg-accent px-4 py-2.5 text-[0.9375rem] text-white">{run.input}</p>
      </div>
      <div className="space-y-2.5 border-l border-border pl-4">
        {start && (
          <p className="text-[0.75rem] text-muted">
            {start.mode === "ai" ? `Claude (${start.model}) is coordinating the agents` : "Rule-based mode: deterministic planner, same tools and TrustGate (add AI_API_KEY for Claude)"}
          </p>
        )}
        {run.events.map((e, i) => {
          if (e.type === "thinking")
            return (
              <div key={i} className="flex gap-2.5 text-[0.8125rem] text-muted">
                <AgentBadge name={e.agent} />
                <p className="pt-0.5 italic">{e.text}</p>
              </div>
            );
          if (e.type === "tool_call") {
            const r = results.get(e.id);
            const d = DECISION[e.decision];
            return (
              <div key={i} className="flex gap-2.5">
                <AgentBadge name={e.agent} />
                <div className="min-w-0 flex-1 rounded-[4px] border border-border bg-surface px-3 py-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[0.75rem] font-semibold">{e.agent}</span>
                    <span className="text-[0.8125rem]">{e.label}</span>
                    <span className="font-mono text-[0.65rem] text-faint">{e.tool}()</span>
                    <span className={cn("ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold", d.cls)}>
                      <d.icon className="h-3 w-3" /> TrustGate: {d.label}
                    </span>
                  </div>
                  <p className={cn("mt-1 flex items-center gap-1.5 text-[0.8125rem]", r ? (r.ok ? "text-muted" : "text-error") : "text-faint")}>
                    {!r && <CircleDashed className="h-3.5 w-3.5 animate-spin" />}
                    {r ? r.summary : "Working…"}
                  </p>
                </div>
              </div>
            );
          }
          if (e.type === "approval")
            return (
              <div key={i} className="pl-8">
                <ApprovalCard compact approval={{ id: e.approvalId, title: e.title, amount: e.amount, reason: e.reason }} />
              </div>
            );
          if (e.type === "message")
            return (
              <div key={i} className="flex gap-2.5">
                <AgentBadge name="Orchestrator" />
                <p className="min-w-0 flex-1 whitespace-pre-line rounded-[4px] bg-fill px-3.5 py-2.5 text-[0.9375rem] leading-relaxed">{e.text}</p>
              </div>
            );
          if (e.type === "error")
            return (
              <p key={i} className="rounded-[4px] bg-error-soft px-3 py-2 text-[0.8125rem] text-error">
                {e.message}
              </p>
            );
          return null;
        })}
        {!run.done && (
          <p className="flex items-center gap-2 text-[0.8125rem] text-muted">
            <CircleDashed className="h-3.5 w-3.5 animate-spin" /> Agents working…
          </p>
        )}
      </div>
    </li>
  );
}

export function AgentConsole({ mode, model, suggestions, tall }: { mode: "ai" | "heuristic"; model: string | null; suggestions: string[]; tall?: boolean }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const counter = useRef(0);

  const run = useCallback(
    async (text: string) => {
      const command = text.trim();
      if (!command || busy) return;
      setBusy(true);
      setInput("");
      const id = ++counter.current;
      setRuns((r) => [...r, { id, input: command, events: [], done: false }]);
      const push = (e: Ev) => setRuns((all) => all.map((r) => (r.id === id ? { ...r, events: [...r.events, e] } : r)));
      try {
        const res = await fetch("/api/agents/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: command }) });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          push({ type: "error", message: (j as { error?: string }).error ?? `Request failed (${res.status})` });
        } else {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let nl: number;
            while ((nl = buf.indexOf("\n")) >= 0) {
              const line = buf.slice(0, nl).trim();
              buf = buf.slice(nl + 1);
              if (line) push(JSON.parse(line) as Ev);
            }
          }
        }
      } catch {
        push({ type: "error", message: "Lost connection to the agents. Try again." });
      } finally {
        setRuns((all) => all.map((r) => (r.id === id ? { ...r, done: true } : r)));
        setBusy(false);
        router.refresh(); // dashboard figures, VowGraph and approvals reflect what the agents changed
      }
    },
    [busy, router],
  );

  useEffect(() => {
    const onCmd = (e: Event) => {
      run((e as CustomEvent<string>).detail);
      scroller.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener(AGENT_COMMAND_EVENT, onCmd);
    return () => window.removeEventListener(AGENT_COMMAND_EVENT, onCmd);
  }, [run]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [runs]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(input);
  };

  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface" aria-label="Agent console">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-[0.9375rem] font-semibold">Ask PactPop</h2>
        <span className={cn("ml-auto rounded-md px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.06em]", mode === "ai" ? "bg-accent-soft text-accent" : "bg-warning-soft text-warning")}>
          {mode === "ai" ? model ?? "Claude" : "Rule-based mode"}
        </span>
      </header>

      <div ref={scroller} className={cn("overflow-y-auto px-5 py-4", tall ? "h-[min(60vh,560px)]" : runs.length ? "max-h-[440px]" : "")} aria-live="polite">
        {runs.length === 0 ? (
          <div>
            <p className="text-[0.9375rem] text-muted">
              Tell the agents what you need. They read your records, act through permission-checked tools, and ask before anything sensitive.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => run(s)}
                  disabled={busy}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-[0.8125rem] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-6">
            {runs.map((r) => (
              <RunView key={r.id} run={r} />
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
        <label htmlFor="agent-input" className="sr-only">
          Ask PactPop
        </label>
        <input
          id="agent-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Agents are working…" : "e.g. Northwind asked for a booking system too. Check the scope."}
          disabled={busy}
          maxLength={2000}
          className="h-11 min-w-0 flex-1 rounded-[4px] border border-border bg-background px-3.5 text-[0.9375rem] placeholder:text-faint focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-ring/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length < 2}
          aria-label="Send to agents"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] bg-accent text-white transition hover:bg-violet-strong disabled:opacity-40"
        >
          {busy ? <CircleDashed className="h-[18px] w-[18px] animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" />}
        </button>
      </form>
    </section>
  );
}
