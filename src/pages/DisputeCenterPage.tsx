import React from 'react';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import BrandIcon from '../components/BrandIcon';

const DisputeCenterPage: React.FC = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <BrandIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-slate-dark">Dispute Center</h1>
      </div>
      <p className="text-gray-muted mb-8">Review and resolve all open user disputes. This is a subsection of the Admin Panel.</p>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* The AdminDashboard component already contains the logic for displaying disputes in its 'disputes' tab. 
            This page could be used to directly show that tab, or contain a more detailed, standalone dispute management interface.
            For this implementation, we will re-use the AdminDashboard.
        */}
        <AdminDashboard defaultTab="disputes" />
      </div>
    </div>
  );
};

export default DisputeCenterPage;