import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, collection, onSnapshot, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, BrainCircuit } from 'lucide-react';

// List of countries for the dropdown
const countries = ["Canada", "USA", "UK", "Germany", "France", "Australia"];

function TimeOffSettings() {
  const [weekends, setWeekends] = useState({ sat: true, sun: true });
  const [holidays, setHolidays] = useState([]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Canada');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 1);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const policyRef = doc(db, 'companyPolicies', 'timeOff');
    const holidaysColRef = collection(policyRef, 'holidays');

    const unsubscribePolicy = onSnapshot(policyRef, (docSnap) => {
      if (docSnap.exists()) {
        setWeekends(docSnap.data().weekends || { sat: true, sun: true });
      }
    });

    const unsubscribeHolidays = onSnapshot(holidaysColRef, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubscribePolicy(); unsubscribeHolidays(); };
  }, []);

  const handleWeekendChange = async (day) => {
    const newWeekends = { ...weekends, [day]: !weekends[day] };
    setWeekends(newWeekends);
    await setDoc(doc(db, 'companyPolicies', 'timeOff'), { weekends: newWeekends }, { merge: true });
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;
    const policyRef = doc(db, 'companyPolicies', 'timeOff');
    await addDoc(collection(policyRef, 'holidays'), { name: newHolidayName, date: newHolidayDate });
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const handleDeleteHoliday = async (holidayId) => {
    await deleteDoc(doc(db, 'companyPolicies', 'timeOff', 'holidays', holidayId));
  };
  
  const handleFetchHolidays = async () => {
    setAiLoading(true);
    const prompt = `List all official public holidays for ${selectedCountry} for the year ${selectedYear}.`;
    
    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "holidayName": { "type": "STRING" },
                            "holidayDate": { "type": "STRING", "description": "Date in YYYY-MM-DD format" }
                        },
                        required: ["holidayName", "holidayDate"]
                    }
                }
            }
        };

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // --- NEW: Try to get more details from the error response ---
            const errorBody = await response.json().catch(() => null);
            const errorMessage = errorBody?.error?.message || `API request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
            const fetchedHolidays = JSON.parse(text);
            const batch = writeBatch(db);
            const policyRef = doc(db, 'companyPolicies', 'timeOff');
            
            fetchedHolidays.forEach(holiday => {
                const newHolidayRef = doc(collection(policyRef, 'holidays'));
                batch.set(newHolidayRef, { name: holiday.holidayName, date: holiday.holidayDate });
            });
            
            await batch.commit();
        } else {
            throw new Error("Could not parse holidays from AI response. The response might be empty.");
        }

    } catch (error) {
        console.error("Error fetching holidays with AI:", error);
        // --- NEW: Show the more specific error message ---
        alert(`AI Assistant Error: I couldn't fetch the holidays.\n\nReason: ${error.message}\n\nPlease try again or add them manually.`);
    } finally {
        setAiLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Weekend Definition</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Select the days of the week that are considered non-working days.</p>
            <div className="flex gap-2">
              {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
                <button key={day} onClick={() => handleWeekendChange(day)} className={`capitalize w-12 h-12 rounded-lg font-semibold transition-colors ${weekends[day] ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Public Holidays</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-2 mb-4">
                <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="border border-gray-300 rounded-md shadow-sm p-2 text-sm">
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="border border-gray-300 rounded-md shadow-sm p-2 text-sm" />
            </div>
            <button onClick={handleFetchHolidays} disabled={aiLoading} className="w-full mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 px-4 rounded-lg disabled:opacity-50">
                <BrainCircuit size={16} />
                {aiLoading ? 'Fetching Holidays...' : 'Use AI to fetch holidays'}
            </button>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {holidays.map(holiday => (
                <div key={holiday.id} className="flex justify-between items-center bg-white p-2 rounded-md border">
                  <p className="text-sm font-semibold text-gray-700">{holiday.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">{holiday.date}</p>
                    <button onClick={() => handleDeleteHoliday(holiday.id)}><Trash2 size={16} className="text-red-500 hover:text-red-700" /></button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddHoliday} className="flex gap-2">
              <input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="Holiday Name" className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 text-sm" />
              <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="border border-gray-300 rounded-md shadow-sm p-2 text-sm" />
              <button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold p-2 rounded-lg"><Plus size={20} /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeOffSettings;
