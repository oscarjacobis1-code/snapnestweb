const MODULES={
 website:{name:'Website & Online Presence',setup:55000,monthly:15000},
 booking:{name:'Booking & Scheduling',setup:30000,monthly:5000},
 orders:{name:'Online Orders',setup:35000,monthly:6000},
 inventory:{name:'Inventory & Stock Tracking',setup:40000,monthly:6000},
 crm:{name:'Customer Records',setup:25000,monthly:4000},
 staff:{name:'Staff / Job Workflow',setup:30000,monthly:5000},
 pos:{name:'POS / Counter Sales',setup:65000,monthly:10000},
 invoicing:{name:'Invoices & Quotations',setup:28000,monthly:4000},
 payments:{name:'Digital Payments',setup:30000,monthly:5000},
 delivery:{name:'Delivery / Dispatch Workflow',setup:40000,monthly:6000},
 automation:{name:'Business Automation',setup:45000,monthly:7000},
 reporting:{name:'Owner Reports / Analytics',setup:25000,monthly:4000},
 ai:{name:'AI Customer Assistant',setup:35000,monthly:6000}
};

const state={
 industry:'',stage:'',activities:new Set(),customerFlow:'',problems:new Set(),
 digital:'',staff:'',locations:'',selected:new Set(),branchAnswers:{},
 name:'',business:'',phone:'',email:''
};

const BASE=[
 {id:'industry',title:'What kind of business is this mainly?',sub:'Choose the closest main type. The activities you select next tell us what else the business does.',choices:[
  ['retail','Shop / retail / wholesale'],['food','Restaurant / café / catering'],['salon','Salon / barber / beauty'],
  ['contractor','Construction / contractor / trades'],['professional','Professional services'],['logistics','Transport / courier / logistics'],
  ['agriculture','Agriculture / farming / agro-processing'],['tourism','Accommodation / tourism / guesthouse'],['manufacturing','Manufacturing / production'],
  ['property','Property / rental / real estate'],['creative','Creative / media / events'],['health','Health / wellness / care'],
  ['education','Education / training / tutoring'],['other','Other / mixed business']
 ]},
 {id:'stage',title:'Where is the business right now?',sub:'This helps us keep an estimate realistic for the stage you are actually at.',choices:[
  ['planning','Planning / business plan'],['financing','Preparing a financing application'],['launch','Ready to launch'],['operating','Already operating']
 ]},
 {id:'activities',multi:true,title:'What does the business actually do?',sub:'Choose the real activities. Selecting an activity only opens a possibility — it does not automatically add software.',choices:[
  ['appointments','Take appointments / reservations'],['sell_products','Sell physical products'],['walkin','Serve walk-in / counter customers'],
  ['orders','Take orders'],['quotes','Send quotations / invoices'],['delivery','Deliver goods or services'],
  ['stock','Manage stock / materials / ingredients'],['jobs','Assign jobs / tasks'],['rentals','Rent rooms / property / equipment'],
  ['recurring','Collect recurring payments'],['online','Serve customers online / remotely'],['production','Make / prepare products']
 ]},
 {id:'customerFlow',title:'How do customers mainly buy from or work with you?',sub:'Choose the closest main pattern. This helps us identify the workflow that cannot afford to break.',choices:[
  ['appointments','They book a time'],['orders','They place an order'],['quotes','They ask for a price / quotation first'],
  ['counter','They mostly walk in and pay at a counter'],['project','A job or project has to be managed'],['mixed','It is a mix of these']
 ]},
 {id:'problems',multi:true,max:3,title:'What are the biggest problems you want technology to solve?',sub:'Choose up to three. We use problems to set priority, not to automatically sell you a product.',choices:[
  ['customers','Get more customers'],['missed','Stop missing enquiries / follow-ups'],['transactions','Make bookings or orders easier'],
  ['records','Keep better records'],['stock','Reduce stock / material problems'],['staff','Manage staff / jobs better'],
  ['visibility','Know how the business is performing'],['paperwork','Reduce repetitive admin / paperwork'],
  ['payments','Make it easier to get paid'],['delivery','Organise delivery better']
 ]},
 {id:'digital',title:'What already works well today?',sub:'We should not replace something just because SnapNest can build it.',choices:[
  ['none','Nothing reliable yet'],['social','Mostly social media / WhatsApp'],['website','A website already works well'],
  ['systems','A website and business systems already work well']
 ]},
 {id:'scale',custom:'scale',title:'How large is the operation?',sub:'Scale can change permissions, reporting and support — but size alone does not decide what you need.'},
 {id:'selected',multi:true,optional:true,title:'Is there anything you already know you want?',sub:'Optional. Pick what you have in mind, or choose “I’m not sure — recommend it for me.” Your choices do not control SnapNest’s recommendation.',choices:[
  ['unsure','I’m not sure — recommend it for me'],...Object.entries(MODULES).map(([k,v])=>[k,v.name])
 ]}
];

