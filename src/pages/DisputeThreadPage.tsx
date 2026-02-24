

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useRole } from '../hooks/useRole';
import { getDisputeById, addMessageToDispute, addEvidenceToDispute, resolveDispute, notifyDisputant } from '../services/api';
// AI helpers (network-aware wrappers)
import { generateDisputeSummary, generateDisputeAdvice, generateSupportReply, generateDisputeReplySuggestion } from '../services/api';
import type { Dispute, DisputeConversationItem, DisputeEvidence } from '../types';
import { DisputeStatus, Role } from '../constants';
import Spinner from '../components/Spinner';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import EvidenceViewerModal from '../components/EvidenceViewerModal';
import AISummaryModal from '../components/AISummaryModal';
import ResolutionModal from '../components/ResolutionModal';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageFeedSkeleton from '../components/MessageFeedSkeleton';

// New Modal for AI Advice
const AIDisputeAdviceModal: React.FC<{ advice: string | null; isLoading: boolean; onClose: () => void; }> = ({ advice, isLoading, onClose }) => {
    if (!advice && !isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-2xl max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4 flex items-center gap-2">
                    💡 AI Resolution Advice
                </h2>
                
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <Spinner size="lg" />
                            <p className="text-gray-muted dark:text-dark-muted mt-4">Generating advice with Gemini...</p>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-slate-dark dark:text-dark-text">
                            <p className="text-sm p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-md">
                                <strong>Disclaimer:</strong> This is AI-generated advice and should be used as a suggestion only. It is not a binding resolution.
                            </p>
                            {advice}
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


const DisputeThreadPage: React.FC = () => {
    const { disputeId } = useParams<{ disputeId: string }>();
    const { user } = useAuth();
    const { permissions } = useRole();
    const { addToast } = useToast();

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Evidence state
    const [selectedEvidence, setSelectedEvidence] = useState<DisputeEvidence | null>(null);
    
    // AI Summary State
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    
    // New AI Advice State
    const [isAdviceLoading, setIsAdviceLoading] = useState(false);
    const [advice, setAdvice] = useState<string | null>(null);
    const [isDraftingReply, setIsDraftingReply] = useState(false);
    const [suggestingForTimestamp, setSuggestingForTimestamp] = useState<string | null>(null);
    
    // New state for resolution modal
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
    const [resolutionAction, setResolutionAction] = useState<'Refund Buyer' | 'Release to Seller' | null>(null);


    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchDispute = useCallback(async (isInitialLoad = false) => {
        if (!disputeId) {
            setError('Dispute ID not found.');
            if (isInitialLoad) setLoading(false);
            return;
        }
        if (isInitialLoad) setLoading(true);
        try {
            const data = await getDisputeById(disputeId);
            if (data) {
                setDispute(data);
            } else {
                setError('Dispute not found.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch dispute details.');
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [disputeId]);
    
    const topic = useMemo(() => disputeId ? `dispute_${disputeId}` : null, [disputeId]);
    
    const handleNewDisputeMessage = useCallback((newItem: DisputeConversationItem) => {
        // Only add messages from other users via WebSocket to prevent duplication
        if (newItem.userId !== user?.id) {
            setDispute(prevDispute => {
                if (!prevDispute) return null;
                if (prevDispute.conversation.some(item => item.timestamp === newItem.timestamp && item.userId === newItem.userId)) {
                    return prevDispute;
                }
                return {
                    ...prevDispute,
                    conversation: [...prevDispute.conversation, newItem],
                };
            });
        }
    }, [user]);

    useWebSocket(topic, handleNewDisputeMessage);

    useEffect(() => {
        fetchDispute(true); // Initial load
    }, [fetchDispute]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [dispute?.conversation, dispute?.evidence]);

    const timelineItems = useMemo(() => {
        if (!dispute) return [];

        const conversationItems = dispute.conversation.map(item => ({
            type: item.message.startsWith('[SYSTEM]') ? 'system' as const : 'message' as const,
            timestamp: item.timestamp,
            user: { id: item.userId, name: item.userName, role: item.userRole },
            content: item.message,
            originalItem: item,
        }));

        const evidenceItems = dispute.evidence.map(item => ({
            type: 'evidence' as const,
            timestamp: item.timestamp,
            user: { id: item.userId, name: item.userName, role: item.userRole },
            imageUrl: item.imageUrl,
            content: `${item.userName} uploaded evidence.`,
            originalItem: item,
        }));

        return [...conversationItems, ...evidenceItems].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [dispute]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !dispute) return;

        setIsSubmitting(true);
        const optimisticItem: DisputeConversationItem = {
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            message: newMessage,
            timestamp: new Date().toISOString(),
        };
        setDispute(prev => prev ? { ...prev, conversation: [...prev.conversation, optimisticItem] } : null);
        const messageToSend = newMessage;
        setNewMessage('');
        
        try {
            const updatedDispute = await addMessageToDispute(dispute.id, messageToSend);
            setDispute(updatedDispute);
        } catch (err: any) {
            addToast(err.message || "Failed to send message.", 'error');
            setDispute(prev => prev ? { ...prev, conversation: prev.conversation.filter(item => item !== optimisticItem) } : null);
            setNewMessage(messageToSend);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user && dispute) {
            setIsSubmitting(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const imageUrl = reader.result as string;
                    const updatedDispute = await addEvidenceToDispute(dispute.id, imageUrl);
                    setDispute(updatedDispute);
                    addToast("Evidence uploaded successfully.", "success");
                } catch (err: any) {
                    addToast(err.message || "Failed to upload evidence.", 'error');
                } finally {
                    setIsSubmitting(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleOpenResolutionModal = (action: 'Refund Buyer' | 'Release to Seller') => {
        setResolutionAction(action);
        setIsResolutionModalOpen(true);
    };

    const handleConfirmResolution = async (details: string) => {
        if (!dispute || !resolutionAction || !user) return;
        
        setIsSubmitting(true);
        try {
            const updatedDispute = await resolveDispute(dispute.id, { resolution: resolutionAction, details });
            setDispute(updatedDispute);
            addToast(`Dispute resolved: ${resolutionAction}.`, 'success');
            setIsResolutionModalOpen(false);
            setResolutionAction(null);
        } catch (err: any) {
            addToast(err.message || "Failed to resolve dispute.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleGenerateSummary = async () => {
        if (!dispute) return;
        setIsSummaryLoading(true);
        setSummary(null);
        try {
            const result = await generateDisputeSummary(dispute.id);
            setSummary(result);
        } catch (error: any) {
            addToast(error.message || "Failed to generate AI summary.", 'error');
            setSummary(null); // Clear any previous summary
        } finally {
            setIsSummaryLoading(false);
        }
    };
    
    const handleGenerateAdvice = async () => {
        if (!dispute) return;
        setIsAdviceLoading(true);
        setAdvice(null);
        try {
            const result = await generateDisputeAdvice(dispute.id);
            setAdvice(result);
        } catch (error: any) {
            addToast(error.message || "Failed to generate AI advice.", 'error');
            setAdvice(null);
        } finally {
            setIsAdviceLoading(false);
        }
    };

    const handleDraftReply = async () => {
        if (!dispute) return;
        setIsDraftingReply(true);
        try {
            const draft = await generateSupportReply(dispute.id);
            setNewMessage(draft);
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsDraftingReply(false);
        }
    };
    
    const handleSuggestReply = async (messageToReplyTo: DisputeConversationItem) => {
        if (!dispute) return;
        setSuggestingForTimestamp(messageToReplyTo.timestamp);
        try {
            const suggestion = await generateDisputeReplySuggestion(dispute.id, messageToReplyTo.message);
            setNewMessage(suggestion);
            addToast("AI reply suggestion has been generated.", "success");
        } catch (error: any) {
            addToast(error.message || "Failed to generate reply.", "error");
        } finally {
            setSuggestingForTimestamp(null);
        }
    };

    const handleNotify = async (recipientId: string, recipientName: string) => {
        if (!dispute || !user) return;
        setIsSubmitting(true);
        try {
            const updatedDispute = await notifyDisputant(dispute.id, { message: notification });
            setDispute(updatedDispute);
            addToast(`Notification sent to ${recipientName}.`, 'success');
        } catch (err: any) {
            addToast(err.message || 'Failed to send notification.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) return <MessageFeedSkeleton />;
    if (error) return <div className="text-center p-8 bg-red-50 text-red-700">{error}</div>;
    if (!dispute) return <div className="text-center p-8">Dispute data could not be loaded.</div>;

    const renderTimelineItem = (item: typeof timelineItems[0], index: number) => {
        const isYou = item.user.id === user?.id;
        const isAdminOrSupport = item.user.role === Role.Admin || item.user.role === Role.SupportAgent;
        
        if (item.type === 'system') {
            return (
                <li key={item.timestamp} className="relative flex justify-center items-center gap-4 animate-fade-in">
                    <div className="flex-grow border-t dark:border-dark-border"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic py-2 whitespace-nowrap">{item.content.replace('[SYSTEM] ', '')}</span>
                    <div className="flex-grow border-t dark:border-dark-border"></div>
                </li>
            )
        }
        
        const getIcon = () => {
            switch (item.type) {
                case 'message': return '💬';
                case 'evidence': return '📎';
                default: return '⚙️';
            }
        };

        const cardClasses = isYou
            ? 'bg-primary text-white'
            : isAdminOrSupport
            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800'
            : 'bg-white dark:bg-dark-border';

        return (
             <li key={`${item.timestamp}-${index}`} className="relative flex items-start gap-4 animate-fade-in">
                <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${isYou ? 'bg-primary' : 'bg-gray-300 dark:bg-dark-border'}`}>
                        <span className="text-sm">{getIcon()}</span>
                    </div>
                    {index < timelineItems.length - 1 && <div className="h-full w-0.5 bg-gray-200 dark:bg-dark-border"></div>}
                </div>
                
                <div className="pb-8 flex-grow">
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                        <span className="font-semibold text-slate-dark dark:text-white">{item.user.name}</span>
                        {' - '}
                        {new Date(item.timestamp).toLocaleString()}
                    </p>
                    
                    <div className={`mt-1 p-3 rounded-lg shadow-sm ${cardClasses}`}>
                        {item.type === 'message' && <p className="text-sm whitespace-pre-wrap">{item.content}</p>}
                        {item.type === 'evidence' && (
                            <div className="cursor-pointer" onClick={() => setSelectedEvidence(item.originalItem as DisputeEvidence)}>
                                <p className="text-sm font-semibold mb-2">Evidence Uploaded:</p>
                                <img src={item.imageUrl} alt="Evidence thumbnail" className="max-w-xs max-h-40 rounded-md" />
                            </div>
                        )}
                    </div>

                    {permissions.canManageDisputes && item.type === 'message' && !isAdminOrSupport && dispute.status === DisputeStatus.Open && (
                        <div className="mt-1">
                            <button 
                                onClick={() => handleSuggestReply(item.originalItem as DisputeConversationItem)}
                                className="btn btn-ghost btn-sm text-xs flex items-center gap-1"
                                disabled={suggestingForTimestamp === item.timestamp || isSubmitting}
                            >
                                {suggestingForTimestamp === item.timestamp 
                                    ? <Spinner size="sm" /> 
                                    : <>🤖 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Suggest Reply</span></>
                                }
                            </button>
                        </div>
                    )}
                </div>
            </li>
        );
    };
    
    const isParticipant = user && (user.id === dispute.buyerId || user.id === dispute.sellerId);
    const isBookingDispute = !!dispute.bookingId;

    return (
        <div className="max-w-4xl mx-auto">
            <BreadcrumbNavigation paths={[{ name: 'Dashboard', path: '/dashboard' }, { name: 'Dispute' }]} />
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl overflow-hidden">
                <header className="p-4 bg-gray-50 dark:bg-dark-border border-b dark:border-dark-border/50 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-dark dark:text-white">Dispute Details</h1>
                         <p className="text-sm text-gray-muted dark:text-dark-muted">
                            {isBookingDispute
                                ? `Regarding Booking for "${dispute.booking?.serviceTitle}"`
                                : `Regarding Order #${dispute.orderId?.slice(-6)}`
                            }
                        </p>
                    </div>
                    {permissions.canManageDisputes && (
                        <button onClick={handleGenerateSummary} className="btn btn-secondary" disabled={isSummaryLoading}>
                            {isSummaryLoading ? <Spinner size="sm" /> : '✨ AI Summary'}
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Main Conversation */}
                    <main className="md:col-span-2 flex flex-col h-[70vh] md:h-[80vh]">
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-dark-bg">
                            <ul className="-ml-4">
                                {timelineItems.map(renderTimelineItem)}
                            </ul>
                            <div ref={messagesEndRef} />
                        </div>
                        {dispute.status === DisputeStatus.Open && (
                             <footer className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-surface">
                                <form onSubmit={handleSendMessage}>
                                     {permissions.canManageDisputes && (
                                        <div className="flex justify-end mb-2">
                                            <button type="button" onClick={handleDraftReply} className="btn btn-sm btn-light" disabled={isDraftingReply}>
                                                {isDraftingReply ? <Spinner size="sm" /> : '🤖 AI Draft Reply'}
                                            </button>
                                        </div>
                                     )}
                                     <div className="flex items-center gap-3">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="input flex-1"
                                            disabled={isSubmitting}
                                            rows={3}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-light" disabled={isSubmitting}>Attach</button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newMessage.trim()}>
                                                {isSubmitting ? <Spinner size="sm" /> : 'Send'}
                                            </button>
                                        </div>
                                     </div>
                                </form>
                            </footer>
                        )}
                    </main>

                    {/* Sidebar */}
                    <aside className="md:col-span-1 border-l dark:border-dark-border p-4 space-y-4">
                        <div>
                            <h3 className="font-semibold text-slate-dark dark:text-white">Status</h3>
                            <p className={`font-bold ${dispute.status === 'Open' ? 'text-yellow-600' : 'text-green-600'}`}>{dispute.status}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-dark dark:text-white">Participants</h3>
                            <p className="text-sm text-gray-muted dark:text-dark-muted">Buyer: {dispute.buyerName}</p>
                            <p className="text-sm text-gray-muted dark:text-dark-muted">{isBookingDispute ? 'Provider' : 'Seller'}: {dispute.seller?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-dark dark:text-white">Evidence</h3>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {dispute.evidence.map(e => (
                                    <div key={e.timestamp} className="cursor-pointer" onClick={() => setSelectedEvidence(e)}>
                                        <img src={e.imageUrl} alt="Evidence" className="w-full h-16 object-cover rounded hover:opacity-75" />
                                    </div>
                                ))}
                                {dispute.evidence.length === 0 && <p className="text-xs text-gray-muted dark:text-dark-muted col-span-3">No evidence uploaded.</p>}
                            </div>
                        </div>
                        {dispute.status !== 'Open' && dispute.resolutionDetails && (
                            <div>
                                <h3 className="font-semibold text-slate-dark dark:text-white">Resolution</h3>
                                <p className="text-sm p-2 bg-gray-100 dark:bg-dark-border rounded mt-1">{dispute.resolutionDetails}</p>
                            </div>
                        )}
                        
                        {/* Participant AI Advice */}
                        {isParticipant && dispute.status === 'Open' && (
                             <div className="border-t dark:border-dark-border pt-4">
                                <button onClick={handleGenerateAdvice} className="btn btn-light w-full" disabled={isAdviceLoading}>
                                     {isAdviceLoading ? <Spinner size="sm" /> : '💡 Get AI Advice'}
                                </button>
                            </div>
                        )}

                        {permissions.canManageDisputes && dispute.status === 'Open' && (
                             <div className="border-t dark:border-dark-border pt-4 space-y-2">
                                 <h3 className="font-semibold text-slate-dark dark:text-white">Admin Actions</h3>
                                  <div className="space-y-2">
                                    <button onClick={() => handleNotify(dispute.buyerId, dispute.buyerName)} className="btn btn-secondary w-full" disabled={isSubmitting}>Notify Buyer</button>
                                    <button onClick={() => handleNotify(dispute.sellerId, dispute.seller?.name || 'Seller')} className="btn btn-secondary w-full" disabled={isSubmitting}>Notify Seller</button>
                                 </div>
                                 <div className="flex gap-2 pt-2">
                                    <button onClick={() => handleOpenResolutionModal('Refund Buyer')} className="btn btn-danger w-full">Refund</button>
                                    <button onClick={() => handleOpenResolutionModal('Release to Seller')} className="btn btn-primary w-full">Release</button>
                                 </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
             <EvidenceViewerModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
             <AISummaryModal summary={summary} isLoading={isSummaryLoading} onClose={() => setSummary(null)} />
             <AIDisputeAdviceModal advice={advice} isLoading={isAdviceLoading} onClose={() => setAdvice(null)} />
             {resolutionAction && (
                <ResolutionModal
                    isOpen={isResolutionModalOpen}
                    onClose={() => setIsResolutionModalOpen(false)}
                    onSubmit={handleConfirmResolution}
                    action={resolutionAction}
                />
             )}
        </div>
    );
};

export default DisputeThreadPage;