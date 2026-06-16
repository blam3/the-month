#!/usr/bin/env python3
"""
Parameter recovery for "The Month" budgeted-choice task.

Idea: invent N synthetic participants, each with KNOWN values for the three
constructs, push them through the exact event structure of the task (same
probabilities, payoffs, and scripted bills), record their choices in the task's
data schema, then try to RECOVER each construct from those choices and correlate
recovered-vs-true. Strong correlations are evidence the task measures what it
claims; weak ones tell you where the design needs more trials or bigger contrasts.

Run:  python3 recover.py
Deps: numpy, scipy, pandas
"""
import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar
from scipy.stats import pearsonr

rng = np.random.default_rng(7)
N = 400  # synthetic participants

# ---- The task's event structure (mirrors events.js) ----------------------
# expense: ('exp', amount).  decision: ('dec', construct, dict)
MONTH = [
    ('dec', 'desperation', dict(p=0.20, win=120, sure=20)),
    ('dec', 'ambiguity',   dict(known_p=0.60, payoff=80)),
    ('dec', 'likelihood',  dict(p=0.90, win=50, sure=40)),
    ('exp', -140),
    ('exp', -650),
    ('dec', 'likelihood',  dict(p=0.50, win=90, sure=40)),
    ('dec', 'ambiguity',   dict(known_p=0.50, payoff=90)),
    ('dec', 'likelihood',  dict(p=0.10, win=120, sure=10)),
    ('exp', -110),
    ('exp', -190),
    ('dec', 'desperation', dict(p=0.20, win=120, sure=20)),
    ('dec', 'likelihood',  dict(p=0.75, win=60, sure=40)),
    ('dec', 'ambiguity',   dict(known_p=0.70, payoff=70)),
    ('dec', 'likelihood',  dict(p=0.25, win=100, sure=20)),
    ('exp', -120),
    ('exp', -240),
    ('dec', 'likelihood',  dict(p=0.05, win=120, sure=5)),
    ('dec', 'ambiguity',   dict(known_p=0.50, payoff=90)),
    ('dec', 'likelihood',  dict(p=0.95, win=45, sure=40)),
    ('dec', 'desperation', dict(p=0.20, win=120, sure=20)),
    ('dec', 'ambiguity',   dict(known_p=0.40, payoff=80)),
]
START = 1000.0


def build_events(reps):
    """Repeat the WHOLE month (decisions AND scripted bills) `reps` times. Because the
    bills travel with the decisions, the balance keeps descending across reps, which
    preserves and widens the scarcity gradient that the desperation construct needs.
    reps=1 is the shipped task; the balance is reset to START at the top of each month
    so participants re-experience the full high->low arc rather than sinking into
    ever-deeper debt."""
    return MONTH * reps


def prelec(p, gamma):
    """Prelec (1998) one-parameter weighting; gamma<1 = likelihood-insensitive (inverse-S)."""
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.exp(-((-np.log(p)) ** gamma))


def logistic(x):
    return 1.0 / (1.0 + np.exp(-x))


# ---- True parameters per participant -------------------------------------
true = pd.DataFrame({
    'amb_aversion':  rng.uniform(0.0, 0.45, N),     # discount on ambiguous prob (bigger = more averse)
    'gamma':         rng.uniform(0.40, 1.00, N),    # prob-weighting sensitivity (lower = more insensitive)
    'desp_thresh':   rng.uniform(100, 500, N),      # balance below which risk appetite rises
    'desp_react':    rng.uniform(0.0, 3.0, N),      # strength of that scarcity-driven risk boost
})
TAU = 0.06  # choice inverse-temperature (shared)

lik_lookup = {q[2]['p']: (q[2]['win'], q[2]['sure'])
              for q in MONTH if q[0] == 'dec' and q[1] == 'likelihood'}


def simulate(reps):
    rows = []
    for i in range(N):
        pr = true.iloc[i]
        for _ in range(reps):
            money = START          # reset: each month is a fresh high->low arc
            for ev in MONTH:
                if ev[0] == 'exp':
                    money += ev[1]
                    continue
                sim_one(rows, i, pr, ev[1], ev[2], money)
                money += rows[-1]['delta']
    return pd.DataFrame(rows)


