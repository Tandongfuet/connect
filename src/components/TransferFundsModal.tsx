
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockGetAllUsers, mockTransferFunds } from '../services/mockApi';
import type { User } from '../types';
import Spinner from './Spinner';
import PasswordConfirmationModal from './PasswordConfirmationModal';

interface TransferFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TransferFundsModal: React.FC<TransferFundsModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();

    const [step, setStep] = useState<'details' | 'confirm'>('details');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [foundRecipient, setFoundRecipient] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setStep('details');
            setRecipientEmail('');
            setAmount('');
            setFoundRecipient(null);
            setIsSearching(false);
            setIsProcessing(false);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const handleSearchRecipient = async () => {
        if (!recipientEmail.trim()) {
            addToast('Please enter a recipient email.', 'error');
            return;
        }
        if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
            addToast('You cannot send money to yourself.', 'error');
            return;
        }
        setIsSearching(true);
        try {
            const allUsers = await mockGetAllUsers();
            const recipient = allUsers.find(u => u.email.toLowerCase() === recipientEmail.toLowerCase());
            if (recipient) {
                setFoundRecipient(recipient);
                setStep('confirm');
            } else {
                addToast('User not found. Please check the email address.', 'error');
            }
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleConfirmTransfer = () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addToast('Please enter a valid amount.', 'error');
            return;
        }
        if (numericAmount > user.accountBalance) {
            addToast('Insufficient funds.', 'error');
            return;
        }
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirmed = async () => {
        setIsPasswordModalOpen(false);
        setIsProcessing(true);
        try {
            const numericAmount = parseFloat(amount);
            const updatedUser = await mockTransferFunds(user, recipientEmail, numericAmount);
            updateUser(updatedUser);
            addToast('Transfer successful!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.message || 'Transfer failed.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (val: number) => `XAF ${val.toLocaleString('fr-CM')}`;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
                <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                    <h2 id="dialog-title" className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Send Money</h2>
                    
                    {step === 'details' && (
                        <form onSubmit={(e) => { e.preventDefault(); handleSearchRecipient(); }} className="space-y-4">
                            <div>
                                <label htmlFor="recipientEmail" className="label">Recipient's Email</label>
                                <input id="recipientEmail" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label htmlFor="amount" className="label">Amount (XAF)</label>
                                <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
                                <p className="text-xs text-gray-muted mt-1">Available Balance: {formatCurrency(user.accountBalance)}</p>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="btn btn-light" disabled={isSearching}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSearching}>
                                    {isSearching ? <Spinner size="sm"/> : 'Find Recipient'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'confirm' && foundRecipient && (
                        <div className="animate-fade-in">
                            <p className="text-gray-muted mb-4">You are about to send money to:</p>
                            <div className="bg-secondary dark:bg-dark-border p-4 rounded-lg text-center mb-4">
                                <p className="font-bold text-lg text-slate-dark dark:text-white">{foundRecipient.name}</p>
                                <p className="text-sm text-gray-muted">{foundRecipient.email}</p>
                            </div>
                            <p className="text-center text-3xl font-bold text-primary my-4">{formatCurrency(parseFloat(amount) || 0)}</p>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setStep('details')} className="btn btn-light">Back</button>
                                <button type="button" onClick={handleConfirmTransfer} className="btn btn-primary">
                                    Confirm & Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <PasswordConfirmationModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirmed}
                userId={user.id}
            />
        </>
    );
};

export default TransferFundsModal;
