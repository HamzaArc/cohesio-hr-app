import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Check, MoreVertical } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, where } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import {
    CreatePerformanceCycleModal,
    EditPerformanceCycleModal,
    ReschedulePerformanceCycleModal
} from '../components/performance/Modals.jsx';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const PerformanceTab = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
        {label}
    </button>
);

function Performance() {
    const { employees, loading: employeesLoading, currentUser } = useAppContext();
    const [activeTab, setActiveTab] = useState('My Performance');
    const [cycles, setCycles] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const currentUserEmployee = useMemo(() => employees.find(e => e.email === currentUser?.email), [employees, currentUser]);
    const myTeam = useMemo(() => employees.filter(e => e.managerEmail === currentUser?.email), [employees, currentUser]);

    useEffect(() => {
        // --- FIX STARTS HERE ---
        if (!currentUser || !currentUserEmployee) return; 
        // --- FIX ENDS HERE ---
        
        setLoadingData(true);
        const cyclesRef = collection(db, 'performanceCycles');
        let q;
        if (activeTab === 'My Performance') {
            q = query(cyclesRef, where('employeeId', '==', currentUserEmployee?.id), orderBy('endDate', 'desc'));
        } else {
            const teamMemberIds = myTeam.map(member => member.id);
            if (teamMemberIds.length === 0) {
                setCycles([]);
                setLoadingData(false);
                return;
            }
            q = query(cyclesRef, where('employeeId', 'in', teamMemberIds), orderBy('endDate', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cycleData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCycles(cycleData);
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, [activeTab, currentUser, currentUserEmployee, myTeam]);

    const handleEditClick = (e, cycle) => {
        e.stopPropagation();
        setSelectedCycle(cycle);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (e, cycle) => {
        e.stopPropagation();
        setSelectedCycle(cycle);
        setIsDeleteModalOpen(true);
    };

    const handleRescheduleClick = (e, cycle) => {
        e.stopPropagation();
        setSelectedCycle(cycle);
        setIsRescheduleModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCycle) return;
        setIsDeleting(true);
        await deleteDoc(doc(db, 'performanceCycles', selectedCycle.id));
        setIsDeleteModalOpen(false);
        setSelectedCycle(null);
        setIsDeleting(false);
    };

    const handleRowClick = (cycle) => {
        navigate(`/performance/${cycle.id}`);
    };

    const loading = employeesLoading || loadingData;

    return (
        <>
            <CreatePerformanceCycleModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <EditPerformanceCycleModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} cycle={selectedCycle} />
            <ReschedulePerformanceCycleModal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} cycle={selectedCycle} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={`the performance cycle for ${employees.find(e => e.id === selectedCycle?.employeeId)?.name}`} loading={isDeleting} />

            <div className="p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Performance</h1>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                        <Plus size={20} className="mr-2" />
                        New Performance Cycle
                    </button>
                </header>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200 px-2 flex">
                        <PerformanceTab label="My Performance" active={activeTab === 'My Performance'} onClick={() => setActiveTab('My Performance')} />
                        {myTeam.length > 0 && <PerformanceTab label="Team Performance" active={activeTab === 'Team Performance'} onClick={() => setActiveTab('Team Performance')} />}
                    </div>
                    <div className="p-6">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-4 font-semibold text-gray-500 text-sm">Employee</th>
                                    <th className="p-4 font-semibold text-gray-500 text-sm">Cycle Period</th>
                                    <th className="p-4 font-semibold text-gray-500 text-sm">Status</th>
                                    <th className="p-4 font-semibold text-gray-500 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center">Loading...</td>
                                    </tr>
                                ) : (
                                    cycles.map(cycle => (
                                        <tr key={cycle.id} onClick={() => handleRowClick(cycle)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                            <td className="p-4 font-semibold text-gray-800">{employees.find(e => e.id === cycle.employeeId)?.name || 'Unknown'}</td>
                                            <td className="p-4 text-gray-700">{`${new Date(cycle.startDate.seconds * 1000).toLocaleDateString()} - ${new Date(cycle.endDate.seconds * 1000).toLocaleDateString()}`}</td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold py-1 px-2 rounded-full ${cycle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {cycle.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => handleEditClick(e, cycle)} className="p-2 hover:bg-gray-200 rounded-full"><Edit size={16} /></button>
                                                    <button onClick={(e) => handleDeleteClick(e, cycle)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button>
                                                    <button onClick={(e) => handleRescheduleClick(e, cycle)} className="p-2 hover:bg-gray-200 rounded-full"><MoreVertical size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Performance;