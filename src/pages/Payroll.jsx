import React, { useState, useEffect } from 'react';
import { Plus, PlayCircle, Eye } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CreateOffCyclePayrollModal from '../components/CreateOffCyclePayrollModal';
import PayrollSettings from '../components/PayrollSettings';

const PayrollTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function Payroll() {
  const [activeTab, setActiveTab] = useState('Run Payroll');
  const [payPeriods, setPayPeriods] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffCycleModalOpen, setIsOffCycleModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    let payPeriodsLoaded = false;
    let payrollRunsLoaded = false;

    const checkLoading = () => {
        if (payPeriodsLoaded && payrollRunsLoaded) { setLoading(false); }
    }

    const payPeriodsQuery = query(collection(db, 'payPeriods'), orderBy('period'));
    const unsubPayPeriods = onSnapshot(payPeriodsQuery, (snap) => {
      setPayPeriods(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      payPeriodsLoaded = true;
      checkLoading();
    });

    const payrollRunsQuery = query(collection(db, 'payrollRuns'), orderBy('runAt', 'desc'));
    const unsubPayrollRuns = onSnapshot(payrollRunsQuery, (snap) => {
        const runs = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), runAt: doc.data().runAt?.toDate().toLocaleDateString() }));
        setPayrollRuns(runs);
        payrollRunsLoaded = true;
        checkLoading();
    });

    return () => { unsubPayPeriods(); unsubPayrollRuns(); };
  }, []);

  const handleRunPayrollClick = (payPeriod) => {
    if (payPeriod.state === 'OPEN') { navigate(`/payroll/run/${payPeriod.id}`); }
  };

  const handleViewRunClick = (runId) => { navigate(`/payroll/records/${runId}`); };

  const renderContent = () => {
      if (loading) return <div className="p-4 text-center">Loading...</div>;
      switch(activeTab) {
          case 'Settings':
              return <PayrollSettings />;
          case 'Records':
              return (
                <div>
                    {payrollRuns.length === 0 ? ( <p className="text-center text-gray-500 p-8">No payroll records found.</p> ) 
                    : (
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Pay Period</th><th className="p-4 font-semibold text-gray-500 text-sm">Pay Day</th><th className="p-4 font-semibold text-gray-500 text-sm">Date Run</th><th className="p-4 font-semibold text-gray-500 text-sm">Total Pay</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                            <tbody>
                                {payrollRuns.map(run => (
                                    <tr key={run.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                        <td className="p-4 text-gray-700">{run.periodSpans}</td>
                                        <td className="p-4 text-gray-700">{run.payDay}</td>
                                        <td className="p-4 text-gray-700">{run.runAt || 'N/A'}</td>
                                        <td className="p-4 font-semibold text-gray-800">${(Number(run.totalNetPay) || 0).toFixed(2)}</td>
                                        <td className="p-4"><button onClick={() => handleViewRunClick(run.id)} className="p-2 hover:bg-gray-200 rounded-full"><Eye size={16} className="text-gray-600" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
              );
          case 'Run Payroll':
          default:
              return (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Period</th><th className="p-4 font-semibold text-gray-500 text-sm">Period spans</th><th className="p-4 font-semibold text-gray-500 text-sm">Pay day</th><th className="p-4 font-semibold text-gray-500 text-sm">State</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                    <tbody>
                        {payPeriods.map(p => (
                        <tr key={p.id} className={`border-b border-gray-100 last:border-b-0 ${p.state === 'OPEN' ? 'hover:bg-gray-50 cursor-pointer' : ''}`} onClick={() => handleRunPayrollClick(p)}>
                            <td className="p-4 text-gray-700">{p.period}</td>
                            <td className="p-4 text-gray-700">{p.periodSpans}</td>
                            <td className="p-4 text-gray-700">{p.payDay}</td>
                            <td className="p-4"><span className={`text-xs font-bold py-1 px-2 rounded-full ${p.state === 'PAID' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>{p.state}</span></td>
                            <td className="p-4">{p.state === 'OPEN' && (<button className="flex items-center text-sm text-blue-600 font-semibold"><PlayCircle size={16} className="mr-2"/>Run Payroll</button>)}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
              );
      }
  }

  return (
    <>
      <CreateOffCyclePayrollModal isOpen={isOffCycleModalOpen} onClose={() => setIsOffCycleModalOpen(false)} onPayrollRun={() => setIsOffCycleModalOpen(false)} />
      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Payroll</h1>
          <button onClick={() => setIsOffCycleModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            Create Off-Cycle Payroll
          </button>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-2 flex">
              <PayrollTab label="Run Payroll" active={activeTab === 'Run Payroll'} onClick={() => setActiveTab('Run Payroll')} />
              <PayrollTab label="Records" active={activeTab === 'Records'} onClick={() => setActiveTab('Records')} />
              <PayrollTab label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
          </div>
          
          <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    </>
  );
}

export default Payroll;
