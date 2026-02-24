
import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { useToast } from '../contexts/ToastContext';

interface FlagContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
    contentType: 'post' | 'reply' | 'user';
    subjectName: string;
}

const FlagContentModal: React.FC<FlagContentModalProps> = ({ isOpen, onClose, onSubmit, contentType, subjectName }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            addToast("Please provide a reason for flagging.", "error");
            return;
        }
        setLoading(true);
        await onSubmit(reason);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Report {subjectName}</h2>
                <p className="text-gray-muted dark:text-dark-muted mb-6">Please let us know why you are flagging this {contentType}. Your report will be reviewed by an administrator.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="flag-reason" className="label">Reason</label>
                        <textarea
                            id="flag-reason"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={4}
                            required
                            className="input"
                            placeholder="e.g., This content is spam, offensive, or inappropriate."
                        />
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-danger" disabled={loading || !reason.trim()}>
                            {loading ? <Spinner size="sm" /> : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FlagContentModal;
