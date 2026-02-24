

import React from 'react';
import type { ProduceSubscription } from '../types';
import { Role } from '../constants';
import type { ProduceItem } from '../services/seasonalData';

interface ProduceCalendarCardProps {
  month: string;
  produce: ProduceItem[];
  userRole?: Role;
  subscriptions: ProduceSubscription;
  onToggleSubscription: (cropName: string, type: 'planting' | 'harvest') => void;
}

const ProduceCalendarCard: React.FC<ProduceCalendarCardProps> = ({ month, produce, userRole, subscriptions, onToggleSubscription }) => {

  const renderSubscriptionButton = (item: ProduceItem) => {
    if (!userRole || userRole === Role.Admin) return null;

    if (userRole === Role.Farmer) {
      const isSubscribed = subscriptions.planting.includes(item.name);
      return (
        <button
          onClick={() => onToggleSubscription(item.name, 'planting')}
          className={`btn btn-xs ${isSubscribed ? 'btn-primary' : 'btn-ghost'}`}
          title={isSubscribed ? 'Unsubscribe from planting alerts' : 'Get planting alerts'}
        >
          🌱
        </button>
      );
    }

    if (userRole === Role.Buyer) {
      const isSubscribed = subscriptions.harvest.includes(item.name);
      return (
        <button
          onClick={() => onToggleSubscription(item.name, 'harvest')}
          className={`btn btn-xs ${isSubscribed ? 'btn-light' : 'btn-ghost'}`}
          title={isSubscribed ? 'Unsubscribe from harvest alerts' : 'Get harvest alerts'}
        >
          🔔
        </button>
      );
    }

    return null;
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md border dark:border-dark-border flex flex-col">
      <h3 className="text-xl font-semibold text-white bg-primary-dark p-3 rounded-t-lg text-center">
        {month}
      </h3>
      <ul className="p-4 space-y-3 flex-grow">
        {produce.map((item) => (
          <li key={item.name} className="flex justify-between items-center text-slate-dark dark:text-gray-300">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span className="whitespace-nowrap truncate">{item.name}</span>
            </div>
            {renderSubscriptionButton(item)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProduceCalendarCard;
