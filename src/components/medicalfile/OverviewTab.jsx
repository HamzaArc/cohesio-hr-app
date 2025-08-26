import React, { useState } from 'react';
import { CalendarDays, StickyNote, Plus } from 'lucide-react';
import { dayCount, STATUS, StatusBadge } from './helpers.jsx';
import { useAppContext } from '../../contexts/AppContext.jsx';

export default function OverviewTab({ caseData, onUpdate }) {
    const { currentUser } = useAppContext();
    const [newNote, setNewNote] = useState('');
    
    // Ensure notes is always an array to prevent crashes
    const notes = Array.isArray(caseData.notes) ? caseData.notes : [];

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const noteEntry = {
            text: newNote,
            author: currentUser.displayName || currentUser.email,
            createdAt: new Date(),
        };
        const updatedNotes = [...notes, noteEntry];
        onUpdate('notes', updatedNotes);
        setNewNote('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Period & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm">
                        <CalendarDays className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Period</p>
                            <p className="font-semibold">{caseData.startDate} to {caseData.endDate} ({dayCount(caseData.startDate, caseData.endDate)} days)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex-grow">
                            <label className="block text-gray-500">Status</label>
                            <select value={caseData.status} onChange={(e) => onUpdate('status', e.target.value)} className="w-full mt-1 border border-gray-300 rounded-md shadow-sm p-2">
                                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="pt-5">
                            <StatusBadge value={caseData.status} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><StickyNote size={20} /> Internal Notes Log</h3>
                <div className="space-y-4 mb-4">
                    {notes.slice().reverse().map((note, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                            <p className="text-sm text-gray-800">{note.text}</p>
                            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-dashed">
                                By {note.author} on {note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    ))}
                    {notes.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No notes added yet.</p>}
                </div>
                <div className="flex gap-2">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows="2"
                        className="flex-grow border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Add a new note..."
                    />
                    <button onClick={handleAddNote} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2 self-end">
                        <Plus size={16} /> Add Note
                    </button>
                </div>
            </div>
        </div>
    );
}
