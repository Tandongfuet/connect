import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { mockGetAgroBotResponse as getAgroBotResponse } from '../services/mockApi';
import Spinner from './Spinner';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import BrandIcon from './BrandIcon';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    sources?: { title: string; uri: string }[];
}
interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
}
export interface AgroBotRef {
    sendMessage: (message: string) => void;
    clearMessages: () => void;
}
interface AgroBotProps {
    isOpen?: boolean;
    onClose?: () => void;
    context?: string;
    mode?: 'panel' | 'embedded';
}

const smartActions = [
    { text: "Predict harvest yield", icon: "🌾" },
    { text: "Create a farm image", icon: "🎨" },
    { text: "Take agro quiz", icon: "❓" },
    { text: "Find buyers near me", icon: "🤝" },
];

const quickReplies = [
    "What's in season?",
    "How do I verify my account?",
    "Explain tiered pricing.",
];

const AgroBot = forwardRef<AgroBotRef, AgroBotProps>(({ isOpen, onClose, context = 'dashboard', mode = 'panel' }, ref) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const storageKey = useMemo(() => user ? `agroconnect_agrobot_history_${user.id}` : null, [user]);

    const createNewConversation = (userName: string | null): Conversation => ({
        id: `convo_${Date.now()}`,
        title: "New Chat",
        messages: [{
            role: 'model',
            content: `Oh hey ${userName || 'there'}, welcome to AgroConnect!\nHow can I help you today?`
        }]
    });

    const [conversations, setConversations] = useState<Conversation[]>(() => [createNewConversation(user?.name || null)]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(conversations[0].id);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    useEffect(() => {
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved) as Conversation[];
                    if (parsed.length > 0) {
                        setConversations(parsed);
                        setActiveConversationId(parsed[0].id);
                        return;
                    }
                }
            } catch (error) { console.error("Failed to load AgroBot history", error); }
        }
        // If no saved history or not logged in, start fresh
        const newConvo = createNewConversation(user?.name || null);
        setConversations([newConvo]);
        setActiveConversationId(newConvo.id);
    }, [user, storageKey]);

    useEffect(() => {
        if (storageKey && conversations.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(conversations));
        }
    }, [conversations, storageKey]);

    const activeConversation = useMemo(() => {
        return conversations.find(c => c.id === activeConversationId);
    }, [conversations, activeConversationId]);

    const sendMessage = async (messageContent: string) => {
        if (!messageContent.trim() || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', content: messageContent };
        
        setConversations(prev => {
            const newTitle = activeConversation?.title === 'New Chat' 
                ? messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '')
                : activeConversation?.title;

            return prev.map(convo => 
                convo.id === activeConversationId 
                    ? { ...convo, messages: [...convo.messages, userMessage], title: newTitle || 'Chat' } 
                    : convo
            );
        });

        setInput('');
        setIsLoading(true);

        try {
            const { text, sources } = await getAgroBotResponse(messageContent, context, useWebSearch);
            const modelMessage: ChatMessage = { role: 'model', content: text, sources };
            setConversations(prev => prev.map(convo => 
                convo.id === activeConversationId ? { ...convo, messages: [...convo.messages, modelMessage] } : convo
            ));
        } catch (error: any) {
            const errorMessage: ChatMessage = { role: 'model', content: `Sorry, I encountered an error: ${error.message}` };
            setConversations(prev => prev.map(convo => 
                convo.id === activeConversationId ? { ...convo, messages: [...convo.messages, errorMessage] } : convo
            ));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewChat = () => {
        const newConvo = createNewConversation(user?.name || null);
        setConversations(prev => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        setIsSidebarOpen(false); // Close sidebar on mobile after action
    };

    useImperativeHandle(ref, () => ({
        sendMessage,
        clearMessages: handleNewChat
    }));

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages]);

    const Sidebar = () => (
         <aside className={`absolute md:relative top-0 left-0 h-full z-20 md:z-auto w-4/5 md:w-1/3 bg-gray-50 dark:bg-dark-surface border-r dark:border-dark-border flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-3 border-b dark:border-dark-border flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <BrandIcon className="h-8 w-8 text-primary" />
                    <span className="font-bold text-primary">AgroConnect</span>
                </Link>
                <div className="flex items-center gap-1">
                     <button className="p-2 text-gray-500 hover:text-primary dark:hover:text-white" aria-label="Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                    <button onClick={handleNewChat} className="p-2 text-gray-500 hover:text-primary dark:hover:text-white" aria-label="New Chat">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map(convo => (
                    <div key={convo.id} onClick={() => { setActiveConversationId(convo.id); setIsSidebarOpen(false); }} className={`p-3 m-2 rounded-md cursor-pointer ${activeConversationId === convo.id ? 'bg-primary-light/50 dark:bg-primary/20' : 'hover:bg-gray-200 dark:hover:bg-dark-border'}`}>
                        <p className="text-sm font-medium text-slate-dark dark:text-dark-text truncate">{convo.title}</p>
                    </div>
                ))}
            </div>
        </aside>
    );

    const isNewChat = activeConversation?.messages.length === 1;

    const ChatInterface = (
        <main className="flex-1 flex flex-col bg-gray-100 dark:bg-dark-bg">
             <header className="p-3 border-b dark:border-dark-border flex justify-between items-center bg-white dark:bg-dark-surface flex-shrink-0">
                <div className="flex items-center gap-2">
                     {mode === 'panel' && <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:text-primary dark:hover:text-white md:hidden" aria-label="Open sidebar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </button>}
                    <h2 className="font-semibold text-slate-dark dark:text-white truncate">{activeConversation?.title || "AgroBot"}</h2>
                </div>
                {onClose && <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl" aria-label="Close AgroBot">&times;</button>}
            </header>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                {!isAuthenticated ? (
                     <div className="text-center p-8 bg-white dark:bg-dark-surface rounded-lg shadow-md h-full flex flex-col justify-center">
                        <p className="text-lg">Please <button onClick={() => { navigate('/login'); onClose && onClose(); }} className="font-semibold text-primary hover:underline">log in</button> to chat with AgroBot.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {isNewChat && (
                            <div className="text-center animate-fade-in">
                                <p className="text-lg font-semibold text-slate-dark dark:text-white whitespace-pre-wrap">{activeConversation?.messages[0].content}</p>
                                <div className="grid grid-cols-2 gap-3 mt-8 max-w-md mx-auto">
                                    {smartActions.map(action => (
                                        <button key={action.text} onClick={() => sendMessage(action.text)} className="p-3 bg-white dark:bg-dark-surface rounded-lg shadow hover:shadow-md transition-shadow text-left flex items-center gap-3">
                                            <span className="text-2xl">{action.icon}</span>
                                            <span className="font-medium text-sm text-slate-dark dark:text-white">{action.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!isNewChat && activeConversation?.messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <span className="text-2xl flex-shrink-0 pt-1">🤖</span>}
                                <div className={`max-w-xl p-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-dark-surface text-slate-dark dark:text-dark-text rounded-bl-none'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3"><span className="text-2xl pt-1">🤖</span><div className="p-3 rounded-lg bg-white dark:bg-dark-surface"><Spinner size="sm" /></div></div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
             {isAuthenticated && (
                <div className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-surface/50">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
                        <div className="flex items-center gap-2">
                            <button type="button" className="btn btn-ghost" aria-label="Attach file">📎</button>
                            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Message AgroBot..." className="input flex-1" disabled={isLoading} />
                            <button type="submit" className="btn btn-primary" disabled={isLoading || !input.trim()}>➤</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {quickReplies.map(reply => (
                                <button key={reply} type="button" onClick={() => sendMessage(reply)} className="btn btn-sm btn-secondary">{reply}</button>
                            ))}
                        </div>
                    </form>
                </div>
            )}
        </main>
    );

    if (mode === 'embedded') {
        return (
             <div className="h-full w-full flex flex-col bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
                {ChatInterface}
            </div>
        );
    }

    return (
        <>
            <div className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'opacity-0 pointer-events-none'}`} onClick={onClose} aria-hidden="true" />
            <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white dark:bg-dark-surface shadow-2xl flex z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <Sidebar />
                {ChatInterface}
            </div>
        </>
    );
});

export default AgroBot;