import React, { useState } from 'react';
import Spinner from './Spinner';

interface ResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (details: string) => Promise<void>;
    action: 'Refund Buyer' | 'Release to Seller';
}

const ResolutionModal: React.FC<ResolutionModalProps> = ({ isOpen, onClose, onSubmit, action }) => {
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(details);
        setLoading(false);
    };
    
    const confirmButtonClass = action === 'Refund Buyer' ? 'btn-danger' : 'btn-primary';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-dark-text mb-4">Confirm Resolution: {action}</h2>
                <p className="text-gray-muted dark:text-dark-muted mb-6">Please provide a reason for this resolution. These notes will be visible to both parties.</p>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="resolution-details" className="label">Resolution Notes</label>
                        <textarea
                            id="resolution-details"
                            rows={4}
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            className="input"
                            placeholder="e.g., After reviewing the evidence, we found that..."
                            required
                        />
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className={`btn ${confirmButtonClass}`} disabled={loading || !details.trim()}>
                            {loading ? <Spinner size="sm" /> : `Confirm ${action}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResolutionModal;