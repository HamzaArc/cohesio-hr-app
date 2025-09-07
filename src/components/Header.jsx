import React, { useState } from 'react';
import { Search, Bell, Calendar, ChevronDown, HelpCircle } from 'lucide-react';
import { auth } from '../firebase';
import './Help.css'; // Import the new CSS

function Header({ onHelpClick, onTourClick }) {
  const user = auth.currentUser;
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  return (
    // The header now has a subtle shadow and spans the full width.
    <header className="bg-white h-16 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm z-10 relative">
      {/* Left Side: Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#4A1D4A] rounded-md flex items-center justify-center font-bold text-white">
            C
        </div>
        <h1 className="text-xl font-bold text-gray-800">Cohesio</h1>
      </div>

      {/* Right Side: Actions and User Profile */}
      <div className="flex items-center gap-6">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Search size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Calendar size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
        </button>
        
        <div className="relative">
            <button 
                onClick={() => setHelpMenuOpen(!helpMenuOpen)} 
                className="bg-highlight text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center shadow-sm help-button-pulse"
            >
                <HelpCircle size={16} className="mr-2"/> Get Help
            </button>
            {helpMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
                    <button onClick={() => { onHelpClick(); setHelpMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Page Overview</button>
                    <button onClick={() => { onTourClick(); setHelpMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Start Feature Tour</button>
                </div>
            )}
        </div>

        <div className="h-8 border-l border-gray-200"></div>

        <div className="flex items-center gap-3">
            <img 
                src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${user?.email?.charAt(0).toUpperCase()}`} 
                alt="User" 
                className="w-8 h-8 rounded-full"
            />
            <div>
                <p className="font-semibold text-sm text-gray-800">{user?.displayName || 'Admin User'}</p>
                <p className="text-xs text-gray-500">Admin</p>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}

export default Header;