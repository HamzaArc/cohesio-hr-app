import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Check, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

// --- Finalize Payroll Modal Component ---
const FinalizePayrollModal = ({ isOpen, onClose, onConfirm, loading, periodLabel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4"><AlertTriangle size={40} className="text-green-600" /></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Finalize Payroll?</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to finalize the payroll for <span className="font-bold">{periodLabel}</span>? This action cannot be undone and will generate payslips.</p>
        <div className="flex justify-center gap-4"><button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button><button onClick={onConfirm} disabled={loading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center gap-2"><Check size={16} />{loading ? 'Finalizing...' : 'Yes, Finalize'}</button></div>
      </div>
    </div>
  );
};

// --- Payroll Configuration & Helpers ---
const PAYROLL_SETTINGS = { currency: "MAD", locale: "fr-MA", cnss: { rate: 0.0448, monthlyCeiling: 6000 }, amo: { rate: 0.0226, monthlyCeiling: null }, irBrackets: [ { min: 0, max: 2500.00, rate: 0.00, deduction: 0.0 }, { min: 2500.01, max: 4166.67, rate: 0.10, deduction: 250.00 }, { min: 4166.68, max: 5000.00, rate: 0.20, deduction: 666.67 }, { min: 5000.01, max: 6666.67, rate: 0.30, deduction: 1166.67 }, { min: 6666.68, max: 15000.00, rate: 0.34, deduction: 1833.33 }, { min: 15000.01, max: Infinity, rate: 0.38, deduction: 3333.33 }, ] };
const formatCurrency = (n) => new Intl.NumberFormat(PAYROLL_SETTINGS.locale, { style: "currency", currency: PAYROLL_SETTINGS.currency, maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
const formatNumber = (n) => new Intl.NumberFormat(PAYROLL_SETTINGS.locale, { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
function parseMoney(input) { if (typeof input === "number") return input; if (!input) return 0; const s = String(input).trim().replace(/\s/g, "").replace(/,(?=\d{1,2}$)/, "."); const val = parseFloat(s); return Number.isFinite(val) ? val : 0; }

// --- Reusable UI Components ---
const InputMoney = ({ value, onCommit }) => {
  const [localValue, setLocalValue] = useState(formatNumber(value));
  useEffect(() => { setLocalValue(formatNumber(value)); }, [value]);
  const handleBlur = () => { const parsed = parseMoney(localValue); onCommit(parsed); setLocalValue(formatNumber(parsed)); };
  return (<div className="relative w-full"><input className="w-full px-2 py-1.5 pr-12 text-right rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" inputMode="decimal" value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /><span className="absolute inset-y-0 right-2 flex items-center text-gray-400 text-xs font-semibold">{PAYROLL_SETTINGS.currency}</span></div>);
};
const SummaryCard = ({ totals, onSave, onFinalize, isSaving, isValid }) => ( <div className="rounded-xl border bg-white p-6 sticky top-8 shadow-sm"><h2 className="text-lg font-bold text-gray-800 mb-4">Summary</h2><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Total Gross Pay</span><span className="font-medium">{formatCurrency(totals.gross)}</span></div><div className="flex justify-between text-gray-600"><span>- CNSS</span><span>{formatCurrency(totals.cnss)}</span></div><div className="flex justify-between text-gray-600"><span>- AMO</span><span>{formatCurrency(totals.amo)}</span></div><div className="flex justify-between text-gray-600"><span>- IR</span><span>{formatCurrency(totals.ir)}</span></div><div className="flex justify-between text-gray-600"><span>- Other Deductions</span><span>{formatCurrency(totals.otherDeductions)}</span></div><div className="flex justify-between text-xl pt-3 border-t mt-3"><span>Net Pay</span><span className="font-bold">{formatCurrency(totals.net)}</span></div></div><div className="mt-6 space-y-2"><button onClick={onSave} disabled={isSaving} className="w-full py-2.5 rounded-lg bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 flex items-center justify-center gap-2"><Save size={16}/> {isSaving ? 'Saving...' : 'Save Draft'}</button><button onClick={onFinalize} disabled={isSaving || !isValid} className="w-full py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"><Check size={16}/> Finalize Payroll</button>{!isValid && <p className="text-xs text-red-600 text-center flex items-center gap-2 mt-2"><AlertTriangle size={14}/> Cannot finalize with negative net pay.</p>}</div></div> );
const SettingsInfoCard = ({ title, children }) => ( <div className="p-4 rounded-xl bg-gray-50 border"><div className="text-gray-500 text-sm font-medium">{title}</div><div className="mt-1">{children}</div></div> );

function RunPayroll() {
  const { runId } = useParams();
  const { employees, loading: employeesLoading, companyId } = useAppContext();
  const [payrollRun, setPayrollRun] = useState(null);
  const [employeeData, setEmployeeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const navigate = useNavigate();

  const computeRow = useCallback((data) => {
    const grossPay = (data.baseSalary || 0) + (data.bonuses || 0); // Simplified for this example
    const cnssBase = Math.min(grossPay, PAYROLL_SETTINGS.cnss.monthlyCeiling);
    const cnss = cnssBase * PAYROLL_SETTINGS.cnss.rate;
    const amo = grossPay * PAYROLL_SETTINGS.amo.rate;
    const taxableIncome = Math.max(0, grossPay - cnss - amo);
    let ir = 0;
    for (const bracket of PAYROLL_SETTINGS.irBrackets) { if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) { ir = (taxableIncome * bracket.rate) - bracket.deduction; break; } }
    ir = Math.max(0, ir);
    const totalDeductions = cnss + amo + ir + (data.otherDeductions || 0);
    const netPay = grossPay - totalDeductions;
    return { grossPay, cnss, amo, ir, netPay };
  }, []);

  useEffect(() => {
    if (!runId || !companyId) { setLoading(false); return; }
    const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
    const unsubscribe = onSnapshot(runRef, (docSnap) => {
        if (docSnap.exists()) {
            const run = { id: docSnap.id, ...docSnap.data() };
            setPayrollRun(run);
            if (employees.length > 0 && Object.keys(employeeData).length === 0) {
                const initialData = {};
                employees.forEach(emp => {
                    const baseSalary = emp.monthlyGrossSalary || (emp.compensation?.includes('/year') ? parseFloat(emp.compensation.replace(/[^0-9.]/g, '')) / 12 : 0);
                    initialData[emp.id] = run.employeeData?.[emp.id] || { baseSalary, bonuses: 0, otherDeductions: 0 };
                });
                setEmployeeData(initialData);
            }
        } else { navigate('/payroll'); }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [runId, companyId, employees, navigate, employeeData]);

  const handleDataChange = useCallback((empId, field, value) => { setEmployeeData(prev => ({ ...prev, [empId]: { ...prev[empId], [field]: value } })); }, []);

  const { employeeTotals, companyTotals, isPayrollValid } = useMemo(() => {
    const totals = {};
    let companyGross = 0, companyCnss = 0, companyAmo = 0, companyIr = 0, companyOther = 0, companyNet = 0;
    let isValid = true;
    Object.keys(employeeData).forEach(empId => {
        const data = employeeData[empId];
        const computed = computeRow(data);
        totals[empId] = computed;
        companyGross += computed.grossPay; companyCnss += computed.cnss; companyAmo += computed.amo; companyIr += computed.ir; companyOther += data.otherDeductions || 0; companyNet += computed.netPay;
        if (computed.netPay < 0) isValid = false;
    });
    return { employeeTotals: totals, companyTotals: { gross: companyGross, cnss: companyCnss, amo: companyAmo, ir: companyIr, otherDeductions: companyOther, net: companyNet }, isPayrollValid: isValid };
  }, [employeeData, computeRow]);

  const handleSaveDraft = async () => { if (!companyId) return; setIsSaving(true); const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId); await updateDoc(runRef, { employeeData }); setIsSaving(false); };
  const handleFinalize = () => { if (!isPayrollValid) return; setIsFinalizeModalOpen(true); };
  const handleConfirmFinalize = async () => { if (!companyId || !isPayrollValid) return; setIsSaving(true); const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId); await updateDoc(runRef, { employeeData, status: 'Finalized', totalGrossPay: companyTotals.gross, totalNetPay: companyTotals.net, finalizedAt: serverTimestamp() }); setIsFinalizeModalOpen(false); navigate(`/payroll/records/${runId}`); };

  if (loading || employeesLoading) { return <div className="p-8">Loading Payroll Worksheet...</div>; }

  return (
    <>
      <FinalizePayrollModal isOpen={isFinalizeModalOpen} onClose={() => setIsFinalizeModalOpen(false)} onConfirm={handleConfirmFinalize} loading={isSaving} periodLabel={payrollRun?.periodLabel} />
      <div className="min-h-screen bg-gray-50">
        <header className="max-w-screen-2xl mx-auto px-6 py-6"><Link to="/payroll" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"><ArrowLeft size={16}/> Back to Payroll Hub</Link><h1 className="text-2xl font-bold mt-2">Run Payroll: {payrollRun?.periodLabel}</h1></header>
        <main className="max-w-screen-2xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-6">
            <div className="rounded-xl border bg-white overflow-hidden shadow-sm"><div className="max-w-full overflow-x-auto"><table className="w-full table-fixed text-sm"><colgroup><col className="w-[24%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[8%]" /><col className="w-[8%]" /><col className="w-[8%]" /><col className="w-[12%]" /><col className="w-[16%]" /></colgroup><thead className="sticky top-0 bg-gray-50 z-10"><tr className="text-xs uppercase tracking-wide text-gray-500"><th className="text-left px-3 py-3">Employee</th><th className="text-right px-2 py-3">Base Salary</th><th className="text-right px-2 py-3">Bonuses</th><th className="text-right px-2 py-3">CNSS</th><th className="text-right px-2 py-3">AMO</th><th className="text-right px-2 py-3">IR</th><th className="text-right px-2 py-3">Other Deductions</th><th className="text-right px-3 py-3">Net Pay</th></tr></thead><tbody className="divide-y divide-gray-200">{employees.map(emp => { const data = employeeData[emp.id] || {}; const computed = employeeTotals[emp.id] || {}; const isInvalid = computed.netPay < 0; return ( <tr key={emp.id} className={`hover:bg-gray-50 ${isInvalid ? 'bg-red-50' : ''}`}><td className="px-3 py-2 align-middle font-semibold text-gray-800">{emp.name}</td><td className="px-2 py-2 align-middle"><InputMoney value={data.baseSalary} onCommit={(v) => handleDataChange(emp.id, 'baseSalary', v)} /></td><td className="px-2 py-2 align-middle"><InputMoney value={data.bonuses} onCommit={(v) => handleDataChange(emp.id, 'bonuses', v)} /></td><td className="px-2 py-2 text-right align-middle text-gray-600">{formatCurrency(computed.cnss)}</td><td className="px-2 py-2 text-right align-middle text-gray-600">{formatCurrency(computed.amo)}</td><td className="px-2 py-2 text-right align-middle text-gray-600">{formatCurrency(computed.ir)}</td><td className="px-2 py-2 align-middle"><InputMoney value={data.otherDeductions} onCommit={(v) => handleDataChange(emp.id, 'otherDeductions', v)} /></td><td className={`px-3 py-2 text-right align-middle font-bold ${isInvalid ? 'text-red-600' : 'text-gray-800'}`}>{formatCurrency(computed.netPay)}</td></tr> )})}</tbody></table></div></div>
            <section className="rounded-xl border bg-white p-6 shadow-sm"><h3 className="font-bold text-gray-800 mb-4">Rules and Settings</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><SettingsInfoCard title="CNSS (taux / plafond)"><div className="font-medium text-gray-800">{(PAYROLL_SETTINGS.cnss.rate * 100).toFixed(2)}% / {PAYROLL_SETTINGS.cnss.monthlyCeiling ? formatCurrency(PAYROLL_SETTINGS.cnss.monthlyCeiling) : "—"}</div></SettingsInfoCard><SettingsInfoCard title="AMO (taux / plafond)"><div className="font-medium text-gray-800">{(PAYROLL_SETTINGS.amo.rate * 100).toFixed(2)}% / {PAYROLL_SETTINGS.amo.monthlyCeiling ? formatCurrency(PAYROLL_SETTINGS.amo.monthlyCeiling) : "—"}</div></SettingsInfoCard><div className="md:col-span-2"><SettingsInfoCard title="Monthly IR Scales (with rapid reduction)"><ul className="mt-1 text-xs text-gray-700 list-disc pl-4 space-y-1">{PAYROLL_SETTINGS.irBrackets.map(({min, max, rate, deduction}, idx) => ( <li key={idx}>{formatCurrency(min)} – {isFinite(max) ? formatCurrency(max) : "∞"}: <span className="font-semibold">{(rate*100).toFixed(0)}%</span> − {formatCurrency(deduction)}</li> ))}</ul></SettingsInfoCard></div></div></section>
          </div>
          <div className="lg:col-span-3"><SummaryCard totals={companyTotals} onSave={handleSaveDraft} onFinalize={handleFinalize} isSaving={isSaving} isValid={isPayrollValid} /></div>
        </main>
      </div>
    </>
  );
}

export default RunPayroll;