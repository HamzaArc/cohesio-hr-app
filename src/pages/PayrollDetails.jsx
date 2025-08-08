import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Payslip from '../components/Payslip'; // We will use our payslip component here

function PayrollDetails() {
  const { runId } = useParams();
  const [payrollRun, setPayrollRun] = useState(null);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      return;
    }
    const runRef = doc(db, 'payrollRuns', runId);
    const unsubscribe = onSnapshot(runRef, (docSnap) => {
      if (docSnap.exists()) {
        setPayrollRun({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Payroll run not found!");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [runId]);

  if (loading) {
    return <div className="p-8">Loading Payroll Record...</div>;
  }

  if (!payrollRun) {
    return <div className="p-8">Payroll Record not found.</div>;
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/payroll" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Payroll Records</Link>
        <h1 className="text-3xl font-bold text-gray-800">Payroll Record</h1>
        <p className="text-gray-500">For pay period: {payrollRun.periodSpans}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Employee List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 self-start">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Employees ({payrollRun.employeePayData.length})</h2>
          <div className="space-y-2">
            {payrollRun.employeePayData.map(empData => (
              <button 
                key={empData.employeeId} 
                onClick={() => setSelectedEmployeeData(empData)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedEmployeeData?.employeeId === empData.employeeId ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-50'}`}
              >
                {empData.employeeName}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Payslip Viewer */}
        <div className="lg:col-span-2">
          {selectedEmployeeData ? (
            <Payslip payrollRun={payrollRun} employeeData={selectedEmployeeData} />
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Select an employee to view their payslip.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayrollDetails;
