(function(){
  const CONSULTANT_NUMBER='5926357771';

  function enhanceDocumentHelp(){
    const card=document.querySelector('.document-help-card');
    if(!card||card.dataset.nygilEnhanced==='true')return;

    const helpItems=[...document.querySelectorAll('.document-result-row')]
      .filter(row=>row.querySelector('strong.help'))
      .map(row=>row.querySelector('span')?.textContent.trim())
      .filter(Boolean);

    const itemText=helpItems.length?helpItems.join(', '):'the business documents I marked as Need help';
    const message=`Hi Nygil, I used the SnapNest Business Readiness Tool and I need help preparing ${itemText}. Can you assist me?`;
    const whatsappUrl=`https://wa.me/${CONSULTANT_NUMBER}?text=${encodeURIComponent(message)}`;

    const contact=document.createElement('div');
    contact.className='document-consultant-contact';
    contact.innerHTML=`
      <p><strong>Nygil Drepaul</strong><br>Business Documentation &amp; Compliance Consultant<br><a href="tel:+5926357771">+592 635-7771</a></p>
      <a class="btn btn-primary" href="${whatsappUrl}" target="_blank" rel="noopener">WhatsApp Nygil for help</a>
    `;

    card.appendChild(contact);
    card.dataset.nygilEnhanced='true';
  }

  const result=document.getElementById('result');
  if(result){
    new MutationObserver(enhanceDocumentHelp).observe(result,{childList:true,subtree:true});
    enhanceDocumentHelp();
  }
})();
