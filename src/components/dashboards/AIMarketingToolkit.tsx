import React, { useState } from 'react';
import { generateMarketingText } from '../../services/api';
import Spinner from '../Spinner';
import { useToast } from '../../contexts/ToastContext';

const AIMarketingToolkit: React.FC = () => {
    const [productName, setProductName] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleGenerate = async (type: 'description' | 'promo') => {
        if (!productName.trim()) {
            addToast('Please enter a product or service name first.', 'info');
            return;
        }
        setLoading(true);
        setGeneratedText('');
        try {
            const text = await generateMarketingText(productName, type);
            setGeneratedText(text);
        } catch (error: any) {
            addToast(error.message || 'Failed to generate text.', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedText) return;
        navigator.clipboard.writeText(generatedText);
        addToast('Text copied to clipboard!', 'success');
    };

    return (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-lg border border-teal-200 dark:border-teal-800">
            <h3 className="font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2 text-lg">
                <span className="text-2xl">✍️</span>
                AI Marketing Toolkit
            </h3>
            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor="product-name-input" className="label text-sm">Product or Service Name</label>
                    <input
                        id="product-name-input"
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Fresh Irish Potatoes"
                        className="input"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleGenerate('description')} className="btn btn-secondary" disabled={loading}>
                        Generate Engaging Description
                    </button>
                    <button onClick={() => handleGenerate('promo')} className="btn btn-secondary" disabled={loading}>
                        Write WhatsApp Promo
                    </button>
                </div>

                {(loading || generatedText) && (
                    <div className="mt-4 pt-4 border-t dark:border-teal-800">
                        {loading ? (
                            <div className="flex items-center justify-center h-24">
                                <Spinner />
                            </div>
                        ) : (
                            <div className="relative animate-fade-in">
                                <pre className="bg-white dark:bg-dark-surface p-4 rounded-md text-sm whitespace-pre-wrap font-sans text-slate-dark dark:text-dark-text">
                                    {generatedText}
                                </pre>
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 btn btn-ghost btn-sm"
                                    aria-label="Copy text"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIMarketingToolkit;