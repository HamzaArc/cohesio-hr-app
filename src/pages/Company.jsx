import React from 'react';
import { Building, MapPin, Calendar } from 'lucide-react';

// Mock data for the design polish phase
const locations = [
    { name: 'Head Office', address: '123 Main Street, Toronto, ON, Canada' },
    { name: 'Store Front Wicker Park', address: '456 Park Ave, Chicago, IL, USA' },
];

const holidays = [
    { name: 'New Year\'s Day', date: 'Jan 1, 2025' },
    { name: 'Family Day', date: 'Feb 17, 2025' },
    { name: 'Good Friday', date: 'Apr 18, 2025' },
    { name: 'Victoria Day', date: 'May 19, 2025' },
];

const InfoCard = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
            {React.cloneElement(icon, { className: "w-6 h-6 mr-3 text-blue-600"})}
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

function Company() {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Company</h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InfoCard icon={<Building />} title="Locations">
            {locations.map(loc => (
                <div key={loc.name} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="font-semibold text-gray-700">{loc.name}</p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" /> {loc.address}
                    </p>
                </div>
            ))}
        </InfoCard>

        <InfoCard icon={<Calendar />} title="Holidays 2025">
            {holidays.map(holiday => (
                <div key={holiday.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="font-semibold text-gray-700">{holiday.name}</p>
                    <p className="text-sm text-gray-600">{holiday.date}</p>
                </div>
            ))}
        </InfoCard>
      </div>
    </div>
  );
}

export default Company;
