import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Edit, Trash, CheckSquare } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import AddTrainingModal from '../components/AddTrainingModal';
import EditTrainingModal from '../components/EditTrainingModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

function Training() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    const trainingCollection = collection(db, 'training');
    const q = query(trainingCollection, orderBy('created', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const programsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPrograms(programsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const getAssignedToText = (program) => {
    if (!program.assignmentType) return 'N/A';
    if (program.assignmentType === 'all') return 'All Employees';
    if (program.assignedEmails && program.assignedEmails.length > 0) {
        return `${program.assignedEmails.length} specific employee(s)`;
    }
    return 'Specific Employees';
  };

  const handleEditClick = (program) => {
    setSelectedProgram(program);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (program) => {
    setSelectedProgram(program);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProgram) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'training', selectedProgram.id));
      setIsDeleteModalOpen(false);
      setSelectedProgram(null);
    } catch (error) {
      console.error("Error deleting program: ", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCompleteTraining = async (programId) => {
      if (!currentUser) return;
      const docRef = doc(db, 'training', programId);
      await updateDoc(docRef, {
          completedBy: arrayUnion(currentUser.email)
      });
  };

  return (
    <>
      <AddTrainingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProgramAdded={() => setIsAddModalOpen(false)} />
      <EditTrainingModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={selectedProgram} onProgramUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedProgram?.title} loading={isDeleting} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Training</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            Create Program
          </button>
        </header>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-500 text-sm">Program Title</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Assigned To</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">My Status</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>) 
              : programs.map(program => {
                  const isCompleted = program.completedBy?.includes(currentUser.email);
                  return (
                    <tr key={program.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-800 flex items-center"><BookOpen className="w-5 h-5 mr-3 text-gray-400" />{program.title}</td>
                      <td className="p-4 text-gray-700">{getAssignedToText(program)}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold py-1 px-2 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {!isCompleted && <button onClick={() => handleCompleteTraining(program.id)} className="p-2 hover:bg-gray-200 rounded-full" title="Mark as Complete"><CheckSquare size={16} className="text-blue-600"/></button>}
                          <button onClick={() => handleEditClick(program)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16} className="text-gray-600" /></button>
                          <button onClick={() => handleDeleteClick(program)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button>
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

export default Training;
