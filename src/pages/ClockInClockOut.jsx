import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit, updateDoc, doc, getDocs } from 'firebase/firestore';
import { Clock, LogIn, LogOut, Coffee, Briefcase, ChevronRight, ChevronLeft, User, Calendar } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

// --- New Manager View Calendar Component ---
const ManagerCalendar = ({ entries, onDayClick, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const entryDates = new Set(entries.map(e => e.timestamp?.toDate().toISOString().split('T')[0]));

    const grid = [];
    for (let i = 0; i < firstDayOfMonth; i++) grid.push({ key: `blank-${i}` });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      
      grid.push({ 
        key: `day-${day}`, day, date,
        hasEntry: entryDates.has(dateString),
      });
    }
    return grid;
  }, [currentYear, currentMonth, entries]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDateString = selectedDate.toISOString().split('T')[0];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-2">
                <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
                <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-px text-center text-sm">
            {weekDays.map(day => <div key={day} className="font-semibold text-gray-500 pb-2">{day}</div>)}
            {calendarGrid.map(cell => {
                const isSelected = cell.date?.toISOString().split('T')[0] === selectedDateString;
                const cellClasses = ['h-12 w-12 mx-auto flex items-center justify-center rounded-full transition-colors'];

                if (!cell.day) {
                    cellClasses.push('cursor-default');
                } else {
                    cellClasses.push('hover:bg-blue-100');
                    if (isSelected) {
                        cellClasses.push('bg-green-100 ring-2 ring-green-400 text-gray-700');
                        if (cell.hasEntry) {
                            cellClasses.push('font-bold');
                        }
                    } else {
                        cellClasses.push('text-gray-700');
                    }
                }

                return (
                    <button 
                        key={cell.key} 
                        onClick={() => cell.day && onDayClick(cell.date)}
                        className={cellClasses.join(' ')}
                        disabled={!cell.day}
                    >
                        {cell.day}
                    </button>
                )
            })}
        </div>
    </div>
  );
};

// --- Main Component ---
function ClockInClockOut() {
  const { employees, companyId, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('My Time Clock');
  const [clockedIn, setClockedIn] = useState(false);
  const [lastClockInId, setLastClockInId] = useState(null);
  const [time, setTime] = useState(new Date());
  const [todayLog, setTodayLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- New State for Manager View ---
  const [teamClockEvents, setTeamClockEvents] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingTeamData, setLoadingTeamData] = useState(false);

  const currentUserProfile = useMemo(() => employees.find(e => e.email === currentUser?.email), [employees, currentUser]);
  const myTeam = useMemo(() => {
    if (!currentUserProfile) return [];
    return employees.filter(e => e.managerEmail === currentUserProfile.email);
  }, [employees, currentUserProfile]);


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
        if (lastEvent.type === 'clock-in' || lastEvent.type === 'break-end') {
          setClockedIn(true);
          setLastClockInId(log.find(e => e.type === 'clock-in')?.id);
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
  
  // --- New useEffect to fetch team data ---
  useEffect(() => {
    if (activeTab === 'Manager View' && myTeam.length > 0 && companyId) {
        setLoadingTeamData(true);
        const fetchTeamData = async () => {
            const teamMemberUids = myTeam.map(member => member.uid).filter(Boolean);
            if (teamMemberUids.length === 0) {
                setTeamClockEvents([]);
                setLoadingTeamData(false);
                return;
            }
            
            let allEvents = [];
            for (const uid of teamMemberUids) {
                const clockEventsRef = collection(db, 'companies', companyId, 'employees', uid, 'clockEvents');
                const q = query(clockEventsRef, orderBy('timestamp', 'desc'));
                const snapshot = await getDocs(q);
                const memberEvents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    employeeUid: uid,
                    ...doc.data()
                }));
                allEvents = [...allEvents, ...memberEvents];
            }
            setTeamClockEvents(allEvents);
            setLoadingTeamData(false);
        };
        fetchTeamData();
    }
  }, [activeTab, myTeam, companyId]);

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
    if (!currentUser || !companyId ) return;
    setLoading(true);

    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    await addDoc(clockEventsRef, {
      type: 'clock-out',
      timestamp: serverTimestamp(),
    });
    setLoading(false);
  };
  
    const selectedEmployeeEntries = useMemo(() => {
        if (!selectedEmployee) return [];
        return teamClockEvents.filter(e => e.employeeUid === selectedEmployee.uid);
    }, [teamClockEvents, selectedEmployee]);

    const entriesForSelectedDate = useMemo(() => {
        if (!selectedDate || !selectedEmployee) return [];
        const isSameDay = (date1, date2) => 
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();

        return selectedEmployeeEntries.filter(e => isSameDay(e.timestamp?.toDate(), selectedDate))
            .sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
    }, [selectedEmployeeEntries, selectedDate, selectedEmployee]);


  const TabButton = ({ label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(label)} 
      className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === label ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
      <Icon size={16} />{label}
    </button>
  );

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Time Clock</h1>
      </header>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-2 flex">
            <TabButton label="My Time Clock" icon={Clock} />
            {myTeam.length > 0 && <TabButton label="Manager View" icon={User} />}
        </div>
      
        {activeTab === 'My Time Clock' ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
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
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">My Team</h3>
                    <div className="space-y-2">
                        {myTeam.map(emp => (
                            <button 
                                key={emp.id} 
                                onClick={() => setSelectedEmployee(emp)}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-50'}`}
                            >
                                {emp.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedEmployee ? (
                      <ManagerCalendar entries={selectedEmployeeEntries} onDayClick={setSelectedDate} selectedDate={selectedDate} />
                  ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed">
                          <p className="text-gray-500">Select an employee to view their calendar.</p>
                      </div>
                  )}
                </div>
                <div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Calendar size={16}/> Entries for {selectedDate.toLocaleDateString()}</h3>
                       {entriesForSelectedDate.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {entriesForSelectedDate.map(log => (
                                    <li key={log.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center">
                                            {log.type.includes('in') ? <LogIn size={16} className="text-green-500 mr-3" /> : <LogOut size={16} className="text-red-500 mr-3" />}
                                            <p className="font-semibold text-gray-700 capitalize">{log.type.replace('-', ' ')}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">{log.timestamp?.toDate().toLocaleTimeString()}</p>
                                    </li>
                                ))}
                            </ul>
                       ) : (
                           <p className="text-center text-gray-500 py-8">No entries for this day.</p>
                       )}
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClockInClockOut;