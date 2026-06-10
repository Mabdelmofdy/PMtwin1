/**
 * Matching simulation test: run all four models on seeded data and assert minimum coverage.
 * Uses small seed (--small) for fast runs. Ensures one-way, two-way barter, consortium, and circular all produce matches.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const POC_ROOT = path.join(__dirname, '..', '..');
const SIM_DIR = path.join(POC_ROOT, 'data', 'simulation');

beforeAll(() => {
    const seederPath = path.join(POC_ROOT, 'scripts', 'simulation', 'seed-simulation-data.js');
    spawnSync(process.execPath, [seederPath, '--controlled'], { cwd: POC_ROOT, stdio: 'pipe' });
});

describe('Matching simulation', () => {
    it('runs all four models and produces a report with minimum matches', async () => {
        const { runSimulation } = require(path.join(POC_ROOT, 'scripts', 'simulation', 'run-matching-simulation.js'));
        const report = await runSimulation({
            simulationDir: SIM_DIR,
            oneWayLimit: 5,
            barterLimit: 3
        });
        expect(report.totalPostsAnalyzed).toBe(40);
        expect(report.totalNeeds).toBe(22);
        expect(report.totalOffers).toBe(18);

        expect(report.oneWayMatches).toBeGreaterThanOrEqual(1);
        expect(report.twoWayMatches).toBeGreaterThanOrEqual(1);
        expect(report.groupFormations).toBeGreaterThanOrEqual(1);
        expect(report.circularExchanges).toBeGreaterThanOrEqual(1);

        expect(report.totalMatchesFound).toBe(report.oneWayMatches + report.twoWayMatches + report.groupFormations + report.circularExchanges);
    }, 30000);

    it('writes report files to data/simulation', async () => {
        const { runSimulation, writeReport } = require(path.join(POC_ROOT, 'scripts', 'simulation', 'run-matching-simulation.js'));
        const report = await runSimulation({ simulationDir: SIM_DIR, oneWayLimit: 2, barterLimit: 1 });
        writeReport(report, { outDir: SIM_DIR });
        expect(fs.existsSync(path.join(SIM_DIR, 'matching-report.json'))).toBe(true);
        expect(fs.existsSync(path.join(SIM_DIR, 'matching-report.txt'))).toBe(true);
    }, 20000);
});
