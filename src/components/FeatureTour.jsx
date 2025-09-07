import React from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import '../tour.css';

const tourSteps = {
  people: [
    {
      element: '.people-header',
      intro: 'This is the People Directory. It\'s the central hub for all employee information.'
    },
    {
      element: '.people-stats',
      intro: 'Get a quick overview of your total headcount and new hires this month.'
    },
    {
      element: '.people-actions',
      intro: 'You can invite new employees to join or add their profiles manually right from here.'
    },
    {
      element: '.people-table',
      intro: 'All your employees are listed here. You can search, view profiles, and perform actions like editing or deleting records.'
    },
  ],
  payroll: [
    {
      element: '.payroll-header',
      intro: 'Welcome to the Payroll Hub. Manage all aspects of employee compensation from here.'
    },
    {
      element: '.run-payroll-section',
      intro: 'Start your regular monthly payroll run or run payroll for a specific past month.'
    },
    {
      element: '.payroll-history',
      intro: 'Access and review all your previous payroll records at any time.'
    },
  ],
  'time-off': [
    {
      element: '.time-off-header',
      intro: 'This is the Time Off module, where you can manage all leave requests and policies.'
    },
    {
      element: '.balance-cards',
      intro: 'Your personal time-off balances are displayed here for a quick overview.'
    },
    {
      element: '.time-off-tabs',
      intro: 'Switch between viewing requests in a list, seeing the team calendar, and managing approvals for your team.'
    },
  ],
  'time-clock': [
    {
      element: '.time-clock-header',
      intro: 'The Time Clock allows you and your team to log work hours accurately.'
    },
    {
      element: '.time-clock-main',
      intro: 'This is the main clocking interface. You can clock in, start a break, and clock out from here.'
    },
    {
        element: '.time-clock-kpis',
        intro: 'Key stats like your total hours for the week and your on-time streak are displayed here.'
    },
    {
      element: '.time-clock-log',
      intro: 'Your punches for the day will appear here in real-time, creating a log of your activity.'
    },
  ],
  'performance': [
    {
      element: '.performance-header',
      intro: 'Welcome to the Performance hub. Track and manage review cycles for yourself and your team.'
    },
    {
      element: '.performance-actions',
      intro: 'Create new performance review cycles from here.'
    },
    {
      element: '.performance-table',
      intro: 'All active and past performance cycles are listed here. Click on any row to view the detailed objectives and review notes for that cycle.'
    },
  ],
  'medical-file': [
    {
      element: '.medical-file-header',
      intro: 'This is the Medical Case Tracking module. It provides a unified view of sickness leave and related claims.'
    },
    {
      element: '.medical-file-stats',
      intro: 'These cards give you a quick overview of total cases and their current status.'
    },
    {
      element: '.medical-file-table',
      intro: 'All medical cases are logged here. You can search, filter, and click on a case to view or update its details, documents, and claim status.'
    },
  ],
  documents: [
    {
      element: '.documents-header',
      intro: 'The Document Hub is for managing and sharing important company documents.'
    },
    {
      element: '.document-stats',
      intro: 'See how many documents require your action and which are expiring soon.'
    },
    {
      element: '.documents-table',
      intro: 'View all company documents, see your acknowledgment status, and take necessary actions like acknowledging or requesting a revision.'
    },
  ],
  company: [
    {
        element: '.company-header',
        intro: 'The Company section is where administrators can manage global settings for the organization.'
    },
    {
        element: '.company-tabs',
        intro: 'Switch between updating your company\'s legal profile and managing office locations and public holidays.'
    }
  ],
  settings: [
    {
        element: '.settings-header',
        intro: 'In the Settings area, you can manage your personal account preferences.'
    },
    {
        element: '.settings-sections',
        intro: 'Here you can change your password and configure your notification settings.'
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