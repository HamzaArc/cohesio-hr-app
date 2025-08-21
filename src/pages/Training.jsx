import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, Edit, Trash, Check, Library, Clock, Users, Eye, CheckCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import AddTrainingModal from '../components/AddTrainingModal';
import EditTrainingModal from '../components/EditTrainingModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import TrainingDetailsModal from '../components/TrainingDetailsModal';
import StatCard from '../components/StatCard';

const TrainingTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

const categoryColors = {
  "Onboarding": "bg-blue-50 text-blue-600",
  "Compliance": "bg-red-50 text-red-600",
  "Leadership": "bg-purple-50 text-purple-600",
  "Sales": "bg-green-50 text-green-600",
  "Technical": "bg-indigo-50 text-indigo-600",
  "Other": "bg-gray-50 text-gray-600",
};

function Training() {
  const { employees } = useAppContext();
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('My Training');
  const currentUser = auth.currentUser;

  useEffect(() => {
    const trainingCollection = collection(db, 'training');
    const q = query(trainingCollection, orderBy('created', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const programsList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        participants: Array.isArray(doc.data().participants) ? doc.data().participants : [],
      }));
      setAllPrograms(programsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { myPrograms, stats } = useMemo(() => {
    if (!currentUser) return { myPrograms: [], stats: {} };

    const my = allPrograms.filter(p => 
      p.participants.some(participant => participant.userEmail === currentUser.email)
    );

    const calculatedStats = {
        inProgress: my.filter(p => p.participants.find(part => part.userEmail === currentUser.email)?.status !== 'Completed').length,
        completed: my.filter(p => p.participants.find(part => part.userEmail === currentUser.email)?.status === 'Completed').length,
        overdue: allPrograms.filter(p => {
            const myParticipant = p.participants.find(part => part.userEmail === currentUser.email);
            return p.dueDate && new Date(p.dueDate) < new Date() && myParticipant?.status !== 'Completed';
        }).length,
    };

    return { myPrograms: my, stats: calculatedStats };
  }, [allPrograms, currentUser]);
  
  const handleEditClick = (e, program) => { e.stopPropagation(); setSelectedProgram(program); setIsEditModalOpen(true); };
  const handleDeleteClick = (e, program) => { e.stopPropagation(); setSelectedProgram(program); setIsDeleteModalOpen(true); };
  const handleDetailsClick = (program) => { setSelectedProgram(program); setIsDetailsModalOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!selectedProgram) return;
    setIsDeleting(true);
    await deleteDoc(doc(db, 'training', selectedProgram.id));
    setIsDeleteModalOpen(false);
    setSelectedProgram(null);
    setIsDeleting(false);
  };
  
  const TrainingCard = ({ program }) => {
    const myParticipant = program.participants.find(p => p.userEmail === currentUser.email);
    const status = myParticipant?.status || 'Assigned';
    const isOverdue = program.dueDate && new Date(program.dueDate) < new Date() && status !== 'Completed';

    const totalParticipants = program.participants.length;
    const completedCount = program.participants.filter(p => p.status === 'Completed').length;
    const completionRate = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0;
    const colorClass = categoryColors[program.category] || categoryColors["Other"];

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <span className={`text-xs font-semibold py-1 px-2.5 rounded-full ${colorClass}`}>{program.category || 'General'}</span>
            <div className="flex items-center gap-1">
                <button onClick={() => handleDetailsClick(program)} className="p-2 hover:bg-gray-100 rounded-full" title="View Details"><Eye size={18} className="text-gray-600" /></button>
                <button onClick={(e) => handleEditClick(e, program)} className="p-2 hover:bg-gray-100 rounded-full" title="Edit Program"><Edit size={18} className="text-gray-600" /></button>
                <button onClick={(e) => handleDeleteClick(e, program)} className="p-2 hover:bg-gray-100 rounded-full" title="Delete Program"><Trash size={18} className="text-red-600" /></button>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mt-2">{program.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{program.description}</p>
        </div>
        <div className="mt-6">
            {activeTab === 'Admin View' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1"><span>Team Progress</span><span>{completedCount}/{totalParticipants} Completed</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionRate}%`}}></div></div>
                </div>
            )}
            <button onClick={() => handleDetailsClick(program)} className="w-full text-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                {status === 'Completed' ? <CheckCircle size={16} /> : <BookOpen size={16} />}
                {status === 'Completed' ? 'View Completion' : 'Start Training'}
            </button>
            {isOverdue && <p className="text-xs text-red-600 text-center mt-2">This training is overdue.</p>}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center">Loading programs...</div>;
    
    const programsToDisplay = activeTab === 'My Training' ? myPrograms : allPrograms;

    return programsToDisplay.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-b-lg">
            <h3 className="text-lg font-semibold text-gray-800">No Training Programs Found</h3>
            <p className="text-gray-500 mt-1">{activeTab === 'My Training' ? "You have no assigned training." : "Get started by creating a new training program."}</p>
        </div>
    ) : (
        <div className="p-6 bg-gray-50 rounded-b-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programsToDisplay.map(p => <TrainingCard key={p.id} program={p} />)}
        </div>
    );
  };

  return (
    <>
      <AddTrainingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProgramAdded={() => setIsAddModalOpen(false)} />
      <EditTrainingModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} program={selectedProgram} onProgramUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedProgram?.title} loading={isDeleting} />
      <TrainingDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} program={selectedProgram} employees={employees} />

      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Learning Hub</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <Plus size={20} className="mr-2" />
            Create Program
          </button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Library size={24}/>} title="In Progress" value={stats.inProgress || 0} />
            <StatCard icon={<Check size={24}/>} title="Completed" value={stats.completed || 0} />
            <StatCard icon={<Clock size={24}/>} title="Overdue" value={stats.overdue || 0} />
            <StatCard icon={<Users size={24}/>} title="Total Programs" value={allPrograms.length} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <TrainingTab label="My Training" active={activeTab === 'My Training'} onClick={() => setActiveTab('My Training')} />
                <TrainingTab label="Admin View" active={activeTab === 'Admin View'} onClick={() => setActiveTab('Admin View')} />
            </div>
            {renderContent()}
        </div>
      </div>
    </>
  );
}

export default Training;
