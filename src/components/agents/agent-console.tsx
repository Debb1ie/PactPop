"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Ban, Check, ChevronDown, ChevronRight, CircleDashed, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { Mascot } from "@/components/brand/mascot";
import { ApprovalCard } from "./approval-card";

type Ev =
  | { type: "start"; executionId: string; mode: "ai" | "heuristic"; model: string | null }
  | { type: "thinking"; agent: string; text: string }
  | { type: "status"; text: string }
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

/** **bold** inside a line. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong> : <span key={i}>{p.replace(/\*\*/g, "")}</span>))}
    </>
  );
}

/** Renders the model's answer: paragraphs, bullet and numbered lists, bold. No raw HTML. */
function Answer({ text }: { text: string }) {
  const blocks: { kind: "p" | "ul" | "ol"; lines: string[] }[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim().replace(/^#{1,6}\s+/, "");
    if (!line) {
      blocks.push({ kind: "p", lines: [] });
      continue;
    }
    const bullet = /^[-*•]\s+/.test(line);
    const num = /^\d+[.)]\s+/.test(line);
    const kind = bullet ? "ul" : num ? "ol" : "p";
    const content = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "");
    const last = blocks[blocks.length - 1];
    if (last && last.kind === kind && (kind !== "p" || last.lines.length > 0)) last.lines.push(content);
    else blocks.push({ kind, lines: [content] });
  }
  return (
    <div className="space-y-2.5">
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.kind === "p" ? (
            <p key={i}>
              {b.lines.map((l, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  <Inline text={l} />
                </span>
              ))}
            </p>
          ) : (
            <ul key={i} className={cn("space-y-1 pl-5", b.kind === "ol" ? "list-decimal" : "list-disc marker:text-accent")}>
              {b.lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l} />
                </li>
              ))}
            </ul>
          ),
        )}
    </div>
  );
}

const DECISION = {
  allowed: { label: "Allowed", cls: "text-money-in", icon: Check },
  approval_required: { label: "Needs approval", cls: "text-[#f0b13f]", icon: ShieldAlert },
  denied: { label: "Blocked", cls: "text-[#ec6b74]", icon: Ban },
};

