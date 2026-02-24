
import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-dark dark:text-primary-light mb-6 text-center">Terms of Service</h1>
      <div className="prose dark:prose-invert max-w-none text-slate-dark dark:text-dark-text">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>1. Introduction</h2>
        <p>Welcome to AgroConnect. These Terms of Service ("Terms") govern your use of the AgroConnect website and services. By using our platform, you agree to these terms.</p>

        <h2>2. User Accounts</h2>
        <p>You must register for an account to access certain features. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>

        <h2>3. Seller Responsibilities</h2>
        <p>Sellers agree to provide accurate information about their products and services. You must fulfill orders in a timely manner and communicate professionally with buyers.</p>
        
        <h2>4. Buyer Responsibilities</h2>
        <p>Buyers agree to provide valid payment information and to confirm delivery of goods upon receipt to release funds from escrow. Disputes should be raised in good faith.</p>

        <h2>5. Prohibited Conduct</h2>
        <p>You agree not to engage in any fraudulent activity, sell illegal items, or harass other users. AgroConnect reserves the right to suspend or terminate accounts that violate these terms.</p>
        
        <p className="mt-8 text-center text-gray-muted dark:text-dark-muted">This is a sample Terms of Service document. The content is for placeholder purposes only.</p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
