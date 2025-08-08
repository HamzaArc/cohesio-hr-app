import React from 'react';

function Payslip({ payrollRun, employeeData }) {
  if (!payrollRun || !employeeData) return null;

  const grossPay = employeeData.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const netPay = grossPay; // Placeholder for now

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payslip</h1>
          <p className="text-gray-500">For pay period: {payrollRun.periodSpans}</p>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-bold text-blue-600">Cohesio Inc.</h2>
            <p className="text-sm text-gray-500">123 Main Street, Toronto, ON</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Employee Details</h3>
          <p>{employeeData.employeeName}</p>
        </div>
        <div className="text-right">
          <h3 className="font-bold text-gray-700 mb-2">Pay Details</h3>
          <p>Pay Date: {payrollRun.payDay}</p>
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="p-2 text-left text-sm font-semibold text-gray-600">Earnings</th>
            <th className="p-2 text-right text-sm font-semibold text-gray-600">Hours</th>
            <th className="p-2 text-right text-sm font-semibold text-gray-600">Rate</th>
            <th className="p-2 text-right text-sm font-semibold text-gray-600">Amount</th>
          </tr>
        </thead>
        <tbody>
          {employeeData.lineItems.filter(i => i.type === 'Earning').map(item => {
            // --- THE FIX IS HERE ---
            // We now safely convert hours and rate to numbers before formatting.
            const hours = parseFloat(item.hours);
            const rate = parseFloat(item.rate);

            return (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-right">{!isNaN(hours) ? hours.toFixed(2) : '-'}</td>
                <td className="p-2 text-right">{!isNaN(rate) ? `$${rate.toFixed(2)}` : '-'}</td>
                <td className="p-2 text-right">${(item.total || 0).toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between p-2 bg-gray-50 rounded-t-lg">
            <span className="font-semibold text-gray-700">Gross Pay</span>
            <span className="font-bold text-gray-800">${grossPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between p-2">
            <span className="font-semibold text-gray-700">Net Pay</span>
            <span className="font-bold text-xl text-green-600">${netPay.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payslip;
