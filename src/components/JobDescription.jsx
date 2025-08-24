import React, { useState, useEffect } from 'react';
import { Info, Plus, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import AddJobInfoModal from './AddJobInfoModal';

function JobDescription() {
  const { companyId, currentUser, employees } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personalNotes, setPersonalNotes] = useState([]);

  const currentUserEmployee = employees.find(e => e.email === currentUser?.email);

  useEffect(() => {
    if (!companyId || !currentUserEmployee) return;

    const notesRef = collection(db, 'companies', companyId, 'employees', currentUserEmployee.id, 'jobInfo');
    const q = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersonalNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [companyId, currentUserEmployee]);

  const handleSaveNote = async (noteText) => {
    if (!companyId || !currentUserEmployee) return;
    const notesRef = collection(db, 'companies', companyId, 'employees', currentUserEmployee.id, 'jobInfo');
    await addDoc(notesRef, {
      text: noteText,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <>
      <AddJobInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveNote} />
      <div className="p-6 bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0">
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This is a beta feature. The information below is a general placeholder and will be adapted to your specific job in a future version.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Job Title</h3>
            <p className="text-lg text-gray-600">Manager, Freight Forwarding</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Job Description</h3>
            <p className="text-gray-600">
              As a Freight Forwarding Manager, you are responsible for overseeing the daily operations of the freight forwarding department. This includes managing a team of logistics coordinators, ensuring timely and cost-effective shipment of goods, and maintaining excellent relationships with clients and carriers.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Responsibilities</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Manage and mentor a team of freight forwarding specialists.</li>
              <li>Negotiate rates with carriers to ensure profitability.</li>
              <li>Ensure compliance with all international and domestic shipping regulations.</li>
              <li>Resolve any issues or disputes that may arise during shipment.</li>
              <li>Develop and implement strategies to improve operational efficiency.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Best Practices</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Maintain clear and consistent communication with clients.</li>
              <li>Stay updated on the latest industry trends and regulations.</li>
              <li>Proactively identify and mitigate potential risks.</li>
              <li>Foster a collaborative and supportive team environment.</li>
            </ul>
          </div>
          <div className="border-t pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">My Personal Notes</h3>
              <p className="text-gray-600 mb-4">Add your own private notes, reminders, or personalized information about your role.</p>
              
              <div className="space-y-4 mb-4">
                {personalNotes.map(note => (
                  <div key={note.id} className="flex items-start bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <MessageSquare size={16} className="text-blue-500 mt-1 mr-3 flex-shrink-0"/>
                      <div>
                          <p className="text-sm text-gray-800">{note.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{note.createdAt?.toDate().toLocaleString()}</p>
                      </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                  <Plus size={20} className="mr-2" />
                  Add Note
              </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default JobDescription;