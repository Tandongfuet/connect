
import React from 'react';
import type { Transaction } from '../types';
import BrandIcon from './BrandIcon';
import { TransactionType } from '../constants';

interface MobileMoneyAlertProps {
    transaction: Transaction;
    onClose: () => void;
}

const MobileMoneyAlert: React.FC<MobileMoneyAlertProps> = ({ transaction, onClose }) => {
    const isGrantWithdrawal = transaction.type === TransactionType.Withdrawal && Math.abs(transaction.amount) === 500000;

    const title = isGrantWithdrawal ? "Grant Received!" : "Transfer Successful!";
    const message = isGrantWithdrawal
        ? "You have received 500,000 XAF from AgroConnect in your mobile wallet to support you and help you grow."
        : "Your funds have been successfully sent to your Mobile Money account.";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
                <div className="p-6">
                    <div className="text-center">
                        <BrandIcon className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-dark dark:text-white">{title}</h2>
                        <p className="text-gray-muted dark:text-dark-muted mt-2 text-sm">
                            {message}
                        </p>
                    </div>

                    <div className="mt-6 space-y-3 bg-secondary dark:bg-dark-border p-4 rounded-md text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-muted dark:text-dark-muted">Amount:</span>
                            <span className="font-bold text-slate-dark dark:text-white">{Math.abs(transaction.amount).toLocaleString('fr-CM')} XAF</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-muted dark:text-dark-muted">To Account:</span>
                            <span className="font-medium text-slate-dark dark:text-white">{transaction.metadata?.verifiedAccountHolder}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-gray-muted dark:text-dark-muted">Phone Number:</span>
                            <span className="font-medium text-slate-dark dark:text-white">{transaction.metadata?.phoneNumber}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-muted dark:text-dark-muted">Transaction ID:</span>
                            <span className="font-mono text-xs text-slate-dark dark:text-white">{transaction.id}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-muted dark:text-dark-muted">Status:</span>
                            <span className="font-bold text-green-600">
                                {transaction.status}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                         <button onClick={onClose} className="btn btn-primary w-full">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileMoneyAlert;
