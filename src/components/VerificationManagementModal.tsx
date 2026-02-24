import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import Spinner from './Spinner';
import { VerificationTier } from '../constants';
import { mockPerformOcrOnId as performOcrOnId } from '../services/mockApi';

interface VerificationManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (userId: string, newStatus: 'Verified' | 'Rejected', tier: VerificationTier) => Promise<void>;
}

const OCRResult: React.FC<{ result: { nameMatch: boolean, idMatch: boolean, summary: string } | null }> = ({ result }) => {
    if (!result) return null;
    
    const baseClass = "p-3 mb-4 text-sm rounded-md border-l-4";
    let colorClass = "bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
    let icon = "⚠️";

    if (result.summary.includes("failed")) {
        colorClass = "bg-red-50 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200";
        icon = "❌";
    } else if (result.nameMatch && result.idMatch) {
        colorClass = "bg-green-50 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200";
        icon = "✅";
    }

    return (
        <div className={`${baseClass} ${colorClass}`}>
            <p className="font-bold flex items-center gap-2">{icon} AI Verification Check</p>
            <p>{result.summary}</p>
        </div>
    );
};


const VerificationManagementModal: React.FC<VerificationManagementModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState<{ nameMatch: boolean, idMatch: boolean, summary: string } | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            setIsOcrLoading(true);
            setOcrResult(null);
            performOcrOnId(user.id)
                .then(setOcrResult)
                .catch(err => setOcrResult({ nameMatch: false, idMatch: false, summary: "AI check failed. Please review manually." }))
                .finally(() => setIsOcrLoading(false));
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const handleAction = async (action: 'approve' | 'reject') => {
        setLoading(true);
        try {
            if (action === 'approve') {
                const tier = user.businessRegistrationNumber ? VerificationTier.Silver : VerificationTier.Bronze;
                await onSave(user.id, 'Verified', tier);
            } else {
                await onSave(user.id, 'Rejected', VerificationTier.None); // Tier doesn't matter for rejection
            }
            onClose();
        } catch (error) {
            console.error("Failed to update verification status", error);
        } finally {
            setLoading(false);
        }
    };
    
    const DetailItem: React.FC<{ label: string; value: React.ReactNode | undefined }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-gray-muted dark:text-dark-muted">{label}</p>
            <p className="font-semibold text-slate-dark dark:text-dark-text">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-2xl w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Review Verification</h2>
                
                {isOcrLoading && <div className="flex justify-center mb-4"><Spinner /></div>}
                {!isOcrLoading && <OCRResult result={ocrResult} />}

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <DetailItem label="Full Name" value={user.name} />
                    <DetailItem label="Location" value={user.location} />
                    <DetailItem label="National ID Number" value={user.nationalIdNumber} />
                    <DetailItem label="Business Reg. Number" value={user.businessRegistrationNumber} />
                </div>
                <div>
                    <p className="label">Submitted ID Documents</p>
                    <div className="flex gap-4 mt-2">
                        {user.nationalIdImages?.map((img, index) => (
                            <a key={index} href={img} target="_blank" rel="noopener noreferrer">
                                <img src={img} alt={`ID Document ${index + 1}`} className="h-40 w-auto object-contain rounded-md border" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4 border-t pt-6 dark:border-dark-border">
                    <button onClick={onClose} className="btn btn-light" disabled={loading}>Cancel</button>
                    <button onClick={() => handleAction('reject')} className="btn btn-danger" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Reject'}
                    </button>
                    <button onClick={() => handleAction('approve')} className="btn btn-primary" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Approve'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationManagementModal;