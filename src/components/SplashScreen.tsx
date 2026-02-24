import React from 'react';
import BrandIcon from './BrandIcon';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream-light animate-fade-in">
      <div className="text-center">
        <BrandIcon className="h-24 w-24 text-primary mx-auto" />
        <h1 className="text-5xl font-bold text-primary mt-4">AgroConnect</h1>
        <p className="text-gray-muted mt-2 text-lg">
          Powered by EFUELATEH GEORGE
        </p>
        <div className="mt-8">
            <div 
                className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-dark mx-auto"
            ></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;