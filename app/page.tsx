"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowRight, BadgeCheck, Calculator, CheckCircle2, CircleHelp, FileDown, LockKeyhole, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2, Wallet } from "lucide-react";

type Review = {
  clientName: string; adviserName: string; reviewDate: string; age: number; residency: string; marital: string; dependants: number;
  monthlyIncome: number; monthlyExpenses: number; cash: number; investments: number; cpfOA: number; cpfSA: number; cpfRA: number;
  property: number; loans: number; monthlyInvestment: number; retirementAge: number; targetIncome: number;
  cpfLife: number; otherRetirementIncome: number; returnRate: number; inflation: number; cpfGrowth: number; retirementHorizon: number;
  goals: string; protection: string; notes: string;
};
const initial: Review = {
  clientName: "", adviserName: "", reviewDate: new Date().toISOString().slice(0,10), age: 35, residency: "Singapore Citizen", marital: "Not specified", dependants: 0,
  monthlyIncome: 10000, monthlyExpenses: 5500, cash: 50000, investments: 100000, cpfOA: 50000, cpfSA: 80000, cpfRA: 0,
  property: 0, loans: 0, monthlyInvestment: 1500, retirementAge: 65, targetIncome: 5000,
  cpfLife: 0, otherRetirementIncome: 0, returnRate: 5, inflation: 2.5, cpfGrowth: 3.5, retirementHorizon: 90,
  goals: "Retirement income security", protection: "Review life, critical illness, disability income and hospitalisation coverage against liabilities and dependants.", notes: ""
};
const money = (v:number) => new Intl.NumberFormat("en-SG",{style:"currency",currency:"SGD",maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
const num = (v:number) => new Intl.NumberFormat("en-SG",{maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
const fv = (principal:number, monthly:number, rate:number, years:number) => {
  const n = Math.max(0,Math.floor(years*12)); const r = Math.pow(1+rate/100,1/12)-1;
  if(n===0) return principal;
  if(Math.abs(r)<0.0000001) return principal+monthly*n;
  return principal*Math.pow(1+r,n)+monthly*((Math.pow(1+r,n)-1)/r);
};
function Field({label,value,onChange,type="number",suffix,step=1}:{label:string;value:string|number;onChange:(v:string)=>void;type?:"number"|"text"|"date";suffix?:string;step?:number}) {
  return <label className="fw-field"><span>{label}</span><div className="fw-input-wrap"><input type={type} value={value} step={step} onChange={e=>onChange(e.target.value)} />{suffix&&<small>{suffix}</small>}</div></label>;
}
function SelectField({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}) {
  return <label className="fw-field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>;
}
export default function HomePage() {
  const [r,setR]=useState<Review>(initial);
  const [showReport,setShowReport]=useState(false);
  const [showAdvanced,setShowAdvanced]=useState(true);
  const update=(key:keyof Review,value:string|number)=>setR(prev=>({...prev,[key]:typeof prev[key]==="number"?(value===""?0:Number(value)):value}));
  const calc=useMemo(()=>{
    const monthlySurplus=r.monthlyIncome-r.monthlyExpenses;
    const savingsRate=r.monthlyIncome>0?monthlySurplus/r.monthlyIncome*100:0;
    const netWorth=r.cash+r.investments+r.cpfOA+r.cpfSA+r.cpfRA+r.property-r.loans;
    const investable=r.cash+r.investments;
    const years=Math.max(0,r.retirementAge-r.age);
    const projectedInvestments=fv(investable,r.monthlyInvestment,r.returnRate,years);
    const cpfNow=r.cpfOA+r.cpfSA+r.cpfRA;
    const projectedCpf=fv(cpfNow,0,r.cpfGrowth,years);
    const targetAtRetirement=r.targetIncome*Math.pow(1+r.inflation/100,years);
    const incomeGap=Math.max(0,targetAtRetirement-r.cpfLife-r.otherRetirementIncome);
    const capitalNeeded=incomeGap*12*25;
    const projectedTotal=projectedInvestments+projectedCpf;
    const shortfall=Math.max(0,capitalNeeded-projectedTotal);
    const retirementMonthlyIncome=r.cpfLife+r.otherRetirementIncome+projectedTotal*0.04/12;
    const yearsToHorizon=Math.max(0,r.retirementHorizon-r.retirementAge);
    const drawdownNeed=Math.max(0,targetAtRetirement-r.cpfLife-r.otherRetirementIncome);
    const portfolioAtHorizon=fv(projectedTotal,-drawdownNeed*12,r.returnRate,yearsToHorizon);
    const strengths:string[]=[];const gaps:string[]=[];const actions:string[]=[];
    if(monthlySurplus>0){strengths.push("Positive monthly cash flow of "+money(monthlySurplus)+", providing capacity to build reserves and invest.");}else{gaps.push("Monthly cash flow is "+money(monthlySurplus)+". Spending and debt commitments should be reviewed before increasing investments.");actions.push("Complete a cash-flow review and establish a realistic monthly surplus target.");}
    if(savingsRate>=20)strengths.push("Savings rate of "+savingsRate.toFixed(1)+"% is a useful foundation for long-term planning.");else gaps.push("Savings rate is "+savingsRate.toFixed(1)+"%; assess whether contributions can rise sustainably over time.");
    if(r.cash>=r.monthlyExpenses*6)strengths.push("Cash reserves currently cover at least six months of stated expenses.");else{gaps.push("Cash reserves are below six months of stated expenses.");actions.push("Build an accessible emergency fund toward "+money(r.monthlyExpenses*6)+" (six months of expenses).");}
    if(r.cpfLife>0)strengths.push("A CPF LIFE payout assumption has been included in the retirement-income analysis; validate it using CPF Board's planner.");else{gaps.push("CPF LIFE monthly payout has not been entered, so retirement income may be understated or the funding gap overstated.");actions.push("Use the CPF Board Retirement Payout Planner to obtain a client-specific CPF LIFE estimate and update this review.");}
    if(projectedTotal>=capitalNeeded)strengths.push("Under the selected assumptions, projected CPF and investable assets meet or exceed the simplified retirement capital benchmark.");else{gaps.push("Projected CPF and investable assets are below the simplified retirement capital benchmark by "+money(shortfall)+".");actions.push("Compare a higher sustainable monthly contribution, a later retirement age, a different retirement budget, and alternative return assumptions.");}
    if(r.dependants>0)actions.push("Review income replacement, critical illness, disability income and hospitalisation arrangements in light of "+r.dependants+" dependant(s).");
    actions.push("Review beneficiary nominations, CPF nominations, wills and lasting power of attorney where appropriate.");
    actions.push("Stress-test the plan using lower returns, higher inflation and a longer retirement horizon before making recommendations.");
    return {monthlySurplus,savingsRate,netWorth,investable,years,projectedInvestments,cpfNow,projectedCpf,targetAtRetirement,incomeGap,capitalNeeded,projectedTotal,shortfall,retirementMonthlyIncome,portfolioAtHorizon,strengths,gaps,actions};
  },[r]);
  function reset(){if(window.confirm("Clear this review from the current session? This cannot be undone.")){setR({...initial,reviewDate:new Date().toISOString().slice(0,10)});setShowReport(false);}}
  function printReport(){setShowReport(true);window.setTimeout(()=>window.print(),200);}
  const reportTitle=r.clientName.trim()||"Client (name not provided)";
  return <main className="fw-app">
    <header className="fw-topbar no-print"><div className="fw-brand"><div className="fw-mark"><Activity size={22}/></div><div><b>finwise</b><span>PRIVATE FINANCIAL REVIEW</span></div></div><div className="fw-top-actions"><span className="fw-private"><LockKeyhole size={14}/> DEVICE-ONLY SESSION</span><button className="fw-btn fw-secondary" onClick={reset}><RotateCcw size={15}/> New review</button><button className="fw-btn fw-primary" onClick={printReport}><FileDown size={15}/> Export client PDF</button></div></header>
    <div className="fw-banner no-print"><ShieldCheck size={18}/><div><b>Privacy-first mode</b><span>Client inputs are processed in this browser session only. This screen does not save client records to a Finwise database. Exported PDFs are saved by you.</span></div><button aria-label="Privacy information" title="Do not use shared/public devices. Clear the review before handing your device to another person." onClick={()=>alert("This review is held in temporary page memory and is not written to a Finwise database. Browser hosting, network logs, device backups, screenshots and exported PDFs are separate considerations. Use a trusted device, avoid public/shared devices, and clear the session after each meeting.")}><CircleHelp size={17}/></button></div>
    <section className="fw-intro no-print"><div><div className="fw-eyebrow">ADVISER WORKSPACE · SINGAPORE</div><h1>Build a clearer financial future.</h1><p>Run a structured review, model retirement readiness and prepare a client-facing report—all without signing in.</p></div><div className="fw-steps"><span><i>1</i> Capture</span><ArrowRight size={14}/><span><i>2</i> Analyse</span><ArrowRight size={14}/><span><i>3</i> Report</span></div></section>
    <section className="fw-metrics no-print">
      <div className="fw-metric"><span>Estimated net worth</span><b>{money(calc.netWorth)}</b><small>Assets less stated loans</small></div>
      <div className="fw-metric"><span>Monthly surplus</span><b className={calc.monthlySurplus<0?"negative":""}>{money(calc.monthlySurplus)}</b><small>{calc.savingsRate.toFixed(1)}% savings rate</small></div>
      <div className="fw-metric"><span>Projected retirement assets</span><b>{money(calc.projectedTotal)}</b><small>At age {r.retirementAge}, under selected assumptions</small></div>
      <div className="fw-metric"><span>Indicative capital gap</span><b className={calc.shortfall>0?"negative":""}>{money(calc.shortfall)}</b><small>Compared with a 25× income-gap benchmark</small></div>
    </section>
    <div className="fw-layout no-print">
      <section className="fw-panel">
        <div className="fw-section-title"><span className="fw-section-icon"><Wallet size={17}/></span><div><h2>1. Client snapshot</h2><p>Use only information needed for this consultation.</p></div></div>
        <div className="fw-form-grid">
          <Field label="Client name (optional)" type="text" value={r.clientName} onChange={v=>update("clientName",v)}/>
          <Field label="Adviser name (optional)" type="text" value={r.adviserName} onChange={v=>update("adviserName",v)}/>
          <Field label="Review date" type="date" value={r.reviewDate} onChange={v=>update("reviewDate",v)}/>
          <Field label="Current age" value={r.age} onChange={v=>update("age",v)}/>
          <SelectField label="Residency status" value={r.residency} options={["Singapore Citizen","Permanent Resident","Employment Pass","S Pass","Other / not specified"]} onChange={v=>update("residency",v)}/>
          <SelectField label="Marital status" value={r.marital} options={["Not specified","Single","Married","Divorced","Widowed"]} onChange={v=>update("marital",v)}/>
          <Field label="Dependants" value={r.dependants} onChange={v=>update("dependants",v)}/>
          <Field label="Monthly household income" value={r.monthlyIncome} onChange={v=>update("monthlyIncome",v)} suffix="SGD"/>
          <Field label="Monthly household expenses" value={r.monthlyExpenses} onChange={v=>update("monthlyExpenses",v)} suffix="SGD"/>
        </div>
      </section>
      <section className="fw-panel">
        <div className="fw-section-title"><span className="fw-section-icon"><Wallet size={17}/></span><div><h2>2. Assets and liabilities</h2><p>Enter balances in SGD. Avoid account numbers or unnecessary identifiers.</p></div></div>
        <div className="fw-form-grid">
          <Field label="Cash / emergency reserves" value={r.cash} onChange={v=>update("cash",v)} suffix="SGD"/>
          <Field label="Investments (excluding CPF)" value={r.investments} onChange={v=>update("investments",v)} suffix="SGD"/>
          <Field label="CPF Ordinary Account (OA)" value={r.cpfOA} onChange={v=>update("cpfOA",v)} suffix="SGD"/>
          <Field label="CPF Special / MediSave" value={r.cpfSA} onChange={v=>update("cpfSA",v)} suffix="SGD"/>
          <Field label="CPF Retirement Account (RA)" value={r.cpfRA} onChange={v=>update("cpfRA",v)} suffix="SGD"/>
          <Field label="Property value (optional)" value={r.property} onChange={v=>update("property",v)} suffix="SGD"/>
          <Field label="Outstanding loans (optional)" value={r.loans} onChange={v=>update("loans",v)} suffix="SGD"/>
          <Field label="Current monthly investments" value={r.monthlyInvestment} onChange={v=>update("monthlyInvestment",v)} suffix="SGD"/>
        </div>
      </section>
      <section className="fw-panel">
        <div className="fw-section-title"><span className="fw-section-icon"><Calculator size={17}/></span><div><h2>3. Retirement assumptions</h2><p>Change the assumptions during the conversation to compare outcomes.</p></div></div>
        <div className="fw-form-grid">
          <Field label="Target retirement age" value={r.retirementAge} onChange={v=>update("retirementAge",v)}/>
          <Field label="Desired monthly retirement income (today's dollars)" value={r.targetIncome} onChange={v=>update("targetIncome",v)} suffix="SGD"/>
          <Field label="Estimated CPF LIFE monthly payout" value={r.cpfLife} onChange={v=>update("cpfLife",v)} suffix="SGD"/>
          <Field label="Other guaranteed retirement income" value={r.otherRetirementIncome} onChange={v=>update("otherRetirementIncome",v)} suffix="SGD"/>
        </div>
        <button className="fw-expand" onClick={()=>setShowAdvanced(v=>!v)}>{showAdvanced?"Hide":"Show"} advanced assumptions <span>{showAdvanced?"−":"+"}</span></button>
        {showAdvanced&&<div className="fw-form-grid fw-advanced">
          <Field label="Illustrative annual investment return" value={r.returnRate} onChange={v=>update("returnRate",v)} suffix="%" step={0.25}/>
          <Field label="Annual inflation assumption" value={r.inflation} onChange={v=>update("inflation",v)} suffix="%" step={0.25}/>
          <Field label="Illustrative annual CPF growth" value={r.cpfGrowth} onChange={v=>update("cpfGrowth",v)} suffix="%" step={0.25}/>
          <Field label="Planning horizon (age)" value={r.retirementHorizon} onChange={v=>update("retirementHorizon",v)}/>
        </div>}
        <div className="fw-result-strip"><div><span>Income target at retirement</span><b>{money(calc.targetAtRetirement)}/mo</b></div><div><span>Income gap after CPF LIFE / other income</span><b>{money(calc.incomeGap)}/mo</b></div><div><span>Simple capital benchmark (25× annual gap)</span><b>{money(calc.capitalNeeded)}</b></div></div>
        <p className="fw-disclaimer">The 25× benchmark is a simplified planning heuristic, not a guarantee or a personalised decumulation model. The projected CPF amount uses the selected growth assumption and does not model CPF account rules, contributions, withdrawals or transfers.</p>
      </section>
      <section className="fw-panel">
        <div className="fw-section-title"><span className="fw-section-icon"><ShieldCheck size={17}/></span><div><h2>4. Protection, priorities and adviser notes</h2><p>Capture the review discussion and practical next steps.</p></div></div>
        <div className="fw-form-grid fw-one-col">
          <Field label="Main client goals" type="text" value={r.goals} onChange={v=>update("goals",v)}/>
          <label className="fw-field"><span>Protection review observations</span><textarea rows={3} value={r.protection} onChange={e=>update("protection",e.target.value)}/></label>
          <label className="fw-field"><span>Additional notes (optional)</span><textarea rows={3} value={r.notes} onChange={e=>update("notes",e.target.value)} placeholder="Record agreed actions; avoid highly sensitive details."/></label>
        </div>
      </section>
    </div>
    <section className="fw-report-preview no-print">
      <div className="fw-section-title"><span className="fw-section-icon"><Sparkles size={17}/></span><div><h2>5. Review findings</h2><p>These findings update automatically as you change inputs.</p></div></div>
      <div className="fw-finding-grid"><div><h3><CheckCircle2 size={16}/> Strengths to discuss</h3>{calc.strengths.length?calc.strengths.map((x,i)=><p key={i}>{x}</p>):<p>Enter the client details to generate findings.</p>}</div><div><h3><Activity size={16}/> Gaps to address</h3>{calc.gaps.length?calc.gaps.map((x,i)=><p key={i}>{x}</p>):<p>No immediate gaps identified by the simplified checks; validate assumptions.</p>}</div></div>
      <div className="fw-actions"><div><h3>Suggested next steps</h3><ol>{calc.actions.map((x,i)=><li key={i}>{x}</li>)}</ol></div><div className="fw-report-cta"><FileDown size={23}/><b>Ready to share</b><p>Generate a print-ready report and choose “Save as PDF” in the print dialog.</p><button className="fw-btn fw-primary" onClick={printReport}><FileDown size={15}/> Prepare client report</button></div></div>
    </section>
    <footer className="fw-footer no-print"><span>Finwise · Private session review</span><span><LockKeyhole size={12}/> No client record is saved by this page</span><button onClick={reset}><Trash2 size={13}/> Clear and start over</button></footer>
    <section className="fw-print-report">
      <header className="fw-report-header"><div className="fw-brand"><div className="fw-mark"><Activity size={22}/></div><div><b>finwise</b><span>FINANCIAL WELLBEING REVIEW</span></div></div><div className="fw-report-meta"><b>CONFIDENTIAL · PREPARED FOR DISCUSSION</b><span>Review date: {r.reviewDate||"Not specified"}</span></div></header>
      <div className="fw-report-title"><span>PERSONAL FINANCIAL REVIEW</span><h1>{reportTitle}</h1><p>{r.residency} · Age {r.age} · {r.marital} · {r.dependants} dependant(s)</p>{r.adviserName&&<p>Prepared by {r.adviserName}</p>}</div>
      <div className="fw-report-stat-grid"><div><span>Estimated net worth</span><b>{money(calc.netWorth)}</b></div><div><span>Monthly surplus</span><b>{money(calc.monthlySurplus)}</b></div><div><span>Retirement assets projected at {r.retirementAge}</span><b>{money(calc.projectedTotal)}</b></div><div><span>Indicative capital gap</span><b>{money(calc.shortfall)}</b></div></div>
      <h2>1. Current financial position</h2><table className="fw-report-table"><tbody><tr><th>Monthly income</th><td>{money(r.monthlyIncome)}</td><th>Monthly expenses</th><td>{money(r.monthlyExpenses)}</td></tr><tr><th>Cash reserves</th><td>{money(r.cash)}</td><th>Investments (non-CPF)</th><td>{money(r.investments)}</td></tr><tr><th>CPF OA</th><td>{money(r.cpfOA)}</td><th>CPF SA / MediSave</th><td>{money(r.cpfSA)}</td></tr><tr><th>CPF RA</th><td>{money(r.cpfRA)}</td><th>Property less loans</th><td>{money(r.property-r.loans)}</td></tr><tr><th>Monthly surplus</th><td>{money(calc.monthlySurplus)}</td><th>Savings rate</th><td>{calc.savingsRate.toFixed(1)}%</td></tr></tbody></table>
      <h2>2. Retirement readiness (illustrative)</h2><table className="fw-report-table"><tbody><tr><th>Target monthly income in today's dollars</th><td>{money(r.targetIncome)}</td><th>Target at retirement after inflation</th><td>{money(calc.targetAtRetirement)}</td></tr><tr><th>Estimated CPF LIFE payout entered</th><td>{money(r.cpfLife)}</td><th>Other retirement income</th><td>{money(r.otherRetirementIncome)}</td></tr><tr><th>Years to retirement</th><td>{calc.years}</td><th>Projected investable assets</th><td>{money(calc.projectedInvestments)}</td></tr><tr><th>Projected CPF balances</th><td>{money(calc.projectedCpf)}</td><th>Capital benchmark (25× annual gap)</th><td>{money(calc.capitalNeeded)}</td></tr><tr><th>Indicative monthly income at 4% draw</th><td>{money(calc.retirementMonthlyIncome)}</td><th>Portfolio at age {r.retirementHorizon}*</th><td>{money(calc.portfolioAtHorizon)}</td></tr></tbody></table>
      <p className="fw-report-note">*Horizon value is a simplified stress indicator using the chosen return rate and a constant retirement income gap. It is not a full year-by-year drawdown model. Contributions, CPF account rules, tax, fees, product charges and changes in spending are not fully modelled.</p>
      <h2>3. Strengths identified</h2><ul>{calc.strengths.map((x,i)=><li key={i}>{x}</li>)}</ul>
      <h2>4. Gaps and considerations</h2><ul>{calc.gaps.map((x,i)=><li key={i}>{x}</li>)}</ul>
      <h2>5. Suggested action plan</h2><ol>{calc.actions.map((x,i)=><li key={i}>{x}</li>)}</ol>
      <h2>6. Client priorities and notes</h2><p><b>Main goals:</b> {r.goals||"Not specified"}</p><p><b>Protection review:</b> {r.protection||"Not specified"}</p><p><b>Additional notes:</b> {r.notes||"None recorded"}</p>
      <h2>7. Singapore CPF reference points (2026)</h2><table className="fw-report-table"><tbody><tr><th>Basic Retirement Sum (BRS)</th><td>$110,200</td><th>Illustrative CPF LIFE payout from 65</th><td>About $950/month</td></tr><tr><th>Full Retirement Sum (FRS)</th><td>$220,400</td><th>Illustrative CPF LIFE payout from 65</th><td>About $1,780/month</td></tr><tr><th>Enhanced Retirement Sum (ERS)</th><td>$440,800</td><th>Illustrative CPF LIFE payout from 65</th><td>About $3,440/month</td></tr></tbody></table>
      <p className="fw-report-note">CPF reference figures are for members turning 55 in 2026 and illustrative CPF LIFE Standard Plan estimates. Actual retirement sums and payouts depend on cohort, plan, age and CPF Board rules. Confirm the client's figures using official CPF tools. Source: <span>cpf.gov.sg</span>.</p>
      <div className="fw-report-disclaimer"><b>Important information</b><p>This report is an educational planning illustration based on inputs and assumptions supplied during a discussion. It is not a guarantee, formal recommendation, product illustration, tax/legal advice or an official CPF calculation. Investment returns are not guaranteed; actual outcomes can be lower and inflation, fees, taxes, withdrawals and longevity can materially affect results. Verify information and suitability before making decisions.</p></div>
      <footer className="fw-report-footer">FINWISE · PRIVATE FINANCIAL REVIEW · Prepared {r.reviewDate||"on date not specified"} · For discussion with the client</footer>
    </section>
    <div className="fw-mobile-actions no-print"><button className="fw-btn fw-primary" onClick={printReport}><FileDown size={16}/> Export PDF</button><button className="fw-btn fw-secondary" onClick={reset}><Plus size={16}/> New review</button></div>
  </main>;
}
