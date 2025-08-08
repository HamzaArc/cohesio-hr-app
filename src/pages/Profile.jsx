import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Edit2 } from 'lucide-react';
import EditEmployeeModal from '../components/EditEmployeeModal';

const ProfileTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );
const InfoSection = ({ title, children, onEdit }) => ( <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">{title}</h3>{onEdit && <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:underline">Edit</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{children}</div></div> );
const InfoField = ({ label, value }) => ( <div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value ?? 'N/A'}</p></div> );

function Profile() {
  const [activeTab, setActiveTab] = useState('Personal');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) { setLoading(false); return; }

    setLoading(true);
    const employeesRef = collection(db, 'employees');
    const q = query(employeesRef, where("email", "==", currentUser.email));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setEmployee({ id: doc.id, ...doc.data() });
      } else {
        setEmployee(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8">Loading Your Profile...</div>;
  if (!employee) return <div className="p-8">Could not find an employee profile linked to your account.</div>;

  return (
    <>
      <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={employee} onEmployeeUpdated={() => setIsEditModalOpen(false)} />
      
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/4">
             <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-200 sticky top-8">
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <img src={`https://placehold.co/100x100/E2E8F0/4A5568?text=${employee.name.charAt(0)}`} alt={employee.name} className="w-24 h-24 rounded-full" />
                    <button onClick={() => setIsEditModalOpen(true)} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 border border-gray-200"><Edit2 size={16} className="text-gray-600"/></button>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
                <p className="text-gray-500 mb-4">{employee.position}</p>
                <div className="text-sm text-gray-600 space-y-2 text-left border-t border-gray-100 pt-4">
                    <p><span className="font-semibold">Status:</span> {employee.status}</p>
                    <p><span className="font-semibold">Email:</span> <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">{employee.email || 'N/A'}</a></p>
                </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
              <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm flex items-center px-2">
                  <ProfileTab label="Personal" active={activeTab === 'Personal'} onClick={() => setActiveTab('Personal')} />
                  <ProfileTab label="Job & Pay" active={activeTab === 'Job & Pay'} onClick={() => setActiveTab('Job & Pay')} />
                  <ProfileTab label="Time Off" active={activeTab === 'Time Off'} onClick={() => setActiveTab('Time Off')} />
              </div>
              <div className="mt-0">
                  {activeTab === 'Personal' && ( <InfoSection title="Basic information" onEdit={() => setIsEditModalOpen(true)}><InfoField label="Full Name" value={employee.name} /><InfoField label="Email" value={employee.email} /><InfoField label="Phone (Work)" value={employee.phone} /><InfoField label="Gender" value={employee.gender} /></InfoSection> )}
                  {activeTab === 'Job & Pay' && ( <InfoSection title="Employment information" onEdit={() => setIsEditModalOpen(true)}><InfoField label="Hire date" value={employee.hireDate} /><InfoField label="Department" value={employee.department} /><InfoField label="Position" value={employee.position} /><InfoField label="Employment Type" value={employee.employmentType} /><InfoField label="Compensation" value={employee.compensation} /></InfoSection> )}
                  {activeTab === 'Time Off' && ( <InfoSection title="Time Off Balances" onEdit={() => setIsEditModalOpen(true)}><InfoField label="Vacation" value={`${employee.vacationBalance} days`} /><InfoField label="Sick Days" value={`${employee.sickBalance} days`} /><InfoField label="Personal Days" value={`${employee.personalBalance} days`} /></InfoSection> )}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
