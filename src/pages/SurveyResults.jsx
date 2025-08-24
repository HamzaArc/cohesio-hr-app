import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Percent, CheckCircle, Clock, Shield, Star, MessageSquare, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

// --- Reusable Components ---

const KpiCard = ({ title, value, suffix, hint }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
            {value}
            {suffix && <span className="text-xl text-gray-400 font-medium ml-1">{suffix}</span>}
        </p>
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
);

const QuestionAnalytics = ({ question, responses, isAnonymous, employeeMap }) => {
    const data = useMemo(() => {
        const questionResponses = responses.map(r => ({
            answer: r.answers[question.id],
            userEmail: r.userEmail,
            submittedAt: r.submittedAt
        })).filter(ans => ans.answer !== undefined);

        if (question.type === 'Multiple Choice') {
            const answerCounts = questionResponses.map(r => r.answer);
            return { type: question.type, data: question.options.map(opt => ({ name: opt.text, count: answerCounts.filter(ans => ans === opt.text).length })) };
        }
        if (question.type === 'Scale (1-5)') {
            const answers = questionResponses.map(r => r.answer).filter(Boolean);
            const avg = answers.length > 0 ? answers.reduce((a, b) => a + b, 0) / answers.length : 0;
            return { type: question.type, average: avg.toFixed(2), data: [1, 2, 3, 4, 5].map(i => ({ name: `${i} Star`, count: answers.filter(ans => ans === i).length })) };
        }
        // Open Text
        return { type: question.type, data: questionResponses };
    }, [question, responses]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{question.text}</h3>
                {data.type === 'Scale (1-5)' && <p className="text-sm text-gray-500">Average: <span className="font-bold text-lg text-blue-600">{data.average}</span></p>}
            </div>

            { (data.type === 'Multiple Choice' || data.type === 'Scale (1-5)') && (
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <BarChart data={data.data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip cursor={{fill: '#f3f4f6'}} />
                            <Bar dataKey="count" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            { data.type === 'Open Text' && (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                    {data.data.length > 0 ? data.data.map((res, i) => (
                        <div key={i} className="p-3 bg-gray-50 border rounded-md">
                            <p className="text-sm text-gray-700 italic">"{res.answer}"</p>
                            {!isAnonymous && (
                                <div className="text-right text-xs text-gray-400 mt-2 pt-2 border-t border-dashed">
                                    - {employeeMap.get(res.userEmail)?.name || 'Unknown'}
                                </div>
                            )}
                        </div>
                    )) : <p className="text-sm text-gray-500">No text responses for this question.</p>}
                </div>
            )}
        </div>
    );
};

// --- Main Page Component ---
function SurveyResults() {
  const { surveyId } = useParams();
  const { employees, companyId } = useAppContext();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!surveyId || !companyId) return;
    const fetchSurvey = async () => {
      const docRef = doc(db, 'companies', companyId, 'surveys', surveyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSurvey({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [surveyId, companyId]);

  const { kpis, participationData, allComments, employeeMap } = useMemo(() => {
    if (!survey || employees.length === 0) return { kpis: {}, participationData: [], allComments: [], employeeMap: new Map() };
    
    const empMap = new Map(employees.map(e => [e.email, e]));
    const responseMap = new Map((survey.responses || []).map(r => [r.userEmail, r]));

    const pData = (survey.participants || []).map(email => {
        const response = responseMap.get(email);
        return {
            name: empMap.get(email)?.name || email,
            status: response ? 'Responded' : 'Not Yet Responded',
            submittedAt: response ? response.submittedAt.toDate().toLocaleString() : null
        };
    });

    const ratingAnswers = (survey.responses || []).flatMap(r => Object.values(r.answers).filter(a => typeof a === 'number'));
    const avgRating = ratingAnswers.length > 0 ? (ratingAnswers.reduce((a, b) => a + b, 0) / ratingAnswers.length).toFixed(2) : 'N/A';
    const participationRate = survey.participants?.length > 0 ? (((survey.responses?.length || 0) / survey.participants.length) * 100).toFixed(0) : 0;
    
    const comments = (survey.questions || [])
        .filter(q => q.type === 'Open Text')
        .flatMap(q => 
            (survey.responses || []).map(r => ({
                question: q.text,
                answer: r.answers[q.id],
                userEmail: r.userEmail
            })).filter(c => c.answer)
        );

    return { 
        kpis: {
            responses: survey.responses?.length || 0,
            participants: survey.participants?.length || 0,
            participationRate,
            avgRating
        },
        participationData: pData,
        allComments: comments,
        employeeMap: empMap,
    };
  }, [survey, employees]);

  if (loading) return <div className="p-8">Loading results...</div>;
  if (!survey) return <div className="p-8">Survey not found.</div>;
  
  const tabs = [
      { id: "overview", label: "Overview" },
      { id: "questions", label: "Questions" },
      { id: "comments", label: "Comments" },
      { id: "participants", label: "Participants" },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <header className="mb-8">
        <Link to="/surveys" className="text-sm text-blue-600 font-semibold hover:underline mb-2 flex items-center gap-2"><ArrowLeft size={16}/> Back to Surveys</Link>
        <h1 className="text-3xl font-bold text-gray-800">{survey.title}</h1>
        <p className="text-gray-500">{survey.description}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total Responses" value={kpis.responses} hint={`out of ${kpis.participants} invited`} />
        <KpiCard title="Participation Rate" value={kpis.participationRate} suffix="%" />
        <KpiCard title="Average Rating" value={kpis.avgRating} hint="Across all scale questions" />
        {survey.isAnonymous && <KpiCard title="Anonymity" value="Enabled" hint="Responses are anonymous" />}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-2 flex">
            {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3 px-4 text-sm font-semibold transition-colors ${ activeTab === t.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{t.label}</button>
            ))}
        </div>
        
        <div className="p-6">
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Key Question Insights</h2>
                    {(survey.questions || []).filter(q => q.type === 'Scale (1-5)').map(q => (
                        <QuestionAnalytics key={q.id} question={q} responses={survey.responses || []} isAnonymous={survey.isAnonymous} employeeMap={employeeMap} />
                    ))}
                </div>
            )}
            {activeTab === 'questions' && (
                <div className="space-y-6">
                    {(survey.questions || []).map(q => (
                        <QuestionAnalytics key={q.id} question={q} responses={survey.responses || []} isAnonymous={survey.isAnonymous} employeeMap={employeeMap} />
                    ))}
                </div>
            )}
             {activeTab === 'comments' && (
                <div className="space-y-4">
                    {allComments.map((comment, i) => (
                         <div key={i} className="p-4 bg-gray-50 border rounded-md">
                            <p className="text-xs text-gray-500 font-semibold mb-1">{comment.question}</p>
                            <p className="text-gray-700 italic">"{comment.answer}"</p>
                            {!survey.isAnonymous && (
                                <div className="text-right text-xs text-gray-400 mt-2 pt-2 border-t border-dashed">
                                    - {employeeMap.get(comment.userEmail)?.name || 'Unknown'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'participants' && (
                <table className="w-full text-left">
                    <thead><tr className="border-b"><th className="p-2 font-semibold text-gray-500 text-sm">Participant</th><th className="p-2 font-semibold text-gray-500 text-sm">Status</th><th className="p-2 font-semibold text-gray-500 text-sm">Submitted On</th></tr></thead>
                    <tbody>
                        {participationData.map((p, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3">
                                    <span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full w-fit ${p.status === 'Responded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {p.status === 'Responded' ? <CheckCircle size={14} className="mr-1.5"/> : <Clock size={14} className="mr-1.5"/>}
                                        {p.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-600">{p.submittedAt || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
}

export default SurveyResults;
