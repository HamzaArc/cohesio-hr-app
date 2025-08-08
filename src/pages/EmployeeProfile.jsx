import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, DollarSign, ArrowUp, Briefcase } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot, deleteDoc, collection, query, orderBy } from 'firebase/firestore';
import EditEmployeeModal from '../components/EditEmployeeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import AddJourneyEventModal from '../components/AddJourneyEventModal';

const ProfileTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );
const InfoSection = ({ title, children, onEdit }) => ( <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">{title}</h3>{onEdit && <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:underline">Edit</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{children}</div></div> );
const InfoField = ({ label, value }) => ( <div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value || 'N/A'}</p></div> );

function EmployeeProfile() {
  const [activeTab, setActiveTab] = useState('Personal');
  const [employee, setEmployee] = useState(null);
  const [journey, setJourney] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { employeeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    const docRef = doc(db, "employees", employeeId);
    const unsubscribeEmployee = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setEmployee({ id: docSnap.id, ...docSnap.data() });
      else setEmployee(null);
      setLoading(false);
    });

    const journeyColRef = collection(db, "employees", employeeId, "journey");
    const q = query(journeyColRef, orderBy("date", "desc"));
    const unsubscribeJourney = onSnapshot(q, (snapshot) => {
        setJourney(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})))
    });

    return () => {
        unsubscribeEmployee();
        unsubscribeJourney();
    };
  }, [employeeId]);
  
  const handleDelete = async () => { /* ... */ };
  const getJourneyIcon = (type) => { /* ... */ };

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!employee) return <div className="p-8">Employee not found.</div>;

  return (
    <>
      <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={employee} onEmployeeUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} employeeName={employee.name} loading={isDeleting} />
      <AddJourneyEventModal isOpen={isJourneyModalOpen} onClose={() => setIsJourneyModalOpen(false)} onEventAdded={() => setIsJourneyModalOpen(false)} employeeId={employee.id} />

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
            <Link to="/people" className="text-sm text-blue-600 font-semibold inline-block hover:underline">&larr; Back to People</Link>
            <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center text-sm text-red-600 bg-red-100 hover:bg-red-200 font-semibold py-2 px-4 rounded-lg"><Trash2 size={16} className="mr-2" />Delete Employee</button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/4">
             <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-200 sticky top-8">
                <div className="relative w-24 h-24 mx-auto mb-4"><img src={`https://placehold.co/100x100/E2E8F0/4A5568?text=${employee.name.charAt(0)}`} alt={employee.name} className="w-24 h-24 rounded-full" /><button onClick={() => setIsEditModalOpen(true)} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 border border-gray-200"><Edit2 size={16} className="text-gray-600"/></button></div>
                <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
                <p className="text-gray-500 mb-4">{employee.position}</p>
                <div className="text-sm text-gray-600 space-y-2 text-left border-t border-gray-100 pt-4"><p><span className="font-semibold">Status:</span> {employee.status}</p><p><span className="font-semibold">Email:</span> <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">{employee.email || 'N/A'}</a></p></div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
              <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm flex items-center px-2">
                  <ProfileTab label="Personal" active={activeTab === 'Personal'} onClick={() => setActiveTab('Personal')} />
                  <ProfileTab label="Job & Pay" active={activeTab === 'Job & Pay'} onClick={() => setActiveTab('Job & Pay')} />
                  <ProfileTab label="Journey" active={activeTab === 'Journey'} onClick={() => setActiveTab('Journey')} />
              </div>
              <div className="mt-0">
                  {activeTab === 'Personal' && ( <InfoSection title="Basic information" onEdit={() => setIsEditModalOpen(true)}><InfoField label="Full Name" value={employee.name} /><InfoField label="Email" value={employee.email} /><InfoField label="Phone (Work)" value={employee.phone} /><InfoField label="Gender" value={employee.gender} /><InfoField label="Pronouns" value={employee.pronouns} /></InfoSection> )}
                  {activeTab === 'Job & Pay' && ( <InfoSection title="Employment information" onEdit={() => setIsEditModalOpen(true)}><InfoField label="Hire date" value={employee.hireDate} /><InfoField label="Department" value={employee.department} /><InfoField label="Position" value={employee.position} /><InfoField label="Employment Type" value={employee.employmentType} /><InfoField label="Compensation" value={employee.compensation} /></InfoSection> )}
                  {activeTab === 'Journey' && (
                    <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Journey</h3>
                            <button onClick={() => setIsJourneyModalOpen(true)} className="flex items-center text-sm text-white bg-blue-600 hover:bg-blue-700 font-semibold py-2 px-3 rounded-lg shadow-sm"><Plus size={16} className="mr-2" />Add Event</button>
                        </div>
                        <div className="relative border-l-2 border-gray-200 pl-6 space-y-6">
                            {journey.length > 0 ? journey.map(event => (
                                <div key={event.id} className="relative">
                                    <div className="absolute -left-[34px] top-1 w-4 h-4 bg-white border-2 border-gray-300 rounded-full"></div>
                                    <p className="text-sm text-gray-500">{event.date}</p>
                                    <div className="flex items-center mt-1">
                                        <div className="p-1 bg-gray-100 rounded-full mr-3">{getJourneyIcon(event.type)}</div>
                                        <div><p className="font-bold text-gray-800">{event.type}</p><p className="text-gray-600">{event.details}</p></div>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500">No journey events have been logged for this employee.</p>}
                        </div>
                    </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeProfile;
