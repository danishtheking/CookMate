# Cook-Pilot 🍳 — Agentic Cooking To-Do List

> Hack2Skill · PromptWars (Build with AI). A simple AI micro-app that turns *your day*
> into a personal cooking to-do list — and an **agent that re-plans itself until it fits
> your budget**.

**Live demo:** open `index.html` in any browser. No install, no build, no server.

---

## What it does (maps 1:1 to the challenge)

The challenge asks for a structured meal-planning flow producing four things. Cook-Pilot
delivers all four:

| Required output | In the app |
|---|---|
| **Breakfast / Lunch / Dinner plan** | Three meal cards (dish, ingredients, prep time, calories, cost) |
| **Grocery list** | Aggregated list with quantities + realistic ₹ prices and a running total |
| **Substitutions** | The agent logs every swap it makes (e.g. paneer → tofu) with the ₹ saved |
| **Budget feasibility logic** | A live budget meter + a **self-correcting agent loop** (below) |

You describe your day ("busy WFH day, gym in the evening, high-protein veg"), set people,
₹ budget, prep-time limit and diet — and the agent does the rest.

## The agentic feature (our differentiator)

It is a real **observe → decide → act → verify** loop, not a single prompt:

1. **Plan** — Gemini returns a structured B/L/D plan + grocery list (strict JSON schema).
2. **Verify (deterministic)** — our own JS recomputes the grocery total. We **never trust
   the model's arithmetic** — this is the budget-feasibility check.
3. **Decide** — if `total > budget`, the agent decides it must re-plan.
4. **Act** — it calls Gemini again, asking for cheaper substitutions, and records each swap.
5. **Loop** — up to 3 times until it fits (or it reports the closest-feasible plan).

The **Agent Activity Trail** streams every step on screen, so judges literally watch it
notice it's over budget and fix itself.

## Reuse from `siela` (my existing AI assistant)

Siela is a Node/Express WhatsApp assistant. It's a backend, so I adapted its **proven
patterns**, not its files:

- **`src/services/llm-provider.js`** → the `LLM` module here: one source of truth for every
  model call, with a **fallback chain** (`gemini-2.5-flash` → `gemini-2.0-flash`). Siela
  validated Gemini Flash as the right model for speed + structured output.
- **`src/utils/llm-output-validator.js`** → `validatePlan()`: siela's principle that LLM
  output is *never* committed blindly — suspicious output is a signal to fall back. Here we
  recompute the budget ourselves and drive the re-plan loop from it.

## How it scores against the judging rubric

| Criterion (weight) | What we did |
|---|---|
| **Code Quality** (High) | Modular JS — `LLM` / `validatePlan` / `runAgent` / render — JSDoc, clear naming, this README |
| **Problem Statement Alignment** (High) | All four required outputs + the agentic budget loop *is* the feasibility logic |
| **Security** (Med) | API key in a password field + `localStorage` (never hardcoded/committed); `esc()` escapes **all** model output before render (XSS); no `eval`; numeric input clamping |
| **Efficiency** (Med) | Fast Flash model; loop **capped at 3** iterations with early-exit; single lightweight file; concise prompts |
| **Testing** (Low) | Pure functions (`validatePlan`, `withinBudget`, `esc`) with inline self-tests — open `index.html#test` and check the console |
| **Accessibility** (Low) | Semantic HTML, `<label for>`, `aria-live` agent trail (announced to screen readers), `role="status"` budget, visible focus styles, keyboard-operable |

## Run it

1. Get a free Gemini key: https://aistudio.google.com/apikey
2. Open `index.html` in a browser.
3. Paste the key (top-right) → **Save**.
4. Click **Load demo** (budget is intentionally tight) → **Generate Plan**.
5. Watch the Agent Activity Trail re-plan until it's within budget.

**Run the tests:** open `index.html#test` → results print to the browser console (and a
summary line in the trail).

## Security note

The key lives only in your browser (`localStorage`) and calls Gemini directly — fine for a
demo. For production, proxy calls through a small backend so the key never reaches the
client (this is exactly what siela's `llm-provider.js` does server-side).

## Tech

Single `index.html` · vanilla JS · Tailwind (CDN) · Gemini 2.5 Flash with
`responseSchema` structured output.
