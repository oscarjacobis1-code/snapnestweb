const MODULES={
 website:{name:'Website & Online Presence',setup:55000},
 booking:{name:'Booking & Scheduling',setup:30000},
 orders:{name:'Online Orders',setup:35000},
 inventory:{name:'Inventory & Stock Tracking',setup:40000},
 crm:{name:'Customer Records',setup:25000},
 staff:{name:'Staff / Job Workflow',setup:30000},
 pos:{name:'POS / Counter Sales',setup:65000},
 invoicing:{name:'Invoices & Quotations',setup:28000},
 payments:{name:'Digital Payments',setup:30000},
 delivery:{name:'Delivery / Dispatch Workflow',setup:40000},
 automation:{name:'Business Automation',setup:45000},
 reporting:{name:'Owner Reports / Analytics',setup:25000},
 ai:{name:'AI Customer Assistant',setup:35000}
};

const state={
 industry:'',stage:'',activities:new Set(),customerFlow:'',problems:new Set(),
 digital:'',staff:'',locations:'',selected:new Set(),branchAnswers:{},
 name:'',business:'',phone:'',email:''
};

const BASE=[
 {id:'industry',title:'Which option best describes your business?',sub:'Start with the closest main type. You can describe everything the business actually does in the next question.',choices:[
  ['retail','Shop / retail / wholesale'],['food','Restaurant / café / catering'],['salon','Salon / barber / beauty'],
  ['contractor','Construction / contractor / trades'],['professional','Professional services'],['logistics','Transport / courier / logistics'],
  ['agriculture','Agriculture / farming / agro-processing'],['tourism','Accommodation / tourism / guesthouse'],['manufacturing','Manufacturing / production'],
  ['property','Property / rental / real estate'],['creative','Creative / media / events'],['health','Health / wellness / care'],
  ['education','Education / training / tutoring'],['other','Other / mixed business']
 ]},
 {id:'stage',title:'Where is the business right now?',sub:'This helps us prioritise what is urgent now and what can reasonably wait. It does not change module prices.',choices:[
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
 const active=new Set(branches);
 Object.keys(state.branchAnswers).forEach(id=>{if(!active.has(id))delete state.branchAnswers[id]});
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
 let h=`<div class="q-top"><div class="q-step">Question ${index+1} of up to ${flow.length}</div><div aria-hidden="true" class="q-progress"><span style="width:${pct}%"></span></div></div><h2 id="questionTitle" tabindex="-1">${s.title}</h2><p class="muted" id="questionHelp">${s.sub}</p>`;
 if(s.custom==='scale'){
  h+=`<div class="choice-grid">${[['1','Owner only'],['2-5','2–5 people'],['6-15','6–15 people'],['16+','16+ people']].map(([v,l])=>`<button type="button" class="choice ${state.staff===v?'selected':''}" aria-pressed="${state.staff===v}" onclick="pickScale('${v}')">${l}</button>`).join('')}</div>
      <div class="field"><label for="locations">Locations / operating sites</label><select id="locations" onchange="state.locations=this.value"><option value="1" ${state.locations==='1'?'selected':''}>1 location / site</option><option value="2-3" ${state.locations==='2-3'?'selected':''}>2–3 locations / sites</option><option value="4+" ${state.locations==='4+'?'selected':''}>4+ locations / sites</option></select></div>`;
 } else if(s.choices){
  const groupAttrs=s.multi?'role="group"':'role="radiogroup" onkeydown="moveRadio(event)"';
  h+=`<div class="choice-grid" ${groupAttrs} aria-labelledby="questionTitle" aria-describedby="questionHelp">${s.choices.map(([v,l],choiceIndex)=>`<button type="button" class="choice ${selectedFor(s,v)?'selected':''}" ${s.multi?`aria-pressed="${selectedFor(s,v)}"`:`role="radio" aria-checked="${selectedFor(s,v)}" tabindex="${selectedFor(s,v)||(!s.choices.some(([value])=>selectedFor(s,value))&&choiceIndex===0)?'0':'-1'}"`} onclick="choose('${s.id}','${v}',${s.multi?1:0})">${l}</button>`).join('')}</div>`;
 }
 if(s.id==='selected')h+=`<div class="branch-note"><strong>Important:</strong><span>These are your preferences only. SnapNest’s recommendation is calculated separately from how the business operates.</span></div>`;
 if(s.id.startsWith('branch:'))h+=`<div class="branch-note"><strong>Why this question appeared:</strong><span>One of your earlier answers made this area important enough that a quick follow-up could materially change the estimate.</span></div>`;
 if(s.contact){
  h+=`<div class="field" id="field_name"><label for="r_name">Your name <span class="required-mark">Required</span></label><input id="r_name" aria-describedby="err_name" autocomplete="name" value="${esc(state.name)}"><div class="field-error" id="err_name" aria-live="polite"></div></div>
  <div class="field" id="field_business"><label for="r_business">Business name <span class="required-mark">Required</span></label><input id="r_business" aria-describedby="err_business" autocomplete="organization" value="${esc(state.business)}"><div class="field-error" id="err_business" aria-live="polite"></div></div>
  <div class="field" id="field_phone"><label for="r_phone">WhatsApp / phone <span class="required-mark">Required</span></label><input id="r_phone" aria-describedby="err_phone" autocomplete="tel" value="${esc(state.phone)}" placeholder="+592"><div class="field-error" id="err_phone" aria-live="polite"></div></div>
  <div class="field" id="field_email"><label for="r_email">Email <span class="required-mark">Required</span></label><input id="r_email" aria-describedby="err_email" type="email" autocomplete="email" value="${esc(state.email)}"><div class="field-error" id="err_email" aria-live="polite"></div></div>
  <div class="consent-field" id="field_consent"><label><input id="r_consent" aria-describedby="err_consent" type="checkbox"> <span>I agree to send my contact details and assessment answers to SnapNest so the team can follow up about this estimate.</span></label><div class="field-error" id="err_consent" aria-live="polite"></div></div>`;
 }
 h+=`<div class="tool-actions"><button type="button" class="btn" onclick="back()" ${index===0?'disabled':''}>Back</button><button type="button" class="btn btn-primary" onclick="next()">${s.contact?'Submit & See My Technology Estimate':'Continue'}</button></div>`;
 box.innerHTML=h;
 const heading=box.querySelector('h2');if(heading)heading.focus({preventScroll:true})
}
function moveRadio(event){
 if(!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(event.key))return;
 const radios=[...event.currentTarget.querySelectorAll('[role="radio"]')];if(!radios.length)return;
 event.preventDefault();const current=Math.max(0,radios.indexOf(document.activeElement));
 const direction=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;
 radios[(current+direction+radios.length)%radios.length].focus();
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
 const A=state.activities,P=state.problems,active=new Set(chooseBranches());
 const B=Object.fromEntries(Object.entries(state.branchAnswers).filter(([id])=>active.has(id)));

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
 const branchModules={stock:['inventory'],appointments:['booking'],quotes:['invoicing'],delivery:['delivery'],rentals:['crm','payments'],staff:['staff'],payments:['payments']};
 const priorities=branchPriority(),asked=new Set(chooseBranches()),unresolved=new Set();
 Object.entries(priorities).filter(([,value])=>value>=5).forEach(([branch])=>{
  if(!asked.has(branch)||!state.branchAnswers[branch])branchModules[branch].forEach(id=>unresolved.add(id));
 });
 return Object.entries(E).map(([id,ev])=>{
  const score=ev.reduce((a,x)=>a+x.points,0);
  const positive=ev.filter(x=>x.points>0).sort((a,b)=>b.points-a.points);
  const negative=ev.filter(x=>x.points<0).sort((a,b)=>a.points-b.points);
  let bucket='wait';
  if(score>=7 && positive.some(x=>x.points>=4))bucket='now';
  // Website evidence is cumulative: several independent signals can establish need.
  if(id==='website'&&score>=7&&positive.length>=3)bucket='now';
  if(score<=0||negative.some(x=>x.points<=-8))bucket='skip';
  // Guardrails against over-selling enhancements.
  if(['ai','automation','reporting'].includes(id)&&bucket==='now'&&score<10)bucket='wait';
  // A material unanswered follow-up can reject this recommendation, so it cannot be presented as certain.
  if(bucket==='now'&&unresolved.has(id))bucket='wait';
  // Stage affects urgency only. Planning/financing keep non-launch-critical capabilities for later.
  const launchCritical=(state.customerFlow==='appointments'&&id==='booking')||(state.customerFlow==='orders'&&id==='orders')||(state.customerFlow==='quotes'&&id==='invoicing')||(state.customerFlow==='counter'&&id==='pos')||(state.customerFlow==='project'&&id==='staff')||(state.problems.has('customers')&&id==='website')||(state.problems.has('missed')&&id==='crm');
  if(bucket==='now'&&['planning','financing'].includes(state.stage)&&!launchCritical)bucket='wait';
  return {id,score,bucket,evidence:ev,positive,negative};
 }).sort((a,b)=>b.score-a.score);
}
function requiresManualScope(items){
 const ids=new Set(items.map(x=>x.id));
 const operational=['inventory','staff','pos','delivery','automation','reporting'].filter(id=>ids.has(id)).length;
 return state.locations==='4+'||
  (state.locations==='2-3'&&items.length>=3&&operational>=2)||
  (state.branchAnswers.staff==='stages'&&items.length>=3)||
  (state.branchAnswers.delivery==='complex'&&items.length>=3)||
  (state.staff==='16+'&&items.length>=4);
}
const RECURRING_BANDS={low:10000,standard:15000,high:20000};
function recurringSupport(items){
 if(!items.length)return {band:'none',monthly:0,preliminary:true,drivers:[]};
 const drivers=new Set();
 if(['appointments','orders','counter','project'].includes(state.customerFlow))drivers.add('business-critical customer or job workflow');
 if(state.locations==='2-3'||state.locations==='4+')drivers.add('multi-location data and operations');
 if((state.staff!=='1'&&state.activities.has('jobs'))||['assigned','stages'].includes(state.branchAnswers.staff))drivers.add('shared staff workflow and permissions');
 if(state.branchAnswers.stock==='complex')drivers.add('operationally critical stock handling');
 if(['own','complex'].includes(state.branchAnswers.delivery))drivers.add('managed fulfilment or delivery');
 if(['remote','deposit','recurring'].includes(state.branchAnswers.payments))drivers.add('ongoing payment-service dependency');
 if(items.some(x=>x.id==='ai'))drivers.add('third-party AI service usage');
 const manualScope=requiresManualScope(items);
 const band=manualScope?'manual':drivers.size>=2?'high':drivers.size===1?'standard':'low';
 return {band,monthly:manualScope?RECURRING_BANDS.high:RECURRING_BANDS[band],preliminary:true,drivers:[...drivers]};
}
function estimate(items){
 const setup=items.reduce((a,x)=>a+MODULES[x.id].setup,0);
 const recurring=recurringSupport(items);
 return {setup,monthly:recurring.monthly,firstYear:setup+recurring.monthly*12,recurringBand:recurring.band,recurringDrivers:recurring.drivers,guardrailApplied:false,manualScope:requiresManualScope(items)};
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
function scopeNotice(est){
 return est.manualScope?'<div class="manual-scope"><strong>Custom scope – final quotation required.</strong><p>This preliminary estimate involves operational complexity that must be confirmed through a detailed scope review before final pricing.</p></div>':'';
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
function naturalList(values){
 const items=values.filter(Boolean);if(items.length<2)return items[0]||'';
 if(items.length===2)return items.join(' and ');
 return items.slice(0,-1).join(', ')+', and '+items.at(-1);
}
function moduleNames(items){return items.map(item=>MODULES[item.id].name)}
function recommendationExplanation(selected,now,wait){
 const selectedIds=new Set(selected.map(item=>item.id)),nowIds=new Set(now.map(item=>item.id)),waitById=new Map(wait.map(item=>[item.id,item]));
 const extra=selected.filter(item=>!nowIds.has(item.id)),missing=now.filter(item=>!selectedIds.has(item.id));
 if(!selected.length){
  const recommendation=now.length?`Based on the answers provided, we recommend prioritising ${naturalList(moduleNames(now))} for launch.`:'Based on the answers provided, no paid technology was strongly justified as essential for launch.';
  const later=wait.length?` ${naturalList(moduleNames(wait))} may become useful later as the business grows or its workflow becomes more complex.`:'';
  return recommendation+later+' This recommendation is advisory and the assessment may not capture every business-specific requirement.';
 }
 if(!extra.length&&!missing.length)return 'Your selections line up closely with what we would recommend based on the way you described the business. The recommendation is advisory, and the assessment may not capture every business-specific requirement.';
 const parts=[`You selected ${naturalList(moduleNames(selected))}.`];
 if(now.length)parts.push(`Based on the answers provided, we think ${naturalList(moduleNames(now))} ${now.length===1?'is':'are'} the ${now.length===1?'priority':'priorities'} for launch.`);
 if(extra.length){
  const later=extra.map(item=>waitById.get(item.id)).filter(Boolean),extraNames=naturalList(moduleNames(extra));
  parts.push(`${extraNames} may be better added later rather than included in the initial launch${later.length?' because the current answers do not show enough immediate operational need':''}.`);
 }
 if(missing.length){
  const reasons=missing.map(item=>`${MODULES[item.id].name} because ${shortReason(item).replace(/\.$/,'').replace(/^./,letter=>letter.toLowerCase())}`);
  parts.push(`We also recommend ${naturalList(reasons)}.`);
 }
 parts.push('If a system is important to your launch for reasons this assessment did not capture, you can keep your selections and use your own estimate instead.');
 return parts.join(' ');
}
function resultComparisonCard(title,items,est,recommended=false){
 const modules=items.length?`<ul class="comparison-modules">${items.map(item=>`<li>${MODULES[item.id].name}</li>`).join('')}</ul>`:'<p class="comparison-empty">No independent systems selected.</p>';
 return `<section class="comparison-card ${recommended?'recommended':''}"><div class="comparison-card-head"><span>${recommended?'Advisory result':'Your original scope'}</span><h3>${title}</h3></div>${modules}<dl class="comparison-totals"><div><dt>One-time setup</dt><dd>${money(est.setup)}</dd></div><div><dt>Preliminary recurring support</dt><dd>${money(est.monthly)}/month</dd></div><div><dt>Estimated first-year total</dt><dd>${money(est.firstYear)}</dd></div></dl></section>`;
}
function problemLabel(v){return ({customers:'getting more customers',missed:'missed enquiries',transactions:'easier bookings or orders',records:'better records',stock:'stock control',staff:'staff / job management',visibility:'management visibility',paperwork:'less paperwork',payments:'easier payments',delivery:'delivery organisation'})[v]||v}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}



let submissionPromise=null,lastSubmission=null,generating=false;
async function submitAssessment(data){
 if(location.protocol==='file:'||location.hostname.includes('sandbox'))return {ok:true,status:200,local:true};
 if(submissionPromise)return submissionPromise;
 const body=new URLSearchParams({'form-name':'business-readiness',...data});
 submissionPromise=(async()=>{
  try{
   const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
   return response.ok?{ok:true,status:response.status}:{ok:false,retryable:true,status:response.status};
  }catch(e){console.warn('Assessment logging failed',e);return {ok:false,retryable:true,status:0}}
  finally{submissionPromise=null}
 })();
 return submissionPromise;
}

function setSubmissionStatus(result){
 const box=document.getElementById('submissionStatus');if(!box)return;
 box.className='submission-status '+(result.ok?'sent':'failed');
 box.setAttribute('role',result.ok?'status':'alert');
 box.innerHTML=result.ok?'Your information was sent to SnapNest successfully.':`We could not send your information. Your estimate is still available below. <button type="button" class="btn retry-submit" onclick="retrySubmission()">Try sending again</button>`;
}
async function retrySubmission(){
 if(!lastSubmission)return;
 const button=document.querySelector('.retry-submit');if(button){button.disabled=true;button.textContent='Sending…'}
 setSubmissionStatus(await submitAssessment(lastSubmission));
}

function localDateParts(now=new Date()){
 return {year:now.getFullYear(),month:String(now.getMonth()+1).padStart(2,'0'),day:String(now.getDate()).padStart(2,'0'),display:now.toLocaleDateString('en-GB')};
}
function toggleComparison(button){
 const panel=document.getElementById(button.getAttribute('aria-controls'));
 const open=button.getAttribute('aria-expanded')!=='true';
 button.setAttribute('aria-expanded',String(open));panel.classList.toggle('open',open);
}

let lastReport=null;
function pdfSafe(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'-')}
function pdfEscape(value){return pdfSafe(value).replace(/([\\()])/g,'\\$1')}
function pdfWrap(text,width,size=10){
 const words=pdfSafe(text).split(/\s+/).filter(Boolean),lines=[];let line='';
 const max=Math.max(8,Math.floor(width/(size*.52)));
 words.forEach(word=>{const next=line?line+' '+word:word;if(next.length>max&&line){lines.push(line);line=word}else line=next});
 if(line)lines.push(line);return lines;
}
function pdfText(commands,text,x,y,size=10,bold=false,color='0.12 0.15 0.18'){
 commands.push(`BT /F${bold?2:1} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(text)}) Tj ET`);
}
function pdfRect(commands,x,y,w,h,color,stroke=''){
 commands.push(`${color} rg ${x} ${y} ${w} ${h} re f`);if(stroke)commands.push(`${stroke} RG .8 w ${x} ${y} ${w} ${h} re S`);
}
function pdfLine(commands,x1,y1,x2,y2,color='0.88 0.89 0.90'){
 commands.push(`${color} RG .8 w ${x1} ${y1} m ${x2} ${y2} l S`);
}
function stageLabel(value){return ({planning:'Planning',financing:'Preparing for financing',launch:'Ready to launch',operating:'Already operating'})[value]||value||'Not specified'}
function flowLabel(value){return ({appointments:'Appointments',orders:'Orders',quotes:'Quotations',counter:'Walk-in / counter sales',project:'Jobs / projects',mixed:'Mixed workflow'})[value]||value||'Not specified'}
function teamLabel(value){return ({'1':'Owner only','2-5':'2-5 people','6-15':'6-15 people','16+':'16+ people'})[value]||value||'Not specified'}
function locationLabel(value){return ({'1':'1 site','2-3':'2-3 sites','4+':'4+ sites'})[value]||value||'Not specified'}
function buildBrandedPdf(report,mode='recommended'){
 const pages=[];let commands=[],y=0,pageNumber=0;
 const margin=40,contentWidth=515,navy='0.07 0.25 0.37',navyDeep='0.04 0.16 0.23',orange='0.94 0.31 0',muted='0.39 0.44 0.48',line='0.87 0.89 0.90',soft='0.96 0.97 0.97',warm='1 0.97 0.94';
 const items=mode==='selected'?report.selected:report.now,est=mode==='selected'?report.selectedEst:report.est;
 function startPage(first=false){
  if(commands.length)pages.push(commands.join('\n'));commands=[];pageNumber++;
  pdfRect(commands,0,0,595,842,'1 1 1');
  pdfRect(commands,0,first?710:766,595,first?132:76,navyDeep);
  pdfRect(commands,40,first?786:790,29,29,orange);pdfText(commands,'SN',46,first?796:800,10,true,'1 1 1');
  pdfText(commands,'SnapNest',79,first?802:806,16,true,'1 1 1');pdfText(commands,'DIGITAL SOLUTIONS',79,first?790:794,6.5,true,'0.96 0.58 0.35');
  if(first){
   pdfText(commands,mode==='selected'?'CUSTOMER-SELECTED TECHNOLOGY ESTIMATE':'BUSINESS TECHNOLOGY ESTIMATE',40,756,8,true,'0.96 0.58 0.35');
   pdfText(commands,report.business,40,729,22,true,'1 1 1');
   pdfText(commands,`Reference  ${report.ref}`,402,756,7.5,true,'0.78 0.84 0.87');pdfText(commands,`Prepared  ${report.date}`,402,742,7.5,false,'0.78 0.84 0.87');
   y=684;
  }else{pdfText(commands,'Business Technology Estimate - continued',350,798,7.5,false,'0.78 0.84 0.87');y=742}
  pdfText(commands,`PRELIMINARY ESTIMATE  |  PAGE ${pageNumber}`,40,20,6.8,true,muted);pdfText(commands,report.ref,465,20,6.8,false,muted);
 }
 function ensure(height){if(y-height<30)startPage(false)}
 function sectionHeading(title,subtitle){
  ensure(subtitle?45:31);pdfText(commands,title.toUpperCase(),margin,y,8,true,orange);y-=13;
  if(subtitle){pdfText(commands,subtitle,margin,y,8.2,false,muted);y-=20}else y-=13;
 }
 function recommendationList(list,later=false){
  if(!list.length){ensure(42);pdfRect(commands,margin,y-34,contentWidth,38,soft,line);pdfText(commands,later?'Nothing important was identified for later at this stage.':'No paid technology was strongly justified from these answers.',margin+12,y-18,8.5,false,muted);y-=48;return}
  list.forEach(item=>{
   const module=MODULES[item.id],reason=later?futureReason(item):(mode==='selected'?'Included exactly as selected during the assessment.':shortReason(item)),reasonLines=pdfWrap(reason,350,8);
   const h=Math.max(44,28+reasonLines.length*9);ensure(h+6);
   pdfRect(commands,margin,y-h+5,contentWidth,h,soft,line);pdfRect(commands,margin,y-h+5,4,h,later?'0.54 0.62 0.67':orange);
   pdfText(commands,module.name,margin+15,y-14,10.2,true,navyDeep);
   reasonLines.slice(0,3).forEach((text,i)=>pdfText(commands,text,margin+15,y-28-i*9,7.7,false,muted));
   pdfText(commands,money(module.setup),448,y-14,9.2,true,navy);pdfText(commands,later?'POSSIBLE FUTURE SETUP':'ONE-TIME SETUP',448,y-26,5.8,true,muted);
   y-=h+6;
  });
 }
 startPage(true);
 pdfRect(commands,margin,y-68,contentWidth,72,'0.98 0.98 0.97',line);pdfText(commands,'BUSINESS PROFILE',margin+13,y-16,7,true,navy);
 const profile=[['TYPE',labelIndustry(report.industry)],['STAGE',stageLabel(report.stage)],['TEAM',teamLabel(report.staff)],['LOCATIONS',locationLabel(report.locations)],['MAIN FLOW',flowLabel(report.customerFlow)]];
 profile.forEach(([label,value],i)=>{const x=margin+13+i*100;pdfText(commands,label,x,y-35,5.8,true,muted);pdfWrap(value,88,7.6).slice(0,2).forEach((text,j)=>pdfText(commands,text,x,y-48-j*9,7.6,j===0,navyDeep));if(i<4)pdfLine(commands,x+88,y-57,x+88,y-27,line)});y-=89;
 sectionHeading(mode==='selected'?'Customer-selected scope':'Need now',mode==='selected'?'The capabilities selected during the assessment.':'The capabilities we would budget for at this stage.');recommendationList(items,false);
 sectionHeading('Useful later','Capabilities that may become worthwhile as demand or operational complexity grows.');recommendationList(report.wait||[],true);
 ensure(142);sectionHeading('Preliminary technology budget','Setup and ongoing operating support are shown separately.');
 const budgets=[['ONE-TIME SETUP',money(est.setup)],['HOSTING, MAINTENANCE & SUPPORT',`${money(est.monthly)}/month`],['ESTIMATED FIRST YEAR',money(est.firstYear)]];
 budgets.forEach(([label,value],i)=>{const x=margin+i*174;pdfRect(commands,x,y-68,165,68,i===2?navyDeep:warm,i===2?'':line);pdfText(commands,label,x+11,y-18,5.8,true,i===2?'0.78 0.84 0.87':muted);pdfWrap(value,143,13).slice(0,2).forEach((text,j)=>pdfText(commands,text,x+11,y-39-j*14,13,true,i===2?'1 1 1':navyDeep))});y-=82;
 if(est.manualScope){ensure(58);pdfRect(commands,margin,y-47,contentWidth,51,'1 0.96 0.82','0.94 0.69 0.22');pdfText(commands,'CUSTOM SCOPE - FINAL QUOTATION REQUIRED',margin+13,y-17,8.5,true,'0.38 0.27 0.05');pdfText(commands,'Operational complexity must be confirmed through a detailed scope review before final pricing.',margin+13,y-32,7.7,false,'0.38 0.27 0.05');y-=64}
 ensure(65);pdfRect(commands,margin,y-54,contentWidth,58,'0.96 0.97 0.97',line);pdfText(commands,'PLANNING NOTICE',margin+13,y-15,7.2,true,navy);
 const disclaimer='This is a preliminary technology planning estimate, not a final quotation, contract, lender recommendation, financing approval, or guarantee of final project cost. Final pricing may change after SnapNest confirms requirements, integrations, hardware, third-party services, and any custom development required.';
 pdfWrap(disclaimer,contentWidth-26,7).slice(0,4).forEach((text,i)=>pdfText(commands,text,margin+13,y-28-i*9,7,false,muted));y-=65;
 pages.push(commands.join('\n'));
 const objects=['','','','',''];const pageIds=[],catalogId=1,pagesId=2,regularFontId=3,boldFontId=4;
 objects[regularFontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';objects[boldFontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
 pages.forEach(content=>{const contentId=objects.length;objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);const pageId=objects.length;objects.push(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);pageIds.push(pageId)});
 objects[pagesId]=`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;objects[catalogId]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
 let pdf='%PDF-1.4\n';const offsets=[0];for(let id=1;id<objects.length;id++){offsets[id]=pdf.length;pdf+=`${id} 0 obj\n${objects[id]}\nendobj\n`}
 const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)pdf+=String(offsets[id]).padStart(10,'0')+' 00000 n \n';
 pdf+=`trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'});
}
function downloadEstimate(mode){
 const status=document.getElementById('pdfStatus');
 try{
  if(!lastReport)throw new Error('The estimate is not ready.');
  const url=URL.createObjectURL(buildBrandedPdf(lastReport,mode)),a=document.createElement('a');
  a.href=url;a.download=`${lastReport.ref}-${mode}-estimate.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  if(status){status.className='pdf-status';status.textContent='Your PDF download has started.'}
 }catch(error){if(status){status.className='pdf-status error';status.textContent='The PDF could not be created. Please try again.'}}
}

async function generate(){
 if(generating)return;
 generating=true;
 const rows=scoreRows();
 const now=rows.filter(x=>x.bucket==='now');
 const wait=rows.filter(x=>x.bucket==='wait'&&x.score>=2);
 const est=estimate(now);
 const selected=[...state.selected].filter(x=>x!=='unsure').map(id=>({id}));
 const selectedEst=estimate(selected);
 const date=localDateParts();
 const ref=`SN-BR-${date.year}${date.month}${date.day}-${Math.floor(1000+Math.random()*9000)}`;
 const baseDisclaimer=`<div class="note"><strong>Important:</strong> This document is a preliminary technology cost estimate only. It is not a final quotation, contract, lender recommendation, financing approval, or guarantee of final project cost. Final pricing may change after SnapNest confirms the business requirements, scope, integrations, hardware, third-party services and any custom development required.</div>`;
 const explanation=recommendationExplanation(selected,now,wait);
 const comparison=selected.length?`<div class="result-comparison">${resultComparisonCard('Your selections',selected,selectedEst)}${resultComparisonCard('SnapNest recommendation',now,est,true)}</div>`:`<div class="result-comparison single">${resultComparisonCard('SnapNest recommendation',now,est,true)}</div>`;
 const manualNotice=est.manualScope||selectedEst.manualScope?scopeNotice(est.manualScope?est:selectedEst):'';

 document.getElementById('tool').style.display='none';
 const r=document.getElementById('result');r.classList.add('show');
 r.innerHTML=`<div class="result-shell"><div class="quote">
   <div class="quote-head"><div><span class="badge-green">SnapNest Business Technology Estimate</span><h2 style="font-family:Fraunces,serif;margin-top:10px">${esc(state.business)}</h2><p class="muted">Prepared by SnapNest Digital Solutions · Preliminary planning estimate</p></div><div><div class="quote-ref">${ref}</div><div class="muted">${date.display}</div></div></div>
   <div id="submissionStatus" class="submission-status sending" role="status" aria-live="polite">Sending your information to SnapNest…</div>

   <div class="result-experience">
    <h3 class="result-experience-title">Your assessment result</h3>
    ${comparison}
    <div class="recommendation-explanation"><strong>How we reached this recommendation</strong><p>${esc(explanation)}</p></div>
    <div class="result-downloads no-print"><h3>Download your estimate</h3><p>Choose the version you want. Both estimates remain independent.</p>
       <div class="download-grid">
        <button class="btn btn-primary download-option" type="button" onclick="downloadEstimate('recommended')"><strong>Download SnapNest Recommended Estimate</strong><small>Uses the need-now systems identified by the assessment.</small></button>
        ${selected.length?`<button class="btn download-option" type="button" onclick="downloadEstimate('selected')"><strong>Download My Selected Estimate</strong><small>Uses exactly the systems you selected.</small></button>`:''}
       </div>
       <div aria-live="polite" class="pdf-status" id="pdfStatus"></div>
    </div>
    ${manualNotice}
    ${baseDisclaimer}
   </div>
    <div class="actions"><button class="btn" onclick="location.reload()">Test Another Business</button></div>
  </div></div>`;
 r.scrollIntoView({behavior:'smooth',block:'start'});
 lastSubmission={
  lead_consent:'yes',
  reference:ref,name:state.name,business_name:state.business,whatsapp:state.phone,email:state.email,
  business_type:state.industry,stage:state.stage,activities:[...state.activities].join(', '),
  customer_flow:state.customerFlow,biggest_problems:[...state.problems].join(', '),digital_setup:state.digital,
  staff:state.staff,locations:state.locations,conditional_answers:JSON.stringify(state.branchAnswers),
  customer_selected_modules:[...state.selected].filter(x=>x!=='unsure').join(', '),
  snapnest_now_modules:now.map(x=>x.id).join(', '),snapnest_future_modules:wait.map(x=>x.id).join(', '),
  selected_setup_estimate:selectedEst.setup,selected_monthly_estimate:selectedEst.monthly,selected_year_one_estimate:selectedEst.firstYear,
  snapnest_setup_estimate:est.setup,snapnest_monthly_estimate:est.monthly,snapnest_year_one_estimate:est.firstYear
 };
 lastReport={business:state.business,ref,date:date.display,industry:state.industry,stage:state.stage,staff:state.staff,locations:state.locations,customerFlow:state.customerFlow,now,wait,selected,est,selectedEst};
 setSubmissionStatus(await submitAssessment(lastSubmission));
}
state.locations='1';
rebuildFlow();render();
