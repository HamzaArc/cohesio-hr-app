import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import PayrollSettings from '../components/PayrollSettings';
import RunSpecificMonthModal from '../components/RunSpecificMonthModal';

const PayrollTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function Payroll() {
  const { companyId } = useAppContext();
  const [activeTab, setActiveTab] = useState('Run Payroll');
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSpecificMonthModalOpen, setIsSpecificMonthModalOpen] = useState(false);
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const payrollRunsQuery = query(collection(db, 'companies', companyId, 'payrollRuns'), orderBy('period', 'desc'));
    const unsubscribe = onSnapshot(payrollRunsQuery, (snap) => {
        const runs = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), runAt: doc.data().finalizedAt?.toDate().toLocaleDateString() }));
        setPayrollRuns(runs);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  const nextPayrollPeriod = useMemo(() => {
      const latestFinalized = payrollRuns
          .filter(r => r.status === 'Finalized')
          .sort((a, b) => b.period.localeCompare(a.period))[0];

      let nextDate = new Date();
      if (latestFinalized) {
          const [year, month] = latestFinalized.period.split('-');
          nextDate = new Date(Number(year), Number(month) - 1, 1);
          nextDate.setMonth(nextDate.getMonth() + 1);
      }
      
      return {
          month: String(nextDate.getMonth() + 1).padStart(2, '0'),
          year: nextDate.getFullYear(),
          label: `${nextDate.toLocaleString('default', { month: 'long' })} ${nextDate.getFullYear()}`
      };
  }, [payrollRuns]);

  const handleStartPayroll = async (month, year) => {
    if (!companyId) return;
    setIsCreating(true);
    const periodId = `${year}-${month}`;
    const periodLabel = `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;
    
    const payrollRunsRef = collection(db, "companies", companyId, "payrollRuns");
    const q = query(payrollRunsRef, where("period", "==", periodId));
    const existingRun = await getDocs(q);
    
    if (!existingRun.empty) {
        navigate(`/payroll/run/${existingRun.docs[0].id}`);
    } else {
        const newRun = {
            period: periodId,
            periodLabel: periodLabel,
            status: 'Draft',
            createdAt: serverTimestamp(),
            employeeData: {}
        };
        const docRef = await addDoc(payrollRunsRef, newRun);
        navigate(`/payroll/run/${docRef.id}`);
    }
    setIsCreating(false);
    setIsSpecificMonthModalOpen(false);
  };

  const handleActionClick = (run) => {
    if (run.status === 'Draft') {
        navigate(`/payroll/run/${run.id}`);
    } else {
        navigate(`/payroll/records/${run.id}`);
    }
  };
  
  const renderContent = () => {
      if (loading) return <div className="p-4 text-center">Loading...</div>;
      
      const isRunCreatedForNextPeriod = payrollRuns.some(run => run.period === `${nextPayrollPeriod.year}-${nextPayrollPeriod.month}`);

      switch(activeTab) {
          case 'Settings':
              return <PayrollSettings />;
          case 'Run Payroll':
          default:
            return (
                <div>
                    <div className="p-6 bg-blue-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Run Payroll for {nextPayrollPeriod.label}</h2>
                            <p className="text-sm text-gray-600">Finalize this month's payroll to generate payslips for your employees.</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsSpecificMonthModalOpen(true)}
                                className="bg-white text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 border border-gray-300 flex items-center shadow-sm">
                                <CalendarIcon size={16} className="mr-2"/> Run for a Specific Month
                            </button>
                            <button 
                                onClick={() => handleStartPayroll(nextPayrollPeriod.month, nextPayrollPeriod.year)}
                                disabled={isCreating}
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:bg-blue-400"
                            >
                                {isCreating ? 'Starting...' : isRunCreatedForNextPeriod ? 'Continue Payroll' : 'Start Payroll'}
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-700 mb-4">Payroll History</h3>
                        {payrollRuns.length === 0 ? ( <p className="text-center text-gray-500 py-8">No previous payroll runs found.</p> ) 
                        : (
                            <table className="w-full text-left">
                                <thead><tr className="border-b"><th className="p-4 font-semibold text-gray-500 text-sm">Period</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Finalized On</th><th className="p-4 font-semibold text-gray-500 text-sm">Total Pay</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                                <tbody>
                                    {payrollRuns.map(run => (
                                        <tr key={run.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-800">{run.periodLabel}</td>
                                            <td className="p-4">
                                                <span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full ${run.status === 'Finalized' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {run.status === 'Finalized' ? <CheckCircle size={14} className="mr-1.5"/> : <Clock size={14} className="mr-1.5"/>}
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-700">{run.runAt || 'N/A'}</td>
                                            <td className="p-4 font-semibold text-gray-800">${(Number(run.totalNetPay) || 0).toFixed(2)}</td>
                                            <td className="p-4">
                                                <button onClick={() => handleActionClick(run)} className="p-2 hover:bg-gray-200 rounded-full">
                                                    <Eye size={16} className="text-gray-600" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            );
      }
  }

  return (
    <>
      <RunSpecificMonthModal 
        isOpen={isSpecificMonthModalOpen} 
        onClose={() => setIsSpecificMonthModalOpen(false)} 
        onRun={handleStartPayroll}
        existingRuns={payrollRuns}
      />
      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Payroll</h1>
        </header>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-2 flex">
              <PayrollTab label="Run Payroll" active={activeTab === 'Run Payroll'} onClick={() => setActiveTab('Run Payroll')} />
              <PayrollTab label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
}

export default Payroll;