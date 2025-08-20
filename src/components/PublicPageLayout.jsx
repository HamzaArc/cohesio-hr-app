import React from 'react';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

function PublicPageLayout({ title, children }) {
  return (
    <div className="bg-white">
      <LandingHeader />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">{title}</h1>
          <div className="prose max-w-4xl">
            {children}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

export default PublicPageLayout;