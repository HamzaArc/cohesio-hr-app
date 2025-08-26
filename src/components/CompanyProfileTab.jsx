import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import { Save, Building, MapPin, Hash, Percent, Briefcase } from 'lucide-react';

const InfoInput = ({ id, label, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type="text"
            id={id}
            value={value || ''}
            onChange={onChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

function CompanyProfileTab() {
    const { companyId, showToast } = useAppContext();
    const [companyData, setCompanyData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!companyId) return;
        const companyRef = doc(db, 'companies', companyId);
        const unsubscribe = onSnapshot(companyRef, (docSnap) => {
            if (docSnap.exists()) {
                setCompanyData(docSnap.data());
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [companyId]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setCompanyData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        if (!companyId) return;
        setIsSaving(true);
        try {
            const companyRef = doc(db, 'companies', companyId);
            await setDoc(companyRef, companyData, { merge: true });
            showToast('Company profile updated successfully!');
        } catch (error) {
            console.error("Error updating company profile:", error);
            showToast('Failed to update profile.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <p>Loading company profile...</p>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoInput id="name" label="Legal Company Name" value={companyData.name} onChange={handleChange} />
                <InfoInput id="legalForm" label="Legal Form (e.g., SARL AU)" value={companyData.legalForm} onChange={handleChange} />
            </div>
            <InfoInput id="address" label="Head Office Address" value={companyData.address} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoInput id="rcNumber" label="N° Registre de Commerce (RC)" value={companyData.rcNumber} onChange={handleChange} />
                <InfoInput id="patente" label="N° de Patente" value={companyData.patente} onChange={handleChange} />
                <InfoInput id="cnssNumber" label="N° d'affiliation CNSS" value={companyData.cnssNumber} onChange={handleChange} />
                <InfoInput id="ice" label="Identifiant Commun de l'Entreprise (ICE)" value={companyData.ice} onChange={handleChange} />
                <InfoInput id="idFiscal" label="Identifiant Fiscal (IF)" value={companyData.idFiscal} onChange={handleChange} />
                <InfoInput id="taxId" label="N° de Taxe Professionnelle" value={companyData.taxId} onChange={handleChange} />
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </div>
    );
}

export default CompanyProfileTab;