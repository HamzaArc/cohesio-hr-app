import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, User, Briefcase, AtSign, Calendar } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function QuickAddEmployeeModal({ isOpen, onClose, onEmployeeAdded }) {
  const { companyId } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.position || !formData.hireDate) {
      setError('All fields are required for a quick add.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const docRef = await addDoc(collection(db, 'companies', companyId, 'employees'), {
        ...formData,
        status: 'Onboarding',
        department: '',
        employmentType: 'Full-time',
        compensation: '',
        managerEmail: '',
        vacationBalance: 15,
        sickBalance: 5,
        personalBalance: 3,
      });
      onEmployeeAdded(docRef.id);
      handleClose();
    } catch (err) {
      setError('Failed to add employee. Please check the email is unique.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', position: '', hireDate: new Date().toISOString().split('T')[0] });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Quick Add Employee</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Get your new hire into the system with just the essentials. You can fill out their full profile later.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div><input id="name" type="text" value={formData.name} onChange={handleChange} required className="w-full pl-10 p-2 border border-gray-300 rounded-md"/></div>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Work Email</label>
                <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><AtSign className="h-5 w-5 text-gray-400" /></div><input id="email" type="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 p-2 border border-gray-300 rounded-md"/></div>
            </div>
             <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position / Title</label>
                <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Briefcase className="h-5 w-5 text-gray-400" /></div><input id="position" type="text" value={formData.position} onChange={handleChange} required className="w-full pl-10 p-2 border border-gray-300 rounded-md"/></div>
            </div>
            <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">Hire Date</label>
                <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-gray-400" /></div><input id="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required className="w-full pl-10 p-2 border border-gray-300 rounded-md"/></div>
            </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-6 pt-4 border-t flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Adding...' : 'Add & Finish Later'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickAddEmployeeModal;