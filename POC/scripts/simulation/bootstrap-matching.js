/**
 * Bootstrap matching pipeline for Node (simulation/runner).
 * Sets CONFIG, dataService, patches fetch for skill-canonical, loads matching scripts in order.
 * Use after createMockDataService() and before calling matchingService.findMatchesForPost etc.
 */

const path = require('path');
const { createMockDataService, loadSkillCanonicalForNode } = require('./mock-data-service.js');

const POC_ROOT = path.join(__dirname, '..', '..');
const SRC_MATCHING = path.join(POC_ROOT, 'src', 'services', 'matching');

function setupGlobalConfig(options = {}) {
    const debug = options.debug === true || process.env.MATCHING_DEBUG === '1';
    global.CONFIG = global.CONFIG || {};
    global.CONFIG.BASE_PATH = options.basePath || '';
    global.CONFIG.MATCHING = {
        LEGACY_PERSON_OPPORTUNITY_ENABLED: false,
        MIN_THRESHOLD: 0.70,
        AUTO_NOTIFY_THRESHOLD: 0.80,
        CANDIDATE_MAX: 200,
        POST_TO_POST_THRESHOLD: 0.50,
        HARD_CONSTRAINTS_ENABLED: true,
        STRICT_ROLE_REQUIRED: true,
        STRICT_ROLE_EXACT_MATCH: true,
        MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
        MIN_SKILL_SCORE_FOR_MATCH: 0.50,
        DEBUG: debug,
        WEIGHTS: {
            SKILL_MATCH: 0.40,
            ATTRIBUTE_OVERLAP: 0.40,
            EXCHANGE_COMPATIBILITY: 0,
            VALUE_COMPATIBILITY: 0,
            BUDGET_FIT: 0.30,
            TIMELINE: 0.15,
            LOCATION: 0.10,
            REPUTATION: 0.05
        },
        LABEL_THRESHOLDS: { MATCH: 1, PARTIAL: 0.25 }
    };
}

function patchFetchForSkillCanonical(skillCanonical) {
    const data = skillCanonical;
    const originalFetch = global.fetch;
    global.fetch = function (url) {
        const u = typeof url === 'string' ? url : (url && url.url) || '';
        if (u.includes('skill-canonical.json') || u.endsWith('skill-canonical.json')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(data)
            });
        }
        if (originalFetch) return originalFetch.apply(this, arguments);
        return Promise.reject(new Error('fetch not available for ' + u));
    };
}

/**
 * Load matching scripts in dependency order and attach to global.
 * In Node, scripts only set module.exports, so we assign to global (and window) for cross-module lookups.
 */
function loadMatchingScripts() {
    const postPreprocessor = require(path.join(SRC_MATCHING, 'post-preprocessor.js'));
    const semanticProfile = require(path.join(SRC_MATCHING, 'semantic-profile.js'));
    const hardConstraints = require(path.join(SRC_MATCHING, 'hard-constraints.js'));
    const candidateGenerator = require(path.join(SRC_MATCHING, 'candidate-generator.js'));
    const postToPostScoring = require(path.join(SRC_MATCHING, 'post-to-post-scoring.js'));
    const matchingModels = require(path.join(SRC_MATCHING, 'matching-models.js'));
    const matchingService = require(path.join(SRC_MATCHING, 'matching-service.js'));
    global.postPreprocessor = postPreprocessor;
    global.semanticProfile = semanticProfile;
    global.hardConstraints = hardConstraints;
    global.candidateGenerator = candidateGenerator;
    global.postToPostScoring = postToPostScoring;
    global.matchingModels = matchingModels;
    global.matchingService = matchingService;
    if (global.window) {
        global.window.postPreprocessor = postPreprocessor;
        global.window.semanticProfile = semanticProfile;
        global.window.hardConstraints = hardConstraints;
        global.window.candidateGenerator = candidateGenerator;
        global.window.postToPostScoring = postToPostScoring;
        global.window.matchingModels = matchingModels;
        global.window.matchingService = matchingService;
    }
}

/**
 * Full bootstrap: config, mock data service, fetch patch, load scripts.
 * @param {Object} options - { debug, simulationDir }
 * @returns {{ matchingService, matchingModels, dataService }}
 */
function bootstrap(options = {}) {
    setupGlobalConfig(options);
    const dataService = createMockDataService(options);
    global.dataService = dataService;
    global.window = global.window || global;
    const skillCanonical = loadSkillCanonicalForNode();
    patchFetchForSkillCanonical(skillCanonical);
    loadMatchingScripts();
    return {
        matchingService: global.matchingService,
        matchingModels: global.matchingModels,
        dataService
    };
}

module.exports = {
    bootstrap,
    setupGlobalConfig,
    patchFetchForSkillCanonical,
    loadMatchingScripts
};
