import React from 'react';
import { X, HelpCircle } from 'lucide-react';

const helpContent = {
  'dashboard': {
    title: 'Dashboard Help',
    content: (
      <>
        <p>The dashboard gives you a high-level overview of your company's HR status.</p>
        <h4 className="font-bold mt-2">Key Sections:</h4>
        <ul className="list-disc list-inside">
          <li><b>Action Items:</b> Time-off requests that need your approval.</li>
          <li><b>Who's Out:</b> A list of employees on leave this week.</li>
          <li><b>Upcoming Events:</b> Work anniversaries and birthdays.</li>
        </ul>
      </>
    ),
  },
  'profile': {
    title: 'My Profile Help',
    content: (
      <>
        <p>This is your personal profile page. Here you can view and manage all your information stored in Cohesio.</p>
        <h4 className="font-bold mt-2">Key Sections:</h4>
        <ul className="list-disc list-inside">
          <li><b>Job & Personal:</b> View your employment details and personal contact information.</li>
          <li><b>Time Off:</b> Check your current leave balances.</li>
          <li><b>Documents:</b> Access personal documents uploaded by HR and company-wide documents you need to acknowledge.</li>
          <li><b>Onboarding & Skills:</b> Track your onboarding progress and manage your skills and certifications.</li>
        </ul>
      </>
    )
  },
  'people': {
    title: 'People Directory Help',
    content: (
      <>
        <p>This page allows you to manage all employee profiles in your organization.</p>
        <h4 className="font-bold mt-2">Key Actions:</h4>
        <ul className="list-disc list-inside">
          <li><b>Add Employee:</b> Manually add a new employee to the system.</li>
          <li><b>Invite Employee:</b> Send an email invitation for a new employee to self-register.</li>
          <li><b>Search:</b> Quickly find employees by name, position, or email.</li>
        </ul>
      </>
    ),
  },
  'payroll': {
    title: 'Payroll Help',
    content: (
      <>
        <p>The payroll module helps you manage and run payroll for your employees.</p>
        <h4 className="font-bold mt-2">Key Actions:</h4>
        <ul className="list-disc list-inside">
          <li><b>Run Payroll:</b> Start the payroll process for a specific month.</li>
          <li><b>Payroll History:</b> View and access records of past payroll runs.</li>
          <li><b>Settings:</b> Configure your company's payroll information.</li>
        </ul>
      </>
    ),
  },
  'time-off': {
    title: 'Time Off Help',
    content: (
      <>
        <p>Manage all aspects of employee leave and time off.</p>
        <h4 className="font-bold mt-2">Key Features:</h4>
        <ul className="list-disc list-inside">
          <li><b>Request Time Off:</b> Employees can submit their leave requests here.</li>
          <li><b>Team Calendar:</b> A visual overview of who is out and when.</li>
          <li><b>Approvals:</b> Managers can approve or deny pending time-off requests.</li>
        </ul>
      </>
    ),
  },
  'time-clock': {
    title: 'Time Clock Help',
    content: (
      <>
        <p>The Time Clock feature allows for accurate tracking of work hours.</p>
        <h4 className="font-bold mt-2">Key Features:</h4>
        <ul className="list-disc list-inside">
          <li><b>Clock In/Out:</b> Start and end your workday with a single click.</li>
          <li><b>Breaks:</b> Log your breaks to ensure accurate time tracking.</li>
          <li><b>Today's Log:</b> View all your clocking activities for the current day.</li>
          <li><b>Manager View:</b> If you are a manager, you can view your team's time entries.</li>
        </ul>
      </>
    ),
  },
  'performance': {
    title: 'Performance Help',
    content: (
      <>
        <p>This module helps you manage performance reviews and development cycles.</p>
        <h4 className="font-bold mt-2">Key Actions:</h4>
        <ul className="list-disc list-inside">
          <li><b>New Performance Cycle:</b> Start a new review cycle for an employee.</li>
          <li><b>View Cycles:</b> Click on a cycle to view objectives, add 1-on-1s, and complete reviews.</li>
          <li><b>Team Performance:</b> Managers can view the performance cycles for all their direct reports.</li>
        </ul>
      </>
    ),
  },
  'medical-file': {
    title: 'Medical File Help',
    content: (
      <>
        <p>Track and manage employee medical cases, such as sick leave and work accidents, and related claims.</p>
        <h4 className="font-bold mt-2">Key Actions:</h4>
        <ul className="list-disc list-inside">
          <li><b>New Medical Case:</b> Create a new file to track an employee's sick leave, attaching necessary documents.</li>
          <li><b>View Details:</b> Click a case to update its status, upload documents, and log claim numbers with CNSS or insurance.</li>
        </ul>
      </>
    )
  },
  'documents': {
    title: 'Document Hub Help',
    content: (
        <>
            <p>This is the central place for all company and employee documents.</p>
            <h4 className="font-bold mt-2">Key Actions:</h4>
            <ul className="list-disc list-inside">
                <li><b>Upload Document:</b> Securely upload new documents and assign them to all or specific employees.</li>
                <li><b>Acknowledge:</b> Review documents assigned to you and mark them as acknowledged.</li>
                <li><b>Request Revision:</b> If a document has an error, you can request a revision from your manager.</li>
            </ul>
        </>
    )
  },
  'company': {
    title: 'Company Settings Help',
    content: (
        <>
            <p>This section allows administrators to manage company-wide information and settings.</p>
            <h4 className="font-bold mt-2">Key Areas:</h4>
            <ul className="list-disc list-inside">
                <li><b>Company Profile:</b> Update legal and contact information for your company. This data is used in official documents like payslips.</li>
                <li><b>Locations & Holidays:</b> Manage office locations and the public holiday calendar for time-off calculations.</li>
            </ul>
        </>
    )
  },
  'settings': {
    title: 'Settings Help',
    content: (
        <>
            <p>Manage your personal account settings.</p>
            <h4 className="font-bold mt-2">Key Actions:</h4>
            <ul className="list-disc list-inside">
                <li><b>Profile Settings:</b> Change your password.</li>
                <li><b>Notifications:</b> Configure how you receive alerts and updates from the system.</li>
            </ul>
        </>
    )
  }
};

const Help = ({ page, isOpen, onClose }) => {
  if (!isOpen) return null;

  const { title, content } = helpContent[page] || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <HelpCircle className="mr-2" /> {title || 'Help'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="text-gray-700">{content || <p>Help content for this page is not yet available.</p>}</div>
      </div>
    </div>
  );
};

export default Help;