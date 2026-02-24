import React from 'react';
import { VerificationTier } from '../constants';

interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: 'sm' | 'md';
}

const tierConfig = {
  [VerificationTier.Bronze]: {
    label: 'Bronze Seller',
    icon: '🥉',
    color: 'text-yellow-600',
    tooltip: 'Identity has been verified by AgroConnect.',
  },
  [VerificationTier.Silver]: {
    label: 'Silver Seller',
    icon: '🥈',
    color: 'text-gray-500',
    tooltip: 'Identity and business registration have been verified.',
  },
  [VerificationTier.Gold]: {
    label: 'Gold Seller',
    icon: '🥇',
    color: 'text-yellow-500',
    tooltip: 'A top-rated, trusted, and verified seller with a history of excellent service.',
  },
  [VerificationTier.None]: {
      label: '',
      icon: '',
      color: '',
      tooltip: '',
  }
};

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ tier, size = 'md' }) => {
  if (tier === VerificationTier.None) {
    return null;
  }

  const config = tierConfig[tier];
  const sizeClasses = size === 'md' ? 'text-xl' : 'text-base';

  return (
    <div className="relative group flex items-center" title={config.tooltip}>
      <span className={`${sizeClasses} ${config.color}`} aria-label={config.label}>
        {config.icon}
      </span>
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {config.tooltip}
        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
      </div>
    </div>
  );
};

export default VerificationBadge;