import React, { useEffect } from 'react';
import { PaymentProvider } from '../constants';
import Spinner from './Spinner';

interface PaymentStatusIndicatorProps {
    onComplete: () => void;
    amount: number;
    provider: PaymentProvider;
    number: string;
    action: 'payment' | 'deposit';
}

const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({ onComplete, amount, provider, number, action }) => {
    useEffect(() => {
        // Simulate the user confirming on their phone and the backend sending a callback.
        const timer = setTimeout(() => {
            onComplete();
        }, 7000); // 7-second delay to simulate user action
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="text-center animate-fade-in">
            <h3 className="text-xl font-bold text-slate-dark mb-4">Confirm on Your Phone</h3>
            <Spinner size="lg" />
            <p className="text-gray-muted mt-4">
                A {action} request for <strong className="text-slate-dark">{`XAF ${amount.toLocaleString('fr-CM')}`}</strong> has been sent to <strong className="text-slate-dark">{number}</strong> via {provider}.
            </p>
            <p className="text-sm text-gray-muted mt-2">Please approve the transaction by entering your PIN on your phone.</p>
        </div>
    );
};

export default PaymentStatusIndicator;