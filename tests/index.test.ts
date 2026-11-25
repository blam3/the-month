import { clickTarget, startTimeline, simulateTimeline } from "@jspsych/test-utils";
import { initJsPsych } from "jspsych";

import BudgetedChoice from "../src/index";

describe("budgeted-choice plugin", () => {
  test("resolves a sure option deterministically and updates the balance", async () => {
    const { getData, displayElement, expectFinished } = await startTimeline([
      {
        type: BudgetedChoice,
        balance: 1000,
        feedback: false,
        randomize_option_order: false,
        options: [{ label: "Sure $20", win: 20, p: 1, tag: "sure" }],
      },
    ]);

    clickTarget(displayElement.querySelector('.bc-opt[data-i="0"]'));
    await expectFinished();

    const d = getData().values()[0];
    expect(d.chose_sure).toBe(1);
    expect(d.chose_risky).toBe(0);
    expect(d.delta).toBe(20);
    expect(d.balance_before).toBe(1000);
    expect(d.balance_after).toBe(1020);
    expect(d.outcome_won).toBeNull();
  });

  test("preserves option order when randomize_option_order is false", async () => {
    const { getData, displayElement, expectFinished } = await startTimeline([
      {
        type: BudgetedChoice,
        balance: 500,
        feedback: false,
        randomize_option_order: false,
        options: [
          { label: "Known", win: 80, p: 0.6, tag: "known" },
          { label: "Unknown", win: 80, p: 0.6, ambiguous: true, tag: "ambiguous" },
        ],
      },
    ]);

    clickTarget(displayElement.querySelector('.bc-opt[data-i="0"]'));
    await expectFinished();

    const d = getData().values()[0];
    expect(d.option_order).toBe("known|ambiguous");
    expect(d.chosen_tag).toBe("known");
  });

  test("codes an ambiguous choice correctly", async () => {
    const { getData, displayElement, expectFinished } = await startTimeline([
      {
        type: BudgetedChoice,
        balance: 500,
        feedback: false,
        randomize_option_order: false,
        options: [
          { label: "Known", win: 80, p: 0.6, tag: "known" },
          { label: "Unknown", win: 80, p: 0.6, ambiguous: true, tag: "ambiguous" },
        ],
      },
    ]);

    clickTarget(displayElement.querySelector('.bc-opt[data-i="1"]'));
    await expectFinished();

    const d = getData().values()[0];
    expect(d.chose_ambiguous).toBe(1);
    expect(d.chose_risky).toBe(1);
    expect(d.chosen_p).toBe(0.6); // hidden true probability is still logged
  });

  test("resolves a probabilistic option to one of its two payoffs", async () => {
    const jsPsych = initJsPsych();
    jsPsych.randomization.setSeed("test-seed");

    const { getData, displayElement, expectFinished } = await startTimeline(
      [
        {
          type: BudgetedChoice,
          balance: 300,
          feedback: false,
          randomize_option_order: false,
          options: [{ label: "Gamble", win: 100, lose: 0, p: 0.25, tag: "gamble" }],
        },
      ],
      jsPsych
    );

    clickTarget(displayElement.querySelector('.bc-opt[data-i="0"]'));
    await expectFinished();

    const d = getData().values()[0];
    expect(d.chose_risky).toBe(1);
    expect(typeof d.outcome_won).toBe("boolean");
    expect([0, 100]).toContain(d.delta);
    expect(d.balance_after).toBe(300 + d.delta);
  });

  test("shows feedback then advances on continue", async () => {
    const { displayElement, expectFinished } = await startTimeline([
      {
        type: BudgetedChoice,
        balance: 100,
        feedback: true,
        randomize_option_order: false,
        options: [{ label: "Sure $20", win: 20, p: 1, tag: "sure" }],
      },
    ]);

    clickTarget(displayElement.querySelector('.bc-opt[data-i="0"]'));
    // feedback screen now shown with a continue button
    clickTarget(displayElement.querySelector("#bc-continue"));
    await expectFinished();
  });
});

  test("logs a deterministic p=0 loss and shows its actual negative payoff", async () => {
    const { getData, displayElement, expectFinished } = await startTimeline([{
      type: BudgetedChoice, balance: 5, feedback: true, randomize_option_order: false,
      options: [{label: 'Deterministic loss', win: 10, lose: -7, p: 0, tag: 'loss'}],
    }]);
    await clickTarget(displayElement.querySelector('.bc-opt[data-i="0"]'));
    expect(displayElement.textContent).toContain('-$7');
    await clickTarget(displayElement.querySelector('#bc-continue'));
    await expectFinished();
    const row=getData().values()[0];
    expect(row.delta).toBe(-7); expect(row.balance_after).toBe(-2); expect(row.chose_sure).toBe(1);
  });

  test("a repeated click cannot resolve a decision twice", async () => {
    const { getData, displayElement, expectFinished } = await startTimeline([{
      type: BudgetedChoice, balance: 5, feedback: true, randomize_option_order: false,
      options: [{label: 'Sure', win: 3, p: 1, tag: 'sure'}],
    }]);
    const button=displayElement.querySelector('.bc-opt[data-i="0"]') as HTMLElement;
    button.click(); button.click();
    await clickTarget(displayElement.querySelector('#bc-continue'));
    await expectFinished();
    expect(getData().count()).toBe(1); expect(getData().values()[0].balance_after).toBe(8);
  });

  test("rejects out-of-range probabilities before rendering", () => {
    const plugin = new BudgetedChoice(initJsPsych());
    const display = document.createElement('div');
    const trial = {balance: 10, options: [{label:'bad',p:1.2,win:2,lose:0}],start_balance:null,feedback_duration:null};
    expect(() => plugin.trial(display, trial as any)).toThrow('p must be in [0, 1]');
  });

  test("data-only and visual simulation resolve the same seeded outcome once", async () => {
    const trial = {type:BudgetedChoice, balance:100, feedback:false, randomize_option_order:true,
      options:[{label:'A',win:20,lose:-10,p:.4,tag:'a'},{label:'B',win:30,lose:0,p:.7,tag:'b'}]};
    const rows:any[]=[];
    for(const mode of ['data-only','visual'] as const) {
      const jsPsych=initJsPsych(); jsPsych.randomization.setSeed('simulation-contract');
      const result=await simulateTimeline([trial], mode, {default:{data:{response:0,rt:1}}}, jsPsych);
      await result.finished; await result.expectFinished(); rows.push(result.getData().values()[0]);
    }
    for(const key of ['response','chosen_tag','chosen_p','delta','balance_after','option_order']) expect(rows[0][key]).toEqual(rows[1][key]);
  });
