import React, { useEffect, useMemo, useState, useCallback } from "react";
import { LogIn, LogOut, Pause, Play, MapPin, AlertTriangle, Wifi, Clock, Users, WifiOff, ShieldCheck, RefreshCcw, History, Info, User, Calendar, Briefcase, Coffee, ChevronLeft, ChevronRight, MessageSquare, CheckCircle } from "lucide-react";
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, getDocs, doc } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';

// --- SETTINGS ---
const SETTINGS = {
  // Geofence radius in meters
  geofenceRadiusM: 200,
  shiftPolicy: {
    start: "09:00",
    end: "17:30",
    breakMinutes: 45,
    graceLateMin: 5,
    allowEarlyClockInMin: 10,
  },
  requireGeoForPunch: true,
  requireNoteOnException: true,
};

// --- Helper Functions ---
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtShort = (d) => d ? `${d.toLocaleDateString()} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '...';

function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function parseHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function withinGeofence(user, fence) {
  if (!user || !fence) return { ok: false, distance: Infinity };
  const distance = haversineMeters({ lat: user.lat, lng: user.lng }, { lat: fence.lat, lng: fence.lng });
  return { ok: distance <= SETTINGS.geofenceRadiusM, distance };
}

// --- Reusable Components ---
const StatCard = ({ icon, title, value, subtext }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-4">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
       {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
    </div>
);


// --- Manager View Calendar Component ---
const ManagerCalendar = ({ entries, onDayClick }) => {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-2">
                <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
                <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-px text-center text-sm">
            {weekDays.map(day => <div key={day} className="font-semibold text-gray-500 pb-2">{day}</div>)}
            {calendarGrid.map(cell => (
                <button 
                    key={cell.key} 
                    onClick={() => cell.day && onDayClick(cell.date)}
                    className={`h-12 w-12 mx-auto flex items-center justify-center rounded-full transition-colors ${!cell.day ? 'cursor-default' : 'hover:bg-blue-100'} ${cell.hasEntry ? 'bg-blue-500 text-white font-bold' : 'text-gray-700'}`}
                    disabled={!cell.day}
                >
                    {cell.day}
                </button>
            ))}
        </div>
    </div>
  );
};


// --- Main Component ---
export default function SmartClock() {
  const { companyId, currentUser, employees } = useAppContext();
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [coords, setCoords] = useState(null);
  const [loadingPos, setLoadingPos] = useState(false);
  const [punches, setPunches] = useState([]);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('My Time Clock');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [settings, setSettings] = useState(null);
  const [allMyPunches, setAllMyPunches] = useState([]);
  
  // Manager View State
  const [teamClockEvents, setTeamClockEvents] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingTeamData, setLoadingTeamData] = useState(false);

  const currentUserProfile = useMemo(() => employees.find(e => e.email === currentUser?.email), [employees, currentUser]);
  const myTeam = useMemo(() => {
    if (!currentUserProfile) return [];
    return employees.filter(e => e.managerEmail === currentUserProfile.email);
  }, [employees, currentUserProfile]);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoadingPos(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoadingPos(false);
      },
      () => setLoadingPos(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);
  
  useEffect(() => { 
      getPosition();
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);

      if (companyId) {
          const unsub = onSnapshot(doc(db, 'companies', companyId), (docSnap) => {
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  setCompanyInfo(data);
                   if (data.address === "An der Dahme 3, 12527 Berlin, Germany") {
                      // Simulating geocoding for the specific address
                      setSettings({ ...SETTINGS, geofence: { lat: 52.4042, lng: 13.5873, radiusM: 200 } });
                  } else if (data.address) {
                      // Placeholder for a real geocoding API call
                      setSettings({ ...SETTINGS, geofence: { lat: 33.5731, lng: -7.5898, radiusM: 200 } }); // Default to Casablanca if address exists but isn't the test one
                  } else {
                       setSettings({ ...SETTINGS, geofence: null });
                  }
              }
          });
          return () => {
            unsub();
            window.removeEventListener("online", on);
            window.removeEventListener("offline", off);
          }
      }
  }, [getPosition, companyId]);

  // Fetch all punches for the current user for KPI calculations
  useEffect(() => {
      if (!currentUser || !companyId) return;
      const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
      const q = query(clockEventsRef, orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const allPunches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllMyPunches(allPunches);
          const today = new Date();
          today.setHours(0,0,0,0);
          setPunches(allPunches.filter(p => p.timestamp?.toDate() >= today));
      });
      return () => unsubscribe();
  }, [currentUser, companyId]);
  
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
                const memberEvents = snapshot.docs.map(doc => ({ id: doc.id, employeeUid: uid, ...doc.data() }));
                allEvents = [...allEvents, ...memberEvents];
            }
            setTeamClockEvents(allEvents);
            setLoadingTeamData(false);
        };
        fetchTeamData();
    }
  }, [activeTab, myTeam, companyId]);

  const { status, can, weeklyHours, onTimeStreak } = useMemo(() => {
    let currentStatus = "idle";
    const todayPunches = allMyPunches.filter(p => p.timestamp && p.timestamp.toDate() >= new Date().setHours(0,0,0,0));
    if (todayPunches.length > 0) {
      const last = todayPunches[0]; // Already sorted desc
      if (last.type === "clock-in" || last.type === "break-end") currentStatus = "working";
      else if (last.type === "break-start") currentStatus = "on_break";
      else if (last.type === "clock-out") currentStatus = "idle";
    }

    const shiftStart = parseHHMM(settings?.shiftPolicy.start || "09:00");
    const isBeforeShift = now < new Date(shiftStart.getTime() - (settings?.shiftPolicy.allowEarlyClockInMin || 10) * 60000);

    const permissions = {
      clockIn: currentStatus === "idle" && !isBeforeShift,
      breakStart: currentStatus === "working",
      breakEnd: currentStatus === "on_break",
      clockOut: currentStatus === "working" || currentStatus === "on_break",
    };
    
    // --- Live KPI Calculations ---
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfWeek.setHours(0,0,0,0);
    const weeklyPunches = allMyPunches.filter(p => p.timestamp && p.timestamp.toDate() >= startOfWeek).sort((a,b) => a.timestamp.toDate() - b.timestamp.toDate());
    
    let totalMillis = 0;
    let clockInTime = null;
    for(const punch of weeklyPunches) {
        if(punch.type === 'clock-in') {
            clockInTime = punch.timestamp.toDate();
        } else if (punch.type === 'clock-out' && clockInTime) {
            totalMillis += punch.timestamp.toDate() - clockInTime;
            clockInTime = null;
        }
    }

    let streak = 0;
    const graceMinutes = settings?.shiftPolicy.graceLateMin || 5;
    const onTimeArrival = new Date(shiftStart.getTime() + graceMinutes * 60000);
    const dailyClockIns = allMyPunches
        .filter(p => p.type === 'clock-in' && p.timestamp) // Filter out null timestamps
        .reduce((acc, p) => {
            const dateKey = p.timestamp.toDate().toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = p.timestamp.toDate();
            return acc;
    }, {});

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        if (dailyClockIns[dateKey] && dailyClockIns[dateKey] <= onTimeArrival.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())) {
            streak++;
        } else if (dailyClockIns[dateKey]) {
            break; 
        }
    }


    return { status: currentStatus, can: permissions, weeklyHours: totalMillis / (1000 * 60 * 60), onTimeStreak: streak };
  }, [allMyPunches, now, settings]);

  const geo = withinGeofence(coords, settings?.geofence);
  const shiftStart = parseHHMM(settings?.shiftPolicy.start || "09:00");
  const isLate = now > new Date(shiftStart.getTime() + (settings?.shiftPolicy.graceLateMin || 5) * 60000);

  const handlePunch = async (type) => {
    if (!currentUser || !companyId) return;
    const needsNote = settings?.requireNoteOnException && (!geo.ok || (type === "clock-in" && isLate));
    if (needsNote && !note) { setConfirm(type); return; }
    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    await addDoc(clockEventsRef, {
      type, timestamp: serverTimestamp(),
      location: coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy } : null,
      outsideGeofence: settings?.requireGeoForPunch && settings?.geofence ? !geo.ok : false,
      note: note || null,
    });
    setNote("");
    setConfirm(null);
  };
  
  const StatusPill = ({ ok, label, icon: Icon, warn }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : warn ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      <Icon size={14} /> {label}
    </div>
  );
  
  const TabButton = ({ label, icon: Icon }) => (
    <button onClick={() => setActiveTab(label)} className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === label ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Icon size={16} />{label}</button>
  );
  
  const selectedEmployeeEntries = useMemo(() => {
    if (!selectedEmployee) return [];
    return teamClockEvents.filter(e => e.employeeUid === selectedEmployee.uid);
  }, [teamClockEvents, selectedEmployee]);

  const entriesForSelectedDate = useMemo(() => {
    if (!selectedDate || !selectedEmployee) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return selectedEmployeeEntries.filter(e => e.timestamp?.toDate().toISOString().split('T')[0] === dateStr).sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
  }, [selectedEmployeeEntries, selectedDate, selectedEmployee]);

  const managerKPIs = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysEvents = teamClockEvents.filter(e => e.timestamp?.toDate().toISOString().split('T')[0] === todayStr);
      const presentUids = new Set(todaysEvents.filter(e => e.type === 'clock-in').map(e => e.employeeUid));
      const lateArrivals = todaysEvents.filter(e => e.type === 'clock-in' && new Date(e.timestamp.toDate()) > parseHHMM(settings?.shiftPolicy.start || "09:00")).length;
      return { present: presentUids.size, late: lateArrivals };
  }, [teamClockEvents, settings]);

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="w-full">
        <header className="mb-8"><h1 className="text-3xl font-bold text-gray-800">Time Clock</h1></header>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 px-2 flex">
                <TabButton label="My Time Clock" icon={Clock} />
                {myTeam.length > 0 && <TabButton label="Manager View" icon={User} />}
            </div>
            {activeTab === 'My Time Clock' ? (
                <main className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard icon={<Clock size={24}/>} title="Total Hours This Week" value={`${weeklyHours.toFixed(1)}h`} subtext="Based on today's punches." />
                        <StatCard icon={<CheckCircle size={24}/>} title="On-Time Streak" value={`${onTimeStreak} day(s)`} subtext="Consecutive on-time arrivals." />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <section className="lg:col-span-2">
                            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {online ? <StatusPill ok label="Online" icon={Wifi} /> : <StatusPill ok={false} label="Offline (Queued)" icon={WifiOff} warn />}
                                        <div className="flex items-center gap-1 group relative">
                                            {!settings?.geofence ? <StatusPill ok={false} label="Geofence not set" icon={MapPin} /> :
                                             coords ? <StatusPill ok={geo.ok} label={geo.ok ? "At Site" : `Outside • ${Math.round(geo.distance)}m`} icon={MapPin} /> : 
                                             <StatusPill ok={false} label={loadingPos ? "Locating…" : "No Location"} icon={MapPin} warn />}
                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <h4 className="font-bold">Geofencing Active</h4>
                                                <p>Location is checked against: <span className="font-semibold">{companyInfo?.address || "Default Location"}</span></p>
                                            </div>
                                            <Info size={14} className="text-gray-400 cursor-help" />
                                        </div>
                                        {status === 'working' && isLate && <StatusPill ok={false} label="Late Clock-In" icon={AlertTriangle} />}
                                    </div>
                                    <button onClick={getPosition} className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 flex items-center gap-2"><RefreshCcw size={14} /> Refresh</button>
                                </div>
                                <div className="text-center py-8">
                                    <div className="text-6xl font-bold tracking-tight text-gray-800">{fmtTime(now)}</div>
                                    <div className="text-gray-500 mt-1">{now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-semibold">
                                    <button disabled={!can.clockIn} onClick={() => handlePunch("clock-in")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"><LogIn size={18} /> Clock In</button>
                                    <button disabled={!can.breakStart} onClick={() => handlePunch("break-start")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"><Pause size={18} /> Start Break</button>
                                    <button disabled={!can.breakEnd} onClick={() => handlePunch("break-end")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"><Play size={18} /> End Break</button>
                                    <button disabled={!can.clockOut} onClick={() => handlePunch("clock-out")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"><LogOut size={18} /> Clock Out</button>
                                </div>
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-gray-600">Note (required for exceptions)</label>
                                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., Running late due to traffic" className="mt-1 w-full border rounded-xl p-3 min-h-[60px] focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>
                        </section>
                        <aside className="lg:col-span-1">
                            <div className="rounded-2xl border bg-white p-6 shadow-sm h-full">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800"><History size={18}/> Today's Log</h3>
                                <div className="mt-3 divide-y max-h-96 overflow-y-auto">
                                    {punches.length === 0 ? <div className="text-sm text-gray-500 py-8 text-center">No punches yet.</div> :
                                    [...punches].reverse().map((p) => (
                                        <div key={p.id} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {p.type === "clock-in" && <LogIn className="text-green-600 flex-shrink-0" size={18} />}
                                                    {p.type === "break-start" && <Pause className="text-amber-600 flex-shrink-0" size={18} />}
                                                    {p.type === "break-end" && <Play className="text-blue-600 flex-shrink-0" size={18} />}
                                                    {p.type === "clock-out" && <LogOut className="text-red-600 flex-shrink-0" size={18} />}
                                                    <div>
                                                    <div className="font-semibold capitalize text-gray-700">{p.type.replace("_", " ")}</div>
                                                    <div className="text-xs text-gray-500">{p.timestamp ? fmtShort(p.timestamp.toDate()) : '...'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                    }
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>
            ) : (
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard icon={<Users size={24}/>} title="Team Members Present" value={`${managerKPIs.present} / ${myTeam.length}`} />
                        <StatCard icon={<AlertTriangle size={24}/>} title="Late Arrivals Today" value={managerKPIs.late} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2">My Team</h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {myTeam.map(emp => (
                                        <button key={emp.id} onClick={() => setSelectedEmployee(emp)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedEmployee?.id === emp.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-50'}`}>
                                            {emp.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                            {selectedEmployee ? (
                                <ManagerCalendar entries={selectedEmployeeEntries} onDayClick={setSelectedDate} />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed">
                                    <p className="text-gray-500">Select an employee to view their calendar.</p>
                                </div>
                            )}
                            </div>
                            <div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Calendar size={16}/> Entries for {selectedDate.toLocaleDateString()}</h3>
                                {entriesForSelectedDate.length > 0 ? (
                                        <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                                            {entriesForSelectedDate.map(log => (
                                                <li key={log.id} className="py-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center">
                                                            {log.type.includes('in') ? <LogIn size={16} className="text-green-500 mr-3" /> : log.type.includes('start') ? <Pause size={16} className="text-orange-500 mr-3" /> : log.type.includes('end') ? <Play size={16} className="text-blue-500 mr-3" /> : log.type.includes('out') ? <LogOut size={16} className="text-red-500 mr-3" /> : null}
                                                            <p className="font-semibold text-gray-700 capitalize">{log.type.replace('-', ' ')}</p>
                                                        </div>
                                                        <p className="text-sm text-gray-500">{log.timestamp?.toDate().toLocaleTimeString()}</p>
                                                    </div>
                                                    {log.note && <p className="text-xs text-gray-600 mt-2 pl-8 italic flex items-start gap-2"><MessageSquare size={14} className="flex-shrink-0 mt-0.5"/> “{log.note}”</p>}
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
                </div>
            )}
        </div>
        {confirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                    <div className="flex items-center gap-2 text-amber-700"><AlertTriangle />
                    <div className="font-semibold">Confirm {confirm.replace("_", " ")}</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">This punch is an exception: {!geo.ok && <strong>outside geofence</strong>}{confirm === "clock-in" && isLate && <strong>, late arrival</strong>}. A note is required.</p>
                    <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Add your reason here" className="mt-3 w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    <div className="mt-4 flex justify-end gap-2">
                    <button className="px-4 py-2 rounded-xl border hover:bg-gray-50 font-semibold" onClick={()=>setConfirm(null)}>Cancel</button>
                    <button className="px-4 py-2 rounded-xl bg-black text-white font-semibold" onClick={() => handlePunch(confirm)}>Confirm</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}