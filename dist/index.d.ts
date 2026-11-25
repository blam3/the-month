import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
declare const info: {
    readonly name: "budgeted-choice";
    readonly version: "0.1.1";
    readonly parameters: {
        /** Narrative/context shown above the prompt (HTML allowed). */
        readonly scene: {
            readonly type: ParameterType.HTML_STRING;
            readonly default: "";
        };
        /** The decision question shown below the scene (HTML allowed). */
        readonly prompt: {
            readonly type: ParameterType.HTML_STRING;
            readonly default: "";
        };
        /** The choice options. Each option resolves to a payoff added to the running
         *  balance. `p` is the probability of `win` (else `lose`); `p` of 1 = a sure
         *  thing. Set `ambiguous: true` for an option whose probability is unknown to
         *  the participant (write the label without odds); `p` is then the hidden TRUE
         *  probability used to resolve and log the outcome. `tag` labels the option for
         *  your analysis. */
        readonly options: {
            readonly type: ParameterType.COMPLEX;
            readonly array: true;
            readonly default: undefined;
            readonly nested: {
                /** Button text for this option (HTML allowed). */
                readonly label: {
                    readonly type: ParameterType.HTML_STRING;
                    readonly default: undefined;
                };
                /** Payoff if the option "wins" (added to balance). */
                readonly win: {
                    readonly type: ParameterType.FLOAT;
                    readonly default: 0;
                };
                /** Payoff if the option "loses". */
                readonly lose: {
                    readonly type: ParameterType.FLOAT;
                    readonly default: 0;
                };
                /** Probability of `win`. Use 1 for a guaranteed (sure) option. */
                readonly p: {
                    readonly type: ParameterType.FLOAT;
                    readonly default: 1;
                };
                /** If true, odds are unknown to the participant; `p` is the hidden truth. */
                readonly ambiguous: {
                    readonly type: ParameterType.BOOL;
                    readonly default: false;
                };
                /** Free-text label for analysis (e.g. "known", "ambiguous", "gamble", "sure"). */
                readonly tag: {
                    readonly type: ParameterType.STRING;
                    readonly default: "";
                };
            };
        };
        /** Current balance before this trial. Usually a function returning your running
         *  state, e.g. `balance: () => budget.value`. */
        readonly balance: {
            readonly type: ParameterType.FLOAT;
            readonly default: undefined;
        };
        /** Reference balance used to scale the meter (defaults to `balance`). */
        readonly start_balance: {
            readonly type: ParameterType.FLOAT;
            readonly default: null;
        };
        /** Currency symbol. */
        readonly currency: {
            readonly type: ParameterType.STRING;
            readonly default: "$";
        };
        /** Whether to show the balance/status bar with its draining meter. */
        readonly show_balance: {
            readonly type: ParameterType.BOOL;
            readonly default: true;
        };
        /** Small label on the status bar, e.g. "Week 2 of 4". */
        readonly status_label: {
            readonly type: ParameterType.HTML_STRING;
            readonly default: "";
        };
        /** Balance at/below which the meter turns amber ("tight"). null = off. */
        readonly tight_at: {
            readonly type: ParameterType.FLOAT;
            readonly default: null;
        };
        /** Balance at/below which the meter turns red ("desperate"). null = off. */
        readonly desperate_at: {
            readonly type: ParameterType.FLOAT;
            readonly default: null;
        };
        /** Randomize the left/right (display) order of the options. */
        readonly randomize_option_order: {
            readonly type: ParameterType.BOOL;
            readonly default: true;
        };
        /** Show an outcome-feedback screen after the choice. */
        readonly feedback: {
            readonly type: ParameterType.BOOL;
            readonly default: true;
        };
        /** If set (ms), the feedback screen auto-advances; otherwise it waits for a click. */
        readonly feedback_duration: {
            readonly type: ParameterType.INT;
            readonly default: null;
        };
        /** Optional custom feedback renderer: (outcome) => HTML string. */
        readonly feedback_html: {
            readonly type: ParameterType.FUNCTION;
            readonly default: null;
        };
        /** Label of the continue button on the feedback screen. */
        readonly continue_label: {
            readonly type: ParameterType.STRING;
            readonly default: "Continue";
        };
    };
    readonly data: {
        /** Index of the chosen option as displayed (after any shuffling). */
        readonly response: {
            readonly type: ParameterType.INT;
        };
        /** Response time in milliseconds from option onset. */
        readonly rt: {
            readonly type: ParameterType.INT;
        };
        /** `tag` of the chosen option. */
        readonly chosen_tag: {
            readonly type: ParameterType.STRING;
        };
        /** Label of the chosen option. */
        readonly chosen_label: {
            readonly type: ParameterType.STRING;
        };
        /** 1 if the chosen option was a sure thing (p >= 1). */
        readonly chose_sure: {
            readonly type: ParameterType.INT;
        };
        /** 1 if the chosen option was probabilistic (p < 1). */
        readonly chose_risky: {
            readonly type: ParameterType.INT;
        };
        /** 1 if the chosen option was flagged ambiguous. */
        readonly chose_ambiguous: {
            readonly type: ParameterType.INT;
        };
        /** Probability of the chosen option (hidden true value if ambiguous). */
        readonly chosen_p: {
            readonly type: ParameterType.FLOAT;
        };
        /** Win payoff of the chosen option. */
        readonly chosen_win: {
            readonly type: ParameterType.FLOAT;
        };
        /** Lose payoff of the chosen option. */
        readonly chosen_lose: {
            readonly type: ParameterType.FLOAT;
        };
        /** Balance before this trial's outcome. */
        readonly balance_before: {
            readonly type: ParameterType.FLOAT;
        };
        /** Balance after this trial's outcome. */
        readonly balance_after: {
            readonly type: ParameterType.FLOAT;
        };
        /** True/false if a probabilistic option was chosen; null for sure options. */
        readonly outcome_won: {
            readonly type: ParameterType.BOOL;
        };
        /** Net change to the balance on this trial. */
        readonly delta: {
            readonly type: ParameterType.FLOAT;
        };
        /** Displayed order of option tags, "|"-joined. */
        readonly option_order: {
            readonly type: ParameterType.STRING;
        };
        /** Full option set (with expected values) as a JSON string. */
        readonly options_json: {
            readonly type: ParameterType.STRING;
        };
    };
};
type Info = typeof info;
declare class BudgetedChoicePlugin implements JsPsychPlugin<Info> {
    private jsPsych;
    static info: {
        readonly name: "budgeted-choice";
        readonly version: "0.1.1";
        readonly parameters: {
            /** Narrative/context shown above the prompt (HTML allowed). */
            readonly scene: {
                readonly type: ParameterType.HTML_STRING;
                readonly default: "";
            };
            /** The decision question shown below the scene (HTML allowed). */
            readonly prompt: {
                readonly type: ParameterType.HTML_STRING;
                readonly default: "";
            };
            /** The choice options. Each option resolves to a payoff added to the running
             *  balance. `p` is the probability of `win` (else `lose`); `p` of 1 = a sure
             *  thing. Set `ambiguous: true` for an option whose probability is unknown to
             *  the participant (write the label without odds); `p` is then the hidden TRUE
             *  probability used to resolve and log the outcome. `tag` labels the option for
             *  your analysis. */
            readonly options: {
                readonly type: ParameterType.COMPLEX;
                readonly array: true;
                readonly default: undefined;
                readonly nested: {
                    /** Button text for this option (HTML allowed). */
                    readonly label: {
                        readonly type: ParameterType.HTML_STRING;
                        readonly default: undefined;
                    };
                    /** Payoff if the option "wins" (added to balance). */
                    readonly win: {
                        readonly type: ParameterType.FLOAT;
                        readonly default: 0;
                    };
                    /** Payoff if the option "loses". */
                    readonly lose: {
                        readonly type: ParameterType.FLOAT;
                        readonly default: 0;
                    };
                    /** Probability of `win`. Use 1 for a guaranteed (sure) option. */
                    readonly p: {
                        readonly type: ParameterType.FLOAT;
                        readonly default: 1;
                    };
                    /** If true, odds are unknown to the participant; `p` is the hidden truth. */
                    readonly ambiguous: {
                        readonly type: ParameterType.BOOL;
                        readonly default: false;
                    };
                    /** Free-text label for analysis (e.g. "known", "ambiguous", "gamble", "sure"). */
                    readonly tag: {
                        readonly type: ParameterType.STRING;
                        readonly default: "";
                    };
                };
            };
            /** Current balance before this trial. Usually a function returning your running
             *  state, e.g. `balance: () => budget.value`. */
            readonly balance: {
                readonly type: ParameterType.FLOAT;
                readonly default: undefined;
            };
            /** Reference balance used to scale the meter (defaults to `balance`). */
            readonly start_balance: {
                readonly type: ParameterType.FLOAT;
                readonly default: null;
            };
            /** Currency symbol. */
            readonly currency: {
                readonly type: ParameterType.STRING;
                readonly default: "$";
            };
            /** Whether to show the balance/status bar with its draining meter. */
            readonly show_balance: {
                readonly type: ParameterType.BOOL;
                readonly default: true;
            };
            /** Small label on the status bar, e.g. "Week 2 of 4". */
            readonly status_label: {
                readonly type: ParameterType.HTML_STRING;
                readonly default: "";
            };
            /** Balance at/below which the meter turns amber ("tight"). null = off. */
            readonly tight_at: {
                readonly type: ParameterType.FLOAT;
                readonly default: null;
            };
            /** Balance at/below which the meter turns red ("desperate"). null = off. */
            readonly desperate_at: {
                readonly type: ParameterType.FLOAT;
                readonly default: null;
            };
            /** Randomize the left/right (display) order of the options. */
            readonly randomize_option_order: {
                readonly type: ParameterType.BOOL;
                readonly default: true;
            };
            /** Show an outcome-feedback screen after the choice. */
            readonly feedback: {
                readonly type: ParameterType.BOOL;
                readonly default: true;
            };
            /** If set (ms), the feedback screen auto-advances; otherwise it waits for a click. */
            readonly feedback_duration: {
                readonly type: ParameterType.INT;
                readonly default: null;
            };
            /** Optional custom feedback renderer: (outcome) => HTML string. */
            readonly feedback_html: {
                readonly type: ParameterType.FUNCTION;
                readonly default: null;
            };
            /** Label of the continue button on the feedback screen. */
            readonly continue_label: {
                readonly type: ParameterType.STRING;
                readonly default: "Continue";
            };
        };
        readonly data: {
            /** Index of the chosen option as displayed (after any shuffling). */
            readonly response: {
                readonly type: ParameterType.INT;
            };
            /** Response time in milliseconds from option onset. */
            readonly rt: {
                readonly type: ParameterType.INT;
            };
            /** `tag` of the chosen option. */
            readonly chosen_tag: {
                readonly type: ParameterType.STRING;
            };
            /** Label of the chosen option. */
            readonly chosen_label: {
                readonly type: ParameterType.STRING;
            };
            /** 1 if the chosen option was a sure thing (p >= 1). */
            readonly chose_sure: {
                readonly type: ParameterType.INT;
            };
            /** 1 if the chosen option was probabilistic (p < 1). */
            readonly chose_risky: {
                readonly type: ParameterType.INT;
            };
            /** 1 if the chosen option was flagged ambiguous. */
            readonly chose_ambiguous: {
                readonly type: ParameterType.INT;
            };
            /** Probability of the chosen option (hidden true value if ambiguous). */
            readonly chosen_p: {
                readonly type: ParameterType.FLOAT;
            };
            /** Win payoff of the chosen option. */
            readonly chosen_win: {
                readonly type: ParameterType.FLOAT;
            };
            /** Lose payoff of the chosen option. */
            readonly chosen_lose: {
                readonly type: ParameterType.FLOAT;
            };
            /** Balance before this trial's outcome. */
            readonly balance_before: {
                readonly type: ParameterType.FLOAT;
            };
            /** Balance after this trial's outcome. */
            readonly balance_after: {
                readonly type: ParameterType.FLOAT;
            };
            /** True/false if a probabilistic option was chosen; null for sure options. */
            readonly outcome_won: {
                readonly type: ParameterType.BOOL;
            };
            /** Net change to the balance on this trial. */
            readonly delta: {
                readonly type: ParameterType.FLOAT;
            };
            /** Displayed order of option tags, "|"-joined. */
            readonly option_order: {
                readonly type: ParameterType.STRING;
            };
            /** Full option set (with expected values) as a JSON string. */
            readonly options_json: {
                readonly type: ParameterType.STRING;
            };
        };
    };
    constructor(jsPsych: JsPsych);
    private statusBarHTML;
    private resolve;
    private buildData;
    private feedbackHTML;
    private validate;
    trial(display_element: HTMLElement, trial: TrialType<Info>): void;
    simulate(trial: TrialType<Info>, simulation_mode: "data-only" | "visual", simulation_options: any, load_callback: () => void): void;
    private simulationChoice;
    private create_simulation_data;
    private simulate_visual;
}
export default BudgetedChoicePlugin;
