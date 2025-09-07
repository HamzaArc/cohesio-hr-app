import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { X, CheckCircle, XCircle, Send, Calendar, RotateCcw, Trash2, UploadCloud, FileText, AlertCircle, UserCheck } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import useFileUpload from '../hooks/useFileUpload';


const DetailField = ({ label, value }) => ( <div><p className="text-sm text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value}</p></div> );
const HistoryItem = ({ icon, title, date, isLast, children }) => ( <div className="relative pl-8">{!isLast && <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gray-200"></div>}<div className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-white">{icon}</div><p className="font-semibold text-gray-700">{title}</p><p className="text-xs text-gray-500">{date}</p>{children}</div> );


function RequestDetailsModal({ isOpen, onClose, request, onWithdraw, onReschedule }) {
  const [history, setHistory] = useState([]);
  const currentUser = auth.currentUser;
  const { employees, companyId } = useAppContext();
  const { uploading, progress, error: uploadError, uploadFile } = useFileUpload();
  const [lateCertificate, setLateCertificate] = useState(null);

  const substitute = useMemo(() => {
    if (!request || !request.substituteEmail || !employees) return null;
    return employees.find(e => e.email === request.substituteEmail);
  }, [request, employees]);


  useEffect(() => {
    if (isOpen && request && companyId) {
      const historyQuery = query(collection(db, 'companies', companyId, 'timeOffRequests', request.id, 'history'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
        setHistory(snapshot.docs.map(doc => ({ ...doc.data(), timestamp: doc.data().timestamp?.toDate().toLocaleString() })));
      });
      return () => unsubscribe();
    }
  }, [isOpen, request, companyId]);

  const handleLateUpload = async () => {
      if (!lateCertificate || !request || !companyId) return;
      try {
          const fileURL = await uploadFile(lateCertificate, `medical-certificates/${companyId}/${currentUser.uid}`);
          const requestRef = doc(db, 'companies', companyId, 'timeOffRequests', request.id);
          await updateDoc(requestRef, {
              medicalCertificateUrl: fileURL,
              status: 'Approved' // Auto-approve on late upload
          });
          setLateCertificate(null);
      } catch (err) {
          console.error("Error uploading late certificate:", err);
      }
  };


  if (!isOpen || !request) return null;

  const getStatusStyle = (status) => {
    if (status.includes('Approved')) return 'bg-green-100 text-green-700';
    if (status.includes('Pending')) return 'bg-yellow-100 text-yellow-700';
    if (status.includes('Denied')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  }
  
  const getHistoryIcon = (action) => {
      switch(action) {
          case 'Created': return <Send size={16} className="text-blue-500" />;
          case 'Approved': return <CheckCircle size={16} className="text-green-500" />;
          case 'Denied': return <XCircle size={16} className="text-red-500" />;
          case 'Rescheduled': return <RotateCcw size={16} className="text-orange-500" />;
          default: return <Calendar size={16} className="text-gray-500" />;
      }
  }
  
  const isOwner = currentUser?.email === request.userEmail;
  const canWithdraw = request.status.includes('Pending');
  const canReschedule = request.status === 'Approved' && new Date(request.startDate) > new Date();
  
  const today = new Date();
  const fortyEightHoursAfterStart = new Date(request.startDate);
  fortyEightHoursAfterStart.setHours(fortyEightHoursAfterStart.getHours() + 48);
  const canUploadLate = isOwner && request.leaveType === 'Sick Day' && !request.medicalCertificateUrl && today < fortyEightHoursAfterStart;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        
        <div className="space-y-6">
            <div className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                    <DetailField label="Employee" value={request.employeeName} />
                    <DetailField label="Leave Type" value={request.leaveType} />
                    <DetailField label="Start Date" value={request.startDate} />
                    <DetailField label="End Date" value={request.endDate} />
                    <DetailField label="Total Days" value={`${request.totalDays} day(s)`} />
                    <div><p className="text-sm text-gray-500">Status</p><span className={`text-sm font-bold py-1 px-3 rounded-full ${getStatusStyle(request.status)}`}>{request.status}</span></div>
                </div>
                 {request.leaveType === 'Sick Day' && !request.medicalCertificateUrl && (
                  <div className="mt-4 border-t pt-4 flex items-center text-orange-600">
                    <AlertCircle size={16} className="mr-2" />
                    <span className="text-sm font-semibold">Document missing</span>
                  </div>
                )}
                {request.description && ( <div className="mt-4 border-t pt-4"><DetailField label="Description" value={request.description} /></div> )}
            </div>

             { (request.medicalCertificateUrl || canUploadLate) && (
              <div className="p-4 border rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><FileText size={16}/> Medical Certificate</h3>
                  {request.medicalCertificateUrl ? (
                      <a href={request.medicalCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View Document</a>
                  ) : (
                      <div>
                          <p className="text-xs text-gray-500 mb-2">A document is required. You can upload it until {fortyEightHoursAfterStart.toLocaleDateString()}.</p>
                          <div className="flex items-center gap-2">
                              <input type="file" onChange={(e) => setLateCertificate(e.target.files[0])} className="w-full border p-1 rounded-md text-sm"/>
                              <button onClick={handleLateUpload} disabled={uploading || !lateCertificate} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg text-sm disabled:bg-gray-400">
                                  {uploading ? `${Math.round(progress)}%` : 'Upload'}
                              </button>
                          </div>
                          {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                      </div>
                  )}
              </div>
            )}
            
            {request.leaveType === 'Vacation' && substitute && (
                <div className="p-4 border rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><UserCheck size={16}/> Substitute Information</h3>
                    <DetailField label="Substitute" value={substitute.name} />
                    {request.substituteActions && (
                        <div className="mt-4 border-t pt-4">
                            <DetailField label="Actions for Substitute" value={request.substituteActions} />
                        </div>
                    )}
                </div>
            )}

            <div>
                <h3 className="font-bold text-gray-800 mb-4">Approval History</h3>
                <div className="space-y-4">
                    {history.map((item, index) => (
                        <HistoryItem key={index} icon={getHistoryIcon(item.action)} title={`${item.action} by ${item.user}`} date={item.timestamp} isLast={index === history.length - 1} />
                    ))}
                </div>
            </div>

        </div>

        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <div>
              {isOwner && canWithdraw && <button onClick={() => onWithdraw(request)} className="flex items-center text-sm text-red-600 bg-red-100 hover:bg-red-200 font-semibold py-2 px-3 rounded-lg"><Trash2 size={16} className="mr-2"/>Withdraw Request</button>}
              {isOwner && canReschedule && <button onClick={() => onReschedule(request)} className="flex items-center text-sm text-orange-600 bg-orange-100 hover:bg-orange-200 font-semibold py-2 px-3 rounded-lg"><RotateCcw size={16} className="mr-2"/>Reschedule</button>}
          </div>
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

export default RequestDetailsModal;