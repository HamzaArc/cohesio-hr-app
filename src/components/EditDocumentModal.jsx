import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Link, User, Users } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const documentCategories = ["Policy", "Handbook", "Contract", "Form", "Training Material", "Other"];

function EditDocumentModal({ isOpen, onClose, document: docToEdit, onDocumentUpdated }) {
  const { employees, companyId } = useAppContext();
  const [name, setName] = useState('');
  const [fileURL, setFileURL] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [category, setCategory] = useState('Policy');
  const [description, setDescription] = useState('');
  const [assignedEmails, setAssignedEmails] = useState([]);
  const [assignmentType, setAssignmentType] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && docToEdit) {
        setName(docToEdit.name || '');
        setFileURL(docToEdit.fileURL || '');
        setExpirationDate(docToEdit.expirationDate || '');
        setCategory(docToEdit.category || 'Policy');
        setDescription(docToEdit.description || '');
        setAssignmentType(docToEdit.assignedTo?.type || 'all');
        setAssignedEmails(docToEdit.assignedTo?.emails || []);
    }
  }, [isOpen, docToEdit]);

  const handleEmployeeToggle = (email) => {
    setAssignedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !fileURL || !companyId) {
      setError('Please provide a name and a document link.');
      return;
    }
    setLoading(true);
    setError('');

    try {
        const docRef = doc(db, 'companies', companyId, 'documents', docToEdit.id);
        const currentAcks = docToEdit.acknowledgments || [];
        
        let finalAssignedEmails = [];
        if (assignmentType === 'all') {
            finalAssignedEmails = employees.map(e => e.email);
        } else {
            finalAssignedEmails = assignedEmails;
        }

        const newAcks = finalAssignedEmails.map(email => {
            const existingAck = currentAcks.find(ack => ack.userEmail === email);
            return existingAck || { userEmail: email, status: 'Pending', timestamp: null, notes: '' };
        });

        await updateDoc(docRef, {
            name,
            fileURL,
            category,
            description,
            assignedTo: {
                type: assignmentType,
                emails: assignmentType === 'specific' ? assignedEmails : []
            },
            expirationDate: expirationDate || null,
            acknowledgments: newAcks
        });
      
      onDocumentUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update document. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !docToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Document</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Document Name</label><input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option disabled>Select a category</option>{documentCategories.map(cat => <option key={cat}>{cat}</option>)}</select></div>
            </div>
            <div><label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea></div>
            <div><label htmlFor="fileURL" className="block text-sm font-medium text-gray-700">Document Link</label><div className="relative mt-1"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Link className="h-5 w-5 text-gray-400" /></div><input type="url" id="fileURL" value={fileURL} onChange={(e) => setFileURL(e.target.value)} placeholder="https://..." className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm p-2" /></div></div>
            <div><label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date (Optional)</label><input type="date" id="expirationDate" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <div className="mt-2 flex rounded-lg border border-gray-300">
                <button type="button" onClick={() => setAssignmentType('all')} className={`flex-1 p-2 rounded-l-md text-sm flex items-center justify-center gap-2 ${assignmentType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><Users size={16}/>All Employees</button>
                <button type="button" onClick={() => setAssignmentType('specific')} className={`flex-1 p-2 rounded-r-md text-sm flex items-center justify-center gap-2 ${assignmentType === 'specific' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><User size={16}/>Specific Employees</button>
              </div>
            </div>

            {assignmentType === 'specific' && (
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                    <input type="checkbox" id={`edit-emp-${emp.id}`} checked={assignedEmails.includes(emp.email)} onChange={() => handleEmployeeToggle(emp.email)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor={`edit-emp-${emp.id}`} className="ml-3 text-sm text-gray-700">{emp.name}</label>
                  </div>
                ))}
              </div>
            )}
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

export default EditDocumentModal;