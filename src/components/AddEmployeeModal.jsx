import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { X, AlertCircle, CheckCircle, Briefcase, User, Shield, Plus, Trash2 } from 'lucide-react';
import DatalistInput from './DatalistInput';
import { useAppContext } from '../contexts/AppContext';

// Reusable Input Component for text, email, date, etc.
const ValidatedInput = ({ id, label, value, onChange, error, type = 'text', hint, required, ...props }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <input
            id={id}
            value={value || ''}
            onChange={onChange}
            type={type}
            className={`block w-full border ${error ? 'border-red-500 pr-10' : 'border-gray-300'} ${value && !error ? 'pr-10' : ''} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
            {...props}
        />
        {value && !error && <CheckCircle size={16} className="absolute right-3 top-10 text-green-500" />}
        {error && <AlertCircle size={16} className="absolute right-3 top-10 text-red-500" />}
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

// A new component for consistent select/dropdown styling.
const ValidatedSelect = ({ id, label, value, onChange, error, hint, required, children, ...props }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <select
            id={id}
            value={value || ''}
            onChange={onChange}
            className={`block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-10`}
            {...props}
        >
            {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700" style={{ top: '1.85rem' }}>
             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
        {value && !error && <CheckCircle size={16} className="absolute right-10 top-10 text-green-500 pointer-events-none" />}
        {error && <AlertCircle size={16} className="absolute right-10 top-10 text-red-500 pointer-events-none" />}
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

// Progress tracker component to guide the user.
const ProgressTracker = ({ currentStep, steps }) => (
    <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
            <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${index + 1 <= currentStep ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                        {step.icon}
                    </div>
                    <p className={`mt-2 text-xs text-center font-semibold ${index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>{step.name}</p>
                </div>
                {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 transition-colors duration-300 ${index + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                )}
            </React.Fragment>
        ))}
    </div>
);

