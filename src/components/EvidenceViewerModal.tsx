import React from 'react';
import type { DisputeEvidence } from '../types';

interface EvidenceViewerModalProps {
    evidence: DisputeEvidence | null;
    onClose: () => void;
}

const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({ evidence, onClose }) => {
    if (!evidence) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-4xl w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white z-10 bg-white/50 dark:bg-black/50 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="p-4">
                    <img src={evidence.imageUrl} alt="Dispute evidence" className="max-h-[80vh] w-full object-contain rounded-md" />
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-muted dark:text-gray-400">
                            Uploaded by <span className="font-semibold text-slate-dark dark:text-white">{evidence.userName}</span> on {new Date(evidence.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvidenceViewerModal;
