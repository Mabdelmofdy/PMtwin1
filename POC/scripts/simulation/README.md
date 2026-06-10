# Matching simulation

### What this page is

How to run **matching simulations** with isolated data under `POC/data/simulation/`.

### Why it matters

You can stress-test matching without touching demo users in the main app.

### What happens next

Read reports in the simulation output folder and compare with [MATCHING_FLOW.md](../../docs/simulation/MATCHING_FLOW.md).

---

Tools to validate the matching system under realistic conditions without changing the core architecture.

**Data isolation:** All simulation data is written to and read from `POC/data/simulation/` only. The live platform (dashboard, opportunities, users) loads from `POC/data/*.json` (and localStorage). Simulation data never appears on the platform; the app never reads from `data/simulation/`.

## Quick start (controlled — recommended for hard-constraint testing)

```bash
# From POC directory

# 1. Wipe + seed exactly 40 posts (scenarios A–G + exchange models H) to simulation + browser JSON
npm run seed:controlled
# or: node scripts/simulation/seed-simulation-data.js --controlled

# 2. Run matching simulation and write report
npm run sim:controlled

# 3. Browser: reset localStorage after seed version bump (DevTools console)
#    resetAppData()
```

The controlled dataset includes 40 opportunities (22 needs, 18 offers): scenarios A–G for matching hard constraints, plus 15 non-cash exchange-model posts (`026`–`040`) covering all 13 canonical collaboration sub-models (barter, equity, profit-sharing, hybrid). It also writes `POC/data/opportunities.json`, `seed-controlled-users.json`, **`demo-companies.json`** (6 B2B company accounts owning 11 opportunities), and clears demo opportunity/deal/contract merges. Run `npm run seed:e2e` after seeding for full lifecycle data (applications, deals, notifications).

## Quick start (random small dataset)

```bash
# 1. Seed small dataset (fast, legacy random data)
node scripts/simulation/seed-simulation-data.js --small

# 2. Run simulation and write report
node scripts/simulation/run-matching-simulation.js

# 3. Optional: with debug logging and graph output
MATCHING_DEBUG=1 node scripts/simulation/run-matching-simulation.js --verbose --visualize
```

## Full dataset

```bash
# Seed 30–50 companies, 150–200 users, 200–400 opportunities (no --small)
node scripts/simulation/seed-simulation-data.js

# Run simulation (default caps one-way at 10 needs for speed; use full run in script if needed)
node scripts/simulation/run-matching-simulation.js
```

## Output

- `POC/data/simulation/companies.json`, `users.json`, `opportunities.json` – seeded data
- `POC/data/simulation/matching-report.json` – full report with counts and sample details
- `POC/data/simulation/matching-report.txt` – human-readable summary
- With `--visualize`: `match-graph.mmd` and `match-graph.dot` for graph visualization

## Tests

```bash
npm run test
# or
npx vitest run tests/simulation/matching-simulation.test.js
```

Tests seed the controlled 25-post dataset and assert minimum matches for all four models (one-way, two-way barter, consortium, circular).

## Debug logging

Set `CONFIG.MATCHING.DEBUG = true` or `MATCHING_DEBUG=1` to enable logs for:

- Candidate generation (need id, pool size, filtered count)
- Score calculation (pairs near threshold 0.50)
- Threshold filtering (one-way pairs just below threshold)
- Cycle detection (circular exchange counts and cycle lengths)
