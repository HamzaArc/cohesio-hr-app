import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AtSign, CheckCircle, Shield, BarChart2, Cpu } from 'lucide-react';

// ... (FeatureHighlight component remains the same)
const FeatureHighlight = ({ icon, title, children }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0">
      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-white/10 text-white">
        {icon}
      </div>
    </div>
    <div className="ml-4">
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-1 text-base text-gray-300">{children}</p>
    </div>
  </div>
);


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your email and password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#4A1D4A] p-12 flex-col justify-between">
        <Link to="/landing" className="text-white text-2xl font-bold">
          Cohesio
        </Link>
        <div className="space-y-8">
            <FeatureHighlight icon={<Cpu size={24} />} title="Adaptable Performance">
                Our product effectively adjusts to your needs, boosting efficiency and simplifying your tasks.
            </FeatureHighlight>
            <FeatureHighlight icon={<Shield size={24} />} title="Built to Last">
                Experience unmatched durability that goes above and beyond with a lasting investment.
            </FeatureHighlight>
            <FeatureHighlight icon={<CheckCircle size={24} />} title="Great User Experience">
                Integrate our product into your routine with an intuitive and easy-to-use interface.
            </FeatureHighlight>
            <FeatureHighlight icon={<BarChart2 size={24} />} title="Innovative Functionality">
                Stay ahead with features that set new standards, addressing your evolving needs better than the rest.
            </FeatureHighlight>
        </div>
        <div className="text-gray-300 text-sm">
          &copy; {new Date().getFullYear()} Cohesio. All rights reserved.
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">
              New to Cohesio?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* ... form inputs remain the same ... */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-gray-400" />
                </div>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
              </div>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-[#4A1D4A] text-white font-bold rounded-md hover:bg-[#6E2A6E] transition-colors disabled:bg-gray-400">
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;