
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockPayForOrder, mockPayForBooking } from '../services/mockApi';
import { PaymentProvider } from '../constants';
import Spinner from './Spinner';
import type { Order, Booking } from '../types';
import { requestPayment } from '../services/momoApi';
import PaymentStatusIndicator from './PaymentStatusIndicator';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    payable: Order | Booking | null;
    onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, payable, onSuccess }) => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();

    type PaymentStatus = 'idle' | 'pending_confirmation' | 'processing';
    
    const [provider, setProvider] = useState<'Wallet' | PaymentProvider>('Wallet');
    const [status, setStatus] = useState<PaymentStatus>('idle');
    
    const [momoNumber, setMomoNumber] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setStatus('idle');
            setProvider(user.accountBalance >= price ? 'Wallet' : PaymentProvider.MTN);
            setMomoNumber(user.phoneNumber || '');
            setPaypalEmail(user.email || '');
        }
    }, [isOpen, user, payable]);
    
    if (!isOpen || !payable || !user) return null;
    
    const isOrder = 'totalPrice' in payable;
    const price = isOrder ? payable.totalPrice : payable.price;
    const subjectId = isOrder ? `Order #${payable.id.slice(-6)}` : `Booking #${payable.id.slice(-6)}`;
    const subjectTitle = isOrder ? `Order Payment` : `Pay for Service: "${payable.serviceTitle}"`;

    const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;
    const canPayWithWallet = user.accountBalance >= price;

    const finalizePayment = async () => {
        setStatus('processing');
        try {
            if (isOrder) {
                await mockPayForOrder(payable.id, user);
            } else {
                await mockPayForBooking(payable.id, user);
            }
            
            if (provider === 'Wallet') {
                updateUser({ accountBalance: user.accountBalance - price });
            }
            addToast(`Payment for ${subjectId} successful!`, 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.message || 'Payment failed.', 'error');
            setStatus('idle'); // Reset on failure
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (provider === 'Wallet') {
            if (!canPayWithWallet) {
                addToast("Insufficient wallet balance.", 'error');
                return;
            }
            await finalizePayment(); // Wallet payment is instant
            return;
        }

        if ((provider === PaymentProvider.MTN || provider === PaymentProvider.Orange) && !/^6\d{8}$/.test(momoNumber)) {
            addToast('Please enter a valid 9-digit Cameroon phone number (starts with 6).', 'error');
            return;
        }
        
        // --- Mobile Money Flow ---
        setStatus('processing'); // Show spinner briefly while initiating
        try {
            await requestPayment(momoNumber, price);
            setStatus('pending_confirmation');
            // The PaymentStatusIndicator will now be shown, and it will call finalizePayment on its timer.
        } catch (error: any) {
            addToast(error.message || 'Failed to initiate payment.', 'error');
            setStatus('idle');
        }
    };
    
    const renderProviderSpecificFields = () => {
        switch(provider) {
            case PaymentProvider.MTN:
            case PaymentProvider.Orange:
                return (
                     <div className="animate-fade-in">
                        <label htmlFor="momoNumber" className="label">Mobile Money Number</label>
                        <input 
                            id="momoNumber" 
                            type="tel" 
                            value={momoNumber}
                            onChange={(e) => setMomoNumber(e.target.value)} 
                            required 
                            placeholder="612345678"
                        />
                    </div>
                );
            case PaymentProvider.PayPal:
                 return <p className="text-sm text-center text-gray-muted dark:text-dark-muted p-2 bg-secondary dark:bg-dark-border rounded-md">You will be redirected to PayPal to complete your payment.</p>;
            case 'Wallet':
            default:
                 if (!canPayWithWallet) {
                    return <p className="text-red-600 dark:text-red-300 text-sm text-center bg-red-50 dark:bg-red-900/30 p-2 rounded-md">Your wallet balance is too low for this transaction.</p>;
                 }
                 return <p className="text-green-700 dark:text-green-300 text-sm text-center bg-green-50 dark:bg-green-900/30 p-2 rounded-md">You have sufficient funds in your wallet.</p>;
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" disabled={status !== 'idle'}>&times;</button>
                 
                 {status === 'pending_confirmation' ? (
                    <PaymentStatusIndicator 
                        onComplete={finalizePayment} 
                        amount={price} 
                        provider={provider as PaymentProvider} 
                        number={momoNumber}
                        action="payment"
                    />
                 ) : (
                    <>
                        <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-2">{subjectTitle}</h2>
                        <p className="text-gray-muted dark:text-dark-muted text-sm">{subjectId}</p>
                        <p className="text-3xl font-bold text-primary my-4">{formatCurrency(price)}</p>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                             <div>
                                <label htmlFor="payment-provider" className="label">Payment Method</label>
                                <select id="payment-provider" value={provider} onChange={e => setProvider(e.target.value as 'Wallet' | PaymentProvider)} className="input">
                                    <option value="Wallet" disabled={!canPayWithWallet}>Wallet Balance ({formatCurrency(user.accountBalance)})</option>
                                    <option value={PaymentProvider.MTN}>{PaymentProvider.MTN}</option>
                                    <option value={PaymentProvider.Orange}>{PaymentProvider.Orange}</option>
                                </select>
                            </div>

                            {renderProviderSpecificFields()}
                            
                            <div className="pt-4 flex justify-end gap-3 border-t dark:border-dark-border">
                                <button type="button" onClick={onClose} className="btn btn-light" disabled={status === 'processing'}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={status === 'processing' || (provider === 'Wallet' && !canPayWithWallet)}>
                                    {status === 'processing' ? <Spinner size="sm" /> : `Pay Now`}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
