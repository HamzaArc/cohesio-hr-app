import React, { useMemo, useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Check } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';

function TrainingDetailsModal({ isOpen, onClose, program, employees }) {
  const [steps, setSteps] = useState([]);
  const [notes, setNotes] = useState('');
  const [currentStepId, setCurrentStepId] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (program) {
      console.log("--- MODAL OPENED ---");
      console.log("Program Prop:", program);
      const stepsQuery = query(collection(db, 'training', program.id, 'steps'), orderBy('order'));
      const unsubscribe = onSnapshot(stepsQuery, (snapshot) => {
        const fetchedSteps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Fetched Steps:", fetchedSteps);
        setSteps(fetchedSteps);
      });
      return () => unsubscribe();
    }
  }, [program]);

  const { myParticipant, allParticipantsStatus } = useMemo(() => {
    if (!program || !employees || !currentUser) return { myParticipant: null, allParticipantsStatus: [] };
    
    const employeeMap = new Map(employees.map(e => [e.email, e.name]));
    const participant = program.participants.find(p => p.userEmail === currentUser.email);

    console.log("--- PARTICIPANT DATA ---");
    console.log("My Participant Object:", participant);

    const allStatus = (program.participants || []).map(p => ({
        name: employeeMap.get(p.userEmail) || p.userEmail,
        status: p.status,
        completionDate: p.completionDate?.toDate().toLocaleDateString() || null,
    }));

    return { myParticipant: participant, allParticipantsStatus: allStatus };
  }, [program, employees, currentUser]);

  const handleCompleteStep = async () => {
    console.log("--- 'Confirm Completion' CLICKED ---");
    if (!currentStepId) {
        console.error("No currentStepId set. Aborting.");
        return;
    }
    console.log("Current Step ID to complete:", currentStepId);
    console.log("Notes entered:", notes);

    const updatedParticipants = program.participants.map(p => {
        if (p.userEmail === currentUser.email) {
            console.log("Found my participant object to update:", p);
            const updatedSteps = p.stepsStatus.map(s => {
                if (s.stepId === currentStepId) {
                    console.log("Found matching step to update:", s);
                    return { ...s, status: 'Completed', notes, completedAt: new Date() };
                }
                return s;
            });
            
            const allStepsCompleted = updatedSteps.every(s => s.status === 'Completed');
            console.log("All steps completed?", allStepsCompleted);

            const finalParticipantObject = {
                ...p,
                stepsStatus: updatedSteps,
                status: allStepsCompleted ? 'Completed' : 'In Progress',
                completionDate: allStepsCompleted ? new Date() : null
            };
            console.log("Final participant object to be saved:", finalParticipantObject);
            return finalParticipantObject;
        }
        return p;
    });

    try {
        console.log("Attempting to save the following 'participants' array to Firestore:", updatedParticipants);
        await updateDoc(doc(db, 'training', program.id), { participants: updatedParticipants });
        console.log("--- SUCCESS: Firestore update complete! ---");
        setCurrentStepId(null);
        setNotes('');
    } catch (error) {
        console.error("--- ERROR: Firestore update failed! ---", error);
    }
  };

  if (!isOpen || !program) return null;

  const isMyTraining = !!myParticipant;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Training Details</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
        <div className="overflow-y-auto p-6">
            <div className="mb-6"><p className="text-sm text-gray-500">Program Name</p><h3 className="text-lg font-bold text-gray-800">{program.title}</h3>{program.description && <p className="text-sm text-gray-600 mt-1">{program.description}</p>}</div>
            
            {isMyTraining ? (
                <div>
                    <h4 className="font-bold text-gray-800 mb-2">My Progress</h4>
                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const stepStatusData = myParticipant.stepsStatus.find(s => s.stepId === step.id);
                            const isCompleted = stepStatusData?.status === 'Completed';
                            return (
                                <div key={step.id} className={`p-4 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                    <div className="flex items-start justify-between">
                                        <p className="font-semibold text-gray-800">{index + 1}. {step.text}</p>
                                        {!isCompleted && <button onClick={() => setCurrentStepId(step.id)} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-full text-xs hover:bg-blue-700">Complete Step</button>}
                                        {isCompleted && <CheckCircle size={20} className="text-green-500" />}
                                    </div>
                                    {isCompleted && stepStatusData.notes && (
                                        <div className="mt-2 p-2 bg-green-100 border-l-2 border-green-300 text-xs text-green-800">
                                            <p className="font-semibold">My notes:</p>
                                            <p>{stepStatusData.notes}</p>
                                        </div>
                                    )}
                                    {currentStepId === step.id && (
                                        <div className="mt-4 pt-4 border-t">
                                            <label className="text-xs font-medium text-gray-600">Add completion notes (optional)</label>
                                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" className="w-full border rounded-md p-2 mt-1 text-sm"></textarea>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setCurrentStepId(null)} className="text-xs font-semibold text-gray-700">Cancel</button>
                                                <button onClick={handleCompleteStep} className="bg-green-600 text-white font-semibold py-1 px-3 rounded-full text-xs">Confirm Completion</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div>
                    <h4 className="font-bold text-gray-800 mb-2">Participant Status</h4>
                    <div className="space-y-2 border rounded-lg p-2 max-h-80 overflow-y-auto">
                        {allParticipantsStatus.map((item, index) => (
                            <div key={index} className="p-2 rounded-md hover:bg-gray-50">
                                <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-700">{item.name}</p><span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status === 'Completed' ? <CheckCircle size={14} className="mr-1.5"/> : <Clock size={14} className="mr-1.5"/>}{item.status}</span></div>
                                {item.completionDate && <p className="text-xs text-gray-500 mt-1">Completed on: {item.completionDate}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <div className="mt-auto p-6 border-t flex justify-end">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

export default TrainingDetailsModal;
