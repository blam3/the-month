import { clickTarget, startTimeline } from "@jspsych/test-utils";
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
