import React from 'react';
import { FileText, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from './Modals.jsx';

export const DevPlanTab = ({ cycle, onUpdate, onOpenModal }) => {
    const { devPlan = [] } = cycle;

    const openNew = () => onOpenModal({ id: `d_${Date.now()}`, skill:"", action:"", due: new Date().toISOString().slice(0,10), mentor: "", done:false });
    const openEdit = (action) => onOpenModal(JSON.parse(JSON.stringify(action)));
    const deleteAction = (id) => onUpdate({ devPlan: devPlan.filter(d => d.id !== id) });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-2"><FileText/> Development Plan</h3>
                <Button primary onClick={openNew}><Plus size={16}/> New Action</Button>
            </div>
            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                        <tr>
                            <th className="text-left px-4 py-2">Skill</th>
                            <th className="text-left px-2 py-2">Action</th>
                            <th className="text-left px-2 py-2">Due</th>
                            <th className="text-left px-2 py-2">Mentor</th>
                            <th className="text-left px-2 py-2">Status</th>
                            <th className="text-right px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {devPlan.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-semibold">{d.skill}</td>
                                <td className="px-2 py-3">{d.action}</td>
                                <td className="px-2 py-3">{new Date(d.due).toLocaleDateString()}</td>
                                <td className="px-2 py-3">{d.mentor}</td>
                                <td className="px-2 py-3">{d.done ? <span className="text-emerald-700 text-sm flex items-center gap-1"><CheckCircle2 size={14}/> Done</span> : <span className="text-gray-600 text-sm">Open</span>}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-2">
                                        <Button onClick={() => openEdit(d)}><Edit size={16}/></Button>
                                        <Button danger onClick={() => deleteAction(d.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};