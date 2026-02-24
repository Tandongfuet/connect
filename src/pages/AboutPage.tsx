
import React from 'react';
import BrandIcon from '../components/BrandIcon';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md animate-fade-in">
      <h1 className="text-4xl font-bold text-primary-dark dark:text-primary-light mb-4 text-center">About AgroConnect: Cultivating Cameroon's Future</h1>
      <p className="text-lg text-gray-muted dark:text-dark-muted mb-8 text-center">
        Empowering Cameroonian agriculture, one connection at a time.
      </p>

      <div className="space-y-8 text-slate-dark dark:text-dark-text leading-relaxed">
        <p>
          AgroConnect was born from a deep understanding of the challenges and immense potential within Cameroon's agricultural landscape. We saw hardworking smallholder farmers struggling with market access and post-harvest losses, while urban consumers in cities like Douala and Yaoundé sought fresh, reliable produce. Our platform was built to bridge this critical gap.
        </p>

        <div>
          <h2 className="text-2xl font-semibold text-slate-dark dark:text-white mb-3 border-b-2 border-primary-light dark:border-primary-dark pb-2">Our Mission & Vision</h2>
          <p className="mb-2">
            <strong>Our Mission:</strong> To digitize Cameroon's agricultural supply chain, empowering local farmers with direct, transparent market access, thereby reducing food waste and ensuring national food security.
          </p>
           <p>
            <strong>Our Vision:</strong> We envision a thriving Cameroonian agricultural sector where every farmer is connected, profitable, and a key contributor to a sustainable and self-sufficient national food system.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-slate-dark dark:text-white mb-4 border-b-2 border-primary-light dark:border-primary-dark pb-2">Platform Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-primary-light dark:border-primary">
                <h3 className="font-bold text-lg text-primary-dark dark:text-primary-light mb-2">For Farmers</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>Expand reach beyond local village markets.</li>
                    <li>Achieve fairer prices by selling directly.</li>
                    <li>Reduce spoilage and post-harvest losses.</li>
                </ul>
            </div>
             <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-accent dark:border-yellow-400">
                <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-2">For Buyers & Consumers</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>Access fresh, traceable, and high-quality produce.</li>
                    <li>Support local farming communities directly.</li>
                    <li>Discover a wide variety of Cameroonian products.</li>
                </ul>
            </div>
          </div>
        </div>
        
         <div>
          <h2 className="text-2xl font-semibold text-slate-dark dark:text-white mb-3 border-b-2 border-primary-light dark:border-primary-dark pb-2 flex items-center gap-3">
            <BrandIcon className="h-8 w-8 text-primary" />
            Our Founder
          </h2>
          <p>
            AgroConnect was conceived and built by <span className="font-extrabold text-primary-dark dark:text-primary-light text-lg tracking-wide">EFUELATEH GEORGE</span>, a passionate developer and visionary with deep roots in the community. Driven by a desire to uplift his local farmers and the broader Cameroonian agricultural sector, he single-handedly engineered this platform. His work is a testament to the power of technology in creating tangible solutions for real-world challenges and fostering sustainable growth from the ground up.
          </p>
        </div>

        <p className="border-t border-gray-200 dark:border-dark-border pt-6 mt-6 font-semibold text-center text-slate-dark dark:text-dark-text">
          Join us in transforming agriculture in Cameroon. Whether you are a farmer, a buyer, or a service provider, you have a vital role to play in our growing community.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
