import React from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import '../tour.css';

const tourSteps = {
  people: [
    {
      element: '[data-tour-id="people-header"]',
      intro: "This is the **People Directory**. It's the central hub for all employee information."
    },
    {
      element: '[data-tour-id="people-stats"]',
      intro: 'These cards give you a quick, real-time overview of your total headcount, new hires this month, and more.'
    },
    {
      element: '[data-tour-id="add-employee-btn"]',
      intro: 'Click here to add a new employee profile with a comprehensive, multi-step form.'
    },
    {
      element: '[data-tour-id="invite-employee-btn"]',
      intro: 'Alternatively, you can invite a new hire to fill out their own profile by sending them a secure link.'
    },
    {
      element: '[data-tour-id="people-table"]',
      intro: 'All your employees are listed here. You can search, sort, and click on any employee to view their detailed profile.'
    },
  ],
  payroll: [
    {
      element: '[data-tour-id="payroll-header"]',
      intro: 'Welcome to the **Payroll Hub**. Manage all aspects of employee compensation from here.'
    },
    {
      element: '[data-tour-id="run-payroll-section"]',
      intro: "This is the main action area. You can start the next scheduled payroll run or run payroll for a specific past month if needed."
    },
    {
      element: '[data-tour-id="payroll-history"]',
      intro: 'Access and review all your previous payroll records at any time. Click on a record to see detailed payslips for each employee in that run.'
    },
  ],
  'time-off': [
    {
      element: '[data-tour-id="time-off-header"]',
      intro: 'This is the **Time Off** module, where you can manage all leave requests and policies.'
    },
    {
      element: '[data-tour-id="balance-cards"]',
      intro: 'Your personal time-off balances are displayed here for a quick overview. Managers will also see a card for pending approvals.'
    },
    {
      element: '[data-tour-id="request-time-off-btn"]',
      intro: "When you're ready to request leave, click this button to open the request form."
    },
    {
      element: '[data-tour-id="time-off-tabs"]',
      intro: 'Switch between different views: a list of all requests, a visual team calendar, and a dedicated tab for managers to handle approvals.'
    },
  ],
  'time-clock': [
    {
      element: '[data-tour-id="time-clock-header"]',
      intro: 'The **Time Clock** allows you and your team to log work hours accurately.'
    },
    {
        element: '[data-tour-id="time-clock-kpis"]',
        intro: 'Key stats like your total hours for the week and your on-time streak are displayed here for a quick performance check.'
    },
    {
      element: '[data-tour-id="time-clock-main"]',
      intro: 'This is the main clocking interface. You can clock in, start a break, and clock out from here. The buttons will enable or disable based on your current status.'
    },
    {
      element: '[data-tour-id="time-clock-log"]',
      intro: 'Your punches for the day will appear here in real-time, creating a log of your activity.'
    },
  ],
  'performance': [
    {
      element: '[data-tour-id="performance-header"]',
      intro: 'Welcome to the **Performance** hub. Track and manage review cycles for yourself and your team.'
    },
    {
      element: '[data-tour-id="performance-actions"]',
      intro: 'As a manager, you can create new performance review cycles for your direct reports from here.'
    },
    {
      element: '[data-tour-id="performance-table"]',
      intro: 'All active and past performance cycles are listed here. Click on any row to view the detailed objectives, 1-on-1s, and review notes for that cycle.'
    },
  ],
  'medical-file': [
    {
      element: '[data-tour-id="medical-file-header"]',
      intro: 'This is the **Medical Case Tracking** module. It provides a unified view of sickness leave and related claims.'
    },
    {
      element: '[data-tour-id="medical-file-stats"]',
      intro: 'These cards give you a quick overview of total cases and their current status, such as how many are pending HR review.'
    },
    {
      element: '[data-tour-id="medical-file-table"]',
      intro: 'All medical cases are logged here. You can search, filter, and click on a case to view or update its details, documents, and claim status.'
    },
  ],
  documents: [
    {
      element: '[data-tour-id="documents-header"]',
      intro: 'The **Document Hub** is for managing and sharing important company and employee documents.'
    },
    {
      element: '[data-tour-id="document-stats"]',
      intro: "These cards highlight what's most important: documents that require your action and documents that are expiring soon."
    },
    {
      element: '[data-tour-id="upload-document-btn"]',
      intro: 'Administrators can upload new documents here and assign them to all or specific employees for acknowledgment.'
    },
    {
      element: '[data-tour-id="documents-table"]',
      intro: "This table shows all documents you have access to. You can view, acknowledge, or request revisions right from this list."
    },
  ],
  company: [
    {
        element: '[data-tour-id="company-header"]',
        intro: 'The **Company** section is where administrators can manage global settings for the organization.'
    },
    {
        element: '[data-tour-id="company-tabs"]',
        intro: "Switch between different settings panels. You can update your company's legal profile for official documents and manage office locations or public holidays for time-off calculations."
    }
  ],
  settings: [
    {
        element: '[data-tour-id="settings-header"]',
        intro: 'In the **Settings** area, you can manage your personal account preferences.'
    },
    {
        element: '[data-tour-id="settings-sections"]',
        intro: 'Here you can perform actions like changing your password and configuring how you receive notifications from the system.'
    }
  ],
};

const FeatureTour = ({ page, enabled, onExit }) => {
  const steps = tourSteps[page] || [];

  if (!steps.length) {
    return null;
  }

  return (
    <Steps
      enabled={enabled}
      steps={steps}
      initialStep={0}
      onExit={onExit}
      options={{
        showProgress: true,
        showBullets: true,
        exitOnOverlayClick: false,
        tooltipClass: 'custom-tooltip',
      }}
    />
  );
};

export default FeatureTour;