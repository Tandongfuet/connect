
import React, { useState } from 'react';
import type { User } from '../types';
import { Role } from '../constants';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface RoleManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (userId: string, newRole: Role) => Promise<void>;
}

const RoleManagementModal: React.FC<RoleManagementModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [selectedRole, setSelectedRole] = useState<Role>(user?.role || Role.Buyer);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(user.id, selectedRole);
            addToast(`Successfully updated ${user.name}'s role to ${selectedRole}.`, 'success');
            onClose();
        } catch (error: any) {
            addToast(error.message || 'Failed to update role.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-2">Change User Role</h2>
                <p className="text-gray-muted dark:text-dark-muted mb-6">
                    Update the role for <span className="font-semibold">{user.name}</span>.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="role-select" className="label">New Role</label>
                        <select
                            id="role-select"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as Role)}
                            className="input"
                        >
                            {Object.values(Role).map(roleValue => (
                                <option key={roleValue} value={roleValue}>{roleValue}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="btn btn-light" disabled={loading}>
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={loading || selectedRole === user.role}>
                        {loading ? <Spinner size="sm" /> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleManagementModal;
