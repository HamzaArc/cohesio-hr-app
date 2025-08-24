import React, { useEffect, useMemo, useState, useCallback } from "react";
import { LogIn, LogOut, Pause, Play, MapPin, AlertTriangle, Wifi, WifiOff, ShieldCheck, RefreshCcw, History, Info } from "lucide-react";
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';

// --- SETTINGS (Replace with dynamic data from Firestore in the future) ---
const SETTINGS = {
  geofence: { lat: 33.5731, lng: -7.5898, radiusM: 200 }, // Casablanca center (example)
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
  if (!user) return { ok: false, distance: Infinity };
  const distance = haversineMeters({ lat: user.lat, lng: user.lng }, { lat: fence.lat, lng: fence.lng });
  return { ok: distance <= fence.radiusM, distance };
}

// --- Main Component ---
export default function SmartClock() {
  const { companyId, currentUser } = useAppContext();
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [coords, setCoords] = useState(null);
  const [loadingPos, setLoadingPos] = useState(false);
  const [punches, setPunches] = useState([]);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null);

  // Tick clock every second
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  // Get user's location only on mount
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
      return () => {
          window.removeEventListener("online", on);
          window.removeEventListener("offline", off);
      };
  }, [getPosition]);

  // Subscribe to today's punches from Firestore
  useEffect(() => {
    if (!currentUser || !companyId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    const q = query(
      clockEventsRef,
      where('timestamp', '>=', today),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const log = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPunches(log);
    });

    return () => unsubscribe();
  }, [currentUser, companyId]);

  const { status, can } = useMemo(() => {
    let currentStatus = "idle";
    if (punches.length > 0) {
      const last = punches[punches.length - 1];
      if (last.type === "clock-in") currentStatus = "working";
      else if (last.type === "break-start") currentStatus = "on_break";
      else if (last.type === "break-end") currentStatus = "working";
      else if (last.type === "clock-out") currentStatus = "idle";
    }

    const shiftStart = parseHHMM(SETTINGS.shiftPolicy.start);
    const isBeforeShift = now < new Date(shiftStart.getTime() - SETTINGS.shiftPolicy.allowEarlyClockInMin * 60000);

    const permissions = {
      clockIn: currentStatus === "idle" && !isBeforeShift,
      breakStart: currentStatus === "working",
      breakEnd: currentStatus === "on_break",
      clockOut: currentStatus === "working" || currentStatus === "on_break",
    };
    return { status: currentStatus, can: permissions };
  }, [punches, now]);

  const geo = withinGeofence(coords, SETTINGS.geofence);
  const shiftStart = parseHHMM(SETTINGS.shiftPolicy.start);
  const isLate = now > new Date(shiftStart.getTime() + SETTINGS.shiftPolicy.graceLateMin * 60000);

  const handlePunch = async (type) => {
    if (!currentUser || !companyId) return;

    const needsNote = SETTINGS.requireNoteOnException && (!geo.ok || (type === "clock-in" && isLate));
    if (needsNote && !note) {
      setConfirm(type);
      return;
    }

    const clockEventsRef = collection(db, 'companies', companyId, 'employees', currentUser.uid, 'clockEvents');
    await addDoc(clockEventsRef, {
      type,
      timestamp: serverTimestamp(),
      location: coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy } : null,
      outsideGeofence: SETTINGS.requireGeoForPunch ? !geo.ok : false,
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

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Time Clock</h1>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2">
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {online ? <StatusPill ok label="Online" icon={Wifi} /> : <StatusPill ok={false} label="Offline (Queued)" icon={WifiOff} warn />}
                      <div className="flex items-center gap-1 group relative">
                        {coords ? <StatusPill ok={geo.ok} label={geo.ok ? "At Site" : `Outside • ${Math.round(geo.distance)}m`} icon={MapPin} /> : <StatusPill ok={false} label={loadingPos ? "Locating…" : "No Location"} icon={Navigation} warn />}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <h4 className="font-bold">Geofencing Active</h4>
                            <p>For punch accuracy, your location is checked against the designated work site radius of {SETTINGS.geofence.radiusM}m.</p>
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

                  <div className="grid grid-cols-3 gap-3 text-sm text-center mb-6">
                    <div className="rounded-xl bg-gray-50 p-3 border">
                      <div className="text-gray-500">Shift</div>
                      <div className="font-medium mt-1">{SETTINGS.shiftPolicy.start} – {SETTINGS.shiftPolicy.end}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 border">
                      <div className="text-gray-500">Break</div>
                      <div className="font-medium mt-1">{SETTINGS.shiftPolicy.breakMinutes} min</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 border">
                      <div className="text-gray-500">Grace</div>
                      <div className="font-medium mt-1">Late {SETTINGS.shiftPolicy.graceLateMin} min</div>
                    </div>
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
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
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
                            {p.note && <p className="text-xs text-gray-600 mt-2 pl-8 italic">“{p.note}”</p>}
                        </div>
                      ))
                    }
                  </div>
                </div>
            </aside>
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
        </main>
      </div>
    </div>
  );
}