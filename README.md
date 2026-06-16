# plugin-budgeted-choice

A jsPsych plugin for **budgeted decisions under risk and ambiguity**. On each trial the
participant chooses among options that pay out against a **running balance**, with an
optional status bar that drains and changes color as resources dwindle. It is the
reusable trial behind "Spent"-style scarcity tasks and supports three things in one
unit: sure options, known-probability gambles, and **ambiguous** options whose odds are
hidden from the participant (but logged for you).

The plugin is deliberately **stateless about the budget across trials**: you pass in the
current `balance` (typically as a dynamic parameter reading your own state variable), and
the plugin reports `balance_after` in its data. You thread the running total yourself in
an `on_finish` (see the example). This keeps the plugin pure and testable, and lets you
script any depletion schedule you like.

## Loading

### Via CDN

```html
<script src="https://unpkg.com/@jspsych-contrib/plugin-budgeted-choice@0.1.0"></script>
```

The global is `jsPsychBudgetedChoice`.

### Via NPM

```
npm install @jspsych-contrib/plugin-budgeted-choice
```

```js
import BudgetedChoice from "@jspsych-contrib/plugin-budgeted-choice";
```

## Compatibility

Requires jsPsych v8.0.0 or later.

## Parameters

In addition to the [parameters available in all plugins](https://www.jspsych.org/latest/overview/plugins/#parameters-available-in-all-plugins), this plugin accepts the following. Parameters with no default are required.

| Parameter                | Type             | Default     | Description                                                                                                                                              |
| ------------------------ | ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`                | array of objects | *undefined* | The choice options (see the nested fields below).                                                                                                        |
| `balance`                | numeric          | *undefined* | Current balance before this trial. Usually a function returning your running state, e.g. `() => budget.value`.                                            |
| `scene`                  | HTML string      | `""`        | Narrative/context shown above the prompt.                                                                                                                 |
| `prompt`                 | HTML string      | `""`        | The decision question.                                                                                                                                    |
| `start_balance`          | numeric          | `null`      | Reference balance used to scale the meter. Defaults to `balance`.                                                                                         |
| `currency`               | string           | `"$"`       | Currency symbol.                                                                                                                                          |
| `show_balance`           | boolean          | `true`      | Whether to show the status bar with its draining meter.                                                                                                   |
| `status_label`           | HTML string      | `""`        | Small label on the status bar, e.g. `"Week 2 of 4"`.                                                                                                      |
| `tight_at`               | numeric          | `null`      | Balance at/below which the meter turns amber. `null` disables.                                                                                            |
| `desperate_at`           | numeric          | `null`      | Balance at/below which the meter turns red. `null` disables.                                                                                              |
| `randomize_option_order` | boolean          | `true`      | Randomize the display order of the options.                                                                                                               |
| `feedback`               | boolean          | `true`      | Show an outcome-feedback screen after the choice.                                                                                                         |
| `feedback_duration`      | numeric          | `null`      | If set (ms), the feedback screen auto-advances; otherwise it waits for a click.                                                                           |
| `feedback_html`          | function         | `null`      | Custom feedback renderer `(outcome) => htmlString`. `outcome` has `{won, delta, balance_after, kind, currency}`.                                          |
| `continue_label`         | string           | `"Continue"`| Label of the continue button on the feedback screen.                                                                                                      |

Each entry of `options` is an object with these fields:

| Field       | Type        | Default     | Description                                                                                                                     |
| ----------- | ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `label`     | HTML string | *undefined* | Button text for this option.                                                                                                   |
| `win`       | numeric     | `0`         | Payoff if the option "wins" (added to the balance).                                                                           |
| `lose`      | numeric     | `0`         | Payoff if the option "loses".                                                                                                 |
| `p`         | numeric     | `1`         | Probability of `win`. Use `1` for a guaranteed (sure) option.                                                                 |
| `ambiguous` | boolean     | `false`     | If `true`, odds are unknown to the participant; `p` is the hidden true probability used only to resolve and log the outcome.  |
| `tag`       | string      | `""`        | Free-text label for your analysis coding (e.g. `"known"`, `"ambiguous"`, `"gamble"`, `"sure"`).                               |

## Data Generated

| Name             | Type    | Value                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------- |
| `response`       | integer | Index of the chosen option as displayed (after any shuffling).                         |
| `rt`             | integer | Response time in milliseconds from option onset.                                       |
| `chosen_tag`     | string  | `tag` of the chosen option.                                                            |
| `chosen_label`   | string  | Label of the chosen option.                                                            |
| `chose_sure`     | integer | 1 if the chosen option was a sure thing (`p >= 1`).                                     |
| `chose_risky`    | integer | 1 if the chosen option was probabilistic (`p < 1`).                                    |
| `chose_ambiguous`| integer | 1 if the chosen option was flagged ambiguous.                                          |
| `chosen_p`       | numeric | Probability of the chosen option (hidden true value if ambiguous).                     |
| `chosen_win`     | numeric | Win payoff of the chosen option.                                                       |
| `chosen_lose`    | numeric | Lose payoff of the chosen option.                                                      |
| `balance_before` | numeric | Balance before this trial's outcome.                                                   |
| `balance_after`  | numeric | Balance after this trial's outcome.                                                    |
| `outcome_won`    | boolean | True/false if a probabilistic option was chosen; `null` for sure options.              |
| `delta`          | numeric | Net change to the balance on this trial.                                               |
| `option_order`   | string  | Displayed order of option tags, `"|"`-joined.                                          |
| `options_json`   | string  | Full option set (with expected values) as a JSON string, for reconstruction.           |

## Reproducibility

Outcome resolution and option shuffling use `jsPsych.randomization`, so seeding the
experiment makes a session fully reproducible:

```js
const jsPsych = initJsPsych();
jsPsych.randomization.setSeed("my-seed");
```

## Examples

### A single ambiguity (Ellsberg) trial

```js
const trial = {
  type: jsPsychBudgetedChoice,
  balance: 1000,
  scene: "Two envelopes can each pay <b>$80</b>.",
  prompt: "Which do you open?",
  options: [
    { label: "Envelope A — wins 60% of the time", win: 80, p: 0.6, tag: "known" },
    { label: "Envelope B — odds unknown",         win: 80, p: 0.6, ambiguous: true, tag: "ambiguous" },
  ],
};
```

### Threading a running budget across many trials

See [`examples/the-month.html`](./examples/the-month.html) for a complete, runnable
reconstruction of a four-week scarcity task ("The Month") that uses this plugin for every
decision, scripts bills between decisions to force a high→low balance trajectory, and
measures ambiguity aversion, likelihood insensitivity, and a desperation threshold. The
budget is threaded like this:

```js
const budget = { value: 1000 };

const decision = {
  type: jsPsychBudgetedChoice,
  balance: () => budget.value,          // dynamic: read current state
  start_balance: 1000,
  tight_at: 400,
  desperate_at: 120,
  options: [ /* ... */ ],
  on_finish: (data) => { budget.value = data.balance_after; },  // write it back
};

const bill = {
  type: jsPsychHtmlButtonResponse,      // a scripted expense between decisions
  stimulus: "Rent is due: <b>-$650</b>.",
  choices: ["Pay it"],
  on_finish: () => { budget.value -= 650; },
};
```

## Building from source

```
npm install
npm run build      # regenerates dist/ from src/index.ts
npm test           # runs the Jest test suite
```

A prebuilt `dist/index.global.js` is included so the examples run without a build step.

## Evaluating the task scientifically

The `evaluation/` directory contains a parameter-recovery simulation
(`recover.py`) and an interpretation guide (`evaluation/README.md`) so you can check, for
your own design and assumed effect sizes, how well the constructs can be recovered before
you collect data.

## Citation

If you use this plugin, please cite jsPsych:

> de Leeuw, J. R., Gilbert, R. A., & Luchterhandt, B. (2023). jsPsych: Enabling an
> open-source collaborative ecosystem of behavioral experiments. *Journal of Open Source
> Software, 8*(85), 5351.

## License

MIT
