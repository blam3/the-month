import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "./version";

const info = <const>{
  name: "budgeted-choice",
  version: version,
  parameters: {
    /** Narrative/context shown above the prompt (HTML allowed). */
    scene: { type: ParameterType.HTML_STRING, default: "" },
    /** The decision question shown below the scene (HTML allowed). */
    prompt: { type: ParameterType.HTML_STRING, default: "" },
    /** The choice options. Each option resolves to a payoff added to the running
     *  balance. `p` is the probability of `win` (else `lose`); `p` of 1 = a sure
     *  thing. Set `ambiguous: true` for an option whose probability is unknown to
     *  the participant (write the label without odds); `p` is then the hidden TRUE
     *  probability used to resolve and log the outcome. `tag` labels the option for
     *  your analysis. */
    options: {
      type: ParameterType.COMPLEX,
      array: true,
      default: undefined,
      nested: {
        /** Button text for this option (HTML allowed). */
        label: { type: ParameterType.HTML_STRING, default: undefined },
        /** Payoff if the option "wins" (added to balance). */
        win: { type: ParameterType.FLOAT, default: 0 },
        /** Payoff if the option "loses". */
        lose: { type: ParameterType.FLOAT, default: 0 },
        /** Probability of `win`. Use 1 for a guaranteed (sure) option. */
        p: { type: ParameterType.FLOAT, default: 1 },
        /** If true, odds are unknown to the participant; `p` is the hidden truth. */
        ambiguous: { type: ParameterType.BOOL, default: false },
        /** Free-text label for analysis (e.g. "known", "ambiguous", "gamble", "sure"). */
        tag: { type: ParameterType.STRING, default: "" },
      },
    },
    /** Current balance before this trial. Usually a function returning your running
     *  state, e.g. `balance: () => budget.value`. */
    balance: { type: ParameterType.FLOAT, default: undefined },
    /** Reference balance used to scale the meter (defaults to `balance`). */
    start_balance: { type: ParameterType.FLOAT, default: null },
    /** Currency symbol. */
    currency: { type: ParameterType.STRING, default: "$" },
    /** Whether to show the balance/status bar with its draining meter. */
    show_balance: { type: ParameterType.BOOL, default: true },
    /** Small label on the status bar, e.g. "Week 2 of 4". */
    status_label: { type: ParameterType.HTML_STRING, default: "" },
    /** Balance at/below which the meter turns amber ("tight"). null = off. */
    tight_at: { type: ParameterType.FLOAT, default: null },
    /** Balance at/below which the meter turns red ("desperate"). null = off. */
    desperate_at: { type: ParameterType.FLOAT, default: null },
    /** Randomize the left/right (display) order of the options. */
    randomize_option_order: { type: ParameterType.BOOL, default: true },
    /** Show an outcome-feedback screen after the choice. */
    feedback: { type: ParameterType.BOOL, default: true },
    /** If set (ms), the feedback screen auto-advances; otherwise it waits for a click. */
    feedback_duration: { type: ParameterType.INT, default: null },
    /** Optional custom feedback renderer: (outcome) => HTML string. */
    feedback_html: { type: ParameterType.FUNCTION, default: null },
    /** Label of the continue button on the feedback screen. */
    continue_label: { type: ParameterType.STRING, default: "Continue" },
  },
  data: {
    /** Index of the chosen option as displayed (after any shuffling). */
    response: { type: ParameterType.INT },
    /** Response time in milliseconds from option onset. */
    rt: { type: ParameterType.INT },
    /** `tag` of the chosen option. */
    chosen_tag: { type: ParameterType.STRING },
    /** Label of the chosen option. */
    chosen_label: { type: ParameterType.STRING },
    /** 1 if the chosen option was a sure thing (p >= 1). */
    chose_sure: { type: ParameterType.INT },
    /** 1 if the chosen option was probabilistic (p < 1). */
    chose_risky: { type: ParameterType.INT },
    /** 1 if the chosen option was flagged ambiguous. */
    chose_ambiguous: { type: ParameterType.INT },
    /** Probability of the chosen option (hidden true value if ambiguous). */
    chosen_p: { type: ParameterType.FLOAT },
    /** Win payoff of the chosen option. */
    chosen_win: { type: ParameterType.FLOAT },
    /** Lose payoff of the chosen option. */
    chosen_lose: { type: ParameterType.FLOAT },
    /** Balance before this trial's outcome. */
    balance_before: { type: ParameterType.FLOAT },
    /** Balance after this trial's outcome. */
    balance_after: { type: ParameterType.FLOAT },
    /** True/false if a probabilistic option was chosen; null for sure options. */
    outcome_won: { type: ParameterType.BOOL },
    /** Net change to the balance on this trial. */
    delta: { type: ParameterType.FLOAT },
    /** Displayed order of option tags, "|"-joined. */
    option_order: { type: ParameterType.STRING },
    /** Full option set (with expected values) as a JSON string. */
    options_json: { type: ParameterType.STRING },
  },
};

