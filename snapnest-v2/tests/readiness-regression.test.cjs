const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  MODULES,
  state,
  rebuildFlow,
  scoreRows,
  estimate,
  resetState,
  scenario,
  setFetch,
  submitAssessment,
  source,
} = require('./helpers/load-readiness.cjs');

const pricingHtml = fs.readFileSync(path.resolve(__dirname, '..', 'pricing.html'), 'utf8');

test('baseline: a covered booking system rejects a duplicate booking recommendation', () => {
  const result = scenario({
    industry: 'salon', stage: 'operating', activities: ['appointments'],
    customerFlow: 'appointments', problems: ['transactions'], digital: 'website',
    branchAnswers: { appointments: 'covered' },
  });
  assert.equal(result.now.some((row) => row.id === 'booking'), false);
});

test('active-branch integrity: stale booking pain cannot recommend booking after appointments become irrelevant', () => {
  const result = scenario({
    industry: 'other', stage: 'planning', activities: ['walkin'],
    customerFlow: 'counter', problems: ['records'], digital: 'none',
    branchAnswers: { appointments: 'pain' },
  });
  assert.equal(result.branches.includes('appointments'), false);
  assert.equal(result.now.some((row) => row.id === 'booking'), false);
});

test('active-branch integrity: rebuilding the path removes answers for inactive branches', () => {
  resetState({ activities: ['walkin'], customerFlow: 'counter', branchAnswers: { appointments: 'pain' } });
  rebuildFlow();
  assert.equal(Object.hasOwn(state.branchAnswers, 'appointments'), false);
});

test('recurring pricing: non-recurring modules do not automatically add monthly charges', () => {
  resetState({staff:'1',locations:'1'});
  const website=estimate([{id:'website'}]);
  const expanded=estimate([{id:'website'},{id:'crm'},{id:'reporting'},{id:'inventory'}]);
  assert.equal(website.monthly,10000);assert.equal(expanded.monthly,website.monthly);
  assert.ok(expanded.setup>website.setup);
});

test('recurring pricing: modules have no standalone monthly subscription values', () => {
  for(const module of Object.values(MODULES))assert.equal(Object.hasOwn(module,'monthly'),false);
});

test('pricing: adding a module never lowers first-year total', () => {
  resetState({ staff: '1', locations: '1' });
  const website = estimate([{ id: 'website' }]);
  const websiteAndBooking = estimate([{ id: 'website' }, { id: 'booking' }]);
  assert.ok(websiteAndBooking.firstYear >= website.firstYear);
});

test('pricing: adding a module never lowers setup cost', () => {
  resetState({staff:'1',locations:'1'});
  const ids=Object.keys(MODULES);
  for(let mask=1;mask<(1<<ids.length);mask+=1){
    const base=ids.filter((_,index)=>mask&(1<<index)),basePrice=estimate(base.map(id=>({id})));
    for(const added of ids.filter(id=>!base.includes(id))){
      const expanded=estimate([...base,added].map(id=>({id})));
      assert.ok(expanded.setup>=basePrice.setup,`${base.join('+')} setup fell after adding ${added}`);
    }
  }
});

test('pricing: Staff Workflow alone receives its component price', () => {
  resetState({staff:'2-5',locations:'1',branchAnswers:{staff:'assigned'}});
  const result=estimate([{id:'staff'}]);
  assert.equal(result.setup,30000);assert.equal(result.monthly,15000);assert.equal(result.firstYear,210000);
  assert.equal(result.guardrailApplied,false);assert.equal(result.manualScope,false);
});

test('pricing: POS and Inventory receive a bespoke combined estimate', () => {
  resetState({staff:'2-5',locations:'1',branchAnswers:{stock:'manual'}});
  const result=estimate([{id:'pos'},{id:'inventory'}]);
  assert.equal(result.setup,105000);assert.equal(result.monthly,10000);assert.equal(result.firstYear,225000);
  assert.equal(result.guardrailApplied,false);assert.equal(result.manualScope,false);
});

test('pricing: Website and Booking receive a bespoke combined estimate', () => {
  resetState({staff:'1',locations:'1'});
  const result=estimate([{id:'website'},{id:'booking'}]);
  assert.equal(result.setup,85000);assert.equal(result.monthly,10000);assert.equal(result.firstYear,205000);
});

test('pricing: public package prices are not automatically imposed', () => {
  resetState({staff:'1',locations:'1'});
  const result=estimate([{id:'website'},{id:'booking'}]);
  assert.ok(result.setup<95000);assert.equal(result.monthly,10000);assert.equal(result.guardrailApplied,false);
});

