(function () {
 'use strict';
 const $ = id => document.getElementById(id), F = window.FamilyCheck;
 const expenseIds = ['housing','food','transport','care','other','extra'];
 const steps = [...document.querySelectorAll('.step')];
 let current = 0;
 const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n%100 ? 2 : 0}).format(n/100);
 const scenario = () => document.querySelector('input[name="scenario"]:checked')?.value;
 const coverage = () => document.querySelector('input[name="coverage"]:checked')?.value;
 function inputData() { return { expenses:expenseIds.map(id=>$(id).value.trim()),income:$('income').value.trim(),savings:$('savings').value.trim(),months:$('months').value }; }
 function error(message) { $('error').textContent=message; $('error').hidden=false; }
 function hideError() { $('error').hidden=true; $('error').textContent=''; }
 function show(n, focus=true) {
  current=n;hideError(); steps.forEach((el,i)=>el.hidden=i!==n);
  $('results').hidden=n!==4; $('calculator').hidden=n===4;
  $('step-label').textContent=`Step ${n+1} of 5`; $('progress').setAttribute('aria-valuenow',n+1);$('progress').firstElementChild.style.width=`${(n+1)*20}%`;
  [...$('step-list').children].forEach((el,i)=>{el.classList.toggle('active',i===n);el.classList.toggle('done',i<n);if(i===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
  $('back').hidden=n===0; $('next').innerHTML=n===3?'See my results <span aria-hidden="true">→</span>':'Continue <span aria-hidden="true">→</span>';
  if(scenario())$('expense-context').textContent=F.scenarios[scenario()].intro;
  if(focus)(n===4 ? $('result-heading') : steps[n].querySelector('h2')).focus({preventScroll:true});
  if(focus)$('check').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }
 function validateStep(){
  try{
   if(current===0&&!scenario())throw new Error('Choose a situation to explore.');
   if(current===1){const total=expenseIds.reduce((s,id)=>s+F.cents($(id).value.trim()),0);if(!total)throw new Error('Add at least one monthly expense above zero.');}
   if(current===2){if($('income').value.trim()==='')throw new Error('Enter income that would continue. Enter zero if none.');F.cents($('income').value.trim());if(!coverage())throw new Error('Choose what you know about your existing protection.');}
   if(current===3){if($('savings').value.trim()==='')throw new Error('Enter available savings. Enter zero if none.');F.calculate(inputData());}
   return true;
  }catch(e){error(e.message);return false;}
 }
 function render(){
  const r=F.calculate(inputData()),s=F.scenarios[scenario()];
  $('result-scenario').textContent='Situation: '+s.label;
  $('gap').textContent=money(r.gap);
  $('gap-explanation').textContent=r.gap?'The difference between essential expenses and the monthly income you entered.':'No monthly shortfall under these assumptions. This does not confirm adequate protection or cover unexpected costs.';
  $('runway').textContent=r.runway===null?'Not needed for this gap':r.runway===0?'0 months':r.runway<0.1?'Less than 0.1 month':`${Math.floor(r.runway*10)/10} months`;
  $('runway-note').textContent=r.runway===null?'Continuing income covers the listed monthly expenses.':'Available savings divided by your monthly gap; rounded down to one decimal.';
  $('period-title').textContent=`Remaining gap over ${r.horizon} months`;$('period-gap').textContent=money(r.periodGap);
  const rows=[['Essential monthly expenses',r.essential],['Continuing monthly income',r.income],['Available savings',r.savings],[`Total shortfall over ${r.horizon} months, before savings`,r.periodNeed]];
  $('breakdown').replaceChildren(...rows.map(([label,value])=>{const row=document.createElement('div');row.className='breakdown-row';const a=document.createElement('span'),b=document.createElement('strong');a.textContent=label;b.textContent=money(value);row.append(a,b);return row;}));
  $('result-limits').textContent='Assumes unchanged expenses and income, immediately available savings, and no growth, inflation, taxes beyond your entered take-home income, or unexpected costs. Delayed benefits and one-time claim payments are not modeled. A longer need can exceed your chosen period. '+s.check;
  const actionList=F.actions(scenario(),coverage());if(r.gap>0)actionList.splice(1,0,'Review which expenses could change and how you would address the shortfall after available savings are used.');
  $('actions').replaceChildren(...actionList.map(x=>{const li=document.createElement('li');li.textContent=x;return li;}));
  // Contact fields only. Dollar entries remain out of the submitted form.
  $('lead-situation').value=s.label; $('lead-actions').value=actionList.join('\n');
  $('autoresponse').value='Your Family Income Backup Check action guide\n\nSituation: '+s.label+'\n\n'+actionList.map((x,i)=>(i+1)+'. '+x).join('\n')+'\n\nYour financial figures were not submitted and are not included here. You can print or save them from your results page.\n\nRequest a Family Protection Review: https://calendly.com/mdosso-zoom--meeting-with-madoussou-dosso\n\nMadoussou Dosso | Independent Life Insurance Producer\ndossofinancial.com | 240-702-1772\nEducational information, not an insurance recommendation.';
 }
 $('calculator').addEventListener('submit',e=>{e.preventDefault();if(!validateStep())return;if(current===3){render();show(4);}else show(current+1);});
 $('back').addEventListener('click',()=>show(Math.max(0,current-1)));
 $('edit').addEventListener('click',()=>show(1));
 $('try-another').addEventListener('click',()=>{document.querySelectorAll('input[name="scenario"],input[name="coverage"]').forEach(x=>x.checked=false);$('income').value='';$('savings').value='';$('lead-form').reset();$('lead-status').textContent='';show(0);});
 $('reset').addEventListener('click',()=>{if(current>0&&!window.confirm('Clear your entries and start again?'))return;$('calculator').reset();$('lead-form').reset();$('lead-status').textContent='';$('expense-total').textContent='$0';show(0);});
 expenseIds.forEach(id=>$(id).addEventListener('input',()=>{try{$('expense-total').textContent=money(expenseIds.reduce((s,id)=>s+F.cents($(id).value.trim()),0));hideError();}catch(e){$('expense-total').textContent='Check your amounts';}}));
 $('print').addEventListener('click',()=>window.print());
 $('lead-form').addEventListener('submit',()=>{
  // FormSubmit owns verification and delivery. Do not claim success from a click.
  $('lead-status').textContent='Complete any verification in the confirmation tab. Keep this results page open to print your figures. If the tab did not open, allow it or contact mdosso@dossofinancial.com. Delivery cannot be confirmed on this page.';
 });
 show(0,false);
})();
