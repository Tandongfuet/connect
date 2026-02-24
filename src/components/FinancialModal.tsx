import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockDepositFunds, mockWithdrawFunds } from '../services/mockApi';
import { PaymentProvider } from '../constants';
import Spinner from './Spinner';
import type { Transaction } from '../types';
import { verifyMobileMoneyNumber } from '../services/momoApi';
import PaymentStatusIndicator from './PaymentStatusIndicator';
import MobileMoneyAlert from './MobileMoneyAlert';
import PasswordConfirmationModal from './PasswordConfirmationModal';

interface FinancialModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'deposit' | 'withdraw';
    onSuccess: () => void;
}

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'error';
type PaymentStatus = 'idle' | 'pending_confirmation' | 'processing';

const FinancialModal: React.FC<FinancialModalProps> = ({ isOpen, onClose, mode, onSuccess }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();

    // Form State
    const [amount, setAmount] = useState('5000');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [provider, setProvider] = useState<PaymentProvider>(PaymentProvider.MTN);
    
    // UI/Flow State
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
    const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
    const [verifiedName, setVerifiedName] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setCompletedTransaction(null);
            setAmount(mode === 'withdraw' ? '5000' : '10000');
            setPhoneNumber(user?.phoneNumber || '');
            setProvider(PaymentProvider.MTN);
            setVerificationStatus('idle');
            setVerifiedName('');
            setVerificationError('');
            setPaymentStatus('idle');
        }
    }, [isOpen, user, mode]);

    if (!isOpen || !user) return null;

    const handleVerify = async () => {
        if (!/^6\d{8}$/.test(phoneNumber)) {
            setVerificationStatus('error');
            setVerificationError('Please enter a valid 9-digit Cameroon phone number (starts with 6).');
            return;
        }

        setVerificationStatus('verifying');
        setVerificationError('');
        try {
            const result = await verifyMobileMoneyNumber(phoneNumber);
            if (result.success && result.accountHolderName) {
                setVerifiedName(result.accountHolderName);
                setVerificationStatus('verified');
            } else {
                setVerificationStatus('error');
                setVerificationError(result.message);
            }
        } catch (error: any) {
            setVerificationStatus('error');
            setVerificationError(error.message || 'An unexpected error occurred during verification.');
        }
    };

    const handleFinalizeDeposit = async () => {
        const numericAmount = parseFloat(amount);
        setPaymentStatus('processing');
         try {
            // FIX: Corrected signature for mockDepositFunds.
            const updatedUser = await mockDepositFunds(user, numericAmount, provider, phoneNumber);
            updateUser(updatedUser);
            addToast('Deposit successful!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.message || 'Deposit failed.', 'error');
            setPaymentStatus('idle');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addToast('Please enter a valid amount.', 'error');
            return;
        }

        if (mode === 'deposit') {
            setPaymentStatus('pending_confirmation');
            return;
        }
        
        // --- Withdrawal Logic ---
        if (numericAmount > user.accountBalance) {
            addToast('Withdrawal amount cannot exceed your balance.', 'error');
            return;
        }

        // Require password confirmation for withdrawal
        setIsPasswordConfirmOpen(true);
    };
    
    const handlePasswordConfirmed = async () => {
        setIsPasswordConfirmOpen(false);
        setPaymentStatus('processing');
        try {
            const numericAmount = parseFloat(amount);
            // FIX: Corrected signature for mockWithdrawFunds.
            const { updatedUser, transaction } = await mockWithdrawFunds(user, numericAmount, provider, phoneNumber, verifiedName);
            updateUser(updatedUser);
            setCompletedTransaction(transaction);
        } catch (error: any) {
            addToast(error.message || 'Transaction failed.', 'error');
        } finally {
            setPaymentStatus('idle');
        }
    };

    const handleAlertClose = () => {
        onSuccess();
        onClose();
    };

    if (completedTransaction) {
        return <MobileMoneyAlert transaction={completedTransaction} onClose={handleAlertClose} />;
    }

    const renderWithdrawalContent = () => {
        if (verificationStatus === 'verified') {
            return (
                <form onSubmit={handleSubmit} className="animate-fade-in">
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-md">
                        <p className="font-bold">Account Verified:</p>
                        <p className="text-sm">Name: <span className="font-semibold">{verifiedName}</span></p>
                        <p className="text-sm">Number: <span className="font-semibold">{phoneNumber}</span></p>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-slate-dark">You are about to withdraw <strong className="text-primary">{parseFloat(amount).toLocaleString('fr-CM')} XAF</strong> to the account above.</p>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setVerificationStatus('idle')} className="btn btn-light" disabled={paymentStatus === 'processing'}>Back</button>
                        <button type="submit" className="btn btn-primary" disabled={paymentStatus === 'processing'}>
                            {paymentStatus === 'processing' ? <Spinner size="sm" /> : 'Confirm Withdrawal'}
                        </button>
                    </div>
                </form>
            );
        }

        return (
             <form onSubmit={e => e.preventDefault()} className="space-y-4">
                <p className="text-sm text-gray-muted">Verify your Mobile Money number to proceed. The farmer support grant is 500,000 XAF.</p>
                <div>
                    <label htmlFor="amount" className="label">Amount (XAF)</label>
                    <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" className="input" />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="label">Mobile Money Number</label>
                    <input id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="612345678" className="input" />
                    {verificationError && <p className="text-red-600 text-sm mt-1">{verificationError}</p>}
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="btn btn-secondary" disabled={verificationStatus === 'verifying'}>Cancel</button>
                    <button type="button" onClick={handleVerify} className="btn btn-primary" disabled={verificationStatus === 'verifying'}>
                        {verificationStatus === 'verifying' ? <Spinner size="sm" /> : 'Verify Account'}
                    </button>
                </div>
            </form>
        );
    };

    const renderDepositContent = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="amount" className="label">Amount (XAF)</label>
                <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" className="input" />
            </div>
            <div>
                <label htmlFor="provider" className="label">Provider</label>
                <select id="provider" value={provider} onChange={e => setProvider(e.target.value as PaymentProvider)} className="input">
                    {Object.values(PaymentProvider).filter(p => p !== PaymentProvider.PayPal).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            
            <div className="animate-fade-in">
                <label htmlFor="phoneNumber" className="label">Mobile Money Number</label>
                <input id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="612345678" className="input" />
            </div>
             <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="btn btn-secondary" disabled={paymentStatus !== 'idle'}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={paymentStatus !== 'idle'}>
                    {paymentStatus !== 'idle' ? <Spinner size="sm" /> : `Confirm ${mode}`}
                </button>
            </div>
        </form>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
                <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" disabled={paymentStatus !== 'idle' || verificationStatus === 'verifying'} aria-label="Close modal">&times;</button>
                    
                    {paymentStatus === 'pending_confirmation' ? (
                        <PaymentStatusIndicator 
                            onComplete={handleFinalizeDeposit} 
                            amount={parseFloat(amount)} 
                            provider={provider} 
                            number={phoneNumber}
                            action="deposit"
                        />
                    ) : (
                        <>
                            <h2 id="dialog-title" className="text-2xl font-bold text-slate-dark dark:text-white mb-4 capitalize">{mode} Funds</h2>
                            {mode === 'withdraw' ? renderWithdrawalContent() : renderDepositContent()}
                        </>
                    )}
                </div>
            </div>
            <PasswordConfirmationModal 
                isOpen={isPasswordConfirmOpen}
                onClose={() => setIsPasswordConfirmOpen(false)}
                onConfirm={handlePasswordConfirmed}
                userId={user.id}
            />
        </>
    );
};

export default FinancialModal;