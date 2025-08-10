import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Plane, Gift, Sun, Heart, Trash2, Calendar, List, Filter, Settings } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, where, writeBatch, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import RequestTimeOffModal from '../components/RequestTimeOffModal';
import TeamCalendar from '../components/TeamCalendar';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import RequestDetailsModal from '../components/RequestDetailsModal';
import DayDrawer from '../components/DayDrawer';
import TimeOffSettings from '../components/TimeOffSettings';
import RescheduleModal from '../components/RescheduleModal';

const BalanceCard = ({ icon, title, balance, bgColor, iconColor }) => ( <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-start border border-gray-200"><div className={`p-2 rounded-lg mb-4 ${bgColor}`}>{React.cloneElement(icon, { className: `w-6 h-6 ${iconColor}` })}</div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold text-gray-800">{balance}</p><p className="text-sm text-gray-500">Days Balance Today</p></div> );
const MainTab = ({ label, active, onClick }) => ( <button onClick={onClick} className={`py-3 px-4 text-sm font-semibold transition-colors ${ active ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700' }`}>{label}</button> );

function TimeOff() {
  const [allRequests, setAllRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [myTeam, setMyTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [weekends, setWeekends] = useState({ sat: true, sun: true });
  const [holidays, setHolidays] = useState([]);
  const [view, setView] = useState('List');
  const [scope, setScope] = useState('Mine');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDateForDrawer, setSelectedDateForDrawer] = useState(null);
  const [eventsForDrawer, setEventsForDrawer] = useState([]);
  const [activeTab, setActiveTab] = useState('Requests');
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }

    const unsubscribers = [];
    
    const policyRef = doc(db, 'companyPolicies', 'timeOff');
    unsubscribers.push(onSnapshot(policyRef, (docSnap) => {
      if (docSnap.exists()) setWeekends(docSnap.data().weekends || { sat: true, sun: true });
    }));
    
    const holidaysColRef = collection(policyRef, 'holidays');
    unsubscribers.push(onSnapshot(holidaysColRef, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    const employeesQuery = query(collection(db, 'employees'));
    unsubscribers.push(onSnapshot(employeesQuery, (snapshot) => {
        const employeeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(employeeList);
        setCurrentUserProfile(employeeList.find(e => e.email === currentUser.email));
        setMyTeam(employeeList.filter(e => e.managerEmail === currentUser.email));
    }));
    
    const requestsQuery = query(collection(db, 'timeOffRequests'), orderBy('requestedAt', 'desc'));
    unsubscribers.push(onSnapshot(requestsQuery, (reqSnapshot) => {
      const employeeMap = new Map(employees.map(e => [e.email, e.name]));
      const allRequestsWithName = reqSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, employeeName: employeeMap.get(doc.data().userEmail) || 'Unknown' }));
      setAllRequests(allRequestsWithName);
      setLoading(false);
    }));
    
    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser, employees]);

  const filteredRequests = useMemo(() => {
    if (!currentUser) return [];
    return allRequests.filter(req => {
        if (scope === 'Mine' && req.userEmail !== currentUser.email) return false;
        if (scope === 'My Team' && !myTeam.some(e => e.email === req.userEmail)) return false;
        return true;
    });
  }, [allRequests, scope, myTeam, currentUser]);

  const addHistoryLog = async (requestId, action) => {
    const historyColRef = collection(db, 'timeOffRequests', requestId, 'history');
    await addDoc(historyColRef, { action, timestamp: serverTimestamp() });
  };

  const handleRequestSubmitted = (newRequestId) => {
    setIsAddModalOpen(false);
    addHistoryLog(newRequestId, 'Created');
  };
  
  const handleUpdateRequestStatus = async (request, newStatus) => {
    const employee = employees.find(e => e.email === request.userEmail);
    if (!employee) { console.error("Could not find employee to update balance."); return; }
    
    const requestRef = doc(db, 'timeOffRequests', request.id);
    const employeeRef = doc(db, 'employees', employee.id);
    const balanceFieldMap = { 'Vacation': 'vacationBalance', 'Sick Day': 'sickBalance', 'Personal (Unpaid)': 'personalBalance' };
    const balanceField = balanceFieldMap[request.leaveType];
    const days = request.totalDays;

    const batch = writeBatch(db);
    batch.update(requestRef, { status: newStatus });

    if (newStatus === 'Denied') {
        batch.update(employeeRef, { [balanceField]: increment(days) });
    }
    
    await batch.commit();
    await addHistoryLog(request.id, newStatus);
  };
  
  const handleDeleteClick = (request) => {
    setSelectedRequest(request);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRequest) return;
    setIsDeleting(true);
    
    const employee = employees.find(e => e.email === selectedRequest.userEmail);
    const requestRef = doc(db, 'timeOffRequests', selectedRequest.id);
    
    const batch = writeBatch(db);
    batch.delete(requestRef);

    if (employee) {
        const balanceFieldMap = { 'Vacation': 'vacationBalance', 'Sick Day': 'sickBalance', 'Personal (Unpaid)': 'personalBalance' };
        const balanceField = balanceFieldMap[selectedRequest.leaveType];
        const days = selectedRequest.totalDays;
        const employeeRef = doc(db, 'employees', employee.id);
        batch.update(employeeRef, { [balanceField]: increment(days) });
    }

    await batch.commit();
    setIsDeleteModalOpen(false);
    setSelectedRequest(null);
    setIsDeleting(false);
  };

  const handleWithdrawRequest = (request) => {
      handleDeleteClick(request);
      setIsDetailsModalOpen(false);
  };
  
  const handleRescheduleClick = (request) => {
      setSelectedRequest(request);
      setIsDetailsModalOpen(false);
      setTimeout(() => {
        setIsRescheduleModalOpen(true);
      }, 100); // Small delay to allow details modal to close
  };

  const canCancel = (request) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date(request.startDate);
    return startDate > today;
  };
  
  const handleRowClick = (request) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };
  
  const handleDayClick = (date, events) => {
      setSelectedDateForDrawer(date);
      setEventsForDrawer(events);
      setIsDrawerOpen(true);
  };

  const handleViewRequestFromDrawer = (request) => {
      setIsDrawerOpen(false);
      setTimeout(() => {
          handleRowClick(request);
      }, 300);
  };

  return (
    <>
      <RequestTimeOffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onrequestSubmitted={handleRequestSubmitted} currentUserProfile={currentUserProfile} myRequests={allRequests} weekends={weekends} holidays={holidays} />
      <RequestDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} request={selectedRequest} onWithdraw={handleWithdrawRequest} onReschedule={handleRescheduleClick} />
      <RescheduleModal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} request={selectedRequest} onRescheduled={() => setSelectedRequest(null)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} employeeName={`request from ${selectedRequest?.startDate}`} loading={isDeleting} />
      <DayDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} date={selectedDateForDrawer} events={eventsForDrawer} onViewRequest={handleViewRequestFromDrawer} />
      
      <div className="p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Time Off</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"><Plus size={20} className="mr-2" />Request Time Off</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BalanceCard icon={<Plane />} title="Vacation" balance={currentUserProfile?.vacationBalance ?? '...'} bgColor="bg-blue-100" iconColor="text-blue-600" />
            <BalanceCard icon={<Gift />} title="Birthday" balance="1.00" bgColor="bg-yellow-100" iconColor="text-yellow-600" />
            <BalanceCard icon={<Sun />} title="Personal (Unpaid)" balance={currentUserProfile?.personalBalance ?? '...'} bgColor="bg-purple-100" iconColor="text-purple-600" />
            <BalanceCard icon={<Heart />} title="Sick Days" balance={currentUserProfile?.sickBalance ?? '...'} bgColor="bg-green-100" iconColor="text-green-600" />
        </div>
        
        <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 border-b-0">
            <div className="border-b border-gray-200 px-2 flex">
                <MainTab label="Requests & Calendar" active={activeTab === 'Requests'} onClick={() => setActiveTab('Requests')} />
                <MainTab label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
            </div>
        </div>
        
        {activeTab === 'Requests' && (
            <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-500"/>
                        <select value={scope} onChange={e => setScope(e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm p-2">
                            <option value="Mine">My Requests</option>
                            <option value="My Team">My Team</option>
                            <option value="All">All Company</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('List')} className={`p-2 rounded-md ${view === 'List' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><List size={20}/></button>
                        <button onClick={() => setView('Month')} className={`p-2 rounded-md ${view === 'Month' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><Calendar size={20}/></button>
                    </div>
                </div>
                {view === 'List' && (
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-200"><th className="p-4 font-semibold text-gray-500 text-sm">Employee</th><th className="p-4 font-semibold text-gray-500 text-sm">Leave Type</th><th className="p-4 font-semibold text-gray-500 text-sm">Dates</th><th className="p-4 font-semibold text-gray-500 text-sm">Status</th><th className="p-4 font-semibold text-gray-500 text-sm">Actions</th></tr></thead>
                        <tbody>
                            {loading ? (<tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>) 
                            : filteredRequests.map(req => (
                                <tr key={req.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(req)}>
                                    <td className="p-4 font-semibold text-gray-800">{req.employeeName}</td>
                                    <td className="p-4 text-gray-700">{req.leaveType}</td>
                                    <td className="p-4 text-gray-700">{req.startDate} to {req.endDate}</td>
                                    <td className="p-4"><span className={`text-xs font-bold py-1 px-2 rounded-full ${ req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>{req.status}</span></td>
                                    <td className="p-4">
                                        { (req.status === 'Pending' || req.status === 'Approved') && canCancel(req) && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(req); }} className="p-2 hover:bg-gray-200 rounded-full"><Trash2 size={16} className="text-red-600" /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {view === 'Month' && (
                    <TeamCalendar events={filteredRequests.filter(r => r.status === 'Approved')} weekends={weekends} holidays={holidays} totalEmployees={employees.length} onDayClick={handleDayClick} />
                )}
            </div>
        )}
        {activeTab === 'Settings' && ( <TimeOffSettings /> )}
      </div>
    </>
  );
}

export default TimeOff;
