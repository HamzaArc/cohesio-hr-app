import React, { useState } from 'react';
import { FileText, Trash2, Plus, Eye } from 'lucide-react';
import useFileUpload from '../../hooks/useFileUpload';

export default function DocumentsTab({ caseData, onUpdate }) {
    const { uploading, progress, error, uploadFile } = useFileUpload();
    const [newDoc, setNewDoc] = useState({ type: "Medical certificate", file: null });
    const documents = caseData.documents || [];

    const addDocument = async () => {
        if (!newDoc.file) return;
        try {
            const fileURL = await uploadFile(newDoc.file, `medical-cases/${caseData.id}`);
            const updatedDocs = [...documents, { type: newDoc.type, url: fileURL, name: newDoc.file.name }];
            onUpdate('documents', updatedDocs);
            setNewDoc({ type: "Medical certificate", file: null });
        } catch (err) {
            console.error(err);
        }
    };

    const removeDocument = (index) => {
        const updatedDocs = documents.filter((_, i) => i !== index);
        onUpdate('documents', updatedDocs);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Document</h3>
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
                        <label className="block text-sm font-medium">File</label>
                        <input type="file" onChange={e => setNewDoc({...newDoc, file: e.target.files[0]})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                </div>
                 <div className="flex justify-end mt-4">
                    <button onClick={addDocument} disabled={uploading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400">
                        <Plus size={16} /> {uploading ? `Uploading... ${Math.round(progress)}%` : 'Add Document'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Attached Documents</h3>
                <div className="space-y-2">
                    {documents.length > 0 ? documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-semibold">{doc.type}</p>
                                    <p className="text-xs text-gray-500 truncate">{doc.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-full" title="View Document">
                                    <Eye size={16} className="text-gray-600" />
                                </a>
                                <button onClick={() => removeDocument(index)} className="p-2 hover:bg-gray-200 rounded-full">
                                    <Trash2 size={16} className="text-red-600" />
                                </button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500 text-center py-4">No documents attached.</p>}
                </div>
            </div>
        </div>
    );
}