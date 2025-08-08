import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, writeBatch, addDoc } from 'firebase/firestore';
import { Save, Zap } from 'lucide-react';

function PayrollSettings() {
  const [paySchedule, setPaySchedule] = useState('Bi-weekly');
  const [nextPayday, setNextPayday] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'companyPolicies', 'payroll');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPaySchedule(data.paySchedule || 'Bi-weekly');
        setNextPayday(data.nextPayday || '');
        if (data.nextPayday) {
            setSelectedYear(new Date(data.nextPayday).getFullYear());
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, 'companyPolicies', 'payroll');
      await setDoc(docRef, { paySchedule, nextPayday }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving payroll settings:", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW: Smart Pay Period Generation Logic for ALL schedule types ---
  const handleGeneratePeriods = async () => {
    if (!nextPayday) {
        alert("Please set your company's next pay day before generating periods.");
        return;
    }
    setIsGenerating(true);
    try {
        const year = new Date(nextPayday).getFullYear();
        const periods = [];
        let currentPayday = new Date(nextPayday);
        currentPayday.setMinutes(currentPayday.getMinutes() + currentPayday.getTimezoneOffset());

        let numberOfPeriods = 0;
        switch(paySchedule) {
            case 'Weekly': numberOfPeriods = 52; break;
            case 'Bi-weekly': numberOfPeriods = 26; break;
            case 'Semi-monthly': numberOfPeriods = 24; break;
            case 'Monthly': numberOfPeriods = 12; break;
            default: numberOfPeriods = 26;
        }

        for (let i = 1; i <= numberOfPeriods; i++) {
            if (currentPayday.getFullYear() > year) break;

            let periodStart = new Date(currentPayday);
            let periodEnd = new Date(currentPayday);
            
            // Calculate start and end dates based on schedule
            if (paySchedule === 'Weekly') {
                periodStart.setDate(currentPayday.getDate() - 6);
            } else if (paySchedule === 'Bi-weekly') {
                periodStart.setDate(currentPayday.getDate() - 13);
            } else if (paySchedule === 'Monthly') {
                periodStart = new Date(currentPayday.getFullYear(), currentPayday.getMonth(), 1);
                periodEnd = new Date(currentPayday.getFullYear(), currentPayday.getMonth() + 1, 0);
            } else if (paySchedule === 'Semi-monthly') {
                if (currentPayday.getDate() < 20) { // First half of month
                    periodStart = new Date(currentPayday.getFullYear(), currentPayday.getMonth(), 1);
                    periodEnd = new Date(currentPayday.getFullYear(), currentPayday.getMonth(), 15);
                } else { // Second half of month
                    periodStart = new Date(currentPayday.getFullYear(), currentPayday.getMonth(), 16);
                    periodEnd = new Date(currentPayday.getFullYear(), currentPayday.getMonth() + 1, 0);
                }
            }

            const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            periods.push({
                period: `${i} of ${numberOfPeriods}`,
                periodSpans: `${formatDate(periodStart)} – ${formatDate(periodEnd)}`,
                payDay: formatDate(currentPayday),
                state: 'OPEN',
                type: 'RECURRING'
            });

            // Calculate next payday
            if (paySchedule === 'Weekly') {
                currentPayday.setDate(currentPayday.getDate() + 7);
            } else if (paySchedule === 'Bi-weekly') {
                currentPayday.setDate(currentPayday.getDate() + 14);
            } else if (paySchedule === 'Monthly') {
                currentPayday.setMonth(currentPayday.getMonth() + 1);
            } else if (paySchedule === 'Semi-monthly') {
                if (currentPayday.getDate() < 20) {
                    currentPayday.setDate(15); // Next is end of month
                    currentPayday = new Date(currentPayday.getFullYear(), currentPayday.getMonth() + 1, 0);
                } else {
                    currentPayday = new Date(currentPayday.getFullYear(), currentPayday.getMonth() + 1, 15);
                }
            }
        }

        const batch = writeBatch(db);
        const periodsCollection = collection(db, 'payPeriods');
        periods.forEach(period => {
            const docRef = doc(periodsCollection);
            batch.set(docRef, period);
        });
        await batch.commit();

        alert(`Successfully generated ${periods.length} pay periods for ${year}!`);

    } catch (error) {
        console.error("Error generating pay periods:", error);
        alert("Failed to generate pay periods.");
    } finally {
        setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Pay Schedule</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label htmlFor="paySchedule" className="block text-sm font-medium text-gray-700">How often do you run payroll?</label>
            <select id="paySchedule" value={paySchedule} onChange={(e) => setPaySchedule(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option>Weekly</option>
              <option>Bi-weekly</option>
              <option>Semi-monthly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="nextPayday" className="block text-sm font-medium text-gray-700">What is your next pay day?</label>
            <input type="date" id="nextPayday" value={nextPayday} onChange={(e) => { setNextPayday(e.target.value); setSelectedYear(new Date(e.target.value).getFullYear()); }} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
            <button 
                onClick={handleGeneratePeriods} 
                disabled={isGenerating || !nextPayday}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm disabled:bg-green-400 disabled:cursor-not-allowed"
            >
                <Zap size={16} className="mr-2" />
                {isGenerating ? 'Generating...' : `Generate Periods for ${selectedYear}`}
            </button>
            <div className="flex items-center">
                {saveSuccess && <p className="text-sm text-green-600 mr-4">Settings saved!</p>}
                <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:bg-blue-400">
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default PayrollSettings;