const BRANCHES={
 stock:{
  title:'You mentioned products, stock or materials. How important is stock control day to day?',
  sub:'One quick check helps us tell the difference between a few casual items and stock that really needs a system.',
  choices:[['light','Very light — only a few items and stock-outs are not a real problem'],['manual','Important, but we track it manually / by memory'],['complex','Important — many items, materials or frequent stock problems'],['covered','A stock system already works well']]
 },
 appointments:{
  title:'How are appointments or reservations handled now?',
  sub:'This tells us whether booking software would fix a real gap or just duplicate something that already works.',
  choices:[['manual','Mostly WhatsApp, calls or a notebook'],['simple','A basic calendar works fine'],['pain','We get clashes, missed bookings or too much back-and-forth'],['covered','A booking system already works well']]
 },
 quotes:{
  title:'How important are quotations and invoices to getting paid?',
  sub:'We only need to know whether this is occasional paperwork or a core sales process.',
  choices:[['rare','Occasional only'],['regular','Regular — customers often need a quote or invoice'],['deposit','Regular — we also manage deposits / balances'],['covered','Our current invoicing system works well']]
 },
 delivery:{
  title:'How complicated is delivery or dispatch for the business?',
  sub:'Occasional use of an outside courier is very different from managing deliveries every day.',
  choices:[['rare','Occasional / handled by an outside courier'],['own','We regularly manage our own deliveries'],['complex','Several deliveries, drivers or status updates need coordination'],['covered','A delivery system already works well']]
 },
 rentals:{
  title:'How significant are rentals in the business?',
  sub:'One casual rental should not trigger the same recommendation as a real rental operation.',
  choices:[['small','One or two simple rentals'],['regular','Several renters / recurring rental payments'],['complex','Rentals need records, reminders, availability or maintenance tracking'],['covered','A rental system already works well']]
 },
 staff:{
  title:'How does work move between your staff?',
  sub:'This matters more than headcount. A small team with messy hand-offs can need more structure than a larger independent team.',
  choices:[['simple','People mostly work independently'],['whatsapp','Assignments are mostly verbal / WhatsApp'],['assigned','Jobs or orders are assigned and tracked'],['stages','Work passes through stages / approvals'],['covered','A staff workflow system already works well']]
 },
 payments:{
  title:'What is the main issue with getting paid?',
  sub:'This helps us avoid recommending payment tools where cash or bank transfer already works perfectly well.',
  choices:[['fine','Current payment methods work fine'],['remote','Customers need an easier remote / digital way to pay'],['deposit','We need to track deposits and balances'],['recurring','We collect recurring payments'],['counter','Most payments happen at a counter']]
 }
};

let flow=[],index=0;

