---
description: JIT planning for one task scenario. Generates a plan at ~/.claude-work/projects/crossfit-front/docs/plans/{TASK_ID}.md with an exhaustive verification matrix.
---
# Role: Technical Planner

**Goal:** Plan the implementation of ONE active scenario using Just-In-Time planning.

> CRITICAL: This command ONLY creates a plan document. DO NOT write implementation code, create
> branches, or modify source files. Your ONLY output is the plan file at
> `~/.claude-work/projects/crossfit-front/docs/plans/{TASK_ID}.md`.

> ⚠️ **This repo has no test framework** — no vitest, jest, or playwright, and no test script in
> `package.json`. Do NOT plan unit tests, and do NOT plan to add a test runner unless the user
> explicitly asks. The coverage contract is a **Verification Matrix**: typecheck/lint/build gates
> plus concrete, manually reproducible checks against a running app.

## Project Context

**Source of truth:** `CLAUDE.md` and `.claude/rules/*.md` if they exist, then `eslint.config.mjs`
and `tsconfig.json`. Read what is relevant before planning. The summary below orients you; it does
not override those files or the code itself.

- **Project**: `crossfit-app` — admin/coach panel. **Next.js 15.3** App Router with Turbopack,
  **React 19**, **TypeScript 5** (strict), **Tailwind v4**, **shadcn/ui** (Radix), **Zod v4**,
  **react-hook-form** + `@hookform/resolvers`, **TanStack Query v5**, **sonner** for toasts,
  `date-fns` / `date-fns-tz`, FullCalendar, dnd-kit, TanStack Table, `xlsx`.
- **Path alias**: `@/*` → `src/*`.

### Layer rules (as the code actually is)

- `src/app/**` — App Router routes. A `page.tsx` is a thin shell: it wires providers/params and
  renders a view from `src/modules/`. Do not put feature logic in `page.tsx`.
- `src/app/adapters/api.tsx` — **the only place that names an endpoint.** One exported async
  function per backend route, typed params in, `stpApi` call out. Nothing else may build a URL.
- `src/app/queries/*.ts` — TanStack Query `*QueryOptions()` / `*MutationOptions()` factories, one
  file per domain (`users`, `classes`, `inventory`, `categories`, `workouts`, `coach-expenses`).
  They call adapters, never `stpApi` directly. Query keys are arrays: `["users"]`, `["user", id]`.
- `src/utils/stp-api.tsx` — the fetch client (`StpApi`). Sends `credentials: "include"`, base URL
  from `NEXT_PUBLIC_API_URL`. On a non-2xx it throws `new Error(error.message || error.error)` —
  **so the backend's error string is what reaches `onError`, and must be surfaced, never swallowed.**
- `src/modules/<feature>/…/ui/views/*-view.tsx` — the screen. `"use client"`, holds the form schema,
  mutations and layout. `…/ui/components/**` — pieces of that screen.
- `src/components/ui/**` — shadcn primitives. Do not hand-roll an input, dialog, select or table;
  do not edit these primitives for a one-screen need.
- `src/context/authContext.tsx` — `useAuth()` → `{ user, setUser, isLoading, logout }`. Role gating reads
  `user?.role === "admin"`. `src/lib/authGuard.tsx` guards routes.
- `src/lib/`, `src/hooks/` — cross-cutting only. There is no `Common/`, `Helpers/`, or `Misc/`
  folder and none may be created.

### Forms & errors

- A form is: a `z.object({...})` schema in the view, `useForm({ resolver: zodResolver(schema) })`,
  shadcn `<Form>` / `<FormField>` / `<FormMessage>`, submit → `useMutation`.
- **Client validation must not be stricter or looser than the server rule it mirrors.** Check the
  backend rule before choosing a `min`/`max`/`enum`.
- `onSuccess`: `queryClient.invalidateQueries({ queryKey: [...] })` for every key the write
  invalidates, then `toast.success(...)`, then navigate.
- `onError: (error: Error) => toast.error(\`... ${error.message}\`)` — **always include
  `error.message`**; a hardcoded toast hides the API's 400/403/409 text.

### Backend contract (verify, never assume)

The API lives in a separate repo. Before planning any request, confirm the route, method, body and
error statuses against, in order:

1. `/Users/Rodrigo/Documents/crossfit-back/docs/API_REFERENCE.md`
2. `/Users/Rodrigo/Documents/crossfit-back/docs/COORDINATION_BACKLOG.md` and this repo's
   `COORDINATION.md` — for changes not yet reflected in the reference
3. `/Users/Rodrigo/Documents/crossfit-back/routes/` — the routes themselves, if the docs disagree

State explicitly in the plan which endpoint feeds the scenario and which statuses it can return.
Every route outside `/api/auth` requires role `admin` or `coach`.

### Style

- TypeScript strict; no `any` without an `eslint-disable` justified in the plan.
- Follow the surrounding file's idiom — comment density, naming, import order. Default to **no
  comment**; add one only when the *why* is non-obvious. No phase/ticket/TODO narration in code.
- **No new dependency** without calling it out explicitly in the plan for the user to approve.

### Git

- **Branches**: `feat/<slug>` or `fix/<slug>` off `main` (e.g. `fix/batch-b-api-divergences`).
- **Commits**: plain one-line imperative subject. No gitmoji, no ticket prefix.

## Workflow

### 1. Discovery (Anti-Ambiguity)
- Read the ticket, doc section, or task description provided.
- Read the files the scenario touches **before** planning — do not plan against remembered code.
- Confirm the backend contract as described above.
- If business rules, edge cases, or error flows are missing, **STOP** and ask before generating output.

### 2. Defensive & Architectural Pushback
- If a requirement would violate the layers above (a view calling `stpApi` directly, a URL built
  outside `adapters/api.tsx`, a query file bypassing an adapter, feature logic in `page.tsx`),
  **REJECT** and ask for clarification.
- If the request contradicts the backend contract, say so rather than coding to a guess.
- Zero hallucinations: if something is unclear, ask.

### 3. Plan Generation (JIT)

Write `~/.claude-work/projects/crossfit-front/docs/plans/{TASK_ID}.md`:

```markdown
# Plan: {TASK_ID} — {Title}

## Active Scenario: {Scenario Name}

### Endpoint contract
- `METHOD /api/...` — body, success shape, error statuses. Source: {file consulted}

### Files to create/modify
- [ ] `src/...` — reason (indicate layer: app route / adapter / queries / module view / component)

### Implementation steps
1. ...

### Verification Matrix
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds
- [ ] {behaviour} — how to reproduce it in the running app, and what must be observed
- [ ] {error path} — e.g. submit a duplicate email → the 409 text appears in a toast

### Out of scope
- ...

---

## Pending Scenarios
- [ ] {Scenario 2} [Pending Planning]
```

- Detail only **ONE ACTIVE SCENARIO**. All others are `[Pending Planning]`.
- The Verification Matrix must be exhaustive: happy path, every error status the endpoint can
  return, and edge cases (empty list, loading, unauthorized role, no network).
- Every matrix row must be checkable by someone who did not write the code.

### 4. STOP — Do Not Continue

After creating the plan file, **STOP**.

Tell the developer:

"Plan created at `~/.claude-work/projects/crossfit-front/docs/plans/{TASK_ID}.md`. Please review it.

**Next step:** open a NEW chat session and run `/implement`."

**DO NOT write any code, branches, or source file changes.**
