const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const readinessPath = path.resolve(__dirname, '..', '..', 'readiness.js');
let source = fs.readFileSync(readinessPath, 'utf8');
source = source.replace(/state\.locations='1';\s*rebuildFlow\(\);render\(\);\s*$/, '');
source += `\n;globalThis.__readinessTestApi={
  MODULES,state,rebuildFlow,branchPriority,chooseBranches,capabilityEvidence,
  scoreRows,recurringSupport,requiresManualScope,estimate,submitAssessment,
  recommendationExplanation,resultComparisonCard,buildBrandedPdf
};`;

let fetchImpl = async () => ({ ok: true, status: 200 });
const context = {
  console,
  URLSearchParams,
  Blob,
  location: { protocol: 'https:', hostname: 'snapnestsolutions.com' },
  fetch: (...args) => fetchImpl(...args),
  setTimeout: () => 0,
  clearTimeout: () => {},
};
vm.createContext(context);
vm.runInContext(source, context, { filename: readinessPath });

const api = context.__readinessTestApi;

function resetState(overrides = {}) {
  Object.assign(api.state, {
    industry: '',
    stage: '',
    customerFlow: '',
    digital: '',
    staff: '1',
    locations: '1',
    branchAnswers: {},
    name: '',
    business: '',
    phone: '',
    email: '',
    ...overrides,
  });
  api.state.activities = new Set(overrides.activities || []);
  api.state.problems = new Set(overrides.problems || []);
  api.state.selected = new Set(overrides.selected || []);
  api.state.branchAnswers = { ...(overrides.branchAnswers || {}) };
  return api.state;
}

function scenario(overrides = {}) {
  resetState(overrides);
  const rows = api.scoreRows();
  const now = rows.filter((row) => row.bucket === 'now');
  const wait = rows.filter((row) => row.bucket === 'wait' && row.score >= 2);
  return { rows, now, wait, branches: api.chooseBranches(), estimate: api.estimate(now) };
}

function setFetch(implementation) {
  fetchImpl = implementation;
}

module.exports = { ...api, resetState, scenario, setFetch, source, readinessPath };
