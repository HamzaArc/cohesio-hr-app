import React, { useState, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '../../contexts/AppContext';
import { X, User, Calendar, FileText } from 'lucide-react';
import useFileUpload from '../../hooks/useFileUpload';

export default function AddCaseModal({ isOpen, onClose }) {
    const { companyId, employees } = useAppContext();
    const { uploading, progress, error, uploadFile } = useFileUpload();
    const [form, setForm] = useState({
        employeeId: "",
        type: "Sickness",
        startDate: "",
        endDate: "",
        files: [],
        notes: "",
    });
    const [formError, setFormError] = useState('');

    const selectedEmployee = useMemo(() => employees.find(e => e.id === form.employeeId), [employees, form.employeeId]);
    const canCreate = form.employeeId && form.startDate && form.endDate;

    const handleCreate = async () => {
        if (!canCreate || !companyId || !selectedEmployee) {
            setFormError('Please select an employee and provide a valid date range.');
            return;
        }
        setFormError('');

        const documentPromises = form.files.map(file => uploadFile(file, `medical-cases/${companyId}`));
        const documentURLs = await Promise.all(documentPromises);
        const documents = documentURLs.map((url, index) => ({ type: "Uploaded file", url, name: form.files[index].name }));

        const payload = {
            employee: {
                id: selectedEmployee.id,
                name: selectedEmployee.name,
                cin: selectedEmployee.nationalId || '',
                cnss: selectedEmployee.cnssNumber || '',
            },
            type: form.type,
            startDate: form.startDate,
            endDate: form.endDate,
            documents,
            notes: form.notes ? [{
                text: form.notes,
                author: "Initial Note",
                createdAt: new Date()
            }] : [],
            history: [],
            status: "HR review",
            createdAt: serverTimestamp(),
            cnss: { claimNumber: null, status: "Draft" },
            mutuelle: { claimNumber: null, status: "Draft" },
        };

        await addDoc(collection(db, 'companies', companyId, 'medicalCases'), payload);
        handleClose();
    };
    
    const handleClose = () => {
        setForm({ employeeId: "", type: "Sickness", startDate: "", endDate: "", files: [], notes: "" });
        setFormError('');
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Create New Medical Case</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">
                    {/* Employee Section */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4"><User size={18} /> Employee Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium">Employee</label>
                                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">CIN</label>
                                <input type="text" value={selectedEmployee?.nationalId || ''} disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">CNSS</label>
                                <input type="text" value={selectedEmployee?.cnssNumber || ''} disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" />
                            </div>
                        </div>
                    </div>

                    {/* Case Details Section */}
                    <div className="p-4 border rounded-lg">
                         <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4"><Calendar size={18} /> Case Details</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Case Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option>Sickness</option>
                                    <option>Work accident</option>
                                    <option>Maternity</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Start Date</label>
                                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">End Date</label>
                                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                         </div>
                    </div>

                    {/* Documents & Notes Section */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4"><FileText size={18} /> Documents & Notes</h3>
                        <div>
                            <label className="block text-sm font-medium">Documents</label>
                            <input type="file" multiple onChange={e => setForm({ ...form, files: Array.from(e.target.files) })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                         <div className="mt-4">
                            <label className="block text-sm font-medium">Initial Note</label>
                            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="Add an initial note for the case log..."></textarea>
                        </div>
                    </div>
                </div>

                {formError && <p className="text-red-500 text-sm px-6 pb-4">{formError}</p>}
                {error && <p className="text-red-500 text-sm px-6 pb-4">{error}</p>}
                {uploading && <div className="px-6 pb-4"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div><p className="text-sm text-center">Uploading... {Math.round(progress)}%</p></div>}

                <div className="p-6 border-t flex justify-end gap-2">
                    <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleCreate} disabled={!canCreate || uploading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{uploading ? 'Uploading...' : 'Create Case'}</button>
                </div>
            </div>
        </div>
    );
}