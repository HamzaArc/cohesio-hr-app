import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash, KanbanSquare, Table as TableIcon, Clock, Send, CheckCircle, Briefcase } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import StatCard from '../components/StatCard';
import AddCaseModal from '../components/medicalfile/AddCaseModal';
import CaseDetailsDialog from '../components/medicalfile/CaseDetailsDialog';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { dayCount, STATUS, StatusBadge } from '../components/medicalfile/helpers.jsx';

export default function MedicalFile() {
    const { companyId } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('table');
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cases, setCases] = useState([]);
    
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    
    const [selectedCase, setSelectedCase] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!companyId) {
            setLoading(false);
            return;
        }
        const q = query(collection(db, 'companies', companyId, 'medicalCases'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCases(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [companyId]);

    const filteredCases = useMemo(() => {
        return cases.filter((r) => {
            const q = search.trim().toLowerCase();
            const matchQ = !q ||
                (r.id && r.id.toLowerCase().includes(q)) ||
                (r.employee.name && r.employee.name.toLowerCase().includes(q)) ||
                (r.employee.cin && r.employee.cin.toLowerCase().includes(q)) ||
                (r.employee.cnss && r.employee.cnss.toLowerCase().includes(q));
            const matchS = statusFilter === "all" || r.status === statusFilter;
            return matchQ && matchS;
        });
    }, [cases, search, statusFilter]);

    const stats = useMemo(() => {
        const byStatus = {};
        cases.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
        return {
            total: cases.length,
            pendingHR: byStatus["HR review"] || 0,
            pendingCNSS: byStatus["Submitted to CNSS"] || 0,
            approved: byStatus["Approved"] || 0,
        };
    }, [cases]);

    const openDetails = (caseData) => {
        setSelectedCase(caseData);
        setDetailsDialogOpen(true);
    };
    
    const handleDeleteClick = (e, caseData) => {
        e.stopPropagation();
        setSelectedCase(caseData);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCase || !companyId) return;
        setIsDeleting(true);
        await deleteDoc(doc(db, 'companies', companyId, 'medicalCases', selectedCase.id));
        setDeleteModalOpen(false);
        setSelectedCase(null);
        setIsDeleting(false);
    };

    return (
        <>
            <AddCaseModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
            {selectedCase && <CaseDetailsDialog isOpen={isDetailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} caseData={selectedCase} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={selectedCase?.id} loading={isDeleting} />

            <div className="p-8">
                <header className="flex justify-between items-center mb-8 medical-file-header">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Medical Case Tracking</h1>
                        <p className="text-gray-500">Unified view of sickness leave and CNSS/Mutuelle claims.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView(view === 'table' ? 'kanban' : 'table')} className="bg-white text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 border border-gray-300 flex items-center shadow-sm">
                            {view === 'table' ? <KanbanSquare size={16} className="mr-2"/> : <TableIcon size={16} className="mr-2"/>}
                            {view === 'table' ? 'Kanban View' : 'Table View'}
                        </button>
                        <button onClick={() => setAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                            <Plus size={20} className="mr-2" /> New Medical Case
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 medical-file-stats">
                    <StatCard icon={<Briefcase size={24}/>} title="Total Cases" value={stats.total} />
                    <StatCard icon={<Clock size={24}/>} title="Pending HR Review" value={stats.pendingHR} />
                    <StatCard icon={<Send size={24}/>} title="Submitted to CNSS" value={stats.pendingCNSS} />
                    <StatCard icon={<CheckCircle size={24}/>} title="Approved" value={stats.approved} />
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Search by name, CIN, CNSS..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-full" />
                        </div>
                        <div className="relative">
                             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border-gray-300 rounded-md shadow-sm w-full p-2">
                                <option value="all">All Statuses</option>
                                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? <p>Loading cases...</p> : view === 'table' ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto medical-file-table">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50"><th className="p-4 font-semibold text-gray-500 text-sm">Case ID</th><th className="p-4 font-semibold text-gray-500 text-sm">Employee</th><th className="p-4 font-semibold text-gray-500 text-sm">Period</th><th className="p-4 font-semibold text-gray-500 text-sm">Days</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr>
                            </thead>
                            <tbody>
                                {filteredCases.map(c => (
                                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-semibold text-gray-800">{c.id.substring(0, 8)}...</td>
                                        <td className="p-4">{c.employee.name}</td>
                                        <td className="p-4">{c.startDate} to {c.endDate}</td>
                                        <td className="p-4">{dayCount(c.startDate, c.endDate)}</td>
                                        <td className="p-4"><StatusBadge value={c.status} /></td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => openDetails(c)} className="p-2 hover:bg-gray-200 rounded-full"><Eye size={16} /></button>
                                                <button onClick={(e) => handleDeleteClick(e, c)} className="p-2 hover:bg-gray-200 rounded-full"><Trash size={16} className="text-red-600" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STATUS.map(status => (
                            <div key={status} className="bg-gray-50 rounded-lg border">
                                <h3 className="p-4 font-semibold border-b text-gray-700">{status}</h3>
                                <div className="p-4 space-y-3">
                                    {filteredCases.filter(c => c.status === status).map(c => (
                                        <div key={c.id} onClick={() => openDetails(c)} className="bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:border-blue-500">
                                            <p className="font-semibold">{c.employee.name}</p>
                                            <p className="text-xs text-gray-500">{c.startDate} to {c.endDate}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}