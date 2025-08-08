import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout() {
  return (
    // This outer container is now a column, putting the header on top.
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header />
      {/* This container is a row for the content below the header. */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
