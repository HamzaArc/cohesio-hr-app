import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import { Building, MapPin, Calendar, User } from 'lucide-react';
import CompanyProfileTab from '../components/CompanyProfileTab';

const MainTab = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>
        {label}
    </button>
);

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
  const { companyId } = useAppContext();
  const [locations, setLocations] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Profile');

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const companyDocRef = doc(db, 'companies', companyId);
    const unsubCompany = onSnapshot(companyDocRef, (docSnap) => {
        if(docSnap.exists() && docSnap.data().locations) {
            setLocations(docSnap.data().locations);
        }
    });

    const holidaysColRef = collection(db, 'companies', companyId, 'policies', 'timeOff', 'holidays');
    const unsubHolidays = onSnapshot(holidaysColRef, (snapshot) => {
        setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });

    return () => {
        unsubCompany();
        unsubHolidays();
    };
  }, [companyId]);

  if (loading) {
      return <div className="p-8">Loading Company Info...</div>;
  }

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Company Settings</h1>
      </header>
      
       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex flex-wrap">
                <MainTab label="Company Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
                <MainTab label="Locations & Holidays" active={activeTab === 'Locations'} onClick={() => setActiveTab('Locations')} />
            </div>

            {activeTab === 'Profile' && <CompanyProfileTab />}
            
            {activeTab === 'Locations' && (
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <InfoCard icon={<Building />} title="Locations">
                        {locations.length > 0 ? locations.map(loc => (
                            <div key={loc.name} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                <p className="font-semibold text-gray-700">{loc.name}</p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" /> {loc.address}
                                </p>
                            </div>
                        )) : <p className="text-gray-500">No locations have been set up.</p>}
                    </InfoCard>

                    <InfoCard icon={<Calendar />} title="Public Holidays">
                        {holidays.length > 0 ? holidays.map(holiday => (
                            <div key={holiday.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                                <p className="font-semibold text-gray-700">{holiday.name}</p>
                                <p className="text-sm text-gray-600">{holiday.date}</p>
                            </div>
                        )) : <p className="text-gray-500">No public holidays have been added.</p>}
                    </InfoCard>
                </div>
            )}
       </div>
    </div>
  );
}

export default Company;