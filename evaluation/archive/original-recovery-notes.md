# Evaluating the task: parameter recovery

`recover.py` is a tool for answering one question before you spend money on data:
**given this task's structure, how well can you actually recover the three constructs it
is meant to measure?** It invents synthetic participants with *known* parameter values,
runs them through the exact event structure of "The Month," writes their choices in the
task's data schema, then tries to recover each parameter and correlates
recovered-vs-true.

```
python3 recover.py
```

It runs at three trial densities: the shipped task (`reps=1`), and `reps=3` / `reps=6`,
which repeat the whole month (bills included, balance reset each month) so you can see how
recovery scales with more trials.

## What it does

Three constructs, three generative models, three recovery estimators:

- **Ambiguity aversion** — synthetic agents discount the ambiguous option's value; recovery
  = each agent's rate of choosing the *known* option on EV-matched ambiguity trials.
- **Likelihood sensitivity** — agents weight probabilities with a Prelec function (γ < 1 =
  more insensitive / inverse-S); recovery = a per-person maximum-likelihood fit of γ from
  the gamble-vs-sure trials.
- **Desperation reactivity** — agents take more risk as the balance falls below a personal
  threshold; recovery = a per-person logistic slope of risk-taking on `money_before`.

## What we found (illustrative run, N = 400, τ = 0.06)

| Construct                       | reps=1 (7/5/3 trials) | reps=3 (21/15/9) | reps=6 (42/30/18) |
| ------------------------------- | --------------------- | ---------------- | ----------------- |
| Ambiguity aversion              | r ≈ 0.56              | r ≈ 0.73         | r ≈ 0.84          |
| Likelihood sensitivity (γ)      | r ≈ 0.28              | r ≈ 0.46         | r ≈ 0.54          |
| Desperation reactivity          | r ≈ 0.14              | r ≈ 0.11         | r ≈ 0.26          |

Your numbers will differ — they depend on the choice-noise level (`TAU`) and the
parameter ranges, both of which are assumptions you should set to match your population.
Re-run with your own values; this is effectively a power analysis for the instrument.

### Honest takeaways

1. **The scarcity gradient is robust.** Every month, the balance descends ~$1000 → ~$120
   → ~$0 regardless of choices. That part of the design works and is what makes a
   within-person desperation effect estimable at all.

2. **As shipped, this is a group-level / hierarchical instrument, not a per-person scoring
   test.** At 5/7/3 trials per construct, per-person point estimates are noisy
   (ambiguity moderate, likelihood and desperation weak). Use mixed-effects / Bayesian
   hierarchical models with partial pooling rather than computing a separate score per
   person from raw rates. Recovery of *group* parameters and of *covariate effects* is far
   better than these per-person correlations suggest.

3. **More trials help ambiguity and likelihood, but with diminishing returns for
   likelihood.** Recovering a continuous probability-weighting curve from binary choices is
   intrinsically hard; even 42 trials only reaches r ≈ 0.54 per person. If likelihood
   insensitivity is a primary outcome, plan ~3–5× the probability ladder *and* a
   hierarchical weighting model.

4. **Desperation reactivity is the weakest-identified construct, and you cannot fix it by
   blindly repeating trials.** It is a state×person interaction read off binary choices,
   and — critically — if you add decision trials without scaling the depleting bills, the
   winnings swamp the budget and the scarcity gradient disappears (try editing the script
   to repeat decisions without repeating bills: desperation recovery collapses to ~0).
   To strengthen it: add more low-balance anchors, widen the contrast (make the long-shot's
   EV advantage larger when poor, or use a loss frame), and model it hierarchically.

## How to use this for your own design

- Edit `true = pd.DataFrame({...})` to set the parameter ranges you expect in your sample.
- Edit `TAU` to your expected choice consistency (lower = noisier choosers).
- Edit `MONTH` to add or rebalance trials and bills, then re-check recovery and the
  printed desperation-anchor balances to confirm the gradient survives your edits.
- Treat a construct as "measurable per-person" only once its recovery r clears whatever
  bar your analysis needs (e.g. ≥ .7 for individual-differences correlations).
