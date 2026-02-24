
import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { mockVerifyPassword } from '../services/mockApi';
import Spinner from './Spinner';

interface PasswordConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userId: string;
}

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({ isOpen, onClose, onConfirm, userId }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const isCorrect = await mockVerifyPassword(userId, password);
            if (isCorrect) {
                onConfirm();
            } else {
                addToast('Incorrect password. Please try again.', 'error');
            }
        } catch (error: any) {
            addToast(error.message || 'An error occurred.', 'error');
        } finally {
            setLoading(false);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-sm w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Confirm Your Identity</h2>
                <p className="text-gray-muted dark:text-dark-muted text-sm mb-6">
                    For your security, please enter your password to confirm this change.
                </p>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="confirm-password" className="label">Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !password}>
                            {loading ? <Spinner size="sm" /> : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordConfirmationModal;
