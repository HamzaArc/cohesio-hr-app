import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import { Plus, Trash2, FileText, X, Calendar, AlertCircle, Info, Eye } from 'lucide-react';
import useFileUpload from '../hooks/useFileUpload';

const documentTypes = [
  'Attestation de RIB',
  'Copie CIN',
  'Copie carte CNSS',
  'Contrat',
  'Assurance maladie contrat',
  'Diplômes',
  'Autres'
];

function AddDocumentModal({ isOpen, onClose, employeeId, onDocumentAdded }) {
  const { companyId } = useAppContext();
  const { uploading, progress, error, uploadFile } = useFileUpload();
  const [documentType, setDocumentType] = useState('Attestation de RIB');
  const [otherDescription, setOtherDescription] = useState('');
  const [file, setFile] = useState(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setFormError('Please select a file to upload.');
      return;
    }
    if (documentType === 'Autres' && !otherDescription) {
      setFormError('Please provide a description for the document.');
      return;
    }
    setFormError('');

    try {
      const fileURL = await uploadFile(file, `personal-documents/${companyId}/${employeeId}`);
      const documentsRef = collection(db, 'companies', companyId, 'employees', employeeId, 'personalDocuments');
      await addDoc(documentsRef, {
        type: documentType,
        description: documentType === 'Autres' ? otherDescription : null,
        fileName: file.name,
        fileURL,
        expirationDate: expirationDate || null,
        notes: notes,
        createdAt: serverTimestamp(),
      });

      onDocumentAdded();
      handleClose();
    } catch (err) {
      setFormError('Failed to add document. Please try again.');
      console.error(err);
    }
  };

  const handleClose = () => {
    setDocumentType('Attestation de RIB');
    setOtherDescription('');
    setFile(null);
    setExpirationDate('');
    setNotes('');
    setFormError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Document</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">Document Type</label>
            <select id="documentType" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          {documentType === 'Autres' && (
            <div>
              <label htmlFor="otherDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <input type="text" id="otherDescription" value={otherDescription} onChange={(e) => setOtherDescription(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          )}
          <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">File</label>
              <input type="file" id="file" onChange={(e) => setFile(e.target.files[0])} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date (Optional)</label>
            <input type="date" id="expirationDate" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {uploading && <div className="mt-4"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div><p className="text-sm text-center">Uploading... {Math.round(progress)}%</p></div>}
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={uploading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {uploading ? 'Uploading...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PersonalDocumentsTab({ employeeId }) {
  const { companyId } = useAppContext();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!employeeId || !companyId) return;
    const documentsRef = collection(db, 'companies', companyId, 'employees', employeeId, 'personalDocuments');
    const q = query(documentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [employeeId, companyId]);

  const handleDelete = async (docToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${docToDelete.fileName}?`)) return;
    try {
      await deleteDoc(doc(db, 'companies', companyId, 'employees', employeeId, 'personalDocuments', docToDelete.id));
    } catch (error) {
      console.error("Error deleting document record:", error);
      alert("Failed to delete document record.");
    }
  };

  return (
    <>
      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        employeeId={employeeId}
        onDocumentAdded={() => setIsAddModalOpen(false)}
      />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">My Documents</h3>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center text-sm text-white bg-blue-600 hover:bg-blue-700 font-semibold py-2 px-3 rounded-lg shadow-sm">
            <Plus size={16} className="mr-2" />
            Add Document
          </button>
        </div>
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-500">No personal documents have been logged.</p>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center">
                  <FileText size={20} className="mr-3 text-gray-400" />
                  <div>
                    <a href={doc.fileURL} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 hover:underline">
                      {doc.type === 'Autres' ? doc.description : doc.type}
                    </a>
                    <p className="text-xs text-gray-500">{doc.fileName}</p>
                    {doc.expirationDate && (
                      <p className={`text-xs flex items-center mt-1 ${new Date(doc.expirationDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        <Calendar size={14} className="mr-1.5" />
                        Expires: {doc.expirationDate}
                        {new Date(doc.expirationDate) < new Date() && <AlertCircle size={14} className="ml-1.5" />}
                      </p>
                    )}
                     {doc.notes && <p className="text-xs text-gray-500 mt-1 italic">Note: {doc.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href={doc.fileURL} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-full" title="View Document">
                        <Eye size={16} className="text-gray-600" />
                    </a>
                    <button onClick={() => handleDelete(doc)} className="p-2 hover:bg-gray-200 rounded-full">
                        <Trash2 size={16} className="text-red-600" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default PersonalDocumentsTab;