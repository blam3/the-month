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
