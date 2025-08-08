import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import People from './pages/People';
import EmployeeProfile from './pages/EmployeeProfile';
import Payroll from './pages/Payroll';
import RunPayroll from './pages/RunPayroll';
import PayrollDetails from './pages/PayrollDetails';
import TimeOff from './pages/TimeOff';
import TimeTracking from './pages/TimeTracking';
import Performance from './pages/Performance';
import TemplateEditor from './pages/TemplateEditor';
import TakeReview from './pages/TakeReview';
import ReviewSummary from './pages/ReviewSummary'; // Import the new component
import Surveys from './pages/Surveys';
import Documents from './pages/Documents';
import Training from './pages/Training';
import Reporting from './pages/Reporting';
import Company from './pages/Company';
import Settings from './pages/Settings';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) { return <Navigate to="/login" />; }
    return children;
  };

  if (loading) { return <div>Loading Application...</div>; }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="people" element={<People />} />
          <Route path="people/:employeeId" element={<EmployeeProfile />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="payroll/run/:payPeriodId" element={<RunPayroll />} />
          <Route path="payroll/records/:runId" element={<PayrollDetails />} />
          <Route path="time-off" element={<TimeOff />} />
          <Route path="time-tracking" element={<TimeTracking />} />
          <Route path="performance" element={<Performance />} />
          <Route path="performance/templates/:templateId" element={<TemplateEditor />} />
          <Route path="performance/reviews/:reviewId" element={<TakeReview />} />
          <Route path="performance/reviews/:reviewId/summary" element={<ReviewSummary />} /> {/* New Dynamic Route */}
          <Route path="surveys" element={<Surveys />} />
          <Route path="documents" element={<Documents />} />
          <Route path="training" element={<Training />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="company" element={<Company />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
