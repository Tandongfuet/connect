import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface LiveCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LiveCheckModal: React.FC<LiveCheckModalProps> = ({ isOpen, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<'idle' | 'requesting' | 'streaming' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { addToast } = useToast();

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };
    
    useEffect(() => {
        const startVideo = async () => {
            if (isOpen) {
                setStatus('requesting');
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    setStatus('streaming');
                } catch (err: any) {
                    console.error("Error accessing media devices.", err);
                    setStatus('error');
                    if (err.name === 'NotAllowedError') {
                        setErrorMessage('Camera and microphone access denied. Please enable permissions in your browser settings.');
                    } else {
                        setErrorMessage('Could not access your camera or microphone. Please ensure they are connected and not in use by another application.');
                    }
                    addToast('Could not start video check.', 'error');
                }
            } else {
                stopStream();
                setStatus('idle');
            }
        };

        startVideo();
        
        return () => {
            stopStream();
        };
    }, [isOpen]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-surface p-6 rounded-lg shadow-xl max-w-2xl w-full text-white relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-center">Live Freshness Check</h2>
                <div className="aspect-video bg-black rounded-md overflow-hidden flex justify-center items-center">
                    {status === 'streaming' && (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                    )}
                    {status === 'requesting' && <Spinner size="lg" />}
                    {status === 'error' && <p className="p-4 text-center text-red-400">{errorMessage}</p>}
                </div>
                <div className="mt-4 text-center">
                    <p className="text-dark-muted">Your camera feed is shown above.</p>
                    <p className="font-semibold text-accent">Waiting for seller to join...</p>
                </div>
                 <div className="mt-6 flex justify-center">
                    <button onClick={onClose} className="btn btn-danger">
                        End Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveCheckModal;
