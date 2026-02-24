import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';
import { DISPUTE_REASONS } from '../constants';

interface DisputeModalProps {
    subjectId: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reasonCategory: string, reasonMessage: string) => Promise<void>;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ subjectId, isOpen, onClose, onSubmit }) => {
    const [reasonCategory, setReasonCategory] = useState(DISPUTE_REASONS[0]);
    const [reasonMessage, setReasonMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reasonMessage.trim()) {
            addToast('Please provide details for the dispute.', 'error');
            return;
        }
        setLoading(true);
        await onSubmit(reasonCategory, reasonMessage);
        setLoading(false);
        // Parent component is responsible for closing the modal on success
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-dark-text mb-2">Report an Issue</h2>
                <p className="text-gray-muted dark:text-dark-muted mb-6">Subject: <span className="font-mono">{subjectId}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="dispute-category" className="label">Reason for Dispute</label>
                        <select
                            id="dispute-category"
                            value={reasonCategory}
                            onChange={(e) => setReasonCategory(e.target.value)}
                            className="input"
                        >
                            {DISPUTE_REASONS.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dispute-reason" className="label">Please describe the issue in detail:</label>
                        <textarea
                            id="dispute-reason"
                            rows={5}
                            value={reasonMessage}
                            onChange={(e) => setReasonMessage(e.target.value)}
                            className="input"
                            placeholder="e.g., The item was not as described, I did not receive my order..."
                            required
                        />
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-danger" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'Submit Dispute'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DisputeModal;