def sim_one(rows, i, pr, construct, q, money_before):
        if construct == 'ambiguity':
            V = q['payoff']
            v_known = q['known_p'] * V
            v_amb = (q['known_p'] - pr['amb_aversion']) * V
            p_choose_known = logistic(TAU * (v_known - v_amb))
            chose_known = rng.random() < p_choose_known
            # resolve payoff (true prob = known_p for both)
            won = rng.random() < q['known_p']
            delta = V if won else 0
            rows.append(dict(pid=i, construct=construct, money_before=money_before,
                             chose_known=int(chose_known), chose_risky=int(not chose_known),
                             stated_p=np.nan, delta=delta))
            return

        elif construct == 'likelihood':
            v_gamble = prelec(q['p'], pr['gamma']) * q['win']
            v_sure = q['sure']
            p_gamble = logistic(TAU * (v_gamble - v_sure))
            chose_gamble = rng.random() < p_gamble
            won = rng.random() < q['p']
            delta = (q['win'] if won else 0) if chose_gamble else q['sure']
            rows.append(dict(pid=i, construct=construct, money_before=money_before,
                             chose_known=np.nan, chose_risky=int(chose_gamble),
                             stated_p=q['p'], delta=delta))
            return

        elif construct == 'desperation':
            ev_gamble, ev_sure = q['p'] * q['win'], q['sure']
            scarcity = max(0.0, (pr['desp_thresh'] - money_before) / pr['desp_thresh'])
            p_gamble = logistic(TAU * (ev_gamble - ev_sure) + pr['desp_react'] * scarcity)
            chose_gamble = rng.random() < p_gamble
            won = rng.random() < q['p']
            delta = (q['win'] if won else 0) if chose_gamble else q['sure']
            rows.append(dict(pid=i, construct=construct, money_before=money_before,
                             chose_known=np.nan, chose_risky=int(chose_gamble),
                             stated_p=q['p'], delta=delta))
            return

data = pd.DataFrame()  # populated per-reps below


def fit_gamma(df):
    ps = df['stated_p'].values
    wins = np.array([lik_lookup[p][0] for p in ps])
    sures = np.array([lik_lookup[p][1] for p in ps])
    y = df['chose_risky'].values
    def negll(g):
        v = prelec(ps, g) * wins
        pg = np.clip(logistic(TAU * (v - sures)), 1e-6, 1 - 1e-6)
        return -np.sum(y * np.log(pg) + (1 - y) * np.log(1 - pg))
    return minimize_scalar(negll, bounds=(0.2, 1.5), method='bounded').x


def desp_slope(df):
    """Per-person logistic slope of chose_risky on money_before across ALL decisions.
    A more negative slope = takes more risk when poorer (greater scarcity reactivity)."""
    x = df['money_before'].values.astype(float)
    y = df['chose_risky'].values.astype(float)
    if y.std() == 0:
        return 0.0
    x = (x - x.mean()) / (x.std() + 1e-9)
    b0, b1 = 0.0, 0.0
    for _ in range(50):
        mu = logistic(b0 + b1 * x)
        g0, g1 = np.sum(y - mu), np.sum((y - mu) * x)
        w = mu * (1 - mu)
        h00, h11, h01 = -np.sum(w), -np.sum(w * x * x), -np.sum(w * x)
        det = h00 * h11 - h01 * h01
        if abs(det) < 1e-9:
            break
        b0 -= (h11 * g0 - h01 * g1) / det
        b1 -= (-h01 * g0 + h00 * g1) / det
    return b1


def corr(true_vals, rec, flip=False):
    t = true_vals.values
    r = rec.reindex(range(N)).values
    mask = ~np.isnan(r)
    rr = -r if flip else r
    return pearsonr(t[mask], rr[mask])[0]


def run(reps):
    data = simulate(reps)
    desp = data[data.construct == 'desperation']
    grad = desp.groupby(desp.groupby('pid').cumcount())['money_before'].mean()
    rec_amb = data[data.construct == 'ambiguity'].groupby('pid')['chose_known'].mean()
    rec_gam = data[data.construct == 'likelihood'].groupby('pid', group_keys=False).apply(fit_gamma)
    rec_des = data.dropna(subset=['chose_risky']).groupby('pid', group_keys=False).apply(desp_slope)
    n_dec = (data.construct == 'likelihood').sum() // N, (data.construct == 'ambiguity').sum() // N, (data.construct == 'desperation').sum() // N
    print(f"\n--- reps={reps}  (likelihood/ambiguity/desperation trials per person = "
          f"{n_dec[0]}/{n_dec[1]}/{n_dec[2]}) ---")
    print("  Desperation-anchor balances:", "  ".join(f"${v:,.0f}" for v in grad.values))
    print(f"  Ambiguity aversion             recovery r = {corr(true['amb_aversion'], rec_amb):.3f}")
    print(f"  Likelihood sensitivity (gamma) recovery r = {corr(true['gamma'], rec_gam):.3f}")
    print(f"  Desperation reactivity         recovery r = {corr(true['desp_react'], rec_des, flip=True):.3f}")


if __name__ == "__main__":
    print(f"Parameter recovery, N={N} synthetic participants. TAU={TAU}.")
    print("reps=1 is the shipped task; higher reps repeat each construct's trial ladder.")
    for reps in (1, 3, 6):
        run(reps)
    print("\nInterpretation guide: evaluation/README.md")