type Info = typeof info;

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

function fmt(currency: string, v: number) {
  const sign = v < 0 ? "-" : "";
  return sign + currency + Math.abs(Math.round(v)).toLocaleString("en-US");
}

function ev(opt: any) {
  return opt.p >= 1 ? opt.win : opt.p * opt.win + (1 - opt.p) * opt.lose;
}

class BudgetedChoicePlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  private statusBarHTML(trial: any) {
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

  private resolve(opt: any) {
    let delta: number;
    let won: boolean | null = null;
    if (opt.p === 0 || opt.p === 1) {
      delta = opt.p === 1 ? opt.win : opt.lose;
    } else {
      won = this.jsPsych.randomization.sampleWithReplacement([true, false], 1, [opt.p, 1 - opt.p])[0];
      delta = won ? opt.win : opt.lose;
    }
    return { delta, won };
  }

  private buildData(trial: any, displayOrder: any[], displayIndex: number) {
    const chosen = displayOrder[displayIndex];
    const { delta, won } = this.resolve(chosen);
    const balance_after = trial.balance + delta;
    return {
      response: displayIndex,
      chosen_tag: chosen.tag,
      chosen_label: chosen.label,
      chose_sure: chosen.p === 0 || chosen.p === 1 ? 1 : 0,
      chose_risky: chosen.p > 0 && chosen.p < 1 ? 1 : 0,
      chose_ambiguous: chosen.ambiguous ? 1 : 0,
      chosen_p: chosen.p,
      chosen_win: chosen.win,
      chosen_lose: chosen.lose,
      balance_before: trial.balance,
      balance_after,
      outcome_won: won,
      delta,
      option_order: displayOrder.map((o) => o.tag).join("|"),
      options_json: JSON.stringify(
        displayOrder.map((o) => ({ tag: o.tag, p: o.p, win: o.win, lose: o.lose, ambiguous: o.ambiguous, ev: ev(o) }))
      ),
    };
  }

  private feedbackHTML(trial: any, data: any) {
    if (typeof trial.feedback_html === "function") {
      return trial.feedback_html({
        won: data.outcome_won,
        delta: data.delta,
        balance_after: data.balance_after,
        kind: data.chosen_tag,
        currency: trial.currency,
      });
    }
    if (data.outcome_won === null) {
      return `<p class="bc-outcome bc-win">Outcome: <b>${fmt(trial.currency, data.delta)}</b>.</p>`;
    }
    if (data.outcome_won) {
      return `<p class="bc-outcome bc-win">Outcome: <b>${fmt(trial.currency, data.delta)}</b>.</p>`;
    }
    return `<p class="bc-outcome bc-lose">Outcome: <b>${fmt(trial.currency, data.delta)}</b>.</p>`;
  }

  private validate(trial: any) {
    if (!Number.isFinite(trial.balance)) throw new Error("balance must be finite");
    if (!Array.isArray(trial.options) || trial.options.length === 0) throw new Error("options must not be empty");
    for (const option of trial.options) {
      if (!Number.isFinite(option.p) || option.p < 0 || option.p > 1) throw new Error("p must be in [0, 1]");
      if (!Number.isFinite(option.win) || !Number.isFinite(option.lose)) throw new Error("payoffs must be finite");
    }
    if (trial.start_balance !== null && (!Number.isFinite(trial.start_balance) || trial.start_balance <= 0)) {
      throw new Error("start_balance must be positive when supplied");
    }
    if (trial.feedback_duration !== null && (!Number.isFinite(trial.feedback_duration) || trial.feedback_duration < 0)) {
      throw new Error("feedback_duration must be nonnegative when supplied");
    }
  }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    injectStyle();
    const t = trial as any;
    this.validate(t);

