import React, { useState } from 'react';
import { X } from 'lucide-react';

function AddJobInfoModal({ isOpen, onClose, onSave }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setLoading(true);
    await onSave(note);
    setLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Add Personal Note</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">Add your own notes, reminders, or personalized information about your role. This information is private to you.</p>
          <div>
            <label htmlFor="jobNote" className="block text-sm font-medium text-gray-700">Your Note</label>
            <textarea
              id="jobNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="5"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end">
          <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddJobInfoModal;