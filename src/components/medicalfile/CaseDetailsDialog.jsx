import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '../../contexts/AppContext';
import { X, Save, BadgeCheck } from 'lucide-react';
import { StatusBadge } from './helpers.jsx';
import OverviewTab from './OverviewTab';
import DocumentsTab from './DocumentsTab';
import ClaimsTab from './ClaimsTab';
import ActivityLogTab from './ActivityLogTab';

export default function CaseDetailsDialog({ isOpen, onClose, caseData }) {
    const { companyId, currentUser } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [isDirty, setIsDirty] = useState(false);
    const [localCaseData, setLocalCaseData] = useState(caseData);

    useEffect(() => {
        setLocalCaseData(caseData);
        setIsDirty(false);
    }, [caseData]);

    const handleUpdate = (field, value) => {
        const oldStatus = localCaseData.status;
        const newStatus = field === 'status' ? value : oldStatus;

        let updatedData = { ...localCaseData, [field]: value };

        if (field === 'status' && oldStatus !== newStatus) {
            const historyEntry = {
                from: oldStatus,
                to: newStatus,
                user: currentUser.displayName || currentUser.email,
                timestamp: new Date(), // Use a standard JS Date object here
            };
            updatedData.history = [...(localCaseData.history || []), historyEntry];
        }

        setLocalCaseData(updatedData);
        setIsDirty(true);
    };
    
    const handleNestedUpdate = (parent, field, value) => {
        setLocalCaseData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!companyId || !localCaseData || !isDirty) return;
        
        const caseRef = doc(db, 'companies', companyId, 'medicalCases', localCaseData.id);
        
        // Create the data payload for Firestore.
        // We can pass the localCaseData directly. Firestore handles JS Date objects inside arrays correctly.
        // We only use serverTimestamp for the top-level update field.
        const dataToSave = {
            ...localCaseData,
            updatedAt: serverTimestamp()
        };

        await updateDoc(caseRef, dataToSave);
        setIsDirty(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col h-[90vh]">
                <header className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-4">
                        <BadgeCheck className="h-8 w-8 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Medical Case: {localCaseData.employee.name}</h2>
                            <p className="text-sm text-gray-500">Case ID: {localCaseData.id.substring(0, 8)}...</p>
                        </div>
                        <StatusBadge value={localCaseData.status} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Close</button>
                        <button onClick={handleSave} disabled={!isDirty} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2">
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
                    <div className="border-b border-gray-200 bg-white rounded-t-lg">
                        <nav className="flex space-x-4 px-4">
                            <button onClick={() => setActiveTab('overview')} className={`py-3 px-2 text-sm font-semibold ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
                            <button onClick={() => setActiveTab('documents')} className={`py-3 px-2 text-sm font-semibold ${activeTab === 'documents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Documents</button>
                            <button onClick={() => setActiveTab('claims')} className={`py-3 px-2 text-sm font-semibold ${activeTab === 'claims' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>CNSS / Mutuelle</button>
                            <button onClick={() => setActiveTab('log')} className={`py-3 px-2 text-sm font-semibold ${activeTab === 'log' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Activity Log</button>
                        </nav>
                    </div>
                    <div className="mt-6">
                        {activeTab === 'overview' && <OverviewTab caseData={localCaseData} onUpdate={handleUpdate} />}
                        {activeTab === 'documents' && <DocumentsTab caseData={localCaseData} onUpdate={handleUpdate} />}
                        {activeTab === 'claims' && <ClaimsTab caseData={localCaseData} onNestedUpdate={handleNestedUpdate} />}
                        {activeTab === 'log' && <ActivityLogTab caseData={localCaseData} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
