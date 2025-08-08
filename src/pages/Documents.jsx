import React, { useState, useEffect } from 'react';
import { Plus, Folder, Edit, Trash, Eye, CheckSquare } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import AddDocumentModal from '../components/AddDocumentModal';
import EditDocumentModal from '../components/EditDocumentModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    const documentsCollection = collection(db, 'documents');
    const q = query(documentsCollection, orderBy('created', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const isExpired = data.expirationDate && new Date(data.expirationDate) < new Date();
        return {
          id: doc.id,
          ...data,
          created: data.created?.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) || 'N/A',
          isExpired: isExpired,
        }
      });
      setDocuments(documentsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAcknowledge = async (docId) => {
    if (!currentUser) return;
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, {
        acknowledgedBy: arrayUnion(currentUser.email)
    });
  };

  const getAssignedToText = (assignedTo) => {
    if (!assignedTo) return 'N/A';
    if (assignedTo.type === 'all') return 'All Employees';
    if (assignedTo.emails && assignedTo.emails.length > 0) {
        return `${assignedTo.emails.length} specific employee(s)`;
    }
    return 'Specific Employees';
  };
  
  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (doc) => {
    setSelectedDocument(doc);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'documents', selectedDocument.id));
      setIsDeleteModalOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AddDocumentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onDocumentAdded={() => setIsAddModalOpen(false)} />
      <EditDocumentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} document={selectedDocument} onDocumentUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedDocument?.name} loading={isDeleting} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            Add Document
          </button>
        </header>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-500 text-sm">Name</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Assigned To</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">My Status</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Doc Status</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>) 
              : documents.map(doc => {
                  const hasAcknowledged = doc.acknowledgedBy?.includes(currentUser.email);
                  return (
                    <tr key={doc.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-800 flex items-center"><Folder className="w-5 h-5 mr-3 text-gray-400" />{doc.name}</td>
                      <td className="p-4 text-gray-700">{getAssignedToText(doc.assignedTo)}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${hasAcknowledged ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {hasAcknowledged ? 'Acknowledged' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${doc.isExpired ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {doc.isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <a href={doc.fileURL} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-full"><Eye size={16} className="text-gray-600" /></a>
                          {!hasAcknowledged && !doc.isExpired && (
                            <button onClick={() => handleAcknowledge(doc.id)} className="p-2 hover:bg-gray-200 rounded-full" title="Acknowledge"><CheckSquare size={16} className="text-blue-600" /></button>
                          )}
                          <button onClick={() => handleEditClick(doc)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16} className="text-gray-600" /></button>
                          <button onClick={() => handleDeleteClick(doc)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button>
                        </div>
                      </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Documents;
