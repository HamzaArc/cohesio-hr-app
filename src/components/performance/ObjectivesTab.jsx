import React from 'react';
import { Target, Plus, Edit, Trash2 } from 'lucide-react';
import { statusBadge, pct } from './helpers.jsx';
import { Button } from './Modals.jsx';
import { useAppContext } from '../../contexts/AppContext';

export const ObjectivesTab = ({ cycle, onUpdate, onOpenModal }) => {
    const { objectives = [] } = cycle;
    const { employees } = useAppContext();

    const openNew = () => onOpenModal({ id: `o_${Date.now()}`, title: "", description: "", weightPct: 10, ownerId: cycle.employeeId, status: "not_started", krs: [], evidence: [], progress: 0 });
    const openEdit = (obj) => onOpenModal(JSON.parse(JSON.stringify(obj)));
    const deleteObjective = (id) => onUpdate({ objectives: objectives.filter(o => o.id !== id) });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-2"><Target/> Objectives</h3>
                <Button primary onClick={openNew}><Plus size={16}/> New Objective</Button>
            </div>
            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                            <tr>
                                <th className="text-left px-4 py-2 w-2/5">Title</th>
                                <th className="text-left px-2 py-2">Owner</th>
                                <th className="text-left px-2 py-2">Weight</th>
                                <th className="text-left px-2 py-2">Status</th>
                                <th className="text-left px-2 py-2">Progress</th>
                                <th className="text-right px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {objectives.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 align-top">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-800">{o.title}</div>
                                        <div className="text-xs text-gray-500 max-w-xl">{o.description}</div>
                                    </td>
                                    <td className="px-2 py-3">{cycle.participants.find(u=>u.id===o.ownerId)?.name}</td>
                                    <td className="px-2 py-3">{o.weightPct}%</td>
                                    <td className="px-2 py-3">{statusBadge(o.status)}</td>
                                    <td className="px-2 py-3 w-40">
                                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-blue-600" style={{width: pct(o.progress)}}/></div>
                                        <div className="text-xs text-gray-600 mt-1">{o.progress}%</div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <Button onClick={() => openEdit(o)}><Edit size={16}/></Button>
                                            <Button danger onClick={() => deleteObjective(o.id)}><Trash2 size={16}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};