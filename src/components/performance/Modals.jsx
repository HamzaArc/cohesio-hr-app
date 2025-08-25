import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

// --- Reusable UI Atoms ---
const Field = ({ label, children }) => (
  <label className="block text-sm">
    <div className="font-medium text-gray-600 mb-1">{label}</div>
    {children}
  </label>
);
const TextInput = (props) => <input {...props} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500" />;
const TextArea = (props) => <textarea {...props} className="w-full px-3 py-2 rounded-lg border min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500" />;
export const Button = ({ primary, danger, children, className, ...rest }) => (
  <button {...rest} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${primary ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : danger ? "bg-red-600 text-white border-red-600 hover:bg-red-700" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"} ${className}`}>{children}</button>
);
const Modal = ({ title, onClose, children, footer }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
      </div>
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      {footer && <div className="p-4 flex justify-end gap-2 border-t bg-gray-50 rounded-b-2xl">{footer}</div>}
    </div>
  </div>
);

// --- Create Performance Cycle Modal ---
export const CreatePerformanceCycleModal = ({ isOpen, onClose }) => {
    const { employees, companyId } = useAppContext();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleCreate = async () => {
        const employee = employees.find(e => e.id === selectedEmployee);
        const manager = employees.find(e => e.email === employee.managerEmail);

        if (!employee || !manager) {
            alert('Selected employee must have a manager.');
            return;
        }

        // --- FIX: Corrected collection path and added companyId ---
        await addDoc(collection(db, 'performanceCycles'), {
            companyId: companyId, // Add companyId for proper querying
            employeeId: employee.id,
            managerId: manager.id,
            participants: [{ id: employee.id, name: employee.name }, { id: manager.id, name: manager.name }],
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'active',
            objectives: [],
            devPlan: [],
            oneOnOnes: [],
            review: null,
            createdAt: serverTimestamp(),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal title="New Performance Cycle" onClose={onClose} footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" primary onClick={handleCreate}>Create Cycle</Button>,
        ]}>
            <Field label="Employee">
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select an employee</option>
                    {employees.filter(e => e.managerEmail).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date"><TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
                <Field label="End Date"><TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
            </div>
        </Modal>
    );
};

// --- Edit Performance Cycle Modal ---
export const EditPerformanceCycleModal = ({ isOpen, onClose, cycle }) => {
    const [cycleData, setCycleData] = useState(cycle);

    useEffect(() => { setCycleData(cycle); }, [cycle]);

    const handleSave = async () => {
        // --- FIX: Corrected document path ---
        const cycleRef = doc(db, 'performanceCycles', cycle.id);
        await updateDoc(cycleRef, {
            ...cycleData
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal title="Edit Performance Cycle" onClose={onClose} footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" primary onClick={handleSave}>Save Changes</Button>,
        ]}>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date"><TextInput type="date" value={cycleData.startDate.toDate().toISOString().split('T')[0]} onChange={(e) => setCycleData({ ...cycleData, startDate: new Date(e.target.value) })} /></Field>
                <Field label="End Date"><TextInput type="date" value={cycleData.endDate.toDate().toISOString().split('T')[0]} onChange={(e) => setCycleData({ ...cycleData, endDate: new Date(e.target.value) })} /></Field>
            </div>
        </Modal>
    );
};


// --- Reschedule Performance Cycle Modal ---
export const ReschedulePerformanceCycleModal = ({ isOpen, onClose, cycle }) => {
    const [newEndDate, setNewEndDate] = useState('');


    const handleReschedule = async () => {
        // --- FIX: Corrected document path ---
        const cycleRef = doc(db, 'performanceCycles', cycle.id);
        await updateDoc(cycleRef, {
            endDate: new Date(newEndDate),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal title="Reschedule Performance Cycle" onClose={onClose} footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" primary onClick={handleReschedule}>Reschedule</Button>,
        ]}>
            <Field label="New End Date">
                <TextInput type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
            </Field>
        </Modal>
    );
};


// --- Objective Modal ---
export const ObjectiveModal = ({ isOpen, onClose, data, cycle, onSave }) => {
    const [objective, setObjective] = useState(data);
    const { employees } = useAppContext();

    useEffect(() => { setObjective(data); }, [data]);

    const handleSave = () => {
        const objectives = cycle.objectives || [];
        const exists = objectives.findIndex(o => o.id === objective.id) !== -1;
        const newObjectives = exists
            ? objectives.map(o => o.id === objective.id ? objective : o)
            : [...objectives, objective];
        onSave({ objectives: newObjectives });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal title={data.id.startsWith('o_') ? "New Objective" : "Edit Objective"} onClose={onClose} footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" primary onClick={handleSave}>Save Objective</Button>,
        ]}>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Title"><TextInput value={objective.title} onChange={(e)=>setObjective({...objective, title:e.target.value})} /></Field>
                <Field label="Owner">
                    <select value={objective.ownerId} onChange={(e)=>setObjective({...objective, ownerId:e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {cycle.participants.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </Field>
                <Field label="Weight %"><TextInput type="number" min={0} max={100} value={objective.weightPct} onChange={(e)=>setObjective({...objective, weightPct:Number(e.target.value)})} /></Field>
                <Field label="Status">
                    <select value={objective.status} onChange={(e)=>setObjective({...objective, status:e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="not_started">Not started</option><option value="on_track">On track</option><option value="at_risk">At risk</option><option value="blocked">Blocked</option><option value="done">Done</option>
                    </select>
                </Field>
                <div className="col-span-2"><Field label="Description"><TextArea value={objective.description} onChange={(e)=>setObjective({...objective, description:e.target.value})} /></Field></div>
                <Field label="Progress %"><TextInput type="number" min={0} max={100} value={objective.progress} onChange={(e)=>setObjective({...objective, progress:Number(e.target.value)})} /></Field>
            </div>
        </Modal>
    );
};

// --- Development Action Modal ---
export const DevActionModal = ({ isOpen, onClose, data, cycle, onSave }) => {
    const [devAction, setDevAction] = useState(data);

    useEffect(() => { setDevAction(data); }, [data]);

    const handleSave = () => {
        const devPlan = cycle.devPlan || [];
        const exists = devPlan.findIndex(d => d.id === devAction.id) !== -1;
        const newDevPlan = exists
            ? devPlan.map(d => d.id === devAction.id ? devAction : d)
            : [...devPlan, devAction];
        onSave({ devPlan: newDevPlan });
        onClose();
    };

    if (!isOpen) return null;

    return (
         <Modal title={data.id.startsWith('d_') ? "New Development Action" : "Edit Development Action"} onClose={onClose} footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" primary onClick={handleSave}>Save Action</Button>,
        ]}>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Skill / Area to Develop"><TextInput value={devAction.skill} onChange={(e)=>setDevAction({...devAction, skill:e.target.value})} /></Field>
                <Field label="Mentor / Support">
                    <select value={devAction.mentor} onChange={(e)=>setDevAction({...devAction, mentor:e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">None</option>
                        {cycle.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </Field>
                <div className="col-span-2"><Field label="Specific Action"><TextArea value={devAction.action} onChange={(e)=>setDevAction({...devAction, action:e.target.value})} /></Field></div>
                <Field label="Due Date"><TextInput type="date" value={devAction.due} onChange={(e)=>setDevAction({...devAction, due:e.target.value})} /></Field>
                <Field label="Completed?">
                    <input type="checkbox" checked={!!devAction.done} onChange={(e)=>setDevAction({...devAction, done:e.target.checked})} className="h-5 w-5 rounded border-gray-300 text-blue-600" />
                </Field>
            </div>
        </Modal>
    );
};

// --- 1-on-1 Modal ---
export const OneOnOneModal = ({ isOpen, onClose, data, cycle, onSave }) => {
    const [oneOnOne, setOneOnOne] = useState(data);

    useEffect(() => { setOneOnOne(data); }, [data]);

    const handleSave = () => {
        const oneOnOnes = cycle.oneOnOnes || [];
        const exists = oneOnOnes.findIndex(m => m.id === oneOnOne.id) !== -1;
        const newOneOnOnes = exists
            ? oneOnOnes.map(m => m.id === oneOnOne.id ? oneOnOne : m)
            : [...oneOnOnes, oneOnOne];
        onSave({ oneOnOnes: newOneOnOnes });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal title={data.id.startsWith('m_') ? "Schedule 1-on-1" : "Edit 1-on-1"} onClose={onClose} footer={[
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" primary onClick={handleSave}>Save Meeting</Button>,
        ]}>
            <div className="grid grid-cols-2 gap-4">
                <Field label="When"><TextInput type="datetime-local" value={oneOnOne.when ? oneOnOne.when.slice(0, 16) : ''} onChange={(e)=>setOneOnOne({...oneOnOne, when:e.target.value})} /></Field>
                <Field label="With">
                    <select value={oneOnOne.withId} onChange={(e)=>setOneOnOne({...oneOnOne, withId:e.target.value})} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {cycle.participants.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </Field>
                <div className="col-span-2"><Field label="Agenda"><TextArea value={oneOnOne.agenda} onChange={(e)=>setOneOnOne({...oneOnOne, agenda:e.target.value})} /></Field></div>
                <div className="col-span-2"><Field label="Notes"><TextArea value={oneOnOne.notes||""} onChange={(e)=>setOneOnOne({...oneOnOne, notes:e.target.value})} /></Field></div>
            </div>
        </Modal>
    );
};