import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionText?: string;
  actionTo?: string;
  actionOnClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, actionTo, actionOnClick }) => {
  const renderAction = () => {
    if (!actionText) return null;

    if (actionTo) {
      return (
        <Link to={actionTo} className="btn btn-primary">
          {actionText}
        </Link>
      );
    }
    if (actionOnClick) {
      return (
        <button onClick={actionOnClick} className="btn btn-primary">
          {actionText}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="text-center bg-white dark:bg-dark-surface/50 p-10 rounded-lg shadow-md border-2 border-dashed border-gray-200 dark:border-dark-border">
      <div className="text-5xl text-gray-400 dark:text-gray-500 mb-4 mx-auto w-fit">{icon}</div>
      <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-2">{title}</h2>
      <p className="text-gray-muted dark:text-dark-muted mb-6">{message}</p>
      {renderAction()}
    </div>
  );
};

export default EmptyState;