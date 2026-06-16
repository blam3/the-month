# budgeted-choice

This plugin presents a single decision among options that pay out against a **running
balance**, with optional risk and **ambiguity** (hidden-probability) options and a status
bar that drains as resources are spent. It is the reusable building block for
"Spent"-style scarcity tasks, Ellsberg ambiguity choices, and probability-weighting
ladders.

The plugin does not track the budget across trials. You supply the current `balance`
(usually as a dynamic parameter reading your own state variable) and read `balance_after`
back out in `on_finish`. This keeps the plugin pure and lets you script any depletion
schedule.

## Parameters

In addition to the [parameters available in all plugins](../overview/plugins.md#parameters-available-in-all-plugins), this plugin accepts the following parameters. Parameters with a default value of *undefined* must be specified.

| Parameter                | Type             | Default     | Description                                                                                              |
| ------------------------ | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| options                  | array of objects | *undefined* | The choice options. Each has `label`, `win`, `lose`, `p`, `ambiguous`, and `tag` (see below).           |
| balance                  | numeric          | *undefined* | Balance before this trial. Usually a function returning your running state.                              |
| scene                    | HTML string      | `""`        | Narrative/context shown above the prompt.                                                               |
| prompt                   | HTML string      | `""`        | The decision question.                                                                                  |
| start_balance            | numeric          | `null`      | Reference balance for the meter (defaults to `balance`).                                                |
| currency                 | string           | `"$"`       | Currency symbol.                                                                                        |
| show_balance             | boolean          | `true`      | Show the status bar and draining meter.                                                                 |
| status_label             | HTML string      | `""`        | Small label on the status bar, e.g. "Week 2 of 4".                                                      |
| tight_at                 | numeric          | `null`      | Balance at/below which the meter turns amber.                                                           |
| desperate_at             | numeric          | `null`      | Balance at/below which the meter turns red.                                                             |
| randomize_option_order   | boolean          | `true`      | Randomize the display order of the options.                                                             |
| feedback                 | boolean          | `true`      | Show an outcome-feedback screen after the choice.                                                       |
| feedback_duration        | numeric          | `null`      | If set (ms), the feedback auto-advances; otherwise it waits for a click.                                |
| feedback_html            | function         | `null`      | Custom feedback renderer `(outcome) => htmlString`.                                                     |
| continue_label           | string           | `"Continue"`| Label of the continue button on the feedback screen.                                                   |

Each option object:

| Field     | Type        | Default     | Description                                                                       |
| --------- | ----------- | ----------- | --------------------------------------------------------------------------------- |
| label     | HTML string | *undefined* | Button text.                                                                      |
| win       | numeric     | `0`         | Payoff if the option wins.                                                        |
| lose      | numeric     | `0`         | Payoff if the option loses.                                                       |
| p         | numeric     | `1`         | Probability of `win`; `1` = sure.                                                 |
| ambiguous | boolean     | `false`     | If true, odds are hidden from the participant; `p` is the hidden true value.      |
| tag       | string      | `""`        | Analysis label.                                                                   |

## Data Generated

| Name            | Type    | Value                                                              |
| --------------- | ------- | ----------------------------------------------------------------- |
| response        | integer | Index of the chosen option as displayed.                          |
| rt              | integer | Response time (ms) from option onset.                             |
| chosen_tag      | string  | Tag of the chosen option.                                         |
| chosen_label    | string  | Label of the chosen option.                                       |
| chose_sure      | integer | 1 if a sure option (p ≥ 1) was chosen.                            |
| chose_risky     | integer | 1 if a probabilistic option (p < 1) was chosen.                  |
| chose_ambiguous | integer | 1 if an ambiguous option was chosen.                              |
| chosen_p        | numeric | Probability of the chosen option (hidden true value if ambiguous).|
| chosen_win      | numeric | Win payoff of the chosen option.                                  |
| chosen_lose     | numeric | Lose payoff of the chosen option.                                 |
| balance_before  | numeric | Balance before the outcome.                                       |
| balance_after   | numeric | Balance after the outcome.                                        |
| outcome_won     | boolean | Whether a probabilistic option won; null for sure options.        |
| delta           | numeric | Net change to the balance.                                        |
| option_order    | string  | Displayed order of option tags, "\|"-joined.                      |
| options_json    | string  | Full option set with expected values, as JSON.                    |

## Install

```html
<script src="https://unpkg.com/@jspsych-contrib/plugin-budgeted-choice@0.1.0"></script>
```

## Example

A single Ellsberg-style ambiguity trial:

```javascript
var trial = {
  type: jsPsychBudgetedChoice,
  balance: 1000,
  scene: "Two envelopes can each pay <b>$80</b>.",
  prompt: "Which do you open?",
  options: [
    { label: "Envelope A — wins 60% of the time", win: 80, p: 0.6, tag: "known" },
    { label: "Envelope B — odds unknown", win: 80, p: 0.6, ambiguous: true, tag: "ambiguous" },
  ],
};
```

See `examples/the-month.html` in the package for a full multi-trial task that threads a
running budget and scripts bills between decisions.
