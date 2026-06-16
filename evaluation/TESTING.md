# How to test and evaluate this task yourself

Two separate questions: **(A) does the software work?** and **(B) does the task measure
what it claims?** Do both.

## A. Test the software

### A1. Run the example in a browser (no build needed)

The package ships a prebuilt `dist/index.global.js`, so the demo runs as-is.

```bash
cd plugin-budgeted-choice
python3 -m http.server 8000
# open http://localhost:8000/examples/the-month.html
```

Play through. At the end the raw data prints as CSV. Confirm: the balance descends across
the month, the meter turns amber then red, ambiguous options show no odds, and each row
has `balance_before`/`balance_after`/`delta`/`outcome_won`. Because the example calls
`jsPsych.randomization.setSeed(...)`, reloading reproduces the same outcomes.

### A2. Build and unit-test (the contribution workflow)

This is the path to actually submit to jspsych-contrib.

```bash
git clone https://github.com/jspsych/jspsych-contrib.git
cd jspsych-contrib
npm install
# scaffold an empty package, then drop in these files:
npx @jspsych/new-plugin        # name it "budgeted-choice", choose the TypeScript template
# copy src/index.ts, __tests__/index.test.ts, docs/, examples/, README.md into
# packages/plugin-budgeted-choice/, then:
cd packages/plugin-budgeted-choice
npm run build                  # compiles src/ -> dist/ (regenerates the global build)
npm test                       # runs the Jest suite (@jspsych/test-utils)
```

The included `__tests__/index.test.ts` checks sure-option resolution and balance update,
option-order preservation, ambiguity coding, probabilistic resolution, and the
feedback→continue flow. Add cases as you change behavior.

### A3. Automated behavioral testing with jsPsych simulation mode

The plugin implements `simulate()`, so you can dry-run the whole timeline headlessly:

```js
jsPsych.simulate(timeline, "data-only");   // fast: generates plausible data, no DOM
jsPsych.simulate(timeline, "visual");      // watch it click through in real time
```

Use `data-only` in CI to confirm an entire experiment produces the expected columns and
no errors; use `visual` to eyeball pacing and layout.

## B. Evaluate the task scientifically

### B1. Parameter recovery (do this before collecting data)

```bash
cd evaluation
python3 recover.py
```

This simulates participants with known ambiguity/likelihood/desperation parameters, runs
them through the task, and reports how well each is recovered — at the shipped trial
counts and at 3× / 6×. See `evaluation/README.md` for the interpretation. The headline:
the scarcity gradient is solid, but at shipped lengths this is a **group-level /
hierarchical** instrument, not a per-person scoring test; likelihood and (especially)
desperation need more trials and hierarchical models. Edit the parameter ranges and `TAU`
to match your population — that turns the script into a power analysis for your design.

### B2. Pilot, then check the manipulation

Collect ~20–30 pilot participants and verify, before trusting any individual differences:

- **Gradient check.** Plot `money_before` across trial order. It should fall monotonically
  to near zero. If winnings are flattening it, your decision payoffs are too large
  relative to the bills.
- **Ambiguity manipulation.** On ambiguity trials, the group should choose the *known*
  option above 50% (the classic Ellsberg effect) even though options are EV-matched.
- **Likelihood curve.** Plot P(choose gamble) against stated `p`. You want a graded curve;
  a flat or all-or-none curve means your sure amounts aren't bracketing indifference —
  retune them near each gamble's EV.
- **Desperation.** Compare risk-taking on the long-shot anchor at high vs. low balance
  within person.

### B3. Reliability and validity

- **Internal structure.** Fit a mixed-effects/IRT-style model per construct; check that
  items load as intended.
- **Reliability.** Behavioral-task scores are notoriously low in test–retest reliability
  (the "reliability paradox"). Plan a retest subsample and report it honestly; prefer
  hierarchical scores (which borrow strength) over raw per-person rates.
- **Convergent/criterion validity.** Correlate the task scores with established
  self-reports (e.g. DOSPERT for risk, a financial-strain scale) and any criterion you
  care about. The example already collects a couple of anchor items you can extend.
