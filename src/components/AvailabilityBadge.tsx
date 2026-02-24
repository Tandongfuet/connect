import React from 'react';

interface AvailabilityBadgeProps {
  stock?: number;
}

const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ stock }) => {
  if (stock === undefined) return null; // For services

  let text = 'In Stock';
  let colorClasses = 'bg-olive-light text-primary-dark';

  if (stock <= 0) {
    text = 'Out of Stock';
    colorClasses = 'bg-red-100 text-red-800';
  } else if (stock <= 10) {
    text = 'Low Stock';
    colorClasses = 'bg-accent text-slate-dark';
  }

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
      {text}
    </span>
  );
};

export default AvailabilityBadge;