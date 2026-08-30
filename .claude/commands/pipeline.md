---
description: Full automated pipeline — plan → implement → audit with retry loop. Runs unattended using subagents (one clean context per phase). Sends a push notification on completion or when blocked.
---
# Role: Pipeline Orchestrator

**Goal:** Execute plan → implement → audit autonomously using **subagents** — one per phase, each
with a clean context window. You (the orchestrator) stay lean: read a few files, spawn agents, read
their return values, decide the next step.

> Do NOT load architecture context, the backend docs, or source code yourself. That is the
> subagents' job. Your context is the state machine, nothing else.

---

## Input

```
/pipeline {TASK_ID} [optional task description]
```

`{TASK_ID}` is a slug — `register-password-min`, `users-role-patch`. It names the plan file and the
branch. If no description is given and no plan exists, ask the user for one before spawning
anything.

---

## Phase 0 — Pre-flight (orchestrator only, minimal reads)

1. Check `~/.claude-work/projects/crossfit-front/docs/plans/{TASK_ID}.md`:
   - Not found → `NEEDS_SPEC = true`
   - Found, has pending `[ ]` items → `NEEDS_SPEC = false`, `NEEDS_IMPLEMENT = true`
   - Found, all `[x]` → go straight to audit
2. Verify a branch `feat/{TASK_ID}` or `fix/{TASK_ID}` exists via `git branch --list`. If missing,
   create it from `main`:
   ```bash
   git fetch origin main && git checkout -b fix/{TASK_ID} origin/main
   ```
   If the working tree has uncommitted **tracked** changes, **stop and ask** — do not branch over
   them. Untracked files carry over harmlessly.
3. Set `FIX_ATTEMPTS = 0`.

---

## Phase 1 — PLAN (subagent)

Skip if `NEEDS_SPEC = false`. Otherwise spawn an Agent with this prompt (fill in `{TASK_ID}` and
`{TASK_DESCRIPTION}`):

> You are running the plan phase of an automated pipeline for task {TASK_ID}.
>
> Read and follow `.claude/commands/plan.md` exactly, with these overrides:
> - The task description is: {TASK_DESCRIPTION}
> - Replace every `{TASK_ID}` placeholder with the literal value `{TASK_ID}`.
> - Do NOT stop after creating the plan to tell the user to open a new session.
> - If you need to escalate (ambiguous requirements you cannot resolve from the code, the backend
>   docs, or `COORDINATION.md`), do NOT ask the user. Write
>   `~/.claude-work/projects/crossfit-front/docs/audits/pipeline_blocked_{TASK_ID}.md` with your
>   questions, then return exactly: `PLAN_BLOCKED: [one-line summary of what is missing]`
> - On success return exactly: `PLAN_DONE`

**Orchestrator reads the subagent return value:**
- `PLAN_DONE` → proceed to Phase 2.
- `PLAN_BLOCKED: …` → go to **ESCALATE** with the message.

---

## Phase 2 — IMPLEMENT (subagent)

Spawn an Agent with this prompt:

> You are running the implement phase of an automated pipeline for task {TASK_ID}.
>
> Read and follow `.claude/commands/implement.md` exactly, with these overrides:
> - Replace every `{TASK_ID}` placeholder with the literal value `{TASK_ID}`.
> - Do NOT stop after finishing to tell the user to open a new session.
> - If a fix was requested, the failures to fix are: {FIX_INSTRUCTIONS} (empty on first run).
> - On success — every matrix item `[x]` or explicitly reported as un-exercisable,
>   `npx tsc --noEmit && npm run lint && npm run build` green, changes committed — return exactly:
>   `IMPLEMENT_DONE`
> - If you hit a blocker you cannot resolve autonomously (a missing backend contract, a required
>   new dependency, a decision only the user can make), write
>   `~/.claude-work/projects/crossfit-front/docs/audits/pipeline_blocked_{TASK_ID}.md` and return:
>   `IMPLEMENT_BLOCKED: [one-line reason]`

**Orchestrator reads the subagent return value:**
- `IMPLEMENT_DONE` → proceed to Phase 3.
- `IMPLEMENT_BLOCKED: …` → go to **ESCALATE**.

---

## Phase 3 — AUDIT (subagent)

Spawn an Agent with this prompt:

> You are running the audit phase of an automated pipeline for task {TASK_ID}.
>
> Read and follow `.claude/commands/audit.md` exactly, with these overrides:
> - Replace every `{TASK_ID}` placeholder with `{TASK_ID}`.
> - Do NOT tell the user to paste a prompt and do NOT open a new session.
> - Save the audit report to
>   `~/.claude-work/projects/crossfit-front/docs/audits/audit_report_{TASK_ID}.md`. Do not commit it.
> - Do NOT modify code.
> - At the very end of your response, output ONE of these lines (nothing after it):
>   - `AUDIT_PASS`
>   - `AUDIT_FAIL_MECHANICAL: [bullet list of specific failures]`
>   - `AUDIT_FAIL_ARCHITECTURAL: [reason]`

Mechanical = typecheck/lint/build errors, a missed matrix item, a hardcoded error toast, a stale
plan checklist. Architectural = the layering or the backend contract is wrong and the fix changes
the plan.

**Orchestrator reads the last line of the subagent return value:**

| Result | Action |
|---|---|
| `AUDIT_PASS` | Send push notification → **DONE** |
| `AUDIT_FAIL_MECHANICAL` | If `FIX_ATTEMPTS < 2`: set `FIX_INSTRUCTIONS` to the failure list, increment `FIX_ATTEMPTS`, go back to **Phase 2** |
| `AUDIT_FAIL_MECHANICAL` (attempts ≥ 2) | Go to **ESCALATE**: "2 fix attempts exhausted" |
| `AUDIT_FAIL_ARCHITECTURAL` | Go to **ESCALATE** immediately |

---

## DONE

1. Send a push notification (skip silently if no notification tool is available):
   ```
   pipeline {TASK_ID} passed — review & push the branch
   ```
2. Output in chat: "Pipeline complete. Branch `{branch}` is ready." Include the one-paragraph
   summary from the audit report and anything the implementer could not exercise.
3. **Do not push and do not open a PR** — that is the user's call.
4. Stop.

---

## ESCALATE

1. Read `~/.claude-work/projects/crossfit-front/docs/audits/pipeline_blocked_{TASK_ID}.md` if it
   exists (written by a subagent).
2. Send a push notification (≤200 chars, no markdown):
   ```
   pipeline {TASK_ID} blocked — {one-line reason}
   ```
3. Output the full failure details in chat.
4. Stop and wait for user input. When the user responds, resume from the appropriate phase with
   their input as `{FIX_INSTRUCTIONS}` or an updated task description.
