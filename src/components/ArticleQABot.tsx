import React, { useState, useRef, useEffect } from 'react';
import { apiAskAboutArticle } from '../services/api';
import Spinner from './Spinner';

interface ArticleQABotProps {
    articleContent: string;
    articleTitle: string;
}

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const ArticleQABot: React.FC<ArticleQABotProps> = ({ articleContent, articleTitle }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: `Hi! I'm ready to answer your questions about "${articleTitle}". What would you like to know?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const question = input;
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await apiAskAboutArticle(articleContent, question);
            const modelMessage: ChatMessage = { role: 'model', content: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error: any) {
            const errorMessage: ChatMessage = { role: 'model', content: `Sorry, I encountered an error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-secondary dark:bg-dark-border/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-slate-dark dark:text-white mb-4 flex items-center gap-2">
                🤖 Ask AI About This Article
            </h3>
            <div className="bg-white dark:bg-dark-surface rounded-md p-4 h-64 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <span className="text-xl flex-shrink-0 pt-1">🤖</span>}
                        <div className={`max-w-md p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-dark-border text-slate-dark dark:text-dark-text'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 pt-1">🤖</span>
                        <div className="max-w-md p-3 rounded-lg bg-gray-100 dark:bg-dark-border">
                            <Spinner size="sm" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="e.g., What is the best season for planting?"
                    className="input flex-1"
                    disabled={isLoading}
                />
                <button type="submit" className="btn btn-primary" disabled={isLoading || !input.trim()}>
                    Ask
                </button>
            </form>
        </div>
    );
};

export default ArticleQABot;