var jsPsychBudgetedChoice = (function (jspsych) {
  "use strict";

  const info = {
    name: "budgeted-choice",
    version: "0.1.0",
    parameters: {
      /** Narrative/context shown above the prompt (HTML allowed). */
      scene: { type: jspsych.ParameterType.HTML_STRING, default: "" },
      /** The decision question shown below the scene (HTML allowed). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: "" },
      /** The choice options. Each option resolves to a payoff that is added to the
       *  running balance. `p` is the probability of `win` (otherwise `lose`); a `p`
       *  of 1 makes the option a sure thing. Set `ambiguous: true` for an option
       *  whose probability is unknown to the participant (write the label without
       *  odds); `p` is then the hidden TRUE probability used only to resolve and log
       *  the outcome. `tag` is a free label used for your analysis coding. */
      options: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        default: undefined,
        nested: {
          /** Button text for this option (HTML allowed). */
          label: { type: jspsych.ParameterType.HTML_STRING, default: undefined },
          /** Payoff if the option "wins" (added to balance). */
          win: { type: jspsych.ParameterType.FLOAT, default: 0 },
          /** Payoff if the option "loses". */
          lose: { type: jspsych.ParameterType.FLOAT, default: 0 },
          /** Probability of `win`. Use 1 for a guaranteed (sure) option. */
          p: { type: jspsych.ParameterType.FLOAT, default: 1 },
          /** If true, odds are unknown to the participant; `p` is the hidden truth. */
          ambiguous: { type: jspsych.ParameterType.BOOL, default: false },
          /** Free-text label for analysis (e.g. "known", "ambiguous", "gamble", "sure"). */
          tag: { type: jspsych.ParameterType.STRING, default: "" },
        },
      },
      /** Current balance before this trial. Usually a function returning your
       *  running state, e.g. `balance: () => budget.value`. */
      balance: { type: jspsych.ParameterType.FLOAT, default: undefined },
      /** Reference balance used to scale the meter (defaults to `balance`). */
      start_balance: { type: jspsych.ParameterType.FLOAT, default: null },
      /** Currency symbol. */
      currency: { type: jspsych.ParameterType.STRING, default: "$" },
      /** Whether to show the balance/status bar with its draining meter. */
      show_balance: { type: jspsych.ParameterType.BOOL, default: true },
      /** Small label on the status bar, e.g. "Week 2 of 4". */
      status_label: { type: jspsych.ParameterType.HTML_STRING, default: "" },
      /** Balance at/below which the meter turns amber ("tight"). null = off. */
      tight_at: { type: jspsych.ParameterType.FLOAT, default: null },
      /** Balance at/below which the meter turns red ("desperate"). null = off. */
      desperate_at: { type: jspsych.ParameterType.FLOAT, default: null },
      /** Randomize the left/right (display) order of the options. */
      randomize_option_order: { type: jspsych.ParameterType.BOOL, default: true },
      /** Show an outcome-feedback screen after the choice. */
      feedback: { type: jspsych.ParameterType.BOOL, default: true },
      /** If set (ms), the feedback screen auto-advances; otherwise it waits for a click. */
      feedback_duration: { type: jspsych.ParameterType.INT, default: null },
      /** Optional custom feedback renderer: (outcome) => HTML string. `outcome` has
       *  {won, delta, balance_after, kind, currency}. */
      feedback_html: { type: jspsych.ParameterType.FUNCTION, default: null },
      /** Label of the continue button on the feedback screen. */
      continue_label: { type: jspsych.ParameterType.STRING, default: "Continue" },
    },
    data: {
      /** Index of the chosen option as displayed (after any shuffling). */
      response: { type: jspsych.ParameterType.INT },
      /** Response time in milliseconds from option onset. */
      rt: { type: jspsych.ParameterType.INT },
      /** `tag` of the chosen option. */
      chosen_tag: { type: jspsych.ParameterType.STRING },
      /** Label of the chosen option. */
      chosen_label: { type: jspsych.ParameterType.STRING },
      /** 1 if the chosen option was a sure thing (p >= 1). */
      chose_sure: { type: jspsych.ParameterType.INT },
      /** 1 if the chosen option was probabilistic (p < 1). */
      chose_risky: { type: jspsych.ParameterType.INT },
      /** 1 if the chosen option was flagged ambiguous. */
      chose_ambiguous: { type: jspsych.ParameterType.INT },
      /** Probability of the chosen option (hidden true value if ambiguous). */
      chosen_p: { type: jspsych.ParameterType.FLOAT },
      /** Win/lose payoffs of the chosen option. */
      chosen_win: { type: jspsych.ParameterType.FLOAT },
      chosen_lose: { type: jspsych.ParameterType.FLOAT },
      /** Balance before and after this trial's outcome. */
      balance_before: { type: jspsych.ParameterType.FLOAT },
      balance_after: { type: jspsych.ParameterType.FLOAT },
      /** True/false if a probabilistic option was chosen; null for sure options. */
      outcome_won: { type: jspsych.ParameterType.BOOL },
      /** Net change to the balance on this trial. */
      delta: { type: jspsych.ParameterType.FLOAT },
      /** Displayed order of option tags, "|"-joined. */
      option_order: { type: jspsych.ParameterType.STRING },
      /** Full option set (with expected values) as a JSON string, for reconstruction. */
      options_json: { type: jspsych.ParameterType.STRING },
    },
  };

  const STYLE_ID = "jspsych-budgeted-choice-style";
  const CSS = `
    .bc-statusbar{border:1px solid #cdd5dd;border-radius:10px;background:#f6f8fa;
      padding:14px 16px 12px;margin:0 auto 18px;max-width:640px;box-sizing:border-box;}
    .bc-row{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;}
    .bc-label{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#4b5562;}
    .bc-balance{font-family:ui-monospace,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;
      font-size:1.5rem;font-weight:600;}
    .bc-meter{height:7px;border-radius:4px;background:#dfe5ea;overflow:hidden;}
    .bc-fill{height:100%;border-radius:4px;transition:width .35s ease,background .35s ease;}
    .bc-ok .bc-balance{color:#2f6f5e;} .bc-ok .bc-fill{background:#2f6f5e;}
    .bc-tight .bc-balance{color:#b9731a;} .bc-tight .bc-fill{background:#b9731a;}
    .bc-desperate .bc-balance{color:#a8322a;} .bc-desperate .bc-fill{background:#a8322a;}
    .bc-desperate{border-color:#a8322a;background:#fbf1f0;}
    .bc-debt{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;margin-left:8px;color:#a8322a;}
    .bc-card{max-width:640px;margin:0 auto;text-align:left;line-height:1.55;}
    .bc-scene{font-size:1.05rem;margin:0 0 12px;}
    .bc-prompt{font-size:1.05rem;font-weight:600;margin:0 0 6px;}
    .bc-opts{margin-top:18px;}
    .bc-opt{display:block;width:100%;text-align:left;margin:9px 0;line-height:1.4;
      font-size:1rem;padding:13px 18px;border:1px solid #cdd5dd;border-radius:9px;
      background:#fff;cursor:pointer;box-sizing:border-box;}
    .bc-opt:hover{border-color:#4b5562;background:#fcfdfe;}
    .bc-opt:focus-visible{outline:3px solid rgba(47,111,94,.4);outline-offset:2px;}
    .bc-outcome{max-width:640px;margin:0 auto;text-align:left;
      font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.15rem;}
    .bc-win{color:#2f6f5e;} .bc-lose{color:#a8322a;}
    @media (prefers-reduced-motion: reduce){ .bc-fill{transition:none;} }
  `;

  function injectStyle() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function fmt(currency, v) {
    const sign = v < 0 ? "-" : "";
    return sign + currency + Math.abs(Math.round(v)).toLocaleString("en-US");
  }

  function ev(opt) {
    if (opt.p >= 1) return opt.win;
    return opt.p * opt.win + (1 - opt.p) * opt.lose;
  }

  class BudgetedChoicePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    statusBarHTML(trial) {
      const v = trial.balance;
      const start = trial.start_balance == null ? Math.abs(trial.balance) || 1 : trial.start_balance;
      let state = "ok";
      if (trial.desperate_at != null && v <= trial.desperate_at) state = "desperate";
      else if (trial.tight_at != null && v <= trial.tight_at) state = "tight";
      const pct = Math.max(0, Math.min(100, (v / start) * 100));
      const debt = v < 0 ? `<span class="bc-debt">in debt</span>` : "";
      return `<div class="bc-statusbar bc-${state}">
        <div class="bc-row"><span class="bc-label">${trial.status_label}</span>
        <span class="bc-balance">${fmt(trial.currency, v)} ${debt}</span></div>
        <div class="bc-meter"><div class="bc-fill" style="width:${pct}%"></div></div></div>`;
    }

    resolve(opt) {
      let delta, won = null;
      if (opt.p >= 1) {
        delta = opt.win;
      } else {
        won = this.jsPsych.randomization.sampleWithReplacement([true, false], 1, [opt.p, 1 - opt.p])[0];
        delta = won ? opt.win : opt.lose;
      }
      return { delta, won };
    }

    buildData(trial, displayOrder, displayIndex) {
      const chosen = displayOrder[displayIndex];
      const { delta, won } = this.resolve(chosen);
      const balance_after = trial.balance + delta;
      return {
        response: displayIndex,
        chosen_tag: chosen.tag,
        chosen_label: chosen.label,
        chose_sure: chosen.p >= 1 ? 1 : 0,
        chose_risky: chosen.p < 1 ? 1 : 0,
        chose_ambiguous: chosen.ambiguous ? 1 : 0,
        chosen_p: chosen.p,
        chosen_win: chosen.win,
        chosen_lose: chosen.lose,
        balance_before: trial.balance,
        balance_after: balance_after,
        outcome_won: won,
        delta: delta,
        option_order: displayOrder.map((o) => o.tag).join("|"),
        options_json: JSON.stringify(
          displayOrder.map((o) => ({ tag: o.tag, p: o.p, win: o.win, lose: o.lose, ambiguous: o.ambiguous, ev: ev(o) }))
        ),
      };
    }

    feedbackHTML(trial, data) {
      if (typeof trial.feedback_html === "function") {
        return trial.feedback_html({
          won: data.outcome_won,
          delta: data.delta,
          balance_after: data.balance_after,
          kind: data.chosen_tag,
          currency: trial.currency,
        });
      }
      let msg;
      if (data.outcome_won === null) {
        msg = `<p class="bc-outcome bc-win">You earned <b>${fmt(trial.currency, data.delta)}</b>.</p>`;
      } else if (data.outcome_won) {
        msg = `<p class="bc-outcome bc-win">It paid off — <b>+${fmt(trial.currency, data.delta)}</b>.</p>`;
      } else {
        msg = `<p class="bc-outcome bc-lose">It didn't come through — <b>${fmt(trial.currency, 0)}</b>.</p>`;
      }
      return msg;
    }

    trial(display_element, trial) {
      injectStyle();

      // Fix display order once for this trial.
      let displayOrder = trial.options.slice();
      if (trial.randomize_option_order) {
        displayOrder = this.jsPsych.randomization.shuffle(displayOrder);
      }

      const statusHTML = trial.show_balance ? this.statusBarHTML(trial) : "";
      const buttons = displayOrder
        .map((o, i) => `<button class="bc-opt jspsych-btn" data-i="${i}">${o.label}</button>`)
        .join("");
      display_element.innerHTML =
        statusHTML +
        `<div class="bc-card">
           ${trial.scene ? `<p class="bc-scene">${trial.scene}</p>` : ""}
           ${trial.prompt ? `<p class="bc-prompt">${trial.prompt}</p>` : ""}
           <div class="bc-opts">${buttons}</div>
         </div>`;

      const start_time = performance.now();
      const self = this;

      const endTrial = (data) => {
        display_element.innerHTML = "";
        self.jsPsych.finishTrial(data);
      };

      const showFeedback = (data) => {
        const fb = self.feedbackHTML(trial, data);
        const cont = trial.feedback_duration == null
          ? `<div class="bc-opts"><button class="bc-opt jspsych-btn" id="bc-continue">${trial.continue_label}</button></div>`
          : "";
        const status2 = trial.show_balance
          ? self.statusBarHTML(Object.assign({}, trial, { balance: data.balance_after }))
          : "";
        display_element.innerHTML = status2 + `<div class="bc-card">${fb}${cont}</div>`;
        if (trial.feedback_duration == null) {
          display_element.querySelector("#bc-continue").addEventListener("click", () => endTrial(data));
        } else {
          self.jsPsych.pluginAPI.setTimeout(() => endTrial(data), trial.feedback_duration);
        }
      };

      display_element.querySelectorAll(".bc-opt").forEach((btn) => {
        btn.addEventListener("click", function handle() {
          const i = parseInt(this.getAttribute("data-i"), 10);
          const data = self.buildData(trial, displayOrder, i);
          data.rt = Math.round(performance.now() - start_time);
          if (trial.feedback) showFeedback(data);
          else endTrial(data);
        });
      });
    }

    // ---- Simulation support (for jsPsych simulation mode / automated testing) ----
    simulate(trial, simulation_mode, simulation_options, load_callback) {
      if (simulation_mode === "data-only") {
        load_callback();
        this.jsPsych.finishTrial(this.create_simulation_data(trial, simulation_options));
      }
      if (simulation_mode === "visual") {
        this.simulate_visual(trial, simulation_options, load_callback);
      }
    }

    create_simulation_data(trial, simulation_options) {
      let displayOrder = trial.options.slice();
      if (trial.randomize_option_order) displayOrder = this.jsPsych.randomization.shuffle(displayOrder);
      const idx = this.jsPsych.randomization.randomInt(0, displayOrder.length - 1);
      const data = this.buildData(trial, displayOrder, idx);
      data.rt = Math.round(this.jsPsych.randomization.sampleExGaussian(600, 200, 1 / 300, true));
      return this.jsPsych.pluginAPI.mergeSimulationData(data, simulation_options);
    }

    simulate_visual(trial, simulation_options, load_callback) {
      const self = this;
      const data = this.create_simulation_data(trial, simulation_options);
      const display_element = this.jsPsych.getDisplayElement();
      this.trial(display_element, trial);
      load_callback();
      // Click the chosen option, then (if shown) the continue button.
      this.jsPsych.pluginAPI.clickTarget(display_element.querySelector(`.bc-opt[data-i="${data.response}"]`), data.rt);
      if (trial.feedback && trial.feedback_duration == null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          const c = display_element.querySelector("#bc-continue");
          if (c) self.jsPsych.pluginAPI.clickTarget(c);
        }, data.rt + 100);
      }
    }
  }

  BudgetedChoicePlugin.info = info;
  return BudgetedChoicePlugin;
})(jsPsychModule);
