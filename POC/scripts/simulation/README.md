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

## Quick start

```bash
# From POC directory

# 1. Seed small dataset (fast, for tests and quick runs)
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

Tests seed the small dataset and assert minimum matches for all four models (one-way, two-way barter, consortium, circular).

## Debug logging

Set `CONFIG.MATCHING.DEBUG = true` or `MATCHING_DEBUG=1` to enable logs for:

- Candidate generation (need id, pool size, filtered count)
- Score calculation (pairs near threshold 0.50)
- Threshold filtering (one-way pairs just below threshold)
- Cycle detection (circular exchange counts and cycle lengths)
