import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { X, AlertCircle } from 'lucide-react';
import DatalistInput from './DatalistInput';
import { useAppContext } from '../contexts/AppContext';

const ValidatedInput = ({ id, label, value, onChange, error, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input id={id} value={value} onChange={onChange} className={`mt-1 block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500`} {...props} />
        {error && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle size={14} className="mr-1"/>{error}</p>}
    </div>
);

const TabButton = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
        {children}
    </button>
);

function EditEmployeeModal({ isOpen, onClose, employee, onEmployeeUpdated }) {
  const { companyId } = useAppContext();
  const [activeTab, setActiveTab] = useState('job');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        // Job & Pay
        name: employee.name || '', email: employee.email || '', position: employee.position || '',
        department: employee.department || '', hireDate: employee.hireDate || '', status: employee.status || 'active',
        employmentType: employee.employmentType || 'Full-time', compensation: employee.compensation || '',
        managerEmail: employee.managerEmail || '', contractType: employee.contractType || 'CDI',
        contractEndDate: employee.contractEndDate || '', weeklyHours: employee.weeklyHours || '',
        workMode: employee.workMode || 'on-site', monthlyGrossSalary: employee.monthlyGrossSalary || '',
        hourlyRate: employee.hourlyRate || '',
        // Personal & Contact
        phone: employee.phone || '', address: employee.address || '', dateOfBirth: employee.dateOfBirth || '',
        nationality: employee.nationality || '', maritalStatus: employee.maritalStatus || 'Single',
        personalEmail: employee.personalEmail || '',
        // Emergency Contact
        emergencyContactName: employee.emergencyContactName || '', emergencyContactRelationship: employee.emergencyContactRelationship || '',
        emergencyContactPhone: employee.emergencyContactPhone || '',
        // Legal (Morocco)
        nationalId: employee.nationalId || '', cnieExpiryDate: employee.cnieExpiryDate || '',
        cnssNumber: employee.cnssNumber || '', cnssEnrollmentDate: employee.cnssEnrollmentDate || '',
        amoScheme: employee.amoScheme || '', cimrEnrollment: employee.cimrEnrollment || false,
        cimrRate: employee.cimrRate || '', rib: employee.rib || '', bankBranch: employee.bankBranch || '',
        // Time Off
        vacationBalance: employee.vacationBalance ?? 15, sickBalance: employee.sickBalance ?? 5, personalBalance: employee.personalBalance ?? 3,
      });
      setErrors({});
    }
    if (isOpen && employee && companyId) {
        const fetchData = async () => {
            const snapshot = await getDocs(collection(db, 'companies', companyId, 'employees'));
            const employeesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllEmployees(employeesList.filter(e => e.id !== employee?.id));
            const deptSet = new Set(employeesList.map(emp => emp.department).filter(Boolean));
            setDepartments([...deptSet]);
        };
        fetchData();
    }
  }, [isOpen, employee, companyId]);

  const validate = (data = formData) => {
      const newErrors = {};
      if (!data.name) newErrors.name = 'Full name is required.';
      if (!data.email) newErrors.email = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Email address is invalid.';
      if (!data.position) newErrors.position = 'Position is required.';
      if (!data.hireDate) newErrors.hireDate = 'Hire date is required.';
      if (data.phone && !/^[0-9\s+()-]*$/.test(data.phone)) newErrors.phone = 'Invalid phone number format.';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const newFormData = { ...formData, [id]: type === 'checkbox' ? checked : value };
    setFormData(newFormData);
    validate(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !companyId) return;
    setLoading(true);

    try {
      const employeeRef = doc(db, 'companies', companyId, 'employees', employee.id);
      await updateDoc(employeeRef, {
        ...formData,
        monthlyGrossSalary: Number(formData.monthlyGrossSalary) || 0,
        hourlyRate: Number(formData.hourlyRate) || 0,
        cimrRate: Number(formData.cimrRate) || 0,
        vacationBalance: Number(formData.vacationBalance) || 0,
        sickBalance: Number(formData.sickBalance) || 0,
        personalBalance: Number(formData.personalBalance) || 0,
      });
      onEmployeeUpdated();
      onClose();
    } catch (err) {
      setErrors({ form: 'Failed to update employee. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Edit Employee</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
        <div className="border-b border-gray-200 px-6">
            <nav className="-mb-px flex space-x-6">
                <TabButton active={activeTab === 'job'} onClick={() => setActiveTab('job')}>Job & Pay</TabButton>
                <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')}>Personal</TabButton>
                <TabButton active={activeTab === 'legal'} onClick={() => setActiveTab('legal')}>Legal (Morocco)</TabButton>
            </nav>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6" noValidate>
            {activeTab === 'job' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2">Core Information</h3>
                    <ValidatedInput id="name" label="Full Name" value={formData.name} onChange={handleChange} error={errors.name} required />
                    <ValidatedInput id="email" label="Work Email" value={formData.email} onChange={handleChange} error={errors.email} type="email" required />
                    <ValidatedInput id="position" label="Position / Title" value={formData.position} onChange={handleChange} error={errors.position} required />
                    
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Employment Details</h3>
                    <ValidatedInput id="hireDate" label="Hire Date" value={formData.hireDate} onChange={handleChange} error={errors.hireDate} type="date" required />
                    <DatalistInput id="department" label="Department" value={formData.department} onChange={handleChange} options={departments} placeholder="Select or type new"/>
                    <div><label htmlFor="managerEmail" className="block text-sm font-medium">Reports To</label><select id="managerEmail" value={formData.managerEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2"><option value="">No Manager</option>{allEmployees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}</select></div>
                    <div><label htmlFor="status" className="block text-sm font-medium">Status</label><select id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2"><option value="active">Active</option><option value="onboarding">Onboarding</option></select></div>
                    <div><label htmlFor="employmentType" className="block text-sm font-medium">Employment Type</label><select id="employmentType" value={formData.employmentType} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2"><option>Full-time</option><option>Part-time</option><option>Contractor</option></select></div>
                    <div><label htmlFor="contractType" className="block text-sm font-medium">Contract Type</label><select id="contractType" value={formData.contractType} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2"><option>CDI</option><option>CDD</option><option>Internship</option><option>Apprenticeship</option></select></div>
                    {formData.contractType === 'CDD' && <ValidatedInput id="contractEndDate" label="Contract End Date" value={formData.contractEndDate} onChange={handleChange} type="date" />}
                    <ValidatedInput id="weeklyHours" label="Weekly Hours" value={formData.weeklyHours} onChange={handleChange} type="number" />
                    <div><label htmlFor="workMode" className="block text-sm font-medium">Work Mode</label><select id="workMode" value={formData.workMode} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2"><option>On-site</option><option>Hybrid</option><option>Remote</option></select></div>

                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Compensation</h3>
                    <ValidatedInput id="monthlyGrossSalary" label="Monthly Gross Salary (MAD)" value={formData.monthlyGrossSalary} onChange={handleChange} type="number" step="0.01" />
                    <ValidatedInput id="hourlyRate" label="Hourly Rate (MAD)" value={formData.hourlyRate} onChange={handleChange} type="number" step="0.01" />
                    <ValidatedInput id="compensation" label="Legacy Compensation Field" value={formData.compensation} onChange={handleChange} placeholder="e.g., 50000 / year" />
                    
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Time Off Balances (Days)</h3>
                    <ValidatedInput id="vacationBalance" label="Vacation" value={formData.vacationBalance} onChange={handleChange} type="number" />
                    <ValidatedInput id="sickBalance" label="Sick" value={formData.sickBalance} onChange={handleChange} type="number" />
                    <ValidatedInput id="personalBalance" label="Personal" value={formData.personalBalance} onChange={handleChange} type="number" />
                </div>
            )}
            {activeTab === 'personal' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2">Personal Details</h3>
                    <ValidatedInput id="dateOfBirth" label="Date of Birth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
                    <ValidatedInput id="nationality" label="Nationality" value={formData.nationality} onChange={handleChange} />
                    <ValidatedInput id="phone" label="Phone (Work)" value={formData.phone} onChange={handleChange} error={errors.phone} type="tel" />
                    <ValidatedInput id="personalEmail" label="Personal Email" value={formData.personalEmail} onChange={handleChange} type="email" />
                    <div><label htmlFor="maritalStatus" className="block text-sm font-medium">Marital Status</label><select id="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></div>
                    <ValidatedInput id="address" label="Address" value={formData.address} onChange={handleChange} className="md:col-span-2"/>

                    <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Emergency Contact</h3>
                    <ValidatedInput id="emergencyContactName" label="Contact Name" value={formData.emergencyContactName} onChange={handleChange} />
                    <ValidatedInput id="emergencyContactRelationship" label="Relationship" value={formData.emergencyContactRelationship} onChange={handleChange} />
                    <ValidatedInput id="emergencyContactPhone" label="Contact Phone" value={formData.emergencyContactPhone} onChange={handleChange} type="tel" />
                 </div>
            )}
            {activeTab === 'legal' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2">Identification</h3>
                    <ValidatedInput id="nationalId" label="National ID (CNIE)" value={formData.nationalId} onChange={handleChange} />
                    <ValidatedInput id="cnieExpiryDate" label="CNIE Expiry Date" value={formData.cnieExpiryDate} onChange={handleChange} type="date" />
                    
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Social Security</h3>
                    <ValidatedInput id="cnssNumber" label="CNSS Number" value={formData.cnssNumber} onChange={handleChange} />
                    <ValidatedInput id="cnssEnrollmentDate" label="CNSS Enrollment Date" value={formData.cnssEnrollmentDate} onChange={handleChange} type="date" />
                    <div><label htmlFor="amoScheme" className="block text-sm font-medium">AMO Scheme</label><input id="amoScheme" value={formData.amoScheme} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md p-2" /></div>
                    
                    <div className="md:col-span-3 flex items-center gap-4 mt-2">
                        <input type="checkbox" id="cimrEnrollment" checked={formData.cimrEnrollment} onChange={handleChange} className="h-4 w-4 rounded" />
                        <label htmlFor="cimrEnrollment" className="block text-sm font-medium text-gray-700">CIMR Enrollment</label>
                    </div>
                    {formData.cimrEnrollment && <ValidatedInput id="cimrRate" label="CIMR Rate (%)" value={formData.cimrRate} onChange={handleChange} type="number" step="0.01" />}

                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Banking</h3>
                    <ValidatedInput id="rib" label="Bank Account (RIB)" value={formData.rib} onChange={handleChange} />
                    <ValidatedInput id="bankBranch" label="Bank Branch" value={formData.bankBranch} onChange={handleChange} />
                </div>
            )}
          {errors.form && <p className="text-red-500 text-sm mt-4 text-center">{errors.form}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmployeeModal;