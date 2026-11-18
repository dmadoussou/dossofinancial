/* Pure, browser-local arithmetic. Monetary calculations use integer cents. */
(function (root) {
  'use strict';
  const scenarios = {
    job: { label: 'A job loss', intro: 'A paycheck stops, but the household still needs to run.', check: 'Check when workplace benefits end, whether any coverage can continue, and the cost of replacement coverage.', first: 'Find your workplace benefits summary and check what changes after employment ends.' },
    work: { label: 'An illness or injury prevents work', intro: 'An earner is still here, but may be unable to keep working.', check: 'Check disability definitions, waiting periods, benefit amounts, duration, and tax treatment. Living-benefit riders have separate qualification rules.', first: 'Locate any disability coverage and confirm its waiting period and benefit terms.' },
    death: { label: 'The death of an income earner', intro: 'Consider the surviving household’s expenses and income separately.', check: 'Check life insurance amounts, beneficiaries, coverage duration, and whether workplace coverage would remain in force.', first: 'Locate life insurance statements and confirm amounts, beneficiaries, and coverage duration.' }
  };
  function cents(raw) {
    if (raw === '' || raw === null || raw === undefined) return 0;
    const s = String(raw).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(s)) throw new Error('Use a positive dollar amount or zero, with up to two decimal places.');
    const n = Math.round(Number(s) * 100);
    if (!Number.isSafeInteger(n) || n > 10000000000) throw new Error('Use an amount of $100,000,000 or less.');
    return n;
  }
  function calculate({ expenses, income, savings, months }) {
    const essential = expenses.reduce((s, x) => s + cents(x), 0);
    if (essential <= 0) throw new Error('Enter at least one essential monthly expense above zero.');
    if (String(income).trim() === '' || String(savings).trim() === '') throw new Error('Enter continuing income and available savings. Enter zero if there is none.');
    const remaining = cents(income), available = cents(savings);
    const horizon = Number(months);
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 120) throw new Error('Choose a period between 1 and 120 months.');
    const gap = Math.max(0, essential - remaining);
    return { essential, income: remaining, savings: available, gap, runway: gap ? available / gap : null, horizon, periodNeed: gap * horizon, periodGap: Math.max(0, gap * horizon - available) };
  }
  function actions(scenario, coverage) {
    const s = scenarios[scenario];
    if (!s) throw new Error('Choose a situation first.');
    const a = [s.first, 'Compare one recent month of essential expenses with the income you expect to continue.'];
    if (coverage === 'unsure') a.push('Ask your employer or insurer to explain what applies to this situation. Do not assume a benefit will be payable.');
    if (coverage === 'none') a.push('Discuss the uncovered risk and available options with a qualified professional. A calculation alone does not identify the right product.');
    if (coverage === 'yes') a.push('Verify eligibility, payment timing, limits, and whether the arrangement still fits your current responsibilities.');
    a.push('Choose one document to locate or one question to resolve this week.');
    return a;
  }
  const api = { cents, calculate, actions, scenarios };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FamilyCheck = api;
})(typeof window !== 'undefined' ? window : globalThis);
