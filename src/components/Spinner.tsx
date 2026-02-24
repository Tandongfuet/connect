import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]}`}
        style={{ borderColor: '#16a34a', borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
      ></div>
    </div>
  );
};

export default Spinner;