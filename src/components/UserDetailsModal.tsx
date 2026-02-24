import React from 'react';
import type { User } from '../types';
import { VerificationTier, Role } from '../constants';
import { useToast } from '../contexts/ToastContext';
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

interface UserDetailsModalProps {
    user: User | null;
    onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
    const { addToast } = useToast();

    if (!user) return null;

    const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

    const handleExport = () => {
        const data = [user];
        const headers = Object.keys(data[0]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + data.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(",")).join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `user_data_${user.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast(`Exported data for ${user.name}.`, 'success');
    };
    
    const verificationStatusClasses: { [key: string]: string } = {
        'Verified': 'bg-green-100 text-green-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Not Submitted': 'bg-gray-100 text-gray-800',
    };

    const DetailItem: React.FC<{ label: string; value: React.ReactNode | undefined }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-muted dark:text-gray-400">{label}</p>
            <p className="font-semibold text-slate-dark dark:text-gray-200">{value || 'N/A'}</p>
        </div>
    );
    
    const isSeller = user.role === Role.Farmer || user.role === Role.ServiceProvider;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl">&times;</button>
                
                <div className="flex items-center space-x-6 mb-6">
                    {user.profileImage ? (
                        <img 
                            src={user.profileImage} 
                            alt={user.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-primary-light dark:border-primary-dark"
                        />
                    ) : (
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-4xl border-4 border-primary-light dark:border-primary-dark"
                            style={{ backgroundColor: getColorForName(user.name) }}
                            aria-label={user.name}
                        >
                            {getInitials(user.name)}
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-dark dark:text-white">{user.name}</h2>
                        <p className="text-gray-muted dark:text-dark-muted">{user.role}</p>
                         <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                    </div>
                </div>

                <div className="border-t dark:border-dark-border pt-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    <DetailItem label="Email Address" value={user.email} />
                    <DetailItem label="Phone Number" value={user.phoneNumber} />
                    <DetailItem label="Location" value={user.location} />
                    <DetailItem label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} />
                     <div>
                        <p className="text-sm text-gray-muted dark:text-dark-muted">Verification Status</p>
                        <div className="flex items-center gap-2">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${verificationStatusClasses[user.verificationStatus]}`}>{user.verificationStatus}</span>
                             {user.verificationTier !== VerificationTier.None && <VerificationBadge tier={user.verificationTier} />}
                        </div>
                    </div>
                    <DetailItem label="Account Balance" value={formatCurrency(user.accountBalance)} />
                    <DetailItem label="Pending Balance" value={formatCurrency(user.pendingBalance)} />
                    <DetailItem label="Total Earnings" value={formatCurrency(user.totalEarnings)} />
                    {isSeller && <DetailItem label="Followers" value={user.followerCount} />}
                </div>
                
                <div className="mt-8 pt-4 border-t dark:border-dark-border flex justify-end">
                    <button onClick={handleExport} className="btn btn-secondary">
                        Export Data (CSV)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;