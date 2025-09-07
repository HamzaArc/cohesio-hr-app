import React from 'react';
import { X, HelpCircle } from 'lucide-react';

const helpContent = {
  'dashboard': {
    title: 'Dashboard Overview',
    content: (
      <>
        <p className="mb-4">The dashboard is your command center, providing a real-time snapshot of the most important activities in your company.</p>
        <h4 className="font-bold text-gray-800 mb-2">Key Sections:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>Action Items:</b> This section is personalized for managers. It displays pending time-off requests from your direct reports that require your approval or denial.</li>
          <li><b>Who's Out:</b> A weekly view of all employees who have approved leave. This helps in planning and resource allocation.</li>
          <li><b>Upcoming Events:</b> Never miss a milestone. This area shows upcoming work anniversaries and birthdays within the next 30 days to help you foster a positive company culture.</li>
        </ul>
      </>
    ),
  },
  'people': {
    title: 'People Directory Overview',
    content: (
      <>
        <p className="mb-4">This module is the heart of your employee database. It allows you to manage all employee profiles, view organizational structure, and onboard new team members.</p>
        <h4 className="font-bold text-gray-800 mb-2">Core Functionalities:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>Directory View:</b> Search, filter, and view a comprehensive list of all employees. Clicking on an employee's name takes you to their detailed profile.</li>
          <li><b>Org Chart View:</b> An interactive, visual representation of your company's structure based on the "Reports To" field in employee profiles.</li>
          <li><b>Adding Employees:</b> You can either use the **Add Employee** button for a detailed, multi-step form or the **Invite Employee** button to send a secure link for them to self-onboard.</li>
        </ul>
      </>
    ),
  },
  'payroll': {
    title: 'Payroll Hub Overview',
    content: (
      <>
        <p className="mb-4">The payroll module simplifies and automates the process of paying your employees accurately and on time.</p>
        <h4 className="font-bold text-gray-800 mb-2">Key Actions:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>Run Payroll:</b> The system automatically determines the next payroll period. Click "Start Payroll" to enter the worksheet where you can input variables like bonuses and deductions.</li>
          <li><b>Payroll History:</b> All finalized payroll runs are stored here. You can view detailed records and download individual payslips from any past period.</li>
          <li><b>Settings:</b> Configure your company's legal information (RC, CNSS, etc.) which will appear on official documents like payslips.</li>
        </ul>
      </>
    ),
  },
  'time-off': {
    title: 'Time Off Management Overview',
    content: (
      <>
        <p className="mb-4">Manage all aspects of employee leave, from policy configuration to request approvals, ensuring transparency and compliance.</p>
        <h4 className="font-bold text-gray-800 mb-2">Key Features:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>Balances:</b> View your personal leave balances for vacation, sick days, and personal time. Managers will also see a summary of pending requests from their team.</li>
          <li><b>Requests Tab:</b> A detailed log of your own, your team's, or the entire company's time-off requests.</li>
          <li><b>Calendar Tab:</b> A visual, color-coded calendar showing who is out of the office. You can filter by department and leave type.</li>
          <li><b>Approvals Tab (for Managers):</b> A dedicated workspace for managers to approve or deny pending leave requests from their direct reports.</li>
          <li><b>Settings Tab:</b> Define company-wide weekends and add public holidays to ensure accurate leave calculation.</li>
        </ul>
      </>
    ),
  },
  'time-clock': {
    title: 'Time Clock Overview',
    content: (
      <>
        <p className="mb-4">The Time Clock feature allows for accurate tracking of work hours, breaks, and attendance, with optional geofencing for on-site employees.</p>
        <h4 className="font-bold text-gray-800 mb-2">Key Features:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>Clock In/Out:</b> Start and end your workday with a single click. The system logs the precise time of each punch.</li>
          <li><b>Breaks:</b> Log your breaks to ensure accurate time tracking for payroll and compliance.</li>
          <li><b>Today's Log:</b> View all your clocking activities for the current day in a real-time list.</li>
          <li><b>Manager View:</b> If you are a manager, you can switch to a team view to monitor your direct reports' attendance and time entries.</li>
        </ul>
      </>
    ),
  },
  'performance': {
    title: 'Performance Management Overview',
    content: (
      <>
        <p className="mb-4">This module helps you manage performance reviews, set objectives, and facilitate continuous development for your team members.</p>
        <h4 className="font-bold text-gray-800 mb-2">Key Actions:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>New Performance Cycle:</b> As a manager, you can initiate a new review cycle for an employee, typically spanning 6 months.</li>
          <li><b>View Cycles:</b> Click into a cycle to manage its components. You can add objectives (OKRs), schedule 1-on-1 meetings, build a development plan, and complete the final review.</li>
          <li><b>Team Performance:</b> The "Team Performance" tab gives managers an aggregated view of all ongoing cycles for their direct reports.</li>
        </ul>
      </>
    ),
  },
  'medical-file': {
    title: 'Medical Case Tracking Overview',
    content: (
      <>
        <p className="mb-4">Track and manage employee medical cases, such as sick leave and work accidents, and the related claims process with CNSS or private insurance.</p>
        <h4 className="font-bold text-gray-800 mb-2">Key Actions:</h4>
        <ul className="list-disc list-inside space-y-2">
          <li><b>New Medical Case:</b> Create a new file to track an employee's sick leave. You can attach necessary documents like medical certificates.</li>
          <li><b>Track Status:</b> Move cases through a clear pipeline (e.g., "HR Review", "Submitted to CNSS", "Approved") to monitor progress.</li>
          <li><b>Manage Claims:</b> In the details of a case, you can log claim numbers with CNSS or your insurance provider to keep all information centralized.</li>
        </ul>
      </>
    )
  },
   documents: {
    title: 'Document Hub Overview',
    content: (
        <>
            <p className="mb-4">This is the central repository for all company and employee documents. Securely store, share, and track acknowledgments for important files.</p>
            <h4 className="font-bold text-gray-800 mb-2">Key Actions:</h4>
            <ul className="list-disc list-inside space-y-2">
                <li><b>Upload Document:</b> Administrators can upload new documents (e.g., policies, handbooks) and assign them to all or specific employees.</li>
                <li><b>Acknowledge:</b> Review documents assigned to you and mark them as acknowledged with a single click. This creates a digital audit trail.</li>
                <li><b>Request Revision:</b> If you notice an issue with a document, you can send a notification to your manager requesting a revision.</li>
                <li><b>Track Status:</b> Administrators can click any document to see a detailed list of which employees have acknowledged it, who is pending, and who has requested a revision.</li>
            </ul>
        </>
    )
  },
  company: {
    title: 'Company Settings Overview',
    content: (
        <>
            <p className="mb-4">This section allows administrators to manage company-wide information and settings that affect multiple modules across the platform.</p>
            <h4 className="font-bold text-gray-800 mb-2">Key Areas:</h4>
            <ul className="list-disc list-inside space-y-2">
                <li><b>Company Profile:</b> Update legal and contact information for your company. This data is used in official documents like payslips and work certificates.</li>
                <li><b>Locations & Holidays:</b> Manage office locations and the public holiday calendar. The holiday calendar is automatically used for accurate day counting in the Time Off module.</li>
            </ul>
        </>
    )
  },
  settings: {
    title: 'Personal Settings Overview',
    content: (
        <>
            <p className="mb-4">Manage your personal account settings and preferences.</p>
            <h4 className="font-bold text-gray-800 mb-2">Key Actions:</h4>
            <ul className="list-disc list-inside space-y-2">
                <li><b>Profile Settings:</b> This is where you can change your login password to keep your account secure.</li>
                <li><b>Notifications:</b> Configure how you receive alerts and updates from the system, such as email notifications for pending approvals or new document assignments.</li>
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
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <HelpCircle className="mr-3 text-blue-600" /> {title || 'Help'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="text-gray-700 max-h-[60vh] overflow-y-auto pr-4">{content || <p>Help content for this page is not yet available.</p>}</div>
      </div>
    </div>
  );
};

export default Help;