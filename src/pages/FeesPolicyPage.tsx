
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FeesPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-dark dark:text-primary-light mb-6 text-center">Fees & Commission Policy</h1>
      <div className="prose max-w-none dark:prose-invert text-slate-dark dark:text-dark-text">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>1. Overview</h2>
        <p>Transparency is a core value at AgroConnect. This policy outlines the fees associated with selling on our platform. By registering as a Farmer or Service Provider, you agree to these terms.</p>

        <h2>2. Listing Fees</h2>
        <p>It is completely <strong>free</strong> to create and publish listings for products or services on AgroConnect. There are no upfront costs to showcase your offerings to our community of buyers.</p>

        <h2>3. Commission on Sales</h2>
        <p>To maintain and improve the platform, including our secure escrow payment system, marketing efforts, and customer support, we charge a small commission on successfully completed transactions.</p>
        <ul>
            <li><strong>Standard Commission Rate:</strong> A flat rate of <strong>5%</strong> is deducted from the total value of each completed order or booking.</li>
            <li><strong>How it Works:</strong> When a buyer pays, the full amount is held in our secure escrow. Once the order is successfully completed, 95% of the transaction value is transferred to your seller wallet, and 5% is retained by AgroConnect as commission.</li>
        </ul>
        
        <h2>4. Payouts</h2>
        <p>Funds from completed sales are added to your "Available Balance". You can request a withdrawal of your available balance to your registered Mobile Money account at any time. Standard mobile money transaction fees may apply from your provider.</p>
        
        <h2>5. Dispute Resolution</h2>
        <p>In the event of a dispute that results in a full refund to the buyer, no commission will be charged for that transaction. The full amount held in escrow will be returned to the buyer.</p>

        <div className="mt-12 text-center">
            <button onClick={() => navigate(-1)} className="btn btn-primary">
                &larr; Back to Registration
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeesPolicyPage;
