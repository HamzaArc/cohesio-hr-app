import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Check, Plus, Trash2, Banknote } from 'lucide-react';

const Step = ({ number, label, isActive }) => ( <div className="flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{isActive ? <Check size={20} /> : number}</div><p className={`ml-3 font-semibold ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>{label}</p></div> );
const parseDateString = (dateString) => { try { const date = new Date(dateString); if (isNaN(date.getTime())) throw new Error(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().split('T')[0]; } catch (e) { console.error("Invalid date string:", dateString); return null; }};

function RunPayroll() {
  const { payPeriodId } = useParams();
  const [payPeriod, setPayPeriod] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (!payPeriodId) { setLoading(false); return; }
    const payPeriodRef = doc(db, 'payPeriods', payPeriodId);
    const unsubPayPeriod = onSnapshot(payPeriodRef, (docSnap) => {
        if (docSnap.exists()) {
            const periodData = { id: docSnap.id, ...docSnap.data() };
            setPayPeriod(periodData);
            if (payrollData.length === 0) {
                fetchPayrollData(periodData);
            }
        } else { setLoading(false); }
    });
    return () => unsubPayPeriod();
  }, [payPeriodId]);

  const fetchPayrollData = async (period) => {
    try {
        const employeesQuery = query(collection(db, 'employees'));
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeeList = employeesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

        const startDate = parseDateString(period.periodSpans.split(' – ')[0]);
        const endDate = parseDateString(period.periodSpans.split(' – ')[1]);
        if (!startDate || !endDate) throw new Error("Could not parse pay period dates.");

        const timeEntriesQuery = query(collection(db, 'timeTrackingEntries'), where('status', '==', 'Approved'), where('date', '>=', startDate), where('date', '<=', endDate));
        const timeOffQuery = query(collection(db, 'timeOffRequests'), where('status', '==', 'Approved'), where('startDate', '<=', endDate), where('endDate', '>=', startDate));
        const [timeEntriesSnapshot, timeOffSnapshot] = await Promise.all([ getDocs(timeEntriesQuery), getDocs(timeOffQuery) ]);
        const timeEntries = timeEntriesSnapshot.docs.map(doc => doc.data());
        const timeOffRequests = timeOffSnapshot.docs.map(doc => doc.data());

        const calculatedData = employeeList.map(emp => {
            const empTimeEntries = timeEntries.filter(e => e.userEmail === emp.email);
            const empTimeOff = timeOffRequests.filter(r => r.userEmail === emp.email);
            const regularHours = empTimeEntries.filter(e => e.hourType === 'Regular Hours').reduce((sum, e) => sum + e.hours, 0);
            const overtimeHours = empTimeEntries.filter(e => e.hourType === 'Overtime').reduce((sum, e) => sum + e.hours, 0);
            const ptoHours = empTimeOff.reduce((sum, r) => sum + (r.totalDays * 8), 0);
            
            let hourlyRate = 0;
            if (emp.compensation) {
                const compValue = parseFloat(emp.compensation.replace(/[^0-9.-]+/g,""));
                if (!isNaN(compValue)) {
                    if (emp.compensation.includes('/hour')) {
                        hourlyRate = compValue;
                    } else if (emp.compensation.includes('/year')) {
                        hourlyRate = compValue / 2080;
                    }
                }
            }
            
            return {
                employeeId: emp.id, employeeName: emp.name, hourlyRate,
                lineItems: [
                    { id: 1, type: 'Earning', description: 'Regular Hours', hours: regularHours, rate: hourlyRate, total: regularHours * hourlyRate },
                    { id: 2, type: 'Earning', description: 'Overtime', hours: overtimeHours, rate: hourlyRate * 1.5, total: overtimeHours * hourlyRate * 1.5 },
                    { id: 3, type: 'Earning', description: `Paid Time Off (${empTimeOff[0]?.leaveType || ''})`, hours: ptoHours, rate: hourlyRate, total: ptoHours * hourlyRate },
                ].filter(item => item.hours > 0)
            };
        });
        setPayrollData(calculatedData);
    } catch (error) {
        console.error("Failed to fetch payroll data:", error);
        alert(`An error occurred while fetching payroll data: ${error.message}.`);
    } finally {
        setLoading(false);
    }
  };

  const handleDataChange = (employeeId, lineItemId, field, value) => {
    setPayrollData(prevData => prevData.map(emp => {
        if (emp.employeeId === employeeId) {
            const newLineItems = emp.lineItems.map(item => {
                if (item.id === lineItemId) {
                    const newValues = { ...item, [field]: value };
                    if (field === 'hours' || field === 'rate') {
                        newValues.total = (Number(newValues.hours) || 0) * (Number(newValues.rate) || 0);
                    } else if (field === 'total') {
                        newValues.total = Number(value);
                    }
                    return newValues;
                }
                return item;
            });
            return { ...emp, lineItems: newLineItems };
        }
        return emp;
    }));
  };

  const addLineItem = (employeeId, type) => {
    setPayrollData(prevData => prevData.map(emp => {
        if (emp.employeeId === employeeId) {
            const newLineItem = { id: Date.now(), type, description: '', hours: 0, rate: 0, total: 0 };
            return { ...emp, lineItems: [...emp.lineItems, newLineItem] };
        }
        return emp;
    }));
  };

  const removeLineItem = (employeeId, lineItemId) => {
    setPayrollData(prevData => prevData.map(emp => {
        if (emp.employeeId === employeeId) {
            return { ...emp, lineItems: emp.lineItems.filter(item => item.id !== lineItemId) };
        }
        return emp;
    }));
  };

  const totalGrossPay = payrollData.reduce((total, emp) => {
    return total + emp.lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, 0);
  const totalTaxes = 0; // Placeholder
  const totalNetPay = totalGrossPay - totalTaxes;

  const handleRunPayroll = async () => {
    setLoading(true);
    try {
        const runData = {
            payPeriodId: payPeriod.id,
            periodSpans: payPeriod.periodSpans,
            payDay: payPeriod.payDay,
            totalGrossPay,
            totalNetPay,
            employeePayData: payrollData,
            runAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'payrollRuns'), runData);

        const payPeriodRef = doc(db, 'payPeriods', payPeriodId);
        await updateDoc(payPeriodRef, { state: 'PAID' });
        
        navigate('/payroll');
    } catch (error) {
        console.error("Error finalizing payroll:", error);
        alert("Failed to run payroll. Please try again.");
        setLoading(false);
    }
  };

  if (loading) { return <div className="p-8">Loading Payroll Run...</div>; }
  if (!payPeriod) { return <div className="p-8">Pay Period not found.</div>; }

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/payroll" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Payroll</Link>
        <h1 className="text-3xl font-bold text-gray-800">Run Payroll: {payPeriod.periodSpans}</h1>
      </header>

      <div className="flex justify-between items-center mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <Step number={1} label="Review Pay" isActive={activeStep >= 1} />
        <div className="flex-1 h-px bg-gray-200 mx-4"></div>
        <Step number={2} label="Confirm & Run" isActive={activeStep >= 2} />
      </div>

      {activeStep === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1: Review & Make Adjustments</h2>
            <p className="text-sm text-gray-600 mb-6">Review each employee's pay for the period. You can add bonuses, commissions, or other adjustments below.</p>
            <div className="space-y-6">
                {payrollData.map(emp => {
                    const grossPay = emp.lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                    return (
                        <div key={emp.employeeId} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-800">{emp.employeeName}</h3>
                                <div className="text-right"><p className="text-sm text-gray-500">Gross Pay</p><p className="font-bold text-xl text-green-600">${grossPay.toFixed(2)}</p></div>
                            </div>
                            <div className="space-y-2">
                                {emp.lineItems.map(item => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5"><input type="text" value={item.description} onChange={e => handleDataChange(emp.employeeId, item.id, 'description', e.target.value)} className="w-full p-1 border rounded-md text-sm" /></div>
                                        <div className="col-span-2"><input type="number" value={item.hours} onChange={e => handleDataChange(emp.employeeId, item.id, 'hours', e.target.value)} className="w-full p-1 border rounded-md text-sm" placeholder="Hours" /></div>
                                        <div className="col-span-2"><input type="number" value={item.rate} onChange={e => handleDataChange(emp.employeeId, item.id, 'rate', e.target.value)} className="w-full p-1 border rounded-md text-sm" placeholder="Rate" /></div>
                                        <div className="col-span-2"><input type="text" value={(Number(item.total) || 0).toFixed(2)} onChange={e => handleDataChange(emp.employeeId, item.id, 'total', e.target.value)} className="w-full p-1 border rounded-md text-sm bg-gray-50" placeholder="Total" /></div>
                                        <div className="col-span-1"><button onClick={() => removeLineItem(emp.employeeId, item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button></div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => addLineItem(emp.employeeId, 'Earning')} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/>Add Earning</button>
                                <button onClick={() => addLineItem(emp.employeeId, 'Deduction')} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/>Add Deduction</button>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-6 flex justify-between items-center">
                <button onClick={() => navigate('/payroll')} className="text-sm font-semibold text-gray-600 hover:underline">Cancel</button>
                <button onClick={() => setActiveStep(2)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">Continue to Final Confirmation</button>
            </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
                <div className="mx-auto bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Banknote size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Ready to Run Payroll?</h2>
                <p className="text-gray-600 mt-2 mb-6">Please review the final totals below before confirming.</p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center"><p className="text-gray-600">Total Gross Pay</p><p className="font-bold text-lg text-gray-800">${totalGrossPay.toFixed(2)}</p></div>
                <div className="flex justify-between items-center"><p className="text-gray-600">Total Taxes (Placeholder)</p><p className="font-bold text-lg text-gray-800">${totalTaxes.toFixed(2)}</p></div>
                <hr/>
                <div className="flex justify-between items-center"><p className="font-bold text-gray-800">Total Net Pay</p><p className="font-bold text-xl text-green-600">${totalNetPay.toFixed(2)}</p></div>
            </div>
            <div className="mt-8 flex justify-between items-center">
                <button onClick={() => setActiveStep(1)} className="text-sm font-semibold text-gray-600 hover:underline">&larr; Back to Review</button>
                <button onClick={handleRunPayroll} disabled={loading} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm disabled:bg-green-400">
                    {loading ? 'Saving...' : 'Confirm & Run Payroll'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
}

export default RunPayroll;