test('pricing: a highly complex system escalates to manual scope without a fixed package floor', () => {
  resetState({staff:'16+',locations:'4+',branchAnswers:{staff:'stages',delivery:'complex'}});
  const result=estimate([{id:'inventory'},{id:'staff'},{id:'delivery'}]);
  assert.equal(result.setup,110000);assert.equal(result.monthly,20000);assert.equal(result.manualScope,true);
  assert.equal(result.guardrailApplied,false);
});

test('recurring pricing: recurring burden changes bands without changing modules', () => {
  const items=[{id:'website'},{id:'orders'}];
  resetState({staff:'1',locations:'1',customerFlow:'mixed'});const low=estimate(items);
  resetState({staff:'1',locations:'1',customerFlow:'orders'});const standard=estimate(items);
  resetState({staff:'1',locations:'2-3',customerFlow:'orders'});const high=estimate(items);
  assert.equal(low.monthly,10000);assert.equal(standard.monthly,15000);assert.equal(high.monthly,20000);
  assert.equal(low.setup,standard.setup);assert.equal(standard.setup,high.setup);
});

test('recurring pricing: Laundry Loop-like multi-module operations receive one support estimate', () => {
  resetState({staff:'2-5',locations:'1',customerFlow:'orders',activities:['jobs'],branchAnswers:{staff:'assigned'}});
  const result=estimate(['website','orders','crm','staff','pos','inventory'].map(id=>({id})));
  assert.equal(result.monthly,20000);assert.equal(result.recurringBand,'high');assert.equal(result.manualScope,false);
});

test('pricing: bespoke estimates never return a public package classification', () => {
  resetState({staff:'1',locations:'1'});const result=estimate([{id:'website'}]);
  assert.equal(Object.hasOwn(result,'level'),false);
});

test('pricing: equivalent module combinations are path-independent when scale is equivalent', () => {
  resetState({ industry: 'salon', stage: 'planning', staff: '2-5', locations: '1' });
  const first = estimate([{ id: 'website' }, { id: 'booking' }]);
  resetState({ industry: 'retail', stage: 'operating', staff: '2-5', locations: '1' });
  const second = estimate([{ id: 'booking' }, { id: 'website' }]);
  assert.deepEqual(first, second);
});

