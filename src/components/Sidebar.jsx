import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, DollarSign, Clock, Calendar, FileText, BookOpen, MessageSquare, BarChart2, Building, Settings, LogOut, Award, HeartPulse } from 'lucide-react';
import { auth } from '../firebase';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: <Home size={20} /> },
  { path: '/profile', label: 'Profile', icon: <User size={20} /> },
  { path: '/people', label: 'People', icon: <Users size={20} /> },
  { path: '/payroll', label: 'Payroll', icon: <DollarSign size={20} /> },
  { path: '/time-off', label: 'Time Off', icon: <Calendar size={20} /> },
  { path: '/time-clock', label: 'Time Clock', icon: <Clock size={20} />, isBeta: false },
  { path: '/performance', label: 'Performance', icon: <Award size={20} />, isBeta: false },
  { path: '/medical-file', label: 'Medical File', icon: <HeartPulse size={20} />, isBeta: false },
  { path: '/documents', label: 'Documents', icon: <FileText size={20} /> },
  //{ path: '/training', label: 'Training', icon: <BookOpen size={20} /> },
  //{ path: '/surveys', label: 'Surveys', icon: <MessageSquare size={20} /> },
  //{ path: '/reporting', label: 'Reporting', icon: <BarChart2 size={20} /> },
  { path: '/company', label: 'Company', icon: <Building size={20} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

const NavLink = ({ to, children, icon, isBeta }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link to={to} className={`flex items-center p-2.5 my-1 rounded-lg text-sm font-medium transition-all duration-200 ${ isActive ? 'bg-gradient-to-r from-blue-50 to-sky-100 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' }`}>
      <div className={`mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>{icon}</div>
      <span>{children}</span>
      {isBeta && (
        <span className="ml-auto text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          Beta
        </span>
      )}
    </Link>
  );
};

function Sidebar() {
  return (
    <div className="w-64 bg-white text-white flex flex-col p-4 border-r border-gray-200 h-screen">
      <nav className="mt-4">
        {navItems.map(item => (
            <NavLink key={item.path} to={item.path} icon={item.icon} isBeta={item.isBeta}>{item.label}</NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <button onClick={() => auth.signOut()} className="flex items-center w-full p-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            <LogOut size={20} className="mr-3 text-gray-400" />
            Log Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;