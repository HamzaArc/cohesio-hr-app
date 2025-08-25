import React, { useState, useEffect } from 'react';
import { Award, Calendar } from 'lucide-react'; // Corrected: CalIcon -> Calendar
import { Button } from './Modals.jsx';

const Field = ({ label, children }) => (
  <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      {children}
  </div>
);
const TextArea = (props) => <textarea {...props} className="w-full px-3 py-2 rounded-lg border min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500" />;

export const ReviewTab = ({ cycle, onUpdate, onStartNextCycle }) => {
    const [review, setReview] = useState(cycle.review || { overall: 75, perObjective: {}, strengths:"", growth:"", feedback:"" });
    
    useEffect(() => {
        if (cycle.review) setReview(cycle.review);
    }, [cycle.review]);

    const handleFinalize = () => {
        onUpdate({ review });
        alert("Review saved!");
    };
    
    const handleStartNew = () => {
        if (window.confirm("Are you sure you want to complete this cycle and start a new one? This will archive the current review.")) {
            const carryForward = cycle.objectives.filter(o => o.status !== "done").map(o => ({...o, id: `o_${Date.now()}_${o.id}`, progress: 0, status: "not_started"}));
            onStartNextCycle(carryForward);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-2"><Award/> Final 6-Month Review</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <Field label={`Overall Performance Score: ${review.overall}%`}>
                        <input type="range" min={0} max={100} value={review.overall} onChange={(e)=>setReview({...review, overall:Number(e.target.value)})} className="w-full mt-2" />
                    </Field>
                </div>
                <Field label="Strengths"><TextArea value={review.strengths} onChange={(e)=>setReview({...review, strengths:e.target.value})} /></Field>
                <Field label="Areas for Growth"><TextArea value={review.growth} onChange={(e)=>setReview({...review, growth:e.target.value})} /></Field>
                <div className="lg:col-span-2"><Field label="Manager's Feedback"><TextArea value={review.feedback} onChange={(e)=>setReview({...review, feedback:e.target.value})} /></Field></div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
                <Button primary onClick={handleFinalize}><Award size={16}/> Save Review</Button>
                <Button onClick={handleStartNew}><Calendar size={16}/> Start Next Cycle</Button>
            </div>
        </div>
    );
};