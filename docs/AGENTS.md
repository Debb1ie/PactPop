# PactPop agents

PactPop's agents act on real records through permission-checked tools. This document describes how a command flows through the system and what each part guarantees.

## Flow of one command

```
Dashboard / Command Center
   │  POST /api/agents/command  (session auth, same-origin check, 20 runs/min/user)
   ▼
Orchestrator (src/server/agents/orchestrator.ts)
   │  creates agent_executions row, streams NDJSON events to the browser
   ├── AI mode: Claude (claude-opus-5-5) tool-use loop, max 10 steps
   └── Rule-based mode: deterministic planner (src/server/agents/planner.ts)
          │
          ▼  every tool call, in both modes
     invokeTool()
       1. zod-validates the input
       2. TrustGate: effectivePolicy(business setting, locked floor)
            allow    → run handler → domain service → database
            approval → create approvals row, do NOT run
            deny     → refuse
       3. records agent_tool_calls (args, decision, result, duration)
       4. emits tool_call / tool_result / approval events
```

Approvals are executed only by `decideApproval()` (`src/server/services/workflow.ts`), called from the Approval Center or an inline approval card, and only by an owner or admin.

## Specialists and their tools

| Agent | Tools | Writes? |
|---|---|---|
| Finance | `business_summary` | No |
| Operations | `list_clients`, `find_commitments`, `list_approvals` | No |
| Intake | `list_requests`, `get_request`, `save_request_analysis` | Request analysis |
| Pricing | `quote_project` | No (engine-calculated quote) |
| Proposal | `draft_proposal`, `list_proposals`, `send_proposal` | Draft proposals; sending is gated |
| Scope (ScopeWatch) | `get_commitment`, `check_scope` | Scope record + change order + approval request |

PayFlow (PayPal invoices and orders) and ProofFlow (evidence verification) are planned. Their TrustGate policies already exist in `src/server/agents/policies.ts`.

## Guarantees

- **No AI-set prices.** Tools take units (pages, features, hours). Amounts come from `src/server/services/pricing.ts`.
- **No silent agreement changes.** ScopeWatch creates a change order and an approval. The agreement changes only when the owner approves, which writes a new immutable `commitment_versions` row plus a change-order milestone.
- **No duplicate change orders.** If a pending change order already covers the same items, ScopeWatch points to it instead.
- **Locked floors.** Capturing payments, refunds, changing agreed amounts and applying change orders can never be set below "needs approval".
- **Untrusted client text.** Client messages are returned to the model as data, and the system prompt instructs it to ignore instructions inside them. Permissions live on the server, so prompt injection can't grant tools.
- **Full audit.** Executions, tool calls (with TrustGate decision), approvals and resulting changes are stored (`agent_executions`, `agent_tool_calls`, `approvals`, `audit_logs`, `timeline_events`).

## AI mode (Claude)

Set `AI_API_KEY` (and optionally `AI_MODEL`, default `claude-opus-5-5`). The loop uses:
- adaptive thinking with summarised display (shown in the console as the orchestrator's reasoning)
- effort `medium`
- a cached system prompt
- server-side refusal fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`)

The history is append-only, and all tool results for one turn are returned in a single message.

## Rule-based mode

Without a key, the same tools and TrustGate checks run from a deterministic planner. Intent rules route the command. `src/server/agents/extract.ts` extracts only facts stated in the text, and missing facts become follow-up questions. The UI labels this mode clearly.

## Tests

`tests/integration/agents.test.ts` runs the real workflow on an in-memory Postgres:
- intake analysis
- proposal drafting (milestones sum to the total)
- TrustGate queuing of `send_proposal`
- ScopeWatch change order → approval → agreement v2
- duplicate-change-order protection
- double-execution protection
- a business-level deny
- locked floors
