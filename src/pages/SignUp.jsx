import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { User, Building, AtSign, Lock } from 'lucide-react';

function SignUp() {
  // ... state and handleSignUp function remain the same ...
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!fullName || !companyName || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await addDoc(collection(db, 'employees'), {
        name: fullName,
        email: user.email,
        companyName: companyName,
        status: 'active',
        position: 'Administrator',
        hireDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-time',
        vacationBalance: 15,
        sickBalance: 5,
        personalBalance: 3,
      });

      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop')" }}>
        <div className="w-full h-full bg-black/50 flex flex-col justify-center items-center text-center p-12">
            <Link to="/landing" className="text-white text-3xl font-bold mb-4">Cohesio</Link>
            <h1 className="text-white text-4xl font-bold leading-tight">Join the Future of HR Management</h1>
            <p className="text-gray-200 mt-4 max-w-md">Simplify your HR processes and empower your team with a single, easy-to-use platform.</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        {/* ... form remains the same ... */}
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building className="h-5 w-5 text-gray-400" /></div>
                <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Work Email</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><AtSign className="h-5 w-5 text-gray-400" /></div>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-[#4A1D4A] text-white font-bold rounded-md hover:bg-[#6E2A6E] transition-colors disabled:bg-gray-400">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;