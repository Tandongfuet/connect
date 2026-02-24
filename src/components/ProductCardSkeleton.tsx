import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg shadow-sm bg-white overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-300"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="mt-auto border-t pt-4">
           <div className="h-8 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;