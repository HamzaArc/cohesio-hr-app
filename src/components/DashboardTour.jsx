import React from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import '../tour.css';

const DashboardTour = ({ enabled, onExit }) => {
  const steps = [
    {
      element: '[data-tour-id="sidebar"]',
      intro: 'Welcome to Cohesio! This is your main navigation where you can access all key features like People, Payroll, and Time Off.',
    },
    {
      element: '[data-tour-id="dashboard-header"]',
      intro: 'The dashboard gives you a high-level overview of what\'s happening today.',
    },
    {
        element: '[data-tour-id="action-items"]',
        intro: 'Action items that require your immediate attention, like time-off approvals for your team, will appear here.',
    },
    {
        element: '[data-tour-id="whos-out"]',
        intro: "See which team members are out of the office this week at a glance.",
    },
    {
      element: '[data-tour-id="upcoming-events"]',
      intro: 'Stay up to date with upcoming work anniversaries and team birthdays to celebrate milestones together.',
    },
    {
        element: '[data-tour-id="help-button"]',
        intro: 'For more help, click here! You can find a detailed overview of the current page or relaunch these guided tours anytime.'
    }
  ];

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

export default DashboardTour;