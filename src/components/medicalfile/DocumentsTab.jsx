import React, { useState } from 'react';
import { FileText, Upload, Trash2, Link as LinkIcon, Plus } from 'lucide-react';
import { parseLinks } from './helpers.jsx';

export default function DocumentsTab({ caseData, onUpdate }) {
    const [newDoc, setNewDoc] = useState({ type: "Medical certificate", url: "" });
    const documents = caseData.documents || [];

    const addDocument = () => {
        if (!newDoc.url) return;
        const updatedDocs = [...documents, newDoc];
        onUpdate('documents', updatedDocs);
        setNewDoc({ type: "Medical certificate", url: "" });
    };

    const removeDocument = (index) => {
        const updatedDocs = documents.filter((_, i) => i !== index);
        onUpdate('documents', updatedDocs);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Document Link</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium">Type</label>
                        <select value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option>Medical certificate</option>
                            <option>CNSS receipt</option>
                            <option>Doctor letter</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">File URL (Google Drive, etc.)</label>
                        <input type="url" value={newDoc.url} onChange={e => setNewDoc({...newDoc, url: e.target.value})} placeholder="https://" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                </div>
                 <div className="flex justify-end mt-4">
                    <button onClick={addDocument} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Plus size={16} /> Add Link
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Attached Documents</h3>
                <div className="space-y-2">
                    {documents.length > 0 ? documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:underline">
                                <FileText size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-semibold">{doc.type}</p>
                                    <p className="text-xs text-gray-500 truncate">{doc.url}</p>
                                </div>
                            </a>
                            <button onClick={() => removeDocument(index)} className="p-2 hover:bg-gray-200 rounded-full">
                                <Trash2 size={16} className="text-red-600" />
                            </button>
                        </div>
                    )) : <p className="text-gray-500 text-center py-4">No documents attached.</p>}
                </div>
            </div>
        </div>
    );
}
