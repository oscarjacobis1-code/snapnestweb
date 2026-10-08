/* SnapNest Business Readiness lifecycle and recurring-cost layer.
   Requirements and recommendation scoring remain in readiness.js.
   This file only decides what objectively recurs after a scope is chosen. */

const SNAPNEST_LIFECYCLE = {
  website:   { delivery: 'hosted',      infrastructure: ['static_hosting'], supportWeight: 0 },
  booking:   { delivery: 'hosted',      infrastructure: ['cloud_app'],      supportWeight: 1 },
  orders:    { delivery: 'hosted',      infrastructure: ['cloud_app'],      supportWeight: 2 },
  inventory: { delivery: 'local-first', infrastructure: [],                 supportWeight: 0 },
  crm:       { delivery: 'hosted',      infrastructure: ['cloud_app'],      supportWeight: 1 },
  staff:     { delivery: 'hosted',      infrastructure: ['cloud_app'],      supportWeight: 1 },
  pos:       { delivery: 'local-first', infrastructure: [],                 supportWeight: 0 },
  invoicing: { delivery: 'build-once',  infrastructure: [],                 supportWeight: 0 },
  payments:  { delivery: 'integration', infrastructure: [],                 supportWeight: 2, variableFees: ['payment-provider fees'] },
  delivery:  { delivery: 'hosted',      infrastructure: ['cloud_app'],      supportWeight: 1 },
  automation:{ delivery: 'integration', infrastructure: ['automation_runtime'], supportWeight: 2 },
  reporting: { delivery: 'dependent',   infrastructure: [],                 supportWeight: 0 },
  ai:        { delivery: 'usage-based', infrastructure: [],                 supportWeight: 2, variableFees: ['AI usage fees'] }
};

// Central configuration: change infrastructure pricing here without touching recommendation logic.
const SNAPNEST_OPERATING_SERVICES = {
  static_hosting: { name: 'Website hosting', monthly: 2500 },
  cloud_app: { name: 'Cloud app hosting & data services', monthly: 5000 },
  automation_runtime: { name: 'Automation runtime', monthly: 2500 }
};

const SNAPNEST_SUPPORT_PLANS = {
  available: { monthly: 10000, label: 'Optional' },
  recommended: { monthly: 15000, label: 'Optional — recommended' },
  priority: { monthly: 20000, label: 'Optional — strongly recommended' }
};

function lifecycleProfile(id){
  return SNAPNEST_LIFECYCLE[id] || { delivery: 'build-once', infrastructure: [], supportWeight: 0 };
}

function operatingRequirements(items){
  const ids = new Set((items || []).map(item => item.id));
  const serviceIds = new Set();
  const variableFees = new Set();

  ids.forEach(id => {
    const profile = lifecycleProfile(id);
    (profile.infrastructure || []).forEach(service => serviceIds.add(service));
    (profile.variableFees || []).forEach(fee => variableFees.add(fee));
  });

  // A static website can share the same hosted stack as a cloud application.
  if(serviceIds.has('cloud_app')) serviceIds.delete('static_hosting');

  // Local-first POS/inventory stays build-once at one site. Multi-location sync is objectively cloud-dependent.
  const hasLocalOperationalSystem = ids.has('pos') || ids.has('inventory');
  if(hasLocalOperationalSystem && state.locations && state.locations !== '1') serviceIds.add('cloud_app');

  // Standalone AI needs a hosted endpoint if it is not already attached to a hosted application.
  if(ids.has('ai') && !serviceIds.has('cloud_app')) serviceIds.add('cloud_app');

  const services = [...serviceIds].map(id => ({ id, ...SNAPNEST_OPERATING_SERVICES[id] })).filter(service => service.name);
  const monthly = services.reduce((sum, service) => sum + service.monthly, 0);
  return { monthly, services, variableFees: [...variableFees] };
}

