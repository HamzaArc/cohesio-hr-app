import React from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import '../tour.css';

const DashboardTour = ({ enabled, onExit }) => {
  const steps = [
    {
      element: '.sidebar',
      intro: 'Welcome to Cohesio! This is your main navigation where you can access all key features.',
    },
    {
      element: '.dashboard-header',
      intro: 'The dashboard gives you a quick overview of what\'s happening today.',
    },
    {
        element: '.action-items',
        intro: 'Action items that require your attention, like time-off approvals, will appear here.',
    },
    {
        element: '.whos-out',
        intro: "See which team members are out of the office this week at a glance.",
    },
    {
      element: '.upcoming-events',
      intro: 'Stay up to date with upcoming work anniversaries and team birthdays.',
    },
    {
        element: '.help-button-pulse',
        intro: 'For more help, click here! You can find page-specific help or relaunch these tours anytime.'
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