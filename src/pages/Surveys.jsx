import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import AddSurveyModal from '../components/AddSurveyModal';
import EditSurveyModal from '../components/EditSurveyModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const surveysCollection = collection(db, 'surveys');
    const q = query(surveysCollection, orderBy('created', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const surveysList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created: doc.data().created?.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) || 'N/A',
      }));
      setSurveys(surveysList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditClick = (survey) => {
    setSelectedSurvey(survey);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (survey) => {
    setSelectedSurvey(survey);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSurvey) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'surveys', selectedSurvey.id));
      setIsDeleteModalOpen(false);
      setSelectedSurvey(null);
    } catch (error) {
      console.error("Error deleting survey: ", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AddSurveyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSurveyAdded={() => setIsAddModalOpen(false)} />
      <EditSurveyModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} survey={selectedSurvey} onSurveyUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedSurvey?.title} loading={isDeleting} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Surveys</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            Create Survey
          </button>
        </header>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-500 text-sm">Title</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Date Created</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Responses</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>) 
              : surveys.length === 0 ? (<tr><td colSpan="5" className="p-4 text-center text-gray-500">No surveys have been created.</td></tr>)
              : surveys.map(survey => (
                <tr key={survey.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-800">{survey.title}</td>
                  <td className="p-4 text-gray-700">{survey.created}</td>
                  <td className="p-4">
                      <span className={`text-xs font-bold py-1 px-2 rounded-full ${survey.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {survey.status}
                      </span>
                  </td>
                  <td className="p-4 text-gray-700">{survey.responses}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(survey)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16} className="text-gray-600" /></button>
                      <button onClick={() => handleDeleteClick(survey)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Surveys;
