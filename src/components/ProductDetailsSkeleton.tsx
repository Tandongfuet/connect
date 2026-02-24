import React from 'react';

const ProductDetailsSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery Skeleton */}
            <div>
                <div className="h-96 w-full rounded-lg bg-gray-300 dark:bg-gray-700"></div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                    <div className="h-20 w-full bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-20 w-full bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-20 w-full bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                
                <div className="space-y-3 pt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>

                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg w-full mt-8"></div>
                
                <div className="p-4 bg-gray-100 dark:bg-dark-border rounded-lg mt-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex-grow space-y-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default ProductDetailsSkeleton;