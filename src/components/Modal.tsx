import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // additional styling for inner container
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
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
                className={`bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl max-w-lg w-full ${className}`} 
                role="dialog" 
                aria-modal="true"
            >
                {title && <h2 className="text-xl font-bold text-slate-dark dark:text-white mb-4">{title}</h2>}
                {children}
            </div>
        </div>
    );
};

export default Modal;