function RunView({ run }: { run: Run }) {
  const start = run.events.find((e) => e.type === "start") as Extract<Ev, { type: "start" }> | undefined;
  const results = new Map(run.events.filter((e): e is Extract<Ev, { type: "tool_result" }> => e.type === "tool_result").map((e) => [e.id, e]));
  const thoughts = run.events.filter((e): e is Extract<Ev, { type: "thinking" }> => e.type === "thinking");
  const status = [...run.events].reverse().find((e): e is Extract<Ev, { type: "status" }> => e.type === "status");
  const hasAnswer = run.events.some((e) => e.type === "message" || e.type === "error");
  return (
    <li className="space-y-3">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[0.9375rem] text-white">{run.input}</p>
      </div>
      <div className="flex gap-3">
        <Mascot mood={!run.done ? "thinking" : run.events.some((e) => e.type === "error") ? "confused" : run.events.some((e) => e.type === "approval") ? "card-wave" : "laughing"} width={40} decorative className="mt-0.5 h-auto w-10 shrink-0 self-start" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-[0.75rem] font-semibold text-muted">
            Poppy · PactPop agents{start?.mode === "heuristic" ? " · rule-based mode" : ""}
          </p>

          {thoughts.length > 0 && (
            <details className="group rounded-xl text-[0.8125rem] text-muted">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-foreground">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                {run.done ? "Thought process" : "Thinking…"}
              </summary>
              <div className="mt-2 space-y-1.5 border-l border-border pl-3 italic">
                {thoughts.map((t, i) => (
                  <p key={i}>{t.text}</p>
                ))}
              </div>
            </details>
          )}

          {run.events.map((e, i) => {
            if (e.type === "tool_call") {
              const r = results.get(e.id);
              const d = DECISION[e.decision];
              return (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-fill px-3 py-2">
                  <AgentBadge name={e.agent} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[0.8125rem] font-medium">{e.label}</span>
                      <span className="text-[0.7rem] text-muted">{e.agent}</span>
                      <span className="pure ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold text-foreground/85">
                        <d.icon className={cn("h-3 w-3", d.cls)} /> {d.label}
                      </span>
                    </div>
                    <p className={cn("mt-0.5 flex items-center gap-1.5 text-[0.75rem]", r ? (r.ok ? "text-muted" : "text-error") : "text-faint")}>
                      {!r && <CircleDashed className="h-3 w-3 animate-spin" />}
                      {r ? r.summary : "Working…"}
                    </p>
                  </div>
                </div>
              );
            }
            if (e.type === "approval")
              return <ApprovalCard key={i} compact approval={{ id: e.approvalId, title: e.title, amount: e.amount, reason: e.reason }} />;
            if (e.type === "message")
              return (
                <div key={i} className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground/90 shadow-[0_10px_30px_-20px_rgb(0_0_0/0.6)] ring-1 ring-border">
                  <Answer text={e.text} />
                </div>
              );
            if (e.type === "error")
              return (
                <p key={i} className="rounded-xl bg-error-soft px-3 py-2 text-[0.8125rem] text-error">
                  {e.message}
                </p>
              );
            return null;
          })}

          {!run.done && !hasAnswer && (
            <p className="flex items-center gap-2 text-[0.8125rem] text-muted">
              <CircleDashed className="h-3.5 w-3.5 animate-spin" /> {status?.text ?? "Poppy is on it…"}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export type Suggestion = { title: string; detail?: string; command: string };

/** Full-page agent chat (ChatGPT / Claude style): greeting + suggestions, centred thread, composer at the bottom. */
export type ModelOption = { id: string; label: string; note: string };

export function AgentConsole({ mode, models, defaultModel, suggestions, greeting }: { mode: "ai" | "heuristic"; models: ModelOption[]; defaultModel: string | null; suggestions: Suggestion[]; greeting: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [model, setModel] = useState<string | null>(defaultModel);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pactpop:model");
      if (saved && models.some((m) => m.id === saved)) setModel(saved); // eslint-disable-line react-hooks/set-state-in-effect
    } catch {
      /* storage unavailable: keep the default */
    }
  }, [models]);
  const chooseModel = (id: string) => {
    setModel(id);
    try {
      localStorage.setItem("pactpop:model", id);
    } catch {
      /* ignore */
    }
  };
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
        const res = await fetch("/api/agents/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: command, ...(model ? { model } : {}) }) });
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
    [busy, router, model],
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
    <section className="flex h-[calc(100dvh-12.5rem)] flex-col lg:h-[calc(100dvh-6rem)]" aria-label="Agent chat">
      <div ref={scroller} className="flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto w-full max-w-3xl px-1 py-6">
          {runs.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <Mascot mood="thinking" width={110} priority />
              <h1 className="mt-3 text-[1.75rem] font-bold sm:text-[2rem]">{greeting}</h1>
              <p className="mt-1.5 text-[0.9375rem] text-muted">What should the agents work on?</p>
              <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
                {suggestions.map((sg) => (
                  <button
                    key={sg.command}
                    type="button"
                    onClick={() => run(sg.command)}
                    disabled={busy}
                    className="rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2 disabled:opacity-50"
                  >
                    <span className="block text-[0.9375rem] font-medium">{sg.title}</span>
                    {sg.detail && <span className="mt-0.5 block text-[0.8125rem] text-muted">{sg.detail}</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="space-y-8">
              {runs.map((r) => (
                <RunView key={r.id} run={r} />
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl pb-2 pt-3">
        <form onSubmit={submit} className="rounded-3xl border border-border bg-surface p-2 shadow-[0_12px_40px_-20px_rgb(0_0_0/0.5)] focus-within:border-border-strong">
          <label htmlFor="agent-input" className="sr-only">
            Message PactPop agents
          </label>
          <textarea
            id="agent-input"
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                run(input);
              }
            }}
            placeholder={busy ? "Agents are working…" : "Ask PactPop to analyse a request, draft a proposal, check scope…"}
            disabled={busy}
            maxLength={2000}
            className="block max-h-40 min-h-12 w-full resize-none bg-transparent px-3 py-2.5 text-[0.9375rem] leading-relaxed placeholder:text-faint focus:outline-none disabled:opacity-60 [field-sizing:content]"
          />
          <div className="flex items-center gap-2 px-1.5 pb-0.5">
            {mode === "ai" && models.length > 0 ? (
              <label className="pure relative inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-7 text-[0.75rem] font-medium text-foreground/85">
                <Sparkles className="h-3.5 w-3.5 text-muted" />
                <span className="sr-only">Model</span>
                <select value={model ?? ""} onChange={(e) => chooseModel(e.target.value)} disabled={busy} className="appearance-none bg-transparent pr-1 focus:outline-none" aria-label="Choose the AI model">
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-surface text-foreground">
                      {m.label} · {m.note}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted" />
              </label>
            ) : (
              <span className="pure inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium text-foreground/85">
                <Sparkles className="h-3.5 w-3.5 text-muted" /> Rule-based mode
              </span>
            )}
            <button
              type="submit"
              disabled={busy || input.trim().length < 2}
              aria-label="Send to agents"
              className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:opacity-30"
            >
              {busy ? <CircleDashed className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[0.75rem] text-faint">Every action is checked by TrustGate. Anything sensitive waits for your approval.</p>
      </div>
    </section>
  );
}
