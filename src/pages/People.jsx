import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash, Users, UserCheck, Share2, Building } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import AddEmployeeModal from '../components/AddEmployeeModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import OrgChart from '../components/OrgChart';

const PeopleTab = ({ label, icon, active, onClick }) => ( <button onClick={onClick} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{icon}{label}</button> );
const EmployeeTable = ({ employees, onEdit, onDelete }) => ( <table className="w-full text-left"><thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Employee name</th><th className="p-4 font-semibold text-gray-500 text-sm">Position</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Department</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead><tbody>{employees.map(emp => ( <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="p-4 flex items-center"><img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${emp.name.charAt(0)}`} alt={emp.name} className="w-10 h-10 rounded-full mr-4" /><Link to={`/people/${emp.id}`} className="font-semibold text-gray-800 hover:text-blue-600">{emp.name}</Link></td><td className="p-4 text-gray-700">{emp.position}</td><td className="p-4"><span className={`capitalize text-xs font-bold py-1 px-2 rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{emp.status}</span></td><td className="p-4 text-gray-700">{emp.department}</td><td className="p-4"><div className="flex gap-2"><button onClick={() => onEdit(emp)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16} className="text-gray-600" /></button><button onClick={() => onDelete(emp)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button></div></td></tr> ))}</tbody></table> );

function People() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Directory');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) { setLoading(false); return; }

    const employeesCollection = collection(db, "employees");
    const q = query(employeesCollection, orderBy("name"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const employeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllEmployees(employeesList);
      
      const teamList = employeesList.filter(emp => emp.managerEmail === currentUser.email);
      setMyTeam(teamList);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const departments = useMemo(() => {
    const grouped = {};
    allEmployees.forEach(employee => {
        const dept = employee.department || 'Unassigned';
        if (!grouped[dept]) {
            grouped[dept] = [];
        }
        grouped[dept].push(employee);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allEmployees]);

  const handleEditClick = (employee) => { setSelectedEmployee(employee); setIsEditModalOpen(true); };
  const handleDeleteClick = (employee) => { setSelectedEmployee(employee); setIsDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'employees', selectedEmployee.id));
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) { console.error("Error deleting employee: ", error); } 
    finally { setIsDeleting(false); }
  };

  const renderContent = () => {
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    
    switch(activeTab) {
        case 'My Team':
            return <EmployeeTable employees={myTeam} onEdit={handleEditClick} onDelete={handleDeleteClick} />;
        case 'Org Chart':
            return <OrgChart employees={allEmployees} />;
        case 'Departments':
            return (
                <div className="space-y-6">
                    {departments.map(([deptName, employeesInDept]) => (
                        <div key={deptName}>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{deptName} ({employeesInDept.length})</h3>
                            <div className="space-y-2">
                                {employeesInDept.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center">
                                            <img src={`https://placehold.co/32x32/E2E8F0/4A5568?text=${emp.name.charAt(0)}`} alt={emp.name} className="w-8 h-8 rounded-full mr-3" />
                                            <div>
                                                <Link to={`/people/${emp.id}`} className="font-semibold text-gray-800 hover:text-blue-600">{emp.name}</Link>
                                                <p className="text-xs text-gray-500">{emp.position}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'Directory':
        default:
            return <EmployeeTable employees={allEmployees} onEdit={handleEditClick} onDelete={handleDeleteClick} />;
    }
  };

  return (
    <>
      <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onEmployeeAdded={() => setIsAddModalOpen(false)} />
      <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={selectedEmployee} onEmployeeUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedEmployee?.name} loading={isDeleting} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">People</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"><Plus size={20} className="mr-2" />Employee</button>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <PeopleTab label="Directory" icon={<Users size={16} />} active={activeTab === 'Directory'} onClick={() => setActiveTab('Directory')} />
                <PeopleTab label="My Team" icon={<UserCheck size={16} />} active={activeTab === 'My Team'} onClick={() => setActiveTab('My Team')} />
                <PeopleTab label="Departments" icon={<Building size={16} />} active={activeTab === 'Departments'} onClick={() => setActiveTab('Departments')} />
                <PeopleTab label="Org Chart" icon={<Share2 size={16} />} active={activeTab === 'Org Chart'} onClick={() => setActiveTab('Org Chart')} />
            </div>
            
            {activeTab === 'Directory' || activeTab === 'My Team' ? (
                <div className="p-6">
                    <div className="flex justify-between mb-4">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search employees..." className="pl-10 pr-4 py-2 border rounded-lg w-80 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                        <div><button className="flex items-center text-gray-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100"><Filter size={16} className="mr-2" />Filters</button></div>
                    </div>
                    {renderContent()}
                </div>
            ) : (
                <div className="p-6">{renderContent()}</div>
            )}
        </div>
      </div>
    </>
  );
}

export default People;