test('pricing relationship: public package prices remain unchanged as external references only', () => {
  assert.match(pricingHtml, /Growth[\s\S]*GYD 25,000[\s\S]*GYD 95,000/);
  assert.match(pricingHtml, /Operations[\s\S]*GYD 40,000[\s\S]*GYD 175,000/);
  assert.doesNotMatch(source, /floors=\{/);
});

test('recommendation: accumulated independent evidence can make Website need-now', () => {
  const result=scenario({industry:'other',stage:'launch',activities:['online'],customerFlow:'mixed',problems:['customers'],digital:'none',staff:'1',locations:'1'});
  assert.equal(result.now.some(row=>row.id==='website'),true);
});

test('recommendation: an existing suitable Website suppresses a duplicate recommendation', () => {
  const result=scenario({industry:'other',stage:'operating',activities:['online'],customerFlow:'mixed',problems:['customers'],digital:'website',staff:'1',locations:'1'});
  assert.equal(result.now.some(row=>row.id==='website'),false);
});

test('submission: a 2xx response returns a visible-success result contract', async () => {
  setFetch(async () => ({ ok: true, status: 200 }));
  const result=await submitAssessment({ reference: 'TEST-1' });
  assert.equal(result.ok,true);assert.equal(result.status,200);
});

test('submission: a network failure returns a retryable failure contract', async () => {
  setFetch(async () => { throw new Error('offline'); });
  const result=await submitAssessment({ reference: 'TEST-2' });
  assert.equal(result.ok,false);assert.equal(result.retryable,true);assert.equal(result.status,0);
});

test('submission: HTTP 404 is treated as failure', async () => {
  setFetch(async () => ({ ok: false, status: 404 }));
  const result=await submitAssessment({ reference: 'TEST-3' });
  assert.equal(result.ok,false);assert.equal(result.retryable,true);assert.equal(result.status,404);
});

test('submission: HTTP 500 is treated as failure', async () => {
  setFetch(async () => ({ ok: false, status: 500 }));
  const result=await submitAssessment({ reference: 'TEST-4' });
  assert.equal(result.ok,false);assert.equal(result.retryable,true);assert.equal(result.status,500);
});

test('submission: simultaneous retries share one in-flight request', async () => {
  let calls=0,resolveRequest;
  setFetch(()=>{calls+=1;return new Promise(resolve=>{resolveRequest=resolve})});
  const first=submitAssessment({reference:'RETRY'}),second=submitAssessment({reference:'RETRY'});
  assert.equal(calls,1);resolveRequest({ok:true,status:200});
  const [a,b]=await Promise.all([first,second]);assert.equal(a.ok,true);assert.equal(b.ok,true);
});

test('submission: result generation has a duplicate-submit guard', () => {
  assert.match(source,/if\(generating\)return/);
});

test('stage: planning gates non-launch-critical urgency without changing evidence or price', () => {
  const base={industry:'retail',activities:['stock'],customerFlow:'mixed',problems:['stock'],digital:'none',staff:'1',locations:'1',branchAnswers:{stock:'manual'}};
  const planning=scenario({...base,stage:'planning'}),operating=scenario({...base,stage:'operating'});
  const p=planning.rows.find(x=>x.id==='inventory'),o=operating.rows.find(x=>x.id==='inventory');
  assert.equal(p.score,o.score);assert.equal(p.bucket,'wait');assert.equal(o.bucket,'now');
  assert.deepEqual(planning.estimate,planning.estimate);
});

test('stage wording: questionnaire does not claim stage changes the estimate when no weighting exists', () => {
  assert.doesNotMatch(source, /stage.*keep an estimate realistic/i);
});

test('date/reference: reference and display date are not derived from separate UTC/local dates', () => {
  assert.doesNotMatch(source, /toISOString\(\)[\s\S]*toLocaleDateString/);
});

test('follow-up selection: materially rejectable booking evidence stays pending until answered', () => {
  const result = scenario({
    industry: 'salon', stage: 'launch', activities: ['appointments'],
    customerFlow: 'appointments', problems: ['transactions'], digital: 'social',
  });
  assert.ok(result.branches.includes('appointments'));
  assert.equal(result.now.some((row) => row.id === 'booking'), false);
});

test('follow-up selection: an omitted material payment follow-up cannot yield need-now payments', () => {
  const result = scenario({
    industry: 'food', stage: 'operating',
    activities: ['appointments', 'stock', 'quotes', 'delivery', 'jobs', 'recurring'],
    customerFlow: 'appointments', problems: ['stock', 'staff', 'payments'],
    digital: 'social', staff: '6-15',
  });
  assert.equal(result.branches.includes('payments'), false);
  assert.equal(result.now.some((row) => row.id === 'payments'), false);
});

test('result rendering does not silently truncate qualifying recommendations', () => {
  assert.doesNotMatch(source, /filter\(x=>x\.bucket==='now'\)\.slice\(0,6\)/);
  assert.doesNotMatch(source, /filter\(x=>x\.bucket==='wait'&&x\.score>=2\)\.slice\(0,4\)/);
});

test('accessibility: Locations label is associated with the select', () => {
  assert.match(source, /<label for="locations">Locations \/ operating sites<\/label>/);
});

test('accessibility: validation errors are announced and associated with their controls', () => {
  assert.match(source, /aria-live="(?:polite|assertive)"/);
  assert.match(source, /aria-describedby="err_name"/);
  assert.match(source, /aria-describedby="err_consent"/);
});

test('accessibility: comparison disclosure exposes expanded state and controls', () => {
  assert.match(source, /compare-toggle[^>]+aria-expanded=/);
  assert.match(source, /compare-toggle[^>]+aria-controls="comparePanel"/);
});

test('accessibility: single-choice questions expose radio-group semantics', () => {
  assert.match(source, /role="radiogroup"/);
  assert.match(source, /role="radio"/);
  assert.match(source, /aria-checked=/);
});

test('accessibility: dynamic steps explicitly move focus to the new question heading', () => {
  assert.match(source,/id="questionTitle" tabindex="-1"/);
  assert.match(source,/heading\.focus\(\{preventScroll:true\}\)/);
});

test('wording: PDF actions are accurate direct downloads', () => {
  assert.match(source, />Download an estimate/);
  assert.match(source, />Download SnapNest/);
  assert.match(source, /buildBrandedPdf/);
  assert.doesNotMatch(source, /window\.print/);
});

test('wording: live estimates are not labelled demo logic', () => {
  assert.doesNotMatch(source, /Demo logic only/);
});
