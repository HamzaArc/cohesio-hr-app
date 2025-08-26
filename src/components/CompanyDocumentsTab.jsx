import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, orderBy, doc } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import { Download, Send, FileText, CheckCircle, Clock } from 'lucide-react';
import { generateWorkCertificate, generateSalaryCertificate, generateSalaryDomiciliationCertificate } from '../utils/pdfGenerator';

function CompanyDocumentsTab({ employee }) {
  const { companyId } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    if (!employee || !companyId) return;

    // Fetch company info for PDF generation
    const settingsRef = doc(db, 'companies', companyId, 'policies', 'payroll');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) setCompanyInfo(docSnap.data());
    });
    
    // Fetch user's document requests
    const requestsRef = collection(db, 'companies', companyId, 'documentRequests');
    const q = query(requestsRef, where('employeeId', '==', employee.id), orderBy('requestedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [employee, companyId]);

  const handleRequest = async (docType, otherDescription = null) => {
    if (!companyId) return;

    setIsRequesting(true);
    try {
      if (docType === 'Attestation de travail') {
        generateWorkCertificate(employee, companyInfo);
      } else if (docType === 'Attestation de salaire') {
        generateSalaryCertificate(employee, companyInfo);
      } else if (docType === 'Attestation de domiciliation de salaire') {
        generateSalaryDomiciliationCertificate(employee, companyInfo);
      } else if (docType === 'Bulletin de paie') {
        alert("Les bulletins de paie sont disponibles dans la section Paie.");
      } else if (docType === 'Autres') {
        const description = prompt("Veuillez décrire le document que vous souhaitez demander:");
        if (description) {
           await addDoc(collection(db, 'companies', companyId, 'documentRequests'), {
                employeeId: employee.id,
                employeeName: employee.name,
                documentType: 'Autres',
                otherDescription: description,
                status: 'Pending',
                requestedAt: serverTimestamp(),
            });
            // Here you would trigger a notification to the manager, e.g., by creating a notification document
            if (employee.managerEmail) {
                const notificationsRef = collection(db, 'companies', companyId, 'notifications');
                await addDoc(notificationsRef, {
                    message: `${employee.name} a demandé un document: ${description}`,
                    link: `/people/${employee.id}`,
                    isRead: false,
                    recipientEmail: employee.managerEmail,
                    createdAt: serverTimestamp()
                });
            }
        }
      }
    } catch (error) {
      console.error("Error processing document request:", error);
      alert("Une erreur s'est produite lors de la génération du document.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Télécharger des Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button onClick={() => handleRequest('Attestation de travail')} className="flex items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
          <Download size={20} className="mr-3 text-blue-600" />
          <span className="font-semibold">Attestation de travail</span>
        </button>
        <button onClick={() => handleRequest('Attestation de salaire')} className="flex items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
          <Download size={20} className="mr-3 text-blue-600" />
          <span className="font-semibold">Attestation de salaire</span>
        </button>
        <button onClick={() => handleRequest('Attestation de domiciliation de salaire')} className="flex items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
          <Download size={20} className="mr-3 text-blue-600" />
          <span className="font-semibold">Attestation de domiciliation de salaire</span>
        </button>
        <button onClick={() => handleRequest('Autres')} disabled={!employee.managerEmail} className="flex items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Send size={20} className="mr-3 text-blue-600" />
          <span className="font-semibold">Demander un autre document</span>
        </button>
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-t pt-4">Historique de mes demandes</h3>
      {loading ? (
        <p>Chargement de l'historique...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 text-sm">Vous n'avez aucune demande de document "Autre".</p>
      ) : (
        <div className="space-y-2">
            {requests.map(req => (
                <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                    <div>
                        <p className="font-semibold">{req.otherDescription}</p>
                        <p className="text-xs text-gray-500">Demandé le: {req.requestedAt?.toDate().toLocaleDateString()}</p>
                    </div>
                    <span className={`flex items-center text-xs font-bold py-1 px-2 rounded-full ${req.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {req.status === 'Completed' ? <CheckCircle size={14} className="mr-1.5"/> : <Clock size={14} className="mr-1.5"/>}
                        {req.status}
                    </span>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default CompanyDocumentsTab;