
import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-dark dark:text-primary-light mb-6 text-center">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none text-slate-dark dark:text-dark-text">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, list a product, or communicate with other users. This may include your name, email, phone number, and location.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to operate, maintain, and provide you with the features and functionality of the AgroConnect platform. This includes facilitating transactions, communication between users, and providing customer support.</p>

        <h2>3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processing) or as required by law. Your contact information may be shared between a buyer and seller to facilitate a transaction.</p>

        <h2>4. Data Security</h2>
        <p>We use reasonable measures to help protect your information from loss, theft, misuse, and unauthorized access. However, no electronic transmission or storage is 100% secure.</p>
        
        <p className="mt-8 text-center text-gray-muted dark:text-dark-muted">This is a sample Privacy Policy document. The content is for placeholder purposes only.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