function money(n){return 'GYD '+Math.round(n).toLocaleString('en-US')}
function labelIndustry(v){return ({retail:'retail',food:'food / hospitality',salon:'salon / beauty',contractor:'contractor / trades',professional:'professional services',logistics:'logistics',agriculture:'agriculture / agro-processing',tourism:'tourism / accommodation',manufacturing:'manufacturing',property:'property / rental',creative:'creative / events',health:'health / wellness',education:'education / training',other:'mixed'})[v]||v}
function rebuildFlow(){
 const branches=chooseBranches();
 flow=[...BASE.slice(0,7),...branches.map(id=>({id:'branch:'+id,branch:id,...BRANCHES[id]})),BASE[7],{id:'contact',contact:true,title:'Where should we send this estimate?',sub:'Your assessment answers and contact details are sent to SnapNest only after you confirm below, so we can follow up about your estimate.'}];
}
function branchPriority(){
 const scores={stock:0,appointments:0,quotes:0,delivery:0,rentals:0,staff:0,payments:0};
 const A=state.activities,P=state.problems;
 if(A.has('stock'))scores.stock+=6;if(A.has('sell_products'))scores.stock+=3;if(A.has('production'))scores.stock+=3;if(P.has('stock'))scores.stock+=5;
 if(A.has('appointments'))scores.appointments+=6;if(state.customerFlow==='appointments')scores.appointments+=6;if(P.has('transactions')&&state.customerFlow==='appointments')scores.appointments+=3;
 if(A.has('quotes'))scores.quotes+=6;if(state.customerFlow==='quotes')scores.quotes+=6;if(A.has('recurring'))scores.quotes+=1;
 if(A.has('delivery'))scores.delivery+=6;if(P.has('delivery'))scores.delivery+=5;
 if(A.has('rentals'))scores.rentals+=7;if(state.industry==='property')scores.rentals+=2;
 if(state.staff!=='1'){if(A.has('jobs'))scores.staff+=5;if(P.has('staff'))scores.staff+=5;if(state.customerFlow==='project')scores.staff+=4;scores.staff+=1}else{scores.staff=-999;}
 if(P.has('payments'))scores.payments+=6;if(A.has('recurring'))scores.payments+=4;
 return scores;
}
function chooseBranches(){
 const s=branchPriority();
 // Only ask a conditional question when it can materially change the estimate.
 // Hard cap: 3 conditional questions.
 return Object.entries(s).filter(([,v])=>v>=5).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
}
function getStep(){return flow[index]}
function selectedFor(s,v){
 if(s.id==='activities')return state.activities.has(v);
 if(s.id==='problems')return state.problems.has(v);
 if(s.id==='selected')return state.selected.has(v);
 if(s.id.startsWith('branch:'))return state.branchAnswers[s.branch]===v;
 return state[s.id]===v;
}
function render(){
 rebuildFlow();
 if(index>=flow.length)index=flow.length-1;
 const s=getStep(),box=document.getElementById('qbox');
 const pct=Math.round((index+1)/flow.length*100);
 document.getElementById('bar').style.width=pct+'%';
 document.getElementById('stepText').textContent=`Step ${index+1} of up to ${flow.length}`;
 let h=`<div class="q-top"><div class="q-step">Question ${index+1}</div><div class="q-progress"><span style="width:${pct}%"></span></div></div><h2>${s.title}</h2><p class="muted">${s.sub}</p>`;
 if(s.custom==='scale'){
  h+=`<div class="choice-grid">${[['1','Owner only'],['2-5','2–5 people'],['6-15','6–15 people'],['16+','16+ people']].map(([v,l])=>`<button type="button" class="choice ${state.staff===v?'selected':''}" aria-pressed="${state.staff===v}" onclick="pickScale('${v}')">${l}</button>`).join('')}</div>
      <div class="field"><label>Locations / operating sites</label><select id="locations" onchange="state.locations=this.value"><option value="1" ${state.locations==='1'?'selected':''}>1 location / site</option><option value="2-3" ${state.locations==='2-3'?'selected':''}>2–3 locations / sites</option><option value="4+" ${state.locations==='4+'?'selected':''}>4+ locations / sites</option></select></div>`;
 } else if(s.choices){
  h+=`<div class="choice-grid">${s.choices.map(([v,l])=>`<button type="button" class="choice ${selectedFor(s,v)?'selected':''}" aria-pressed="${selectedFor(s,v)}" onclick="choose('${s.id}','${v}',${s.multi?1:0})">${l}</button>`).join('')}</div>`;
 }
 if(s.id==='selected')h+=`<div class="branch-note"><strong>Important:</strong><span>These are your preferences only. SnapNest’s recommendation is calculated separately from how the business operates.</span></div>`;
 if(s.id.startsWith('branch:'))h+=`<div class="branch-note"><strong>Why this question appeared:</strong><span>One of your earlier answers made this area important enough that a quick follow-up could materially change the estimate.</span></div>`;
 if(s.contact){
  h+=`<div class="field" id="field_name"><label for="r_name">Your name <span class="required-mark">Required</span></label><input id="r_name" autocomplete="name" value="${esc(state.name)}"><div class="field-error" id="err_name"></div></div>
  <div class="field" id="field_business"><label for="r_business">Business name <span class="required-mark">Required</span></label><input id="r_business" autocomplete="organization" value="${esc(state.business)}"><div class="field-error" id="err_business"></div></div>
  <div class="field" id="field_phone"><label for="r_phone">WhatsApp / phone <span class="required-mark">Required</span></label><input id="r_phone" autocomplete="tel" value="${esc(state.phone)}" placeholder="+592"><div class="field-error" id="err_phone"></div></div>
  <div class="field" id="field_email"><label for="r_email">Email <span class="required-mark">Required</span></label><input id="r_email" type="email" autocomplete="email" value="${esc(state.email)}"><div class="field-error" id="err_email"></div></div>
  <div class="consent-field" id="field_consent"><label><input id="r_consent" type="checkbox"> <span>I agree to send my contact details and assessment answers to SnapNest so the team can follow up about this estimate.</span></label><div class="field-error" id="err_consent"></div></div>`;
 }
 h+=`<div class="tool-actions"><button type="button" class="btn" onclick="back()" ${index===0?'disabled':''}>Back</button><button type="button" class="btn btn-primary" onclick="next()">${s.contact?'Submit & See My Technology Estimate':'Continue'}</button></div>`;
 box.innerHTML=h;
}
function choose(id,v,multi){
 const s=getStep();
 if(id.startsWith('branch:')){state.branchAnswers[s.branch]=v;render();setTimeout(()=>next(true),80);return}
 if(multi){
  const set=id==='activities'?state.activities:id==='problems'?state.problems:state.selected;
  if(id==='selected'&&v==='unsure'){set.clear();set.add('unsure');render();return}
  if(id==='selected'&&set.has('unsure'))set.delete('unsure');
  if(set.has(v))set.delete(v);else{
   if(s.max&&set.size>=s.max){alert(`Choose up to ${s.max}.`);return}
   set.add(v);
  }
  render();return;
 }
 state[id]=v;render();setTimeout(()=>next(true),80);
}
function pickScale(v){state.staff=v;if(!state.locations)state.locations='1';render();setTimeout(()=>next(true),80)}
function back(){if(index>0){index--;render();scrollQ()}}
function scrollQ(){document.getElementById('qbox').scrollIntoView({behavior:'smooth',block:'start'})}
function next(auto=false){
 rebuildFlow();const s=getStep();
 if(s.contact){
  state.name=document.getElementById('r_name').value.trim();state.business=document.getElementById('r_business').value.trim();state.phone=document.getElementById('r_phone').value.trim();state.email=document.getElementById('r_email').value.trim();
  document.querySelectorAll('.field-error').forEach(x=>x.textContent='');document.querySelectorAll('.field.has-error').forEach(x=>x.classList.remove('has-error'));
  const errs=[];
  if(!state.name)errs.push(['name','Your name is required.']);
  if(!state.business)errs.push(['business','Your business name is required.']);
  if(!state.phone)errs.push(['phone','A phone or WhatsApp number is required.']);
  if(!state.email)errs.push(['email','An email address is required.']);
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email))errs.push(['email','Enter a valid email address.']);
  if(!document.getElementById('r_consent').checked)errs.push(['consent','Please confirm before sending your information to SnapNest.']);
  if(errs.length){errs.forEach(([id,m])=>{document.getElementById('field_'+id)?.classList.add('has-error');document.getElementById('err_'+id).textContent=m});document.getElementById('r_'+errs[0][0])?.focus();return}
  generate();return;
 }
 if(s.custom==='scale'){
  if(!state.staff){if(auto)return;alert('Choose the size of the operation.');return}
  state.locations=document.getElementById('locations')?.value||state.locations||'1';
 }else if(s.multi){
  const set=s.id==='activities'?state.activities:s.id==='problems'?state.problems:state.selected;
  if(!s.optional&&set.size===0){if(auto)return;alert('Choose at least one option.');return}
  if(s.id==='selected'&&set.size===0)set.add('unsure');
 }else if(s.id.startsWith('branch:')){
  if(!state.branchAnswers[s.branch]){if(auto)return;alert('Choose the closest answer.');return}
 }else if(!state[s.id]){if(auto)return;alert('Choose the option that best fits.');return}
 index++;rebuildFlow();render();scrollQ();
}