    let displayOrder = t.options.slice();
    if (t.randomize_option_order) displayOrder = this.jsPsych.randomization.shuffle(displayOrder);

    const statusHTML = t.show_balance ? this.statusBarHTML(t) : "";
    const buttons = displayOrder
      .map((o: any, i: number) => `<button class="bc-opt jspsych-btn" data-i="${i}">${o.label}</button>`)
      .join("");
    display_element.innerHTML =
      statusHTML +
      `<div class="bc-card">
         ${t.scene ? `<p class="bc-scene">${t.scene}</p>` : ""}
         ${t.prompt ? `<p class="bc-prompt">${t.prompt}</p>` : ""}
         <div class="bc-opts">${buttons}</div>
       </div>`;

    const start_time = performance.now();
    const self = this;

    const endTrial = (data: any) => {
      display_element.innerHTML = "";
      self.jsPsych.finishTrial(data);
    };

    const showFeedback = (data: any) => {
      const fb = self.feedbackHTML(t, data);
      const cont =
        t.feedback_duration == null
          ? `<div class="bc-opts"><button class="bc-opt jspsych-btn" id="bc-continue">${t.continue_label}</button></div>`
          : "";
      const status2 = t.show_balance
        ? self.statusBarHTML(Object.assign({}, t, { balance: data.balance_after }))
        : "";
      display_element.innerHTML = status2 + `<div class="bc-card">${fb}${cont}</div>`;
      if (t.feedback_duration == null) {
        (display_element.querySelector("#bc-continue") as HTMLElement).addEventListener("click", () => endTrial(data));
      } else {
        self.jsPsych.pluginAPI.setTimeout(() => endTrial(data), t.feedback_duration);
      }
    };

    let responded = false;
    display_element.querySelectorAll(".bc-opt").forEach((btn) => {
      btn.addEventListener("click", function (this: HTMLElement) {
        if (responded) return;
        responded = true;
        const i = parseInt(this.getAttribute("data-i") as string, 10);
        const data: any = self.buildData(t, displayOrder, i);
        data.rt = Math.round(performance.now() - start_time);
        if (t.feedback) showFeedback(data);
        else endTrial(data);
      });
    });
  }

  simulate(
    trial: TrialType<Info>,
    simulation_mode: "data-only" | "visual",
    simulation_options: any,
    load_callback: () => void
  ) {
    if (simulation_mode === "data-only") {
      load_callback();
      this.jsPsych.finishTrial(this.create_simulation_data(trial, simulation_options));
    }
    if (simulation_mode === "visual") {
      this.simulate_visual(trial, simulation_options, load_callback);
    }
  }

  private simulationChoice(trial: any, simulation_options: any) {
    this.validate(trial);
    const idx = simulation_options?.data?.response ?? this.jsPsych.randomization.randomInt(0, trial.options.length - 1);
    const rt = simulation_options?.data?.rt ?? Math.round(this.jsPsych.randomization.sampleExGaussian(600, 200, 1 / 300, true));
    if (!Number.isInteger(idx) || idx < 0 || idx >= trial.options.length || !Number.isFinite(rt) || rt < 0) {
      throw new Error("simulation response/rt is invalid");
    }
    return { idx, rt };
  }

  private create_simulation_data(trial: TrialType<Info>, simulation_options: any) {
    const t = trial as any;
    const { idx, rt } = this.simulationChoice(t, simulation_options);
    const displayOrder = t.randomize_option_order ? this.jsPsych.randomization.shuffle(t.options) : t.options.slice();
    return { ...this.buildData(t, displayOrder, idx), rt };
  }

  private simulate_visual(trial: TrialType<Info>, simulation_options: any, load_callback: () => void) {
    const t = trial as any;
    // Choose the response without drawing the outcome. trial() resolves it once.
    const { idx, rt } = this.simulationChoice(t, simulation_options);
    const display_element = this.jsPsych.getDisplayElement();
    this.trial(display_element, trial);
    load_callback();
    this.jsPsych.pluginAPI.setTimeout(() => {
      const choice = display_element.querySelector(`.bc-opt[data-i="${idx}"]`) as HTMLElement;
      choice.click();
      if (t.feedback && t.feedback_duration == null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          (display_element.querySelector("#bc-continue") as HTMLElement)?.click();
        }, 100);
      }
    }, rt);
  }

}

export default BudgetedChoicePlugin;
