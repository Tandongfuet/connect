import React from 'react';
import AdminDashboard from './AdminDashboard'; // Reusing admin dashboard for dispute management

const SupportAgentDashboard: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-dark dark:text-dark-text mb-4">Support Center</h2>
      <p className="text-gray-muted dark:text-dark-muted mb-6">Review and assist with open user disputes.</p>
      {/* 
        For simplicity, we are reusing the AdminDashboard component, as it already contains the necessary
        tabs for managing users, listings, and disputes, which are relevant to a Support Agent's role.
        In a more complex application, this could be a dedicated component with tailored functionality.
        We'll default to the 'disputes' tab.
      */}
      <AdminDashboard defaultTab="disputes" />
    </div>
  );
};

export default SupportAgentDashboard;