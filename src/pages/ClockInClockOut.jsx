import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { Clock, LogIn, LogOut, Coffee, Briefcase, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function ClockInClockOut() {
  const { companyId, currentUser } = useAppContext();
  const [clockedIn, setClockedIn] = useState(false);
  const [lastClockInId, setLastClockInId] = useState(null);
  const [time, setTime] = useState(new Date());
  const [todayLog, setTodayLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentUser || !companyId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    const q = query(
      clockEventsRef,
      where('timestamp', '>=', today),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const log = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodayLog(log);

      if (log.length > 0) {
        const lastEvent = log[0];
        if (lastEvent.type === 'clock-in') {
          setClockedIn(true);
          setLastClockInId(lastEvent.id);
        } else {
          setClockedIn(false);
          setLastClockInId(null);
        }
      } else {
        setClockedIn(false);
        setLastClockInId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, companyId]);

  const handleClockIn = async () => {
    if (!currentUser || !companyId) return;
    setLoading(true);
    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    await addDoc(clockEventsRef, {
      type: 'clock-in',
      timestamp: serverTimestamp(),
    });
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!currentUser || !companyId || !lastClockInId) return;
    setLoading(true);
    const clockInRef = doc(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents', lastClockInId);
    await updateDoc(clockInRef, {
      clockOutTimestamp: serverTimestamp()
    });

    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    await addDoc(clockEventsRef, {
      type: 'clock-out',
      timestamp: serverTimestamp(),
    });
    setLoading(false);
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Time Clock</h1>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-lg font-semibold text-gray-600">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-5xl font-bold text-gray-800 my-4">{time.toLocaleTimeString()}</p>
            {clockedIn ? (
              <button onClick={handleClockOut} disabled={loading} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center shadow-sm">
                <LogOut size={20} className="mr-2" /> Clock Out
              </button>
            ) : (
              <button onClick={handleClockIn} disabled={loading} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center shadow-sm">
                <LogIn size={20} className="mr-2" /> Clock In
              </button>
            )}
            <div className="flex justify-around mt-4">
              <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                <Coffee size={20} />
                <span className="text-xs mt-1">Start Break</span>
              </button>
              <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                <Briefcase size={20} />
                <span className="text-xs mt-1">Switch Job</span>
              </button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Today's Activity</h2>
            <ul className="divide-y divide-gray-100">
              {todayLog.map(log => (
                <li key={log.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    {log.type === 'clock-in' ? <LogIn size={16} className="text-green-500 mr-3" /> : <LogOut size={16} className="text-red-500 mr-3" />}
                    <p className="font-semibold text-gray-700 capitalize">{log.type.replace('-', ' ')}</p>
                  </div>
                  <p className="text-sm text-gray-500">{log.timestamp?.toDate().toLocaleTimeString()}</p>
                </li>
              ))}
              {todayLog.length === 0 && !loading && (
                <p className="text-center text-gray-500 py-4">No activity yet today.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClockInClockOut;