import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, TrendingUp, ArrowLeftRight } from 'lucide-react';

// Mock data for the design polish phase
const headcountData = [
  { name: 'Jan', headcount: 12 },
  { name: 'Feb', headcount: 13 },
  { name: 'Mar', headcount: 13 },
  { name: 'Apr', headcount: 15 },
  { name: 'May', headcount: 17 },
  { name: 'Jun', headcount: 18 },
];

const ReportCard = ({ icon, title, value, bgColor, iconColor }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center border border-gray-200">
        <div className={`p-3 rounded-lg mr-4 ${bgColor}`}>
            {React.cloneElement(icon, { className: `w-6 h-6 ${iconColor}` })}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

function Reporting() {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reporting</h1>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReportCard icon={<Users />} title="Total Headcount" value="20" bgColor="bg-blue-100" iconColor="text-blue-600" />
        <ReportCard icon={<Briefcase />} title="Avg. Tenure" value="2.1 years" bgColor="bg-green-100" iconColor="text-green-600" />
        <ReportCard icon={<TrendingUp />} title="Hires this year" value="4" bgColor="bg-purple-100" iconColor="text-purple-600" />
        <ReportCard icon={<ArrowLeftRight />} title="Turnover Rate" value="5%" bgColor="bg-orange-100" iconColor="text-orange-600" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Headcount Growth</h2>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={headcountData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '0.5rem', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            border: '1px solid #e5e7eb'
                        }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="headcount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Reporting;
