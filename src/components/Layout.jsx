import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from './Toast';
import DashboardTour from './DashboardTour';
import FeatureTour from './FeatureTour';
import Help from './Help';
import { useAppContext } from '../contexts/AppContext';

function Layout() {
  const { toast, hideToast } = useAppContext();
  const [dashboardTourEnabled, setDashboardTourEnabled] = React.useState(false);
  const [featureTourEnabled, setFeatureTourEnabled] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const location = useLocation();

  const pageName = location.pathname.split('/')[1] || 'dashboard';

  // This function will be passed to the Header to handle the tour click
  const handleTourClick = () => {
    // We close the other modals to prevent overlap
    setHelpOpen(false);
    
    if (pageName === 'dashboard') {
      // It's crucial to first set it to false, then true, to force a re-render
      // This solves the bug where the tour wouldn't relaunch
      setDashboardTourEnabled(false); 
      setTimeout(() => setDashboardTourEnabled(true), 50);
    } else {
      setFeatureTourEnabled(false);
      setTimeout(() => setFeatureTourEnabled(true), 50);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="sidebar"> {/* Added selector for the tour */}
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onHelpClick={() => setHelpOpen(true)} 
          onTourClick={handleTourClick}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <DashboardTour
        enabled={dashboardTourEnabled}
        onExit={() => setDashboardTourEnabled(false)}
      />
      <FeatureTour 
        page={pageName}
        enabled={featureTourEnabled}
        onExit={() => setFeatureTourEnabled(false)}
      />
      <Help page={pageName} isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default Layout;