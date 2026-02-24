import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types';
import VerificationBadge from './VerificationBadge';

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
const getColorForName = (name: string) => {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};


interface UserFollowCardProps {
    user: User;
}

const UserFollowCard: React.FC<UserFollowCardProps> = ({ user }) => {
    return (
        <div className="bg-white dark:bg-dark-surface p-3 rounded-lg shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
                {user.profileImage ? (
                    <img 
                        src={user.profileImage} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-full object-cover" 
                    />
                ) : (
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                        style={{ backgroundColor: getColorForName(user.name) }}
                    >
                        {getInitials(user.name)}
                    </div>
                )}
                <div>
                    <p className="font-semibold text-slate-dark dark:text-dark-text">{user.name}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-muted dark:text-dark-muted">{user.role}</p>
                        <VerificationBadge tier={user.verificationTier} size="sm" />
                    </div>
                </div>
            </div>
            <Link to={`/seller/${user.id}`} className="btn btn-sm btn-secondary">
                View Profile
            </Link>
        </div>
    );
};

export default UserFollowCard;