function AddEmployeeModal({ isOpen, onClose, onEmployeeAdded }) {
  const { companyId } = useAppContext();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', position: '', department: '', hireDate: new Date().toISOString().split('T')[0], status: 'active',
    employmentType: 'Full-time', managerEmail: '', contractType: 'CDI',
    contractEndDate: '', weeklyHours: '40', workMode: 'on-site', monthlyGrossSalary: '',
    phone: '', address: '', dateOfBirth: '', nationality: '', maritalStatus: 'Single',
    personalEmail: '',
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
    nationalId: '', cnieExpiryDate: '', cnssNumber: '', cnssEnrollmentDate: '', amoScheme: '',
    cimrEnrollment: false, cimrRate: '', rib: '', bankBranch: '',
    vacationBalance: 15, sickBalance: 5, personalBalance: 3,
    kids: [], parents: [],
  });
  const [errors, setErrors] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, name: 'Job & Pay', icon: <Briefcase size={20} /> },
    { id: 2, name: 'Personal', icon: <User size={20} /> },
    { id: 3, name: 'Legal (Morocco)', icon: <Shield size={20} /> },
  ];

  useEffect(() => {
    if (isOpen && companyId) {
      const fetchData = async () => {
        const snapshot = await getDocs(collection(db, 'companies', companyId, 'employees'));
        const employeesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllEmployees(employeesList);
        const deptSet = new Set(employeesList.map(emp => emp.department).filter(Boolean));
        setDepartments([...deptSet]);
      };
      fetchData();
    }
  }, [isOpen, companyId]);

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name) newErrors.name = 'Full name is required.';
      if (!formData.email) newErrors.email = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email address is invalid.';
      if (!formData.position) newErrors.position = 'Position is required.';
      if (!formData.hireDate) newErrors.hireDate = 'Hire date is required.';
    }
    // Add validation for other steps if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };
  
    const handleFamilyChange = (type, index, field, value) => {
    const updatedFamily = [...formData[type]];
    updatedFamily[index][field] = value;
    setFormData(prev => ({ ...prev, [type]: updatedFamily }));
  };

  const addFamilyMember = (type) => {
    setFormData(prev => ({ ...prev, [type]: [...prev[type], { name: '', age: '' }] }));
  };

  const removeFamilyMember = (type, index) => {
    const updatedFamily = [...formData[type]];
    updatedFamily.splice(index, 1);
    setFormData(prev => ({ ...prev, [type]: updatedFamily }));
  };


  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep() || !companyId) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'companies', companyId, 'employees'), {
        ...formData,
        monthlyGrossSalary: Number(formData.monthlyGrossSalary) || null,
        cimrRate: Number(formData.cimrRate) || null,
        vacationBalance: Number(formData.vacationBalance) || 0,
        sickBalance: Number(formData.sickBalance) || 0,
        personalBalance: Number(formData.personalBalance) || 0,
      });
      onEmployeeAdded();
      handleClose();
    } catch (err) {
      setErrors({ form: 'Failed to add employee. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', position: '', department: '', hireDate: new Date().toISOString().split('T')[0], status: 'active', employmentType: 'Full-time', managerEmail: '', contractType: 'CDI', contractEndDate: '', weeklyHours: '40', workMode: 'on-site', monthlyGrossSalary: '', phone: '', address: '', dateOfBirth: '', nationality: '', maritalStatus: 'Single', personalEmail: '', emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '', nationalId: '', cnieExpiryDate: '', cnssNumber: '', cnssEnrollmentDate: '', amoScheme: '', cimrEnrollment: false, cimrRate: '', rib: '', bankBranch: '', vacationBalance: 15, sickBalance: 5, personalBalance: 3, kids: [], parents: [] });
    setErrors({});
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-gray-800">Add New Employee</h2><button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
        <div className="p-6">
            <ProgressTracker currentStep={step} steps={steps} />
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 pt-0" noValidate>
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2">Core Information</h3>
                    <ValidatedInput id="name" label="Full Name" value={formData.name} onChange={handleChange} error={errors.name} required hint="As it should appear on official documents." />
                    <ValidatedInput id="email" label="Work Email" value={formData.email} onChange={handleChange} error={errors.email} type="email" required hint="This will be their login and primary contact."/>
                    <ValidatedInput id="position" label="Position / Title" value={formData.position} onChange={handleChange} error={errors.position} required />
                    
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Employment Details</h3>
                    <ValidatedInput id="hireDate" label="Hire Date" value={formData.hireDate} onChange={handleChange} error={errors.hireDate} type="date" required />
                    <DatalistInput id="department" label="Department" value={formData.department} onChange={handleChange} options={departments} placeholder="Select or type new"/>
                    <ValidatedSelect id="managerEmail" label="Reports To" value={formData.managerEmail} onChange={handleChange}>
                        <option value="">No Manager</option>
                        {allEmployees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
                    </ValidatedSelect>
                    <ValidatedSelect id="status" label="Status" value={formData.status} onChange={handleChange}>
                        <option value="active">Active</option>
                        <option value="onboarding">Onboarding</option>
                    </ValidatedSelect>
                    <ValidatedSelect id="employmentType" label="Employment Type" value={formData.employmentType} onChange={handleChange}>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contractor</option>
                    </ValidatedSelect>
                    <ValidatedSelect id="contractType" label="Contract Type" value={formData.contractType} onChange={handleChange}>
                        <option>CDI</option>
                        <option>CDD</option>
                        <option>Internship</option>
                        <option>Apprenticeship</option>
                    </ValidatedSelect>
                    {formData.contractType === 'CDD' && <ValidatedInput id="contractEndDate" label="Contract End Date" value={formData.contractEndDate} onChange={handleChange} type="date" />}
                    <ValidatedInput id="weeklyHours" label="Weekly Hours" value={formData.weeklyHours} onChange={handleChange} type="number" />
                    <ValidatedSelect id="workMode" label="Work Mode" value={formData.workMode} onChange={handleChange}>
                        <option>On-site</option>
                        <option>Hybrid</option>
                        <option>Remote</option>
                    </ValidatedSelect>

                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Compensation</h3>
                    <ValidatedInput id="monthlyGrossSalary" label="Monthly Gross Salary (MAD)" value={formData.monthlyGrossSalary} onChange={handleChange} type="number" step="0.01" hint="For salaried employees." />
                    
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Time Off Balances (Days)</h3>
                    <ValidatedInput id="vacationBalance" label="Vacation" value={formData.vacationBalance} onChange={handleChange} type="number" />
                    <ValidatedInput id="sickBalance" label="Sick" value={formData.sickBalance} onChange={handleChange} type="number" />
                    <ValidatedInput id="personalBalance" label="Personal" value={formData.personalBalance} onChange={handleChange} type="number" />
                </div>
            )}
            {step === 2 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2">Personal Details</h3>
                    <ValidatedInput id="dateOfBirth" label="Date of Birth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
                    <ValidatedInput id="nationality" label="Nationality" value={formData.nationality} onChange={handleChange} />
                    <ValidatedInput id="phone" label="Phone (Work)" value={formData.phone} onChange={handleChange} error={errors.phone} type="tel" />
                    <ValidatedInput id="personalEmail" label="Personal Email" value={formData.personalEmail} onChange={handleChange} type="email" />
                    <ValidatedSelect id="maritalStatus" label="Marital Status" value={formData.maritalStatus} onChange={handleChange}>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Divorced</option>
                        <option>Widowed</option>
                    </ValidatedSelect>
                    <div className="md:col-span-2"><ValidatedInput id="address" label="Address" value={formData.address} onChange={handleChange} /></div>

                    <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Emergency Contact</h3>
                    <ValidatedInput id="emergencyContactName" label="Contact Name" value={formData.emergencyContactName} onChange={handleChange} />
                    <ValidatedInput id="emergencyContactRelationship" label="Relationship" value={formData.emergencyContactRelationship} onChange={handleChange} />
                    <ValidatedInput id="emergencyContactPhone" label="Contact Phone" value={formData.emergencyContactPhone} onChange={handleChange} type="tel" />
                 
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Family Information</h3>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
                        {formData.kids.map((kid, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                <div className="col-span-6"><input type="text" placeholder="Child's Name" value={kid.name} onChange={(e) => handleFamilyChange('kids', index, 'name', e.target.value)} className="w-full p-2 border rounded-md" /></div>
                                <div className="col-span-4"><input type="number" placeholder="Age" value={kid.age} onChange={(e) => handleFamilyChange('kids', index, 'age', e.target.value)} className="w-full p-2 border rounded-md" /></div>
                                <div className="col-span-2"><button type="button" onClick={() => removeFamilyMember('kids', index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button></div>
                            </div>
                        ))}
                        <button type="button" onClick={() => addFamilyMember('kids')} className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={16}/>Add Child</button>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parents</label>
                         {formData.parents.map((parent, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                <div className="col-span-6"><input type="text" placeholder="Parent's Name" value={parent.name} onChange={(e) => handleFamilyChange('parents', index, 'name', e.target.value)} className="w-full p-2 border rounded-md" /></div>
                                <div className="col-span-4"><input type="number" placeholder="Age" value={parent.age} onChange={(e) => handleFamilyChange('parents', index, 'age', e.target.value)} className="w-full p-2 border rounded-md" /></div>
                                <div className="col-span-2"><button type="button" onClick={() => removeFamilyMember('parents', index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button></div>
                            </div>
                        ))}
                        <button type="button" onClick={() => addFamilyMember('parents')} className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={16}/>Add Parent</button>
                    </div>
                 </div>
            )}
            {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2">Identification</h3>
                    <ValidatedInput id="nationalId" label="National ID (CNIE)" value={formData.nationalId} onChange={handleChange} />
                    <ValidatedInput id="cnieExpiryDate" label="CNIE Expiry Date" value={formData.cnieExpiryDate} onChange={handleChange} type="date" />
                    
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Social Security</h3>
                    <ValidatedInput id="cnssNumber" label="CNSS Number" value={formData.cnssNumber} onChange={handleChange} />
                    <ValidatedInput id="cnssEnrollmentDate" label="CNSS Enrollment Date" value={formData.cnssEnrollmentDate} onChange={handleChange} type="date" />
                    <ValidatedInput id="amoScheme" label="AMO Scheme" value={formData.amoScheme} onChange={handleChange} />
                    
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
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <div>
                {step > 1 && <button type="button" onClick={handleBack} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">Back</button>}
            </div>
            <div>
                {errors.form && <p className="text-red-500 text-sm text-center">{errors.form}</p>}
                {step < steps.length && <button type="button" onClick={handleNext} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Next</button>}
                {step === steps.length && <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Employee'}</button>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeeModal;