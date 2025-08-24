import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Target, Calendar as CalIcon, Plus, TrendingUp, MessageSquare, FileText, Award, Clock, Flag, User } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';

import { ObjectivesTab } from './performance-components/ObjectivesTab.jsx';
import { DevPlanTab } from './performance-components/DevPlanTab.jsx';
import { OneOnOnesTab } from './performance-components/OneOnOnesTab.jsx';
import { ReviewTab } from './performance-components/ReviewTab.jsx';
import { ObjectiveModal, DevActionModal, OneOnOneModal } from './performance-components/Modals.jsx';
import { daysBetween, pct, weightedProgress, sixMonthsFrom } from './performance-components/helpers.jsx';

// --- Main Page Component ---
export default function PerformanceCycle() {
  const { companyId, currentUser, employees } = useAppContext();
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState({ type: null, data: null });

  const currentUserEmployee = useMemo(() => 
    employees.find(e => e.email === currentUser?.email),
  [employees, currentUser]);

  // --- Data Fetching ---
  useEffect(() => {
    if (!companyId || !currentUserEmployee) return;

    const cyclesRef = collection(db, 'companies', companyId, 'performanceCycles');
    const q = query(cyclesRef, where('employeeId', '==', currentUserEmployee.id), where('status', '==', 'active'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCycle(null);
      } else {
        const doc = snapshot.docs[0];
        setCycle({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId, currentUserEmployee]);

  // --- Derived State & KPIs ---
  const { cycleDays, daysElapsed, timelinePct, kpi } = useMemo(() => {
    if (!cycle) return { cycleDays: 0, daysElapsed: 0, timelinePct: 0, kpi: {} };
    
    const start = cycle.start.toDate();
    const end = cycle.end.toDate();
    const cDays = daysBetween(start, end);
    const dElapsed = Math.max(0, Math.min(cDays, daysBetween(start, new Date())));
    const tPct = Math.round((dElapsed / (cDays || 1)) * 100);

    const objectives = cycle.objectives || [];
    const oneOnOnes = cycle.oneOnOnes || [];
    const done = objectives.filter(o => o.status === "done").length;
    const atRisk = objectives.filter(o => o.status === "at_risk" || o.status === "blocked").length;
    const next11 = oneOnOnes.slice().sort((a, b) => +new Date(a.when) - +new Date(b.when))[0];
    const weighted = weightedProgress(objectives);

    return {
      cycleDays: cDays,
      daysElapsed: dElapsed,
      timelinePct: tPct,
      kpi: { totalObj: objectives.length, done, atRisk, next11, weighted }
    };
  }, [cycle]);

  // --- CRUD Operations ---
  const updateCycle = useCallback(async (updatedData) => {
    if (!cycle) return;
    const cycleRef = doc(db, 'companies', companyId, 'performanceCycles', cycle.id);
    await updateDoc(cycleRef, updatedData);
  }, [cycle, companyId]);

  const startNewCycle = async (carryForwardObjectives = []) => {
      if (!companyId || !currentUserEmployee) return;
      const manager = employees.find(e => e.email === currentUserEmployee.managerEmail);
      const newStart = cycle ? cycle.end.toDate() : new Date();
      const newEnd = sixMonthsFrom(newStart);

      const newCycle = {
          employeeId: currentUserEmployee.id,
          managerId: manager ? manager.id : null,
          participants: [
              { id: currentUserEmployee.id, name: currentUserEmployee.name },
              ...(manager ? [{ id: manager.id, name: manager.name }] : [])
          ],
          start: newStart,
          end: newEnd,
          status: 'active',
          objectives: carryForwardObjectives,
          devPlan: [],
          oneOnOnes: [],
          progressHistory: [{ date: serverTimestamp(), progress: 0 }],
          review: null,
      };
      
      if (cycle) { // Mark old cycle as complete
          const oldCycleRef = doc(db, 'companies', companyId, 'performanceCycles', cycle.id);
          await updateDoc(oldCycleRef, { status: 'completed' });
      }

      await addDoc(collection(db, 'companies', companyId, 'performanceCycles'), newCycle);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Performance Data...</div>;
  }

  if (!cycle) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">No Active Performance Cycle</h2>
        <p className="text-gray-600 mt-2">Get started by creating your first 6-month development plan.</p>
        <Button primary onClick={() => startNewCycle()} className="mt-6"><Plus size={16}/> Start New Cycle</Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 bg-gray-50 min-h-full">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Performance & Development</h1>
            <p className="text-gray-600">6-month cycle for {currentUserEmployee?.name}</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9 space-y-6">
                <div className="bg-white p-2 rounded-xl border shadow-sm flex items-center gap-2 overflow-x-auto">
                    {["overview", "objectives", "development", "1-on-1s", "review"].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors whitespace-nowrap ${tab === t ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
                            {t.replace("-", " ")}
                        </button>
                    ))}
                </div>

                {tab === "overview" && <Overview kpi={kpi} cycle={cycle} timelinePct={timelinePct} />}
                {tab === "objectives" && <ObjectivesTab cycle={cycle} onUpdate={updateCycle} onOpenModal={(data) => setModal({ type: 'objective', data })} />}
                {tab === "development" && <DevPlanTab cycle={cycle} onUpdate={updateCycle} onOpenModal={(data) => setModal({ type: 'devAction', data })} />}
                {tab === "1-on-1s" && <OneOnOnesTab cycle={cycle} onUpdate={updateCycle} onOpenModal={(data) => setModal({ type: 'oneOnOne', data })} />}
                {tab === "review" && <ReviewTab cycle={cycle} onUpdate={updateCycle} onStartNextCycle={startNewCycle} />}
            </div>
            <aside className="lg:col-span-3 space-y-6">
                <Sidebar cycle={cycle} />
            </aside>
        </main>
      </div>

      {modal.type === 'objective' && <ObjectiveModal isOpen onClose={() => setModal({ type: null, data: null })} data={modal.data} cycle={cycle} onSave={updateCycle} />}
      {modal.type === 'devAction' && <DevActionModal isOpen onClose={() => setModal({ type: null, data: null })} data={modal.data} cycle={cycle} onSave={updateCycle} />}
      {modal.type === 'oneOnOne' && <OneOnOneModal isOpen onClose={() => setModal({ type: null, data: null })} data={modal.data} cycle={cycle} onSave={updateCycle} />}
    </>
  );
}

// --- Sub-components for Overview and Sidebar ---
const Overview = ({ kpi, cycle, timelinePct }) => {
    const daysElapsed = Math.max(0, Math.min(daysBetween(cycle.start.toDate(), cycle.end.toDate()), daysBetween(cycle.start.toDate(), new Date())));

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Current Cycle Timeline</div>
                        <div className="font-bold text-lg">{cycle.start.toDate().toLocaleDateString()} → {cycle.end.toDate().toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm font-medium">{daysElapsed} / {daysBetween(cycle.start.toDate(), cycle.end.toDate())} days</div>
                </div>
                <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: pct(timelinePct) }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <KPI icon={<Target />} label="Objectives" value={`${kpi.done}/${kpi.totalObj}`} sub="Completed" />
                <KPI icon={<TrendingUp />} label="Overall Progress" value={`${Math.round(kpi.weighted)}%`} sub="Weighted Average" />
                <KPI icon={<AlertTriangle />} label="At Risk / Blocked" value={kpi.atRisk} />
                <KPI icon={<CalIcon />} label="Next 1:1" value={kpi.next11 ? new Date(kpi.next11.when).toLocaleDateString() : "—"} sub={kpi.next11 ? `with ${cycle.participants.find(p=>p.id === kpi.next11.withId)?.name}` : "Not scheduled"} />
            </div>
        </div>
    )
}

const KPI = ({ icon, label, value, sub }) => (
    <div className="rounded-2xl border bg-white p-4 flex items-center gap-4">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
        <div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            {sub && <div className="text-xs text-gray-500">{sub}</div>}
        </div>
    </div>
);

const Sidebar = ({ cycle }) => (
    <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-2">Participants</div>
            <ul className="space-y-2 text-sm">
                {cycle.participants.map(p => <li key={p.id} className="flex items-center gap-2"><User size={16} className="text-gray-400" /> {p.name}</li>)}
            </ul>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-2">Key Dates</div>
            <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Flag size={16} className="text-gray-400" /> Start: {cycle.start.toDate().toLocaleDateString()}</li>
                <li className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> Today: {new Date().toLocaleDateString()}</li>
                <li className="flex items-center gap-2"><CalIcon size={16} className="text-gray-400" /> End: {cycle.end.toDate().toLocaleDateString()}</li>
            </ul>
        </div>
    </div>
);