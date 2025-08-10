import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext'; // Import our new hook

function EditEmployeeModal({ isOpen, onClose, employee, onEmployeeUpdated }) {
  const { employees } = useAppContext(); // Use the global state
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        position: employee.position || '',
        department: employee.department || '',
        hireDate: employee.hireDate || '',
        status: employee.status || 'active',
        phone: employee.phone || '',
        gender: employee.gender || '',
        compensation: employee.compensation || '',
        employmentType: employee.employmentType || 'Full-time',
        managerEmail: employee.managerEmail || '',
        vacationBalance: employee.vacationBalance ?? 15,
        sickBalance: employee.sickBalance ?? 5,
        personalBalance: employee.personalBalance ?? 3,
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const employeeRef = doc(db, 'employees', employee.id);
      const dataToUpdate = {
        ...formData,
        vacationBalance: Number(formData.vacationBalance),
        sickBalance: Number(formData.sickBalance),
        personalBalance: Number(formData.personalBalance),
      };
      await updateDoc(employeeRef, dataToUpdate);
      onEmployeeUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update employee. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  // Exclude the current employee from the list of potential managers
  const potentialManagers = employees.filter(e => e.id !== employee.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Employee</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label><input type="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (Work)</label><input type="tel" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label><input type="text" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Job Information</h3>
            <div><label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label><input type="text" id="position" value={formData.position} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label><input type="text" id="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">Hire Date</label><input type="date" id="hireDate" value={formData.hireDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label><select id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="active">Active</option><option value="onboarding">Onboarding</option></select></div>
            <div><label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">Employment Type</label><input type="text" id="employmentType" value={formData.employmentType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="compensation" className="block text-sm font-medium text-gray-700">Compensation</label><input type="text" id="compensation" value={formData.compensation} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div className="md:col-span-2"><label htmlFor="managerEmail" className="block text-sm font-medium text-gray-700">Reports To</label><select id="managerEmail" value={formData.managerEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">No Manager</option>{potentialManagers.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}</select></div>

            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Time Off Balances</h3>
            <div><label htmlFor="vacationBalance" className="block text-sm font-medium text-gray-700">Vacation Days</label><input type="number" id="vacationBalance" value={formData.vacationBalance} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="sickBalance" className="block text-sm font-medium text-gray-700">Sick Days</label><input type="number" id="sickBalance" value={formData.sickBalance} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            <div><label htmlFor="personalBalance" className="block text-sm font-medium text-gray-700">Personal Days</label><input type="number" id="personalBalance" value={formData.personalBalance} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmployeeModal;
