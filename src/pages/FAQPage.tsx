
import React from 'react';

const FAQPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-dark dark:text-primary-light mb-6 text-center">Frequently Asked Questions</h1>
      <div className="space-y-6 text-slate-dark dark:text-dark-text">
        <div>
          <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">How do I register as a farmer?</h2>
          <p>To register as a farmer, click the "Sign Up" button on the homepage, select the "Farmer" role, and fill in the required details, including your Mobile Money number for payments.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">Is there a fee to list my products?</h2>
          <p>Listing products on AgroConnect is completely free for all registered farmers and service providers.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">How does the payment escrow system work?</h2>
          <p>When a buyer pays for an item, the money is held securely by AgroConnect. The funds are only released to the seller after the buyer confirms that they have received the goods, protecting both parties from fraud.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">What is the Farmer Support Grant?</h2>
          <p>The Farmer Support Grant is a one-time bonus of 500,000 XAF credited to new, eligible farmers upon their first login to help them get started on the platform and invest in their business.</p>
        </div>
         <div>
          <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">How do I resolve an issue with my order?</h2>
          <p>If you have an issue with an order, you can go to your dashboard, find the order, and click "Report an Issue." This will open a dispute, and an administrator will review the case to help find a resolution.</p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
