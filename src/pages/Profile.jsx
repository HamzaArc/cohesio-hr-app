import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Edit2, DollarSign, Briefcase, User, Users, Home, Phone, Shield, Plus, journey, Plane, Heart, Sun, FileText, Lock, Building, List, Flag, Mail, Clock, Calendar } from 'lucide-react';
import EditEmployeeModal from '../components/EditEmployeeModal';
import OnboardingPlan from '../components/OnboardingPlan';
import SkillsAndCerts from '../components/SkillsAndCerts';
import { useAppContext } from '../contexts/AppContext';
import PersonalDocumentsTab from '../components/PersonalDocumentsTab';
import CompanyDocumentsTab from '../components/CompanyDocumentsTab';
import PrivateNotes from '../components/PrivateNotes';
import AddJourneyEventModal from '../components/AddJourneyEventModal';


const ProfileTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`} > {label} </button> );
const InfoSection = ({ title, children, onEdit }) => ( <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">{title}</h3>{onEdit && <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:underline">Edit</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">{children}</div></div> );
const InfoField = ({ icon, label, value }) => ( <div className="flex items-start"><div className="flex-shrink-0 w-6 text-gray-400 pt-0.5">{icon}</div><div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value || 'N/A'}</p></div></div> );

function Profile() {
  const { companyId, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('Job');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser || !companyId) { setLoading(false); return; }
    setLoading(true);
    const employeesRef = collection(db, 'companies', companyId, 'employees');
    const q = query(employeesRef, where("email", "==", currentUser.email));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setEmployee({ id: doc.id, ...doc.data() });
      } else { setEmployee(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, companyId]);

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
                <div className="relative w-24 h-24 mx-auto mb-4"><img src={`https://placehold.co/100x100/E2E8F0/4A5568?text=${employee.name.charAt(0)}`} alt={employee.name} className="w-24 h-24 rounded-full" /><button onClick={() => setIsEditModalOpen(true)} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 border border-gray-200"><Edit2 size={16} className="text-gray-600"/></button></div>
                <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
                <p className="text-gray-500 mb-4">{employee.position}</p>
                <div className="text-sm text-gray-600 space-y-2 text-left border-t border-gray-100 pt-4"><p><span className="font-semibold">Status:</span> <span className={`capitalize font-medium ${employee.status === 'active' ? 'text-green-700' : 'text-yellow-700'}`}>{employee.status}</span></p><p><span className="font-semibold">Email:</span> <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">{employee.email || 'N/A'}</a></p></div>
            </div>
          </div>
          <div className="w-full lg:w-3/4">
              <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm"><div className="flex items-center px-2 overflow-x-auto"><ProfileTab label="Job" active={activeTab === 'Job'} onClick={() => setActiveTab('Job')} /><ProfileTab label="Personal" active={activeTab === 'Personal'} onClick={() => setActiveTab('Personal')} /><ProfileTab label="Legal & Identity" active={activeTab === 'Legal & Identity'} onClick={() => setActiveTab('Legal & Identity')} /><ProfileTab label="Time Off" active={activeTab === 'Time Off'} onClick={() => setActiveTab('Time Off')} /><ProfileTab label="My Documents" active={activeTab === 'My Documents'} onClick={() => setActiveTab('My Documents')} /><ProfileTab label="Download Work Documents" active={activeTab === 'Company Documents'} onClick={() => setActiveTab('Company Documents')} /><ProfileTab label="Onboarding" active={activeTab === 'Onboarding'} onClick={() => setActiveTab('Onboarding')} /><ProfileTab label="Skills" active={activeTab === 'Skills'} onClick={() => setActiveTab('Skills')} /><ProfileTab label="Notes" active={activeTab === 'Notes'} onClick={() => setActiveTab('Notes')} /><ProfileTab label="Journey" active={activeTab === 'Journey'} onClick={() => setActiveTab('Journey')} /></div></div>
              <div className="mt-6">
                  {activeTab === 'Job' && (
                    <div className="space-y-6">
                        <InfoSection title="Employment Details" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<Briefcase size={16} />} label="Position" value={employee.position} /><InfoField icon={<Users size={16} />} label="Department" value={employee.department} /><InfoField icon={<Briefcase size={16} />} label="Employment Type" value={employee.employmentType} /><InfoField icon={<Users size={16} />} label="Reports To" value={employee.managerEmail} /><InfoField icon={<FileText size={16}/>} label="Contract Type" value={employee.contractType} /><InfoField icon={<Calendar size={16}/>} label="Contract End Date" value={employee.contractEndDate} /><InfoField icon={<Clock size={16}/>} label="Weekly Hours" value={employee.weeklyHours} /><InfoField icon={<Home size={16}/>} label="Work Mode" value={employee.workMode} /></InfoSection>
                        <InfoSection title="Compensation" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<FileText size={16} />} label="Monthly Gross Salary" value={employee.monthlyGrossSalary ? `${employee.monthlyGrossSalary} MAD` : 'N/A'} /></InfoSection>
                    </div>
                  )}
                  {activeTab === 'Personal' && (
                    <div className="space-y-6">
                        <InfoSection title="Contact Information" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<Phone size={16} />} label="Phone (Work)" value={employee.phone} /><InfoField icon={<Home size={16} />} label="Address" value={employee.address} /><InfoField icon={<Mail size={16} />} label="Personal Email" value={employee.personalEmail} /></InfoSection>
                        <InfoSection title="Personal Details" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<Calendar size={16} />} label="Date of Birth" value={employee.dateOfBirth} /><InfoField icon={<Users size={16} />} label="Marital Status" value={employee.maritalStatus} /><InfoField icon={<Flag size={16} />} label="Nationality" value={employee.nationality} /></InfoSection>
                        <InfoSection title="Emergency Contact" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<User size={16} />} label="Contact Name" value={employee.emergencyContactName} /><InfoField icon={<Shield size={16} />} label="Relationship" value={employee.emergencyContactRelationship} /><InfoField icon={<Phone size={16} />} label="Contact Phone" value={employee.emergencyContactPhone} /></InfoSection>
                        <InfoSection title="Family Information" onEdit={() => setIsEditModalOpen(true)}>
                            <div className="md:col-span-3">
                                <h4 className="text-sm font-bold text-gray-600 mb-2">Children ({employee.kids?.length || 0})</h4>
                                {employee.kids && employee.kids.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {employee.kids.map((kid, index) => <li key={index}>{kid.name} (Age: {kid.age})</li>)}
                                    </ul>
                                ) : <p className="text-sm text-gray-500">No children listed.</p>}
                            </div>
                            <div className="md:col-span-3">
                                <h4 className="text-sm font-bold text-gray-600 mb-2 mt-4">Parents ({employee.parents?.length || 0})</h4>
                                {employee.parents && employee.parents.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {employee.parents.map((parent, index) => <li key={index}>{parent.name} (Age: {parent.age})</li>)}
                                    </ul>
                                ) : <p className="text-sm text-gray-500">No parents listed.</p>}
                            </div>
                        </InfoSection>
                    </div>
                  )}
                  {activeTab === 'Legal & Identity' && (
                    <div className="space-y-6">
                      <InfoSection title="Legal Identity (Morocco)" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<User size={16} />} label="National ID (CNIE)" value={employee.nationalId} /><InfoField icon={<Calendar size={16} />} label="CNIE Expiry Date" value={employee.cnieExpiryDate} /></InfoSection>
                      <InfoSection title="Social Security (Morocco)" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<FileText size={16} />} label="CNSS Number" value={employee.cnssNumber} /><InfoField icon={<Calendar size={16} />} label="CNSS Enrollment Date" value={employee.cnssEnrollmentDate} /><InfoField icon={<Heart size={16} />} label="AMO Scheme" value={employee.amoScheme} /><InfoField icon={<Building size={16} />} label="CIMR Enrollment" value={employee.cimrEnrollment ? 'Yes' : 'No'} /><InfoField icon={<Users size={16} />} label="CIMR Rate" value={employee.cimrRate ? `${employee.cimrRate}%` : 'N/A'} /></InfoSection>
                      <InfoSection title="Banking Information" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<FileText size={16} />} label="RIB" value={employee.rib} /><InfoField icon={<Building size={16} />} label="Bank Branch" value={employee.bankBranch} /></InfoSection>
                    </div>
                  )}
                  {activeTab === 'Time Off' && (<div className="space-y-6"><InfoSection title="Time Off Balances" onEdit={() => setIsEditModalOpen(true)}><InfoField icon={<Plane size={16} />} label="Vacation" value={`${employee.vacationBalance} days`} /><InfoField icon={<Heart size={16} />} label="Sick Days" value={`${employee.sickBalance} days`} /><InfoField icon={<Sun size={16} />} label="Personal Days" value={`${employee.personalBalance} days`} /></InfoSection></div>)}
                  {activeTab === 'My Documents' && <PersonalDocumentsTab employeeId={employee.id} />}
                  {activeTab === 'Company Documents' && <CompanyDocumentsTab employee={employee} />}
                  {activeTab === 'Onboarding' && (<div><OnboardingPlan employeeId={employee.id} /></div>)}
                  {activeTab === 'Skills' && (<div><SkillsAndCerts employeeId={employee.id} /></div>)}
                  {activeTab === 'Notes' && (<div><PrivateNotes employeeId={employee.id} /></div>)}
                  {activeTab === 'Journey' && (<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Career Journey</h3><button onClick={() => setIsJourneyModalOpen(true)} className="flex items-center text-sm text-white bg-blue-600 hover:bg-blue-700 font-semibold py-2 px-3 rounded-lg shadow-sm"><Plus size={16} className="mr-2" />Add Event</button></div><div className="relative border-l-2 border-gray-200 pl-6 space-y-6">{journey.length > 0 ? journey.map(event => (<div key={event.id} className="relative"><div className="absolute -left-[34px] top-1 w-4 h-4 bg-white border-2 border-blue-600 rounded-full"></div><p className="text-sm text-gray-500">{event.date}</p><div className="flex items-center mt-1"><div className="p-1.5 bg-gray-100 rounded-full mr-3">{getJourneyIcon(event.type)}</div><div><p className="font-bold text-gray-800">{event.type}</p><p className="text-gray-600">{event.details}</p></div></div></div>)) : <p className="text-gray-500">No journey events have been logged for this employee.</p>}</div></div>)}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;