// ---------- deterministic capability engine ----------
function add(E,id,points,reason){E[id]??=[];E[id].push({points,reason})}
function capabilityEvidence(){
 const E={};Object.keys(MODULES).forEach(k=>E[k]=[]);
 const A=state.activities,P=state.problems,B=state.branchAnswers;

 // light industry context — never enough on its own to force a recommendation
 const priors={
  retail:{inventory:2,pos:2,orders:1},food:{orders:2,pos:2,inventory:2},salon:{booking:2,crm:1},
  contractor:{invoicing:2,staff:1},professional:{invoicing:2,crm:1},logistics:{delivery:2,staff:1},
  agriculture:{inventory:2},tourism:{booking:2,crm:1},manufacturing:{inventory:2,staff:1},
  property:{crm:1,payments:1},creative:{invoicing:1,crm:1},health:{booking:2},education:{booking:1,crm:1}
 };
 Object.entries(priors[state.industry]||{}).forEach(([id,p])=>add(E,id,p,`Commonly useful in ${labelIndustry(state.industry)} businesses`));

 // activities
 if(A.has('appointments'))add(E,'booking',4,'Appointments or reservations are part of the business');
 if(A.has('sell_products'))add(E,'inventory',2,'You sell physical products');
 if(A.has('walkin'))add(E,'pos',3,'Customers are served at a counter or location');
 if(A.has('orders'))add(E,'orders',4,'Taking orders is part of the business');
 if(A.has('quotes'))add(E,'invoicing',4,'Quotations or invoices are part of the sales process');
 if(A.has('delivery'))add(E,'delivery',3,'Delivery is part of the operation');
 if(A.has('stock'))add(E,'inventory',4,'Stock, materials or ingredients need to be managed');
 if(A.has('jobs'))add(E,'staff',3,'Jobs or tasks are assigned');
 if(A.has('rentals')){add(E,'crm',2,'Rental records need to stay organised');add(E,'payments',1,'Rentals may involve recurring collections')}
 if(A.has('recurring'))add(E,'payments',3,'Recurring payments are part of the business');
 if(A.has('online'))add(E,'website',3,'Customers are served online or remotely');
 if(A.has('production'))add(E,'inventory',3,'Production requires materials or inputs');

 // main customer flow
 if(state.customerFlow==='appointments')add(E,'booking',5,'Booking is the main customer workflow');
 if(state.customerFlow==='orders')add(E,'orders',5,'Orders are the main customer workflow');
 if(state.customerFlow==='quotes')add(E,'invoicing',5,'Quotations are the main customer workflow');
 if(state.customerFlow==='counter')add(E,'pos',5,'Counter transactions are the main customer workflow');
 if(state.customerFlow==='project')add(E,'staff',4,'Jobs or projects have to be managed');
 if(state.customerFlow==='mixed')add(E,'crm',2,'A mixed customer journey benefits from organised records');

 // problems
 if(P.has('customers'))add(E,'website',3,'Getting more customers is a priority');
 if(P.has('missed'))add(E,'crm',4,'Missed enquiries or follow-ups are a problem');
 if(P.has('transactions')){if(state.customerFlow==='appointments')add(E,'booking',3,'You want bookings to be easier');if(state.customerFlow==='orders')add(E,'orders',3,'You want order-taking to be easier')}
 if(P.has('records'))add(E,'crm',4,'Better records are a stated priority');
 if(P.has('stock'))add(E,'inventory',5,'Stock or material problems are a stated priority');
 if(P.has('staff'))add(E,'staff',4,'Staff or job management is a stated priority');
 if(P.has('visibility'))add(E,'reporting',4,'Better management visibility is a stated priority');
 if(P.has('paperwork'))add(E,'automation',4,'Reducing repetitive administration is a stated priority');
 if(P.has('payments'))add(E,'payments',4,'Making payment collection easier is a priority');
 if(P.has('delivery'))add(E,'delivery',5,'Delivery organisation is a stated priority');

 // existing setup is negative evidence
 if(state.digital==='none'){add(E,'website',2,'There is no reliable digital foundation yet')}
 if(state.digital==='social'){add(E,'website',1,'The business mainly depends on social media or WhatsApp')}
 if(state.digital==='website')add(E,'website',-8,'A working website already exists');
 if(state.digital==='systems'){add(E,'website',-8,'Existing website already works');add(E,'crm',-3,'Existing business systems may already cover customer records')}

 // scale
 if(state.staff==='6-15'){add(E,'staff',1,'A growing team increases coordination needs');add(E,'reporting',1,'A growing team increases the value of owner visibility')}
 if(state.staff==='16+'){add(E,'staff',2,'A larger team increases coordination and permission needs');add(E,'reporting',3,'A larger operation benefits from consolidated reporting')}
 if(state.locations==='2-3')add(E,'reporting',2,'Multiple locations increase the need for consolidated visibility');
 if(state.locations==='4+'){add(E,'reporting',4,'Several locations need consolidated visibility');add(E,'staff',1,'Multiple locations increase workflow complexity')}

 // conditional answers: these can strongly confirm or reject a recommendation
 if(B.stock==='light')add(E,'inventory',-4,'Stock is too light to justify a dedicated system right now');
 if(B.stock==='manual')add(E,'inventory',4,'Important stock is being tracked manually');
 if(B.stock==='complex')add(E,'inventory',7,'Stock complexity or frequent problems make tracking operationally important');
 if(B.stock==='covered')add(E,'inventory',-10,'A stock system already works well');

 if(B.appointments==='manual')add(E,'booking',4,'Appointments are handled mainly through calls, messages or a notebook');
 if(B.appointments==='simple')add(E,'booking',-2,'A simple calendar currently handles appointments adequately');
 if(B.appointments==='pain')add(E,'booking',7,'Booking clashes, missed appointments or back-and-forth are already causing problems');
 if(B.appointments==='covered')add(E,'booking',-10,'A booking system already works well');

 if(B.quotes==='rare')add(E,'invoicing',-2,'Quotations and invoices are only occasional');
 if(B.quotes==='regular')add(E,'invoicing',4,'Quotations and invoices are a regular part of sales');
 if(B.quotes==='deposit')add(E,'invoicing',6,'Quotations, deposits and balances need organised tracking');
 if(B.quotes==='covered')add(E,'invoicing',-10,'An invoicing system already works well');

 if(B.delivery==='rare')add(E,'delivery',-4,'Delivery is occasional or outsourced');
 if(B.delivery==='own')add(E,'delivery',4,'The business regularly manages its own deliveries');
 if(B.delivery==='complex')add(E,'delivery',7,'Several deliveries, drivers or status updates need coordination');
 if(B.delivery==='covered')add(E,'delivery',-10,'A delivery system already works well');

 if(B.rentals==='small'){add(E,'crm',-1,'Rental activity is very small');add(E,'payments',-1,'Rental collection is simple')}
 if(B.rentals==='regular'){add(E,'crm',3,'Several renters need organised records');add(E,'payments',3,'Recurring rental payments need tracking')}
 if(B.rentals==='complex'){add(E,'crm',5,'Rentals need organised records and follow-up');add(E,'payments',4,'Recurring collections are operationally important');add(E,'automation',2,'Rental reminders or recurring workflows may save time')}
 if(B.rentals==='covered'){add(E,'crm',-5,'Rental records are already covered');add(E,'payments',-4,'Rental payment tracking already works')}

 if(B.staff==='simple')add(E,'staff',-3,'Staff mostly work independently');
 if(B.staff==='whatsapp')add(E,'staff',3,'Assignments mainly happen verbally or in WhatsApp');
 if(B.staff==='assigned')add(E,'staff',5,'Jobs or orders are assigned and need tracking');
 if(B.staff==='stages')add(E,'staff',7,'Work passes through stages or approvals');
 if(B.staff==='covered')add(E,'staff',-10,'A staff workflow system already works well');

 if(B.payments==='fine')add(E,'payments',-5,'Current payment methods work adequately');
 if(B.payments==='remote')add(E,'payments',5,'Customers need an easier remote way to pay');
 if(B.payments==='deposit'){add(E,'payments',3,'Deposits and balances need better payment handling');add(E,'invoicing',2,'Deposits and balances benefit from organised billing')}
 if(B.payments==='recurring')add(E,'payments',6,'Recurring collections are part of the business');
 if(B.payments==='counter')add(E,'pos',3,'Most payments happen at a counter');

 // AI is deliberately conservative in an estimate.
 if((P.has('missed')||P.has('customers'))&&(state.digital==='social'||state.digital==='none'))add(E,'ai',1,'An assistant may help later if enquiry volume grows');

 return E;
}
function scoreRows(){
 const E=capabilityEvidence();
 return Object.entries(E).map(([id,ev])=>{
  const score=ev.reduce((a,x)=>a+x.points,0);
  const positive=ev.filter(x=>x.points>0).sort((a,b)=>b.points-a.points);
  const negative=ev.filter(x=>x.points<0).sort((a,b)=>a.points-b.points);
  let bucket='wait';
  if(score>=7 && positive.some(x=>x.points>=4))bucket='now';
  if(score<=0||negative.some(x=>x.points<=-8))bucket='skip';
  // Guardrails against over-selling enhancements.
  if(['ai','automation','reporting'].includes(id)&&bucket==='now'&&score<10)bucket='wait';
  return {id,score,bucket,evidence:ev,positive,negative};
 }).sort((a,b)=>b.score-a.score);
}
function integratedMonthly(items){
 if(!items.length)return 0;
 if(items.length===1)return MODULES[items[0].id].monthly;
 let m=12000;
 if(items.length>=3||state.staff==='6-15'||state.locations==='2-3')m=17000;
 if(items.length>=5||state.staff==='16+'||state.locations==='4+')m=25000;
 return m;
}
function estimate(items){
 const setup=items.reduce((a,x)=>a+MODULES[x.id].setup,0);
 const monthly=integratedMonthly(items);
 return {setup,monthly,firstYear:setup+monthly*12};
}
function shortReason(row){
 const p=row.positive.slice(0,2).map(x=>x.reason);
 if(p.length===0)return 'There is not enough evidence to prioritise this right now.';
 if(p.length===1)return p[0]+'.';
 return p[0]+' and '+p[1].charAt(0).toLowerCase()+p[1].slice(1)+'.';
}

