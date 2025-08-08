import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, increment, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { X, AlertCircle } from 'lucide-react';

function calculateBusinessDays(startDate, endDate, weekends, holidays) {
  if (!startDate || !endDate) return 0;
  let start = new Date(startDate);
  let end = new Date(endDate);
  let count = 0;

  const holidayDates = new Set(holidays.map(h => h.date));
  const weekendDays = Object.keys(weekends).filter(day => weekends[day]).map(day => {
      const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      return map[day];
  });

  const curDate = new Date(start.getTime());
  curDate.setMinutes(curDate.getMinutes() + curDate.getTimezoneOffset());
  end.setMinutes(end.getMinutes() + end.getTimezoneOffset());

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    const dateString = curDate.toISOString().split('T')[0];

    if (!weekendDays.includes(dayOfWeek) && !holidayDates.has(dateString)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

function RequestTimeOffModal({ isOpen, onClose, onrequestSubmitted, currentUserProfile }) {
  const [leaveType, setLeaveType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [weekends, setWeekends] = useState({ sat: true, sun: true });
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (isOpen) {
        const policyRef = doc(db, 'companyPolicies', 'timeOff');
        const holidaysColRef = collection(policyRef, 'holidays');
        
        const unsubPolicy = onSnapshot(policyRef, (docSnap) => {
            if (docSnap.exists()) setWeekends(docSnap.data().weekends);
        });
        const unsubHolidays = onSnapshot(holidaysColRef, (snap) => {
            setHolidays(snap.docs.map(doc => doc.data()));
        });
        return () => { unsubPolicy(); unsubHolidays(); };
    }
  }, [isOpen]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setMinDate(today.toISOString().split('T')[0]);

    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      const days = calculateBusinessDays(startDate, endDate, weekends, holidays);
      setTotalDays(days);
      setError('');
    } else {
      setTotalDays(0);
      if (startDate && endDate) { setError('End date cannot be before the start date.'); }
    }
  }, [startDate, endDate, weekends, holidays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error || !startDate || !endDate) { setError('Please fix the errors before submitting.'); return; }
    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUserProfile) throw new Error("Could not find user profile.");

      const balanceFieldMap = { 'Vacation': 'vacationBalance', 'Sick Day': 'sickBalance', 'Personal (Unpaid)': 'personalBalance' };
      const balanceField = balanceFieldMap[leaveType];
      const currentBalance = currentUserProfile[balanceField] ?? 0;

      if (currentBalance < totalDays) {
        setError(`Insufficient balance. You only have ${currentBalance} day(s) remaining.`);
        setLoading(false);
        return;
      }

      const requestsRef = collection(db, 'timeOffRequests');
      const q = query(requestsRef, where("userEmail", "==", currentUser.email), where("status", "in", ["Pending", "Approved"]), where("endDate", ">=", startDate));
      const overlappingSnapshot = await getDocs(q);
      let isOverlapping = false;
      overlappingSnapshot.forEach(doc => {
          if (doc.data().startDate <= endDate) { isOverlapping = true; }
      });

      if (isOverlapping) {
          setError("You already have a request that overlaps with these dates.");
          setLoading(false);
          return;
      }

      const batch = writeBatch(db);
      const newRequestRef = doc(collection(db, 'timeOffRequests'));
      batch.set(newRequestRef, {
        leaveType, startDate, endDate, description, totalDays,
        status: 'Pending', requestedAt: serverTimestamp(), userEmail: currentUser.email,
      });

      const employeeRef = doc(db, 'employees', currentUserProfile.id);
      batch.update(employeeRef, { [balanceField]: increment(-totalDays) });

      await batch.commit();
      onrequestSubmitted(newRequestRef.id);
      handleClose();
    } catch (err) {
      setError('Failed to submit request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLeaveType('Vacation'); setStartDate(''); setEndDate('');
    setDescription(''); setTotalDays(0); setError(''); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Request Time Off</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select id="leaveType" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option>Vacation</option>
                <option>Sick Day</option>
                <option>Personal (Unpaid)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="startDate" value={startDate} min={minDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" id="endDate" value={endDate} min={startDate || minDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
            </div>
            
            {totalDays > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-gray-800">Summary</h3>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-gray-600">Total days requested:</p>
                        <p className="font-bold text-lg text-blue-600">{totalDays} day{totalDays > 1 && 's'}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">*Weekends & public holidays are not included.</p>
                </div>
            )}

          </div>
          {error && <p className="text-red-500 text-sm mt-4 flex items-center"><AlertCircle size={16} className="mr-2"/>{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestTimeOffModal;