function supportAssessment(items){
  if(!items || !items.length) return { required: false, recommendation: 'none', monthly: 0, label: 'Not needed', score: 0, drivers: [] };

  let score = 0;
  const drivers = new Set();
  const ids = new Set(items.map(item => item.id));

  ids.forEach(id => { score += lifecycleProfile(id).supportWeight || 0; });

  if(state.locations === '2-3' || state.locations === '4+'){
    score += 2; drivers.add('multiple operating locations');
  }
  if(state.staff === '6-15' || state.staff === '16+'){
    score += 1; drivers.add('larger staff access');
  }
  if(['appointments','orders','counter','project'].includes(state.customerFlow) && items.some(item => ['booking','orders','pos','staff'].includes(item.id))){
    score += 1; drivers.add('business-critical daily workflow');
  }
  if(state.branchAnswers.stock === 'complex' && ids.has('inventory')){
    score += 1; drivers.add('complex stock operations');
  }
  if(state.branchAnswers.delivery === 'complex' && ids.has('delivery')){
    score += 1; drivers.add('complex delivery operations');
  }
  if(ids.has('payments') || ids.has('automation') || ids.has('ai')){
    score += 1; drivers.add('third-party integration dependency');
  }
  if(requiresManualScope(items)){
    score += 1; drivers.add('custom operational complexity');
  }

  const recommendation = score >= 6 ? 'priority' : score >= 3 ? 'recommended' : 'available';
  const plan = SNAPNEST_SUPPORT_PLANS[recommendation];
  return { required: false, recommendation, monthly: plan.monthly, label: plan.label, score, drivers: [...drivers] };
}

// Compatibility name retained, but support is now explicitly optional.
function recurringSupport(items){ return supportAssessment(items); }

function estimate(items){
  const safeItems = items || [];
  const setup = safeItems.reduce((sum, item) => sum + (MODULES[item.id]?.setup || 0), 0);
  const operating = operatingRequirements(safeItems);
  const support = supportAssessment(safeItems);
  const firstYear = setup + operating.monthly * 12;
  return {
    setup,
    monthly: operating.monthly,
    requiredMonthly: operating.monthly,
    firstYear,
    firstYearWithSupport: firstYear + support.monthly * 12,
    operatingServices: operating.services,
    variableFees: operating.variableFees,
    supportMonthly: support.monthly,
    supportRecommendation: support.recommendation,
    supportRequired: false,
    support,
    recurringBand: operating.monthly ? 'required-infrastructure' : 'none',
    recurringDrivers: operating.services.map(service => service.name),
    guardrailApplied: false,
    manualScope: requiresManualScope(safeItems)
  };
}

function compactOperatingNote(est){
  const details = [];
  if(est.operatingServices?.length) details.push(est.operatingServices.map(service => service.name).join(' + '));
  if(est.variableFees?.length) details.push(`${naturalList(est.variableFees)} may be billed separately by third parties`);
  return details.join('. ');
}

function resultComparisonCard(title,items,est,recommended=false){
  const modules = items.length
    ? `<ul class="comparison-modules">${items.map(item=>`<li>${MODULES[item.id].name}</li>`).join('')}</ul>`
    : '<p class="comparison-empty">No independent systems selected.</p>';
  const operatingNote = compactOperatingNote(est);
  const supportText = est.supportMonthly
    ? `${est.support.label} · ${money(est.supportMonthly)}/month`
    : 'Not needed';
  return `<section class="comparison-card ${recommended?'recommended':''}">
    <div class="comparison-card-head"><span>${recommended?'Advisory result':'Your original scope'}</span><h3>${title}</h3></div>
    ${modules}
    <dl class="comparison-totals">
      <div><dt>One-time setup</dt><dd>${money(est.setup)}</dd></div>
      <div><dt>Required operating cost</dt><dd>${money(est.requiredMonthly)}/month</dd></div>
      <div><dt>Optional SnapNest Care</dt><dd>${supportText}</dd></div>
      <div><dt>First-year required budget</dt><dd>${money(est.firstYear)}</dd></div>
    </dl>
    ${operatingNote?`<p class="comparison-empty">${esc(operatingNote)}.</p>`:''}
  </section>`;
}

