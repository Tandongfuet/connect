import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { mockGenerateListingVideo as generateListingVideo } from '../services/mockApi';
import Spinner from './Spinner';
import type { Listing } from '../types';

interface GenerateVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: Listing | null;
    onSuccess: () => void;
}

const GENERATION_MESSAGES = [
    "Analyzing listing images...",
    "Storyboarding key scenes...",
    "Drafting video script...",
    "Generating video frames (this can take a minute)...",
    "Applying visual effects...",
    "Rendering final video...",
    "Almost there! Polishing the final cut...",
];

const GenerateVideoModal: React.FC<GenerateVideoModalProps> = ({ isOpen, onClose, listing, onSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [currentMessage, setCurrentMessage] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen && listing) {
            setPrompt(`A short, engaging promotional video for "${listing.title}". Highlight its freshness and quality.`);
            setStatus('idle');
            setVideoUrl('');
        }
    }, [isOpen, listing]);

    useEffect(() => {
        let interval: ReturnType<typeof setTimeout> | null = null;
        if (status === 'generating') {
            setCurrentMessage(GENERATION_MESSAGES[0]);
            let i = 1;
            interval = setInterval(() => {
                setCurrentMessage(GENERATION_MESSAGES[i % GENERATION_MESSAGES.length]);
                i++;
            }, 4000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);
    
    if (!isOpen || !listing) return null;

    const handleGenerate = async () => {
        setStatus('generating');
        try {
            const url = await generateListingVideo(listing.id, prompt);
            setVideoUrl(url);
            setStatus('success');
            addToast("Promotional video generated successfully!", "success");
            onSuccess(); // Refresh dashboard data
        } catch (error: any) {
            setStatus('error');
            addToast(error.message || "Failed to generate video.", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Generate Promotional Video</h2>

                {status === 'idle' && (
                    <div className="space-y-4">
                        <p className="text-gray-muted dark:text-dark-muted">Generate a short video for <span className="font-semibold">{listing.title}</span> using AI.</p>
                        <div>
                            <label htmlFor="video-prompt" className="label">Video Prompt</label>
                            <textarea id="video-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="input" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={onClose} className="btn btn-light">Cancel</button>
                            <button onClick={handleGenerate} className="btn btn-primary">Generate Video</button>
                        </div>
                    </div>
                )}
                
                {status === 'generating' && (
                    <div className="text-center py-8">
                        <Spinner size="lg" />
                        <p className="mt-4 text-slate-dark dark:text-white font-semibold">Generating your video...</p>
                        <p className="text-gray-muted dark:text-dark-muted mt-2 animate-fade-in">{currentMessage}</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="space-y-4">
                        <video src={videoUrl} controls autoPlay className="w-full rounded-md" />
                        <div className="flex justify-end pt-4">
                            <button onClick={onClose} className="btn btn-primary">Done</button>
                        </div>
                    </div>
                )}
                
                 {status === 'error' && (
                    <div className="text-center py-8">
                        <p className="text-red-600">Something went wrong while generating the video. Please try again later.</p>
                         <div className="flex justify-center gap-3 pt-4">
                            <button onClick={onClose} className="btn btn-light">Close</button>
                            <button onClick={handleGenerate} className="btn btn-primary">Retry</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GenerateVideoModal;