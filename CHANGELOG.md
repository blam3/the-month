# 0.1.1 — Packaging and verified demonstration (2026-11-25)

- Repair standalone source/tests/build layout; generate ESM, CJS, browser global,
  and declaration files. Name this package under blam3, with no claim of official
  jspsych-contrib affiliation or registry publication.
- Add a local-asset browser build, tracked Pages files, local CSV/JSON export,
  ledger schema, and real download/replay tests. No response-upload endpoint.
- Validate inputs; handle p=0 deterministically; display actual loss payoffs;
  guard repeated clicks; avoid drawing outcomes twice in visual simulation.
- Replace misleading ticket/keep-money wording with additive bonus wording;
  retain the numerical choice payoffs and scripted expenses.
- Preserve legacy recovery notes as exploratory material; do not infer
  psychometric validity from software checks or simulated recovery.

---

# @jspsych-contrib/plugin-budgeted-choice

## 0.1.0

Initial release.

- Single-trial budgeted decision under risk and ambiguity, resolved against a running
  balance passed in via the `balance` parameter.
- Supports sure options, known-probability gambles, and ambiguous (hidden-probability)
  options; logs position-independent choice coding plus `balance_before`/`balance_after`.
- Optional draining status bar with `tight_at` / `desperate_at` color states.
- Seedable outcomes and option order via `jsPsych.randomization`.
- `simulate()` support for data-only and visual simulation modes.

> **Note for contributors:** jspsych-contrib uses
> [changesets](https://github.com/changesets/changesets). Before opening your PR, run
> `npx changeset` from the repository root and follow the prompts to record this release;
> this file is normally generated from that changeset rather than written by hand.