// Enrich Netlify lead data without changing the questionnaire/recommendation engine.
async function submitAssessment(data){
  if(location.protocol==='file:'||location.hostname.includes('sandbox'))return {ok:true,status:200,local:true};
  if(submissionPromise)return submissionPromise;
  const enriched = {...data};
  if(lastReport){
    enriched.selected_required_monthly_estimate = lastReport.selectedEst?.requiredMonthly ?? 0;
    enriched.selected_support_monthly_estimate = lastReport.selectedEst?.supportMonthly ?? 0;
    enriched.selected_support_recommendation = lastReport.selectedEst?.supportRecommendation || 'none';
    enriched.snapnest_required_monthly_estimate = lastReport.est?.requiredMonthly ?? 0;
    enriched.snapnest_support_monthly_estimate = lastReport.est?.supportMonthly ?? 0;
    enriched.snapnest_support_recommendation = lastReport.est?.supportRecommendation || 'none';
  }
  const body=new URLSearchParams({'form-name':'business-readiness',...enriched});
  submissionPromise=(async()=>{
    try{
      const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
      return response.ok?{ok:true,status:response.status}:{ok:false,retryable:true,status:response.status};
    }catch(e){console.warn('Assessment logging failed',e);return {ok:false,retryable:true,status:0}}
    finally{submissionPromise=null}
  })();
  return submissionPromise;
}

