import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getChatContacts, getMessagesBetweenUsers, sendMessage, flagContent, getUserById } from '../services/api';
import type { User, Message } from '../types';
import Spinner from './Spinner';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../contexts/NotificationContext';
import FlagContentModal from './FlagContentModal';
import { useToast } from '../contexts/ToastContext';
import ContactListSkeleton from './ContactListSkeleton';
import MessageFeedSkeleton from './MessageFeedSkeleton';

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
const getColorForName = (name: string) => {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const Avatar: React.FC<{ user: { name: string, profileImage?: string }, className: string, textClassName?: string }> = ({ user, className, textClassName }) => {
    if (user.profileImage) {
        return <img src={user.profileImage} alt={user.name} className={`${className} object-cover`} />;
    }
    return (
        <div
            className={`${className} flex items-center justify-center font-bold text-white ${textClassName}`}
            style={{ backgroundColor: getColorForName(user.name) }}
            aria-label={user.name}
        >
            {getInitials(user.name)}
        </div>
    );
};


const ChatInterface: React.FC<{ isPage?: boolean }> = ({ isPage = false }) => {
    const { user } = useAuth();
    const { contactId: paramContactId } = useParams<{ contactId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { clearNewMessageIndicator } = useNotification();
    const { addToast } = useToast();
    
    const [contacts, setContacts] = useState<User[]>([]);
    const [selectedContact, setSelectedContact] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // New state for reporting
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [flaggingContent, setFlaggingContent] = useState<{ id: string; type: 'user'; name: string } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchContactsAndSelect = async () => {
            if (!user) return;
            setLoadingContacts(true);
            try {
                // 1. Fetch existing contacts
                let contactsData = await getChatContacts(user.id);
                
                // 2. Handle pre-selection from URL parameter
                if (paramContactId) {
                    let preselected = contactsData.find(c => c.id === paramContactId);
                    
                    // 3. If contact is not in existing list, fetch them
                    if (!preselected) {
                        const newContact = await getUserById(paramContactId);
                        if (newContact) {
                            // Add the new contact to the top of the list
                            contactsData = [newContact, ...contactsData];
                            preselected = newContact;
                        }
                    }

                    // 4. Set the selected contact
                    if (preselected) {
                        setSelectedContact(preselected);
                    }
                } else if (contactsData.length > 0) {
                    // Default to first contact if no ID in URL
                    setSelectedContact(contactsData[0]);
                }
                
                setContacts(contactsData);

                // Handle pre-filled message from navigation state
                if (location.state?.prefillMessage) {
                    setNewMessage(location.state.prefillMessage);
                    navigate(location.pathname, { replace: true, state: {} });
                }

            } catch (error) {
                console.error("Failed to fetch contacts", error);
            } finally {
                setLoadingContacts(false);
            }
        };
        fetchContactsAndSelect();
    }, [user, paramContactId, location.state, navigate, location.pathname]);

    const fetchMessages = useCallback(async (isInitialLoad = false) => {
        if (!user || !selectedContact) {
            setMessages([]);
            return;
        }
        clearNewMessageIndicator(); // Clear indicator as soon as user views any chat
        if (isInitialLoad) setLoadingMessages(true);
        try {
            const messagesData = await getMessagesBetweenUsers(user.id, selectedContact.id);
            setMessages(messagesData);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            if (isInitialLoad) setLoadingMessages(false);
        }
    }, [user, selectedContact, clearNewMessageIndicator]);

    // WebSocket integration
    const topic = useMemo(() => {
        if (!user || !selectedContact) return null;
        return `chat_${[user.id, selectedContact.id].sort().join('_')}`;
    }, [user, selectedContact]);

    const handleNewMessage = useCallback((newMessage: Message) => {
        // Only add messages from the other user via WebSocket to prevent duplication
        if (newMessage.senderId !== user?.id) {
            setMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
        }
    }, [user]);

    useWebSocket(topic, handleNewMessage);
    
    useEffect(() => {
        if (selectedContact) {
            fetchMessages(true); // Initial load
            setIsMenuOpen(false); // Close menu when contact changes
        }
    }, [selectedContact, fetchMessages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedContact) return;

        const optimisticMessage: Message = {
            id: `temp_${Date.now()}`,
            senderId: user.id,
            receiverId: selectedContact.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => [...prev, optimisticMessage]);
        const messageToSend = newMessage;
        setNewMessage('');
        
        try {
            const sentMessage = await sendMessage({ senderId: user.id, receiverId: selectedContact.id, content: messageToSend });
            // Replace optimistic message with the real one from the server
            setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? sentMessage : m));
        } catch (error) {
            console.error("Failed to send message", error);
            // If sending fails, remove the optimistic message and restore the input
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(messageToSend);
        }
    };
    
    const handleFlagSubmit = async (reason: string) => {
        if (!user || !flaggingContent) return;
        await flagContent(flaggingContent.id, reason);
        addToast("User has been reported. Our team will review the report.", "success");
        setFlaggingContent(null);
    };

    
    const containerClass = isPage
        ? "h-full flex flex-col"
        : "h-full flex flex-col";

    return (
        <>
            <div className={`bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden ${containerClass}`}>
                <div className="flex flex-1 overflow-hidden">
                    {/* Contacts Sidebar */}
                    <aside className="w-1/3 md:w-1/4 border-r dark:border-dark-border flex flex-col">
                        <div className="p-4 border-b dark:border-dark-border">
                            <h2 className="text-lg font-semibold text-slate-dark dark:text-white">Contacts</h2>
                        </div>
                        {loadingContacts ? <ContactListSkeleton /> : (
                            <ul className="overflow-y-auto flex-1">
                                {contacts.map(contact => (
                                    <li key={contact.id} onClick={() => setSelectedContact(contact)} className={`p-4 cursor-pointer hover:bg-secondary dark:hover:bg-dark-border ${selectedContact?.id === contact.id ? 'bg-primary-light/50 dark:bg-primary/20' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <Avatar user={contact} className="w-10 h-10 rounded-full" textClassName="text-base" />
                                            <div>
                                                <p className="font-semibold text-slate-dark dark:text-dark-text truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-muted dark:text-dark-muted">{contact.role}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>
                    {/* Main Chat Area */}
                    <main className="flex-1 flex flex-col">
                        {selectedContact ? (
                            <>
                                <header className="p-4 border-b dark:border-dark-border flex items-center justify-between gap-3">
                                    <Link to={`/user/${selectedContact.id}`} className="flex items-center gap-3 group">
                                        <Avatar user={selectedContact} className="w-10 h-10 rounded-full" textClassName="text-base" />
                                        <div>
                                            <h3 className="font-semibold text-slate-dark dark:text-white group-hover:text-primary">{selectedContact.name}</h3>
                                            <p className="text-xs text-green-500">Online</p>
                                        </div>
                                    </Link>
                                    <div className="relative" ref={menuRef}>
                                        <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 text-gray-500 hover:text-gray-800 dark:text-dark-muted dark:hover:text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                        </button>
                                        {isMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-md shadow-lg z-10 border dark:border-dark-border animate-fade-in">
                                                <button 
                                                    onClick={() => {
                                                        setFlaggingContent({ id: selectedContact.id, type: 'user', name: selectedContact.name });
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                >
                                                    Report User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </header>
                                {loadingMessages ? <MessageFeedSkeleton /> : (
                                    <div className="flex-1 p-6 overflow-y-auto bg-secondary/50 dark:bg-dark-bg/70">
                                        <div className="flex flex-col gap-4 pb-4">
                                            {messages.map(msg => {
                                                const isSent = msg.senderId === user?.id;
                                                return (
                                                    <div key={msg.id} className={`flex items-end gap-2.5 max-w-lg ${isSent ? 'self-end' : 'self-start'}`}>
                                                        {!isSent && (
                                                            <Avatar user={selectedContact} className="w-8 h-8 rounded-full flex-shrink-0" textClassName="text-xs" />
                                                        )}
                                                        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                                                            <p className="text-xs text-gray-500 dark:text-dark-muted mb-1 px-1">
                                                                {isSent ? 'You' : selectedContact.name}
                                                            </p>
                                                            <div className={`p-3 rounded-xl shadow-md ${isSent ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-dark-surface text-slate-dark dark:text-dark-text rounded-bl-none'}`}>
                                                                <p className="text-sm break-words">{msg.content}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                                <p className="text-xs text-gray-400 dark:text-dark-muted">
                                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                {isSent && (
                                                                    <span title={msg.isRead ? "Read" : "Sent"}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${msg.isRead ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13l4 4L23 7" />
                                                                        </svg>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSent && user && (
                                                             <Avatar user={user} className="w-8 h-8 rounded-full flex-shrink-0" textClassName="text-xs" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                )}
                                <footer className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-surface">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="input flex-1"
                                            autoComplete="off"
                                        />
                                        <button type="submit" className="btn btn-primary">Send</button>
                                    </form>
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                                <p className="text-gray-muted dark:text-dark-muted">Select a contact to start chatting.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {flaggingContent && (
                <FlagContentModal
                    isOpen={!!flaggingContent}
                    onClose={() => setFlaggingContent(null)}
                    onSubmit={handleFlagSubmit}
                    contentType={flaggingContent.type}
                    subjectName={flaggingContent.name}
                />
            )}
        </>
    );
};

export default ChatInterface;