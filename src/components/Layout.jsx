import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout() {
  return (
    // THIS LINE HAS BEEN CHANGED TO MAKE THE BACKGROUND RED
    <div className="flex flex-col h-screen bg-red-500 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50"> {/* I've kept the main content area gray */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;