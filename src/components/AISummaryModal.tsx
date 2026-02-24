import React from 'react';
import Spinner from './Spinner';

interface AISummaryModalProps {
    summary: string | null;
    isLoading: boolean;
    onClose: () => void;
}

const AISummaryModal: React.FC<AISummaryModalProps> = ({ summary, isLoading, onClose }) => {
    if (!summary && !isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-2xl max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">✨</span>
                    AI Dispute Summary
                </h2>
                
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <Spinner size="lg" />
                            <p className="text-gray-muted dark:text-dark-muted mt-4">Generating summary with Gemini...</p>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-slate-dark dark:text-dark-text">
                            {summary}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t dark:border-dark-border flex justify-end">
                    <button onClick={onClose} className="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
    );
};

export default AISummaryModal;