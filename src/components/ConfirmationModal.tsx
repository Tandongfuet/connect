

import React, { useEffect } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmButtonText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Confirm', confirmButtonClass = 'btn-danger' }) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div 
                role="alertdialog" 
                aria-modal="true" 
                aria-labelledby="dialog-title" 
                aria-describedby="dialog-description"
                className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full"
            >
                <h2 id="dialog-title" className="text-2xl font-bold text-slate-dark dark:text-white mb-4">{title}</h2>
                <div id="dialog-description" className="text-gray-muted dark:text-dark-muted mb-6">{message}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`btn ${confirmButtonClass}`}>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
