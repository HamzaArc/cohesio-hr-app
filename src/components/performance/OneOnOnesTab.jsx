import React from 'react';
import { MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './Modals.jsx';

export const OneOnOnesTab = ({ cycle, onUpdate, onOpenModal }) => {
    const { oneOnOnes = [] } = cycle;

    const openNew = () => onOpenModal({ id:`m_${Date.now()}`, when:new Date().toISOString(), withId: cycle.participants[1]?.id || '', agenda:"" });
    const openEdit = (meeting) => onOpenModal(JSON.parse(JSON.stringify(meeting)));
    const deleteMeeting = (id) => onUpdate({ oneOnOnes: oneOnOnes.filter(m => m.id !== id) });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-2"><MessageSquare/> 1-on-1s</h3>
                <Button primary onClick={openNew}><Plus size={16}/> Schedule 1-on-1</Button>
            </div>
            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                        <tr>
                            <th className="text-left px-4 py-2">When</th>
                            <th className="text-left px-2 py-2">With</th>
                            <th className="text-left px-2 py-2">Agenda</th>
                            <th className="text-right px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {oneOnOnes.sort((a,b)=>+new Date(a.when)-+new Date(b.when)).map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{new Date(m.when).toLocaleString()}</td>
                                <td className="px-2 py-3">{cycle.participants.find(u=>u.id===m.withId)?.name}</td>
                                <td className="px-2 py-3">{m.agenda}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-2">
                                        <Button onClick={() => openEdit(m)}><Edit size={16}/></Button>
                                        <Button danger onClick={() => deleteMeeting(m.id)}><Trash2 size={16}/></Button>
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