// Keep the PDF concise while matching the on-screen lifecycle logic.
function buildBrandedPdf(report,mode='recommended'){
  const pages=[];let commands=[],y=0,pageNumber=0;
  const margin=40,contentWidth=515,navy='0.07 0.25 0.37',navyDeep='0.04 0.16 0.23',orange='0.94 0.31 0',muted='0.39 0.44 0.48',line='0.87 0.89 0.90',soft='0.96 0.97 0.97',warm='1 0.97 0.94';
  const items=mode==='selected'?report.selected:report.now,est=mode==='selected'?report.selectedEst:report.est;
  function startPage(first=false){
    if(commands.length)pages.push(commands.join('\n'));commands=[];pageNumber++;
    pdfRect(commands,0,0,595,842,'1 1 1');pdfRect(commands,0,first?710:766,595,first?132:76,navyDeep);
    pdfRect(commands,40,first?786:790,29,29,orange);pdfText(commands,'SN',46,first?796:800,10,true,'1 1 1');
    pdfText(commands,'SnapNest',79,first?802:806,16,true,'1 1 1');pdfText(commands,'DIGITAL SOLUTIONS',79,first?790:794,6.5,true,'0.96 0.58 0.35');
    if(first){
      pdfText(commands,mode==='selected'?'CUSTOMER-SELECTED TECHNOLOGY ESTIMATE':'BUSINESS TECHNOLOGY ESTIMATE',40,756,8,true,'0.96 0.58 0.35');
      pdfText(commands,report.business,40,729,22,true,'1 1 1');pdfText(commands,`Reference  ${report.ref}`,402,756,7.5,true,'0.78 0.84 0.87');pdfText(commands,`Prepared  ${report.date}`,402,742,7.5,false,'0.78 0.84 0.87');y=684;
    }else{pdfText(commands,'Business Technology Estimate - continued',350,798,7.5,false,'0.78 0.84 0.87');y=742}
    pdfText(commands,`PRELIMINARY ESTIMATE  |  PAGE ${pageNumber}`,40,20,6.8,true,muted);pdfText(commands,report.ref,465,20,6.8,false,muted);
  }
  function ensure(height){if(y-height<35)startPage(false)}
  function heading(title,subtitle=''){
    ensure(subtitle?44:30);pdfText(commands,title.toUpperCase(),margin,y,8,true,orange);y-=13;
    if(subtitle){pdfText(commands,subtitle,margin,y,8,false,muted);y-=20}else y-=13;
  }
  function itemList(list){
    if(!list.length){pdfRect(commands,margin,y-34,contentWidth,38,soft,line);pdfText(commands,'No paid technology was strongly justified from these answers.',margin+12,y-18,8.5,false,muted);y-=48;return}
    list.forEach(item=>{ensure(52);const module=MODULES[item.id],reason=mode==='selected'?'Included exactly as selected during the assessment.':shortReason(item);pdfRect(commands,margin,y-41,contentWidth,45,soft,line);pdfRect(commands,margin,y-41,4,45,orange);pdfText(commands,module.name,margin+15,y-13,10,true,navyDeep);pdfWrap(reason,330,7.6).slice(0,2).forEach((text,i)=>pdfText(commands,text,margin+15,y-27-i*9,7.6,false,muted));pdfText(commands,money(module.setup),448,y-15,9,true,navy);y-=52});
  }
  startPage(true);
  pdfRect(commands,margin,y-66,contentWidth,70,'0.98 0.98 0.97',line);pdfText(commands,'BUSINESS PROFILE',margin+13,y-16,7,true,navy);
  const profile=[['TYPE',labelIndustry(report.industry)],['STAGE',stageLabel(report.stage)],['TEAM',teamLabel(report.staff)],['LOCATIONS',locationLabel(report.locations)],['MAIN FLOW',flowLabel(report.customerFlow)]];
  profile.forEach(([label,value],i)=>{const x=margin+13+i*100;pdfText(commands,label,x,y-35,5.8,true,muted);pdfWrap(value,88,7.4).slice(0,2).forEach((text,j)=>pdfText(commands,text,x,y-48-j*9,7.4,j===0,navyDeep));});y-=86;
  heading(mode==='selected'?'Customer-selected scope':'Need now',mode==='selected'?'The capabilities selected during the assessment.':'The capabilities we would budget for at this stage.');itemList(items);
  ensure(185);heading('Preliminary technology budget','Required operating costs and optional support are kept separate.');
  const supportValue=est.supportMonthly?`${money(est.supportMonthly)}/month`:'Not needed';
  const rows=[['ONE-TIME SETUP',money(est.setup)],['REQUIRED OPERATING COST',`${money(est.requiredMonthly)}/month`],['OPTIONAL SNAPNEST CARE',supportValue],['FIRST-YEAR REQUIRED BUDGET',money(est.firstYear)]];
  rows.forEach(([label,value],i)=>{const rowY=y-i*39;pdfText(commands,label,margin,rowY,6.2,true,muted);pdfText(commands,value,290,rowY,10.5,true,navyDeep);pdfLine(commands,margin,rowY-10,margin+contentWidth,rowY-10,line)});y-=166;
  ensure(75);pdfRect(commands,margin,y-60,contentWidth,64,warm,line);pdfText(commands,'LIFECYCLE NOTE',margin+13,y-16,7.2,true,navy);
  const lifecycleText=`Support is optional and is not included in the first-year required budget. ${est.requiredMonthly===0?'This scope has no fixed monthly operating cost in the current estimate.':'Required monthly cost covers only the operating services needed to keep the selected hosted systems running.'}`;
  pdfWrap(lifecycleText,contentWidth-26,7.2).slice(0,4).forEach((text,i)=>pdfText(commands,text,margin+13,y-30-i*9,7.2,false,muted));y-=76;
  if(est.variableFees?.length){ensure(48);pdfText(commands,'THIRD-PARTY USAGE',margin,y,6.5,true,orange);y-=13;pdfWrap(`${naturalList(est.variableFees)} may apply separately and are not included in the fixed monthly estimate.`,contentWidth,7.2).slice(0,3).forEach((text,i)=>pdfText(commands,text,margin,y-i*9,7.2,false,muted));y-=38}
  ensure(70);pdfRect(commands,margin,y-54,contentWidth,58,soft,line);pdfText(commands,'PLANNING NOTICE',margin+13,y-15,7.2,true,navy);
  const disclaimer='This is a preliminary SnapNest technology planning estimate, not a final quotation, contract, lender recommendation, financing approval, or guarantee of final project cost. Final pricing may change after requirements, integrations, hardware, and third-party services are confirmed.';
  pdfWrap(disclaimer,contentWidth-26,7).slice(0,4).forEach((text,i)=>pdfText(commands,text,margin+13,y-28-i*9,7,false,muted));
  pages.push(commands.join('\n'));
  const objects=['','','','',''];const pageIds=[],catalogId=1,pagesId=2,regularFontId=3,boldFontId=4;
  objects[regularFontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';objects[boldFontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  pages.forEach(content=>{const contentId=objects.length;objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);const pageId=objects.length;objects.push(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);pageIds.push(pageId)});
  objects[pagesId]=`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;objects[catalogId]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  let pdf='%PDF-1.4\n';const offsets=[0];for(let id=1;id<objects.length;id++){offsets[id]=pdf.length;pdf+=`${id} 0 obj\n${objects[id]}\nendobj\n`}
  const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)pdf+=String(offsets[id]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:'application/pdf'});
}