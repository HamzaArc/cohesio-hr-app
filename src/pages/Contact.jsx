import React from 'react';
import PublicPageLayout from '../components/PublicPageLayout';

function Contact() {
  return (
    <PublicPageLayout title="Contact Us">
      <p>Have questions? We'd love to hear from you.</p>
      <p>For support and inquiries, please email us at <a href="mailto:support@cohesio.app">support@cohesio.app</a>.</p>
    </PublicPageLayout>
  );
}

export default Contact;