function futureReason(row){
 const map={
  ai:'Could help once customer enquiries become harder to manage manually.',
  reporting:'Could become more useful once you have more sales, staff or locations to keep track of.',
  automation:'May save time later if repetitive admin starts taking up too much of your day.',
  crm:'Could become more valuable as your customer base and follow-up needs grow.',
  inventory:'May become worthwhile if the number of products, materials or stock issues increases.',
  booking:'Could help later if appointments become harder to manage manually.',
  orders:'May be useful once order volume grows beyond what your current process can handle comfortably.',
  payments:'Could make sense later if customers increasingly need easier remote or recurring payment options.',
  staff:'Could become valuable if more people start sharing jobs, tasks or approvals.',
  delivery:'Could help later if delivery volume or coordination becomes more complex.',
  invoicing:'May become useful if quotations, deposits or billing become a bigger part of the business.',
  pos:'Could make sense later if counter sales volume grows and needs tighter tracking.',
  website:'Could become more useful if online discovery or customer enquiries become more important.'
 };
 return map[row.id] || 'Could be a useful addition later if demand or operational complexity grows.';
}
function overallWhy(now){
 const reasons=[];
 if(state.customerFlow==='appointments')reasons.push('customers mainly book appointments');
 else if(state.customerFlow==='orders')reasons.push('orders are a main customer workflow');
 else if(state.customerFlow==='quotes')reasons.push('customers normally request quotations first');
 else if(state.customerFlow==='counter')reasons.push('most sales happen at a counter');
 else if(state.customerFlow==='project')reasons.push('work has to be managed as jobs or projects');
 if(state.problems.size)reasons.push('your biggest priorities are '+[...state.problems].slice(0,2).map(problemLabel).join(' and '));
 if(state.digital==='website'||state.digital==='systems')reasons.push('we kept the working systems you already have instead of replacing them');
 return reasons.length?capitalize(reasons.join(', '))+'.':'The recommendation is based on the operating pattern you described, not on a generic industry package.';
}
function problemLabel(v){return ({customers:'getting more customers',missed:'missed enquiries',transactions:'easier bookings or orders',records:'better records',stock:'stock control',staff:'staff / job management',visibility:'management visibility',paperwork:'less paperwork',payments:'easier payments',delivery:'delivery organisation'})[v]||v}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}



async function submitAssessment(data){
 if(location.protocol==='file:'||location.hostname.includes('sandbox'))return;
 const body=new URLSearchParams({'form-name':'business-readiness',...data});
 try{await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()})}
 catch(e){console.warn('Assessment logging failed',e)}
}

function printEstimate(mode){
 document.body.dataset.printMode=mode;
 setTimeout(()=>window.print(),60);
 setTimeout(()=>{delete document.body.dataset.printMode},900);
}

function generate(){
 const rows=scoreRows();
 const now=rows.filter(x=>x.bucket==='now').slice(0,6);
 const wait=rows.filter(x=>x.bucket==='wait'&&x.score>=2).slice(0,4);
 const est=estimate(now);
 const selected=[...state.selected].filter(x=>x!=='unsure').map(id=>({id}));
 const selectedEst=estimate(selected);
 const selectedIds=new Set(selected.map(x=>x.id)),nowIds=new Set(now.map(x=>x.id));
 const missing=now.filter(x=>!selectedIds.has(x.id));
 const extra=selected.filter(x=>!nowIds.has(x.id));
 const ref='SN-BR-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.floor(1000+Math.random()*9000);
 const itemRows=(items,waitMode=false)=>items.length?`<div class="simple-list">${items.map(x=>{
   const m=MODULES[x.id];
   return `<div class="simple-item"><div><strong>${m.name}</strong><p>${waitMode?futureReason(x):shortReason(x)}</p></div><div class="simple-price">${money(m.setup)}<small>${waitMode?'possible future setup':'one-time setup'}</small></div></div>`;
 }).join('')}</div>`:`<p class="muted">${waitMode?'Nothing important was identified for later at this stage.':'No paid technology was strongly justified from these answers. A manual conversation may be more appropriate.'}</p>`;

 const baseDisclaimer=`<div class="note"><strong>Important:</strong> This document is a preliminary technology cost estimate only. It is not a final quotation, contract, lender recommendation, financing approval, or guarantee of final project cost. Final pricing may change after SnapNest confirms the business requirements, scope, integrations, hardware, third-party services and any custom development required.</div>`;

 const recommendedPrint=`<div class="print-recommended">
   <div class="result-section"><h3>Preliminary SnapNest technology recommendation</h3><p class="muted">This estimate is based on the information supplied during the assessment and is intended for planning purposes only.</p>${itemRows(now)}</div>
   <div class="result-section"><h3>Estimated technology budget</h3>
    <div class="budget-grid">
     <div class="budget-box"><span>One-time setup</span><strong>${money(est.setup)}</strong></div>
     <div class="budget-box"><span>Hosting, maintenance & support</span><strong>${money(est.monthly)}/month</strong></div>
     <div class="budget-box"><span>Estimated first year</span><strong>${money(est.firstYear)}</strong></div>
    </div>
    <div class="reason-box" style="margin-top:14px"><strong>Why this setup?</strong><br>${esc(overallWhy(now))}</div>
   </div>
   ${baseDisclaimer}
 </div>`;

 const selectedPrint=selected.length?`<div class="print-selected">
   <div class="result-section"><h3>Estimate based on customer-selected technology</h3><p class="muted">This estimate reflects the systems selected by the customer and should not be interpreted as SnapNest’s recommended minimum or final project price.</p>
    <div class="simple-list">${selected.map(x=>{const m=MODULES[x.id];return `<div class="simple-item"><div><strong>${m.name}</strong><p>Included because you selected it during the assessment.</p></div><div class="simple-price">${money(m.setup)}<small>one-time setup</small></div></div>`}).join('')}</div>
   </div>
   <div class="result-section"><h3>Estimated technology budget</h3>
    <div class="budget-grid">
     <div class="budget-box"><span>One-time setup</span><strong>${money(selectedEst.setup)}</strong></div>
     <div class="budget-box"><span>Hosting, maintenance & support</span><strong>${money(selectedEst.monthly)}/month</strong></div>
     <div class="budget-box"><span>Estimated first year</span><strong>${money(selectedEst.firstYear)}</strong></div>
    </div>
    ${extra.length?`<div class="soft-warning"><strong>Note:</strong> Your selected configuration includes additional systems beyond SnapNest’s current recommendation. They remain included because you selected them.</div>`:''}
   </div>
   ${baseDisclaimer}
 </div>`:'';

 document.getElementById('tool').style.display='none';
 const r=document.getElementById('result');r.classList.add('show');
 r.innerHTML=`<div class="result-shell"><div class="quote">
   <div class="quote-head"><div><span class="badge-green">SnapNest Business Technology Estimate</span><h2 style="font-family:Fraunces,serif;margin-top:10px">${esc(state.business)}</h2><p class="muted">Prepared by SnapNest Digital Solutions · Demo logic only</p></div><div><div class="quote-ref">${ref}</div><div class="muted">${new Date().toLocaleDateString('en-GB')}</div></div></div>

   <div class="print-recommended">
    <div class="result-section"><h3>What we think you need now</h3><p class="muted">The short list we would actually budget for at this stage.</p>${itemRows(now)}</div>
    <div class="result-section"><h3>What could be useful to your business in the future</h3><p class="muted">These could be really useful additions as your business grows. You do not need them to launch, but they may make sense later as customer demand, workload or operations become more complex.</p>${itemRows(wait,true)}</div>
    <div class="result-section"><h3>Your estimated technology budget</h3>
     <div class="budget-grid">
      <div class="budget-box"><span>One-time setup</span><strong>${money(est.setup)}</strong></div>
      <div class="budget-box"><span>Hosting, maintenance & support</span><strong>${money(est.monthly)}/month</strong></div>
      <div class="budget-box"><span>Estimated first year</span><strong>${money(est.firstYear)}</strong></div>
     </div>
     <div class="reason-box" style="margin-top:14px"><strong>Why this setup?</strong><br>${esc(overallWhy(now))}</div>
    </div>
   </div>

   ${selected.length?`<div class="result-section no-print"><h3>Your choices vs our estimate</h3><p class="muted">Kept out of the way unless you want to compare them.</p>
      <button class="btn compare-toggle" onclick="document.getElementById('comparePanel').classList.toggle('open')">Compare with what I selected</button>
      <div class="compare-panel" id="comparePanel"><div class="compare-grid"><div class="compare-col"><h4>You selected</h4><ul>${selected.map(x=>`<li>${MODULES[x.id].name}</li>`).join('')}</ul></div><div class="compare-col"><h4>SnapNest thinks you need now</h4><ul>${now.map(x=>`<li>${MODULES[x.id].name}</li>`).join('')}</ul></div></div>
      ${(missing.length||extra.length)?`<div class="soft-warning"><strong>Where we differ:</strong> ${missing.length?`We think ${missing.map(x=>MODULES[x.id].name).join(', ')} may be missing. `:''}${extra.length?`We would not put ${extra.map(x=>MODULES[x.id].name).join(', ')} into the launch estimate yet based on these answers.`:''}</div>`:'<div class="soft-warning"><strong>Good match:</strong> your choices line up closely with the estimate.</div>'}</div></div>`:''}

   <div class="no-print">
    <div class="result-section"><h3>Download an estimate</h3><p class="muted">Choose the version you actually want to use.</p>
      <div class="download-grid">
       <button class="btn btn-primary download-option" onclick="printEstimate('recommended')"><strong>Download SnapNest’s recommended estimate</strong><small>Uses the setup SnapNest recommends from the assessment.</small></button>
       ${selected.length?`<button class="btn download-option" onclick="printEstimate('selected')"><strong>Download an estimate based on my selections</strong><small>Uses the systems exactly as you selected them.</small></button>`:''}
      </div>
    </div>
    <div class="actions"><button class="btn" onclick="location.reload()">Test Another Business</button></div>
   </div>

   <div style="display:none">${recommendedPrint}${selectedPrint}</div>
 </div></div>`;
 r.scrollIntoView({behavior:'smooth',block:'start'});
 submitAssessment({
  lead_consent:'yes',
  reference:ref,name:state.name,business_name:state.business,whatsapp:state.phone,email:state.email,
  business_type:state.industry,stage:state.stage,activities:[...state.activities].join(', '),
  customer_flow:state.customerFlow,biggest_problems:[...state.problems].join(', '),digital_setup:state.digital,
  staff:state.staff,locations:state.locations,conditional_answers:JSON.stringify(state.branchAnswers),
  customer_selected_modules:[...state.selected].filter(x=>x!=='unsure').join(', '),
  snapnest_now_modules:now.map(x=>x.id).join(', '),snapnest_future_modules:wait.map(x=>x.id).join(', '),
  selected_setup_estimate:selectedEst.setup,selected_monthly_estimate:selectedEst.monthly,selected_year_one_estimate:selectedEst.firstYear,
  snapnest_setup_estimate:est.setup,snapnest_monthly_estimate:est.monthly,snapnest_year_one_estimate:est.firstYear
 });
}
state.locations='1';
rebuildFlow();render();
