const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const readinessPath = path.resolve(root, 'readiness.js');
const lifecyclePath = path.resolve(root, 'readiness-lifecycle.js');
const htmlPath = path.resolve(root, 'business-readiness.html');

let source = fs.readFileSync(readinessPath, 'utf8');
source = source.replace(/state\.locations='1';\s*rebuildFlow\(\);render\(\);\s*$/, '');
source += '\n' + fs.readFileSync(lifecyclePath, 'utf8');
source += `\n;globalThis.__lifecycleTestApi={state,estimate,operatingRequirements,supportAssessment,resultComparisonCard,SNAPNEST_LIFECYCLE,SNAPNEST_OPERATING_SERVICES};`;

const context = {
  console,
  URLSearchParams,
  Blob,
  location: { protocol: 'https:', hostname: 'snapnestsolutions.com' },
  fetch: async () => ({ ok: true, status: 200 }),
  setTimeout: () => 0,
  clearTimeout: () => {},
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'readiness-with-lifecycle.js' });
const api = context.__lifecycleTestApi;

function reset(overrides = {}) {
  Object.assign(api.state, {
    industry: '', stage: 'operating', customerFlow: 'mixed', digital: 'none',
    staff: '1', locations: '1', documents: {}, branchAnswers: {},
    name: '', business: '', phone: '', email: '', ...overrides,
  });
  api.state.activities = new Set(overrides.activities || []);
  api.state.problems = new Set(overrides.problems || []);
  api.state.selected = new Set(overrides.selected || []);
  api.state.branchAnswers = { ...(overrides.branchAnswers || {}) };
}

const items = (...ids) => ids.map(id => ({ id }));

test('standalone single-site POS has no required monthly charge', () => {
  reset({ customerFlow: 'counter', locations: '1' });
  const result = api.estimate(items('pos'));
  assert.equal(result.setup, 65000);
  assert.equal(result.requiredMonthly, 0);
  assert.equal(result.monthly, 0);
  assert.equal(result.firstYear, 65000);
  assert.equal(result.supportRequired, false);
});

test('optional support never becomes a condition of ownership or operation', () => {
  reset({ customerFlow: 'orders', staff: '16+', locations: '4+', branchAnswers: { delivery: 'complex' } });
  const result = api.estimate(items('orders','staff','payments','delivery','automation'));
  assert.equal(result.supportRequired, false);
  assert.ok(result.supportMonthly > 0);
  assert.ok(['recommended','priority'].includes(result.supportRecommendation));
  assert.equal(result.firstYear, result.setup + result.requiredMonthly * 12);
  assert.ok(result.firstYearWithSupport > result.firstYear);
});

test('hosted systems carry operating cost without calling it support', () => {
  reset();
  const website = api.estimate(items('website'));
  const booking = api.estimate(items('booking'));
  assert.equal(website.requiredMonthly, 2500);
  assert.equal(booking.requiredMonthly, 5000);
  assert.equal(website.supportRequired, false);
  assert.equal(booking.supportRequired, false);
});

test('shared cloud infrastructure is deduplicated across modules', () => {
  reset();
  const one = api.estimate(items('booking'));
  const many = api.estimate(items('website','booking','crm','staff','orders'));
  assert.equal(one.requiredMonthly, 5000);
  assert.equal(many.requiredMonthly, 5000);
  assert.ok(many.setup > one.setup);
});

test('multi-location local-first systems add cloud sync only when objectively needed', () => {
  reset({ locations: '1' });
  const singleSite = api.estimate(items('pos','inventory'));
  reset({ locations: '2-3' });
  const multiSite = api.estimate(items('pos','inventory'));
  assert.equal(singleSite.requiredMonthly, 0);
  assert.equal(multiSite.requiredMonthly, 5000);
});

test('payment and AI provider usage is disclosed without being invented as fixed support', () => {
  reset();
  const result = api.estimate(items('payments','ai'));
  assert.ok(result.variableFees.includes('payment-provider fees'));
  assert.ok(result.variableFees.includes('AI usage fees'));
  assert.equal(result.supportRequired, false);
});

test('result card stays compact and separates the four cost concepts', () => {
  reset({ customerFlow: 'counter' });
  const estimate = api.estimate(items('pos'));
  const card = api.resultComparisonCard('SnapNest recommendation', items('pos'), estimate, true);
  assert.match(card, /One-time setup/);
  assert.match(card, /Required operating cost/);
  assert.match(card, /Optional SnapNest Care/);
  assert.match(card, /First-year required budget/);
  assert.doesNotMatch(card, /Preliminary recurring support/);
});

test('production page loads lifecycle logic after the recommendation engine', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const baseIndex = html.indexOf('/readiness.js');
  const lifecycleIndex = html.indexOf('/readiness-lifecycle.js');
  assert.ok(baseIndex >= 0);
  assert.ok(lifecycleIndex > baseIndex);
  assert.match(html, /required operating costs and optional support kept separate/i);
});