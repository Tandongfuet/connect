
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockCreateForumPost } from '../services/mockApi';
import Spinner from './Spinner';

interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

const CATEGORIES = ['Farming Tips & Techniques', 'Pest & Disease Control', 'Market Prices & Trends', 'Recipe Sharing', 'General Discussion'];

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            await mockCreateForumPost(user, title, content, category);
            addToast("Your post has been published!", "success");
            onPostCreated();
            onClose();
        } catch (error) {
            addToast("Failed to create post.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-6">Create New Forum Post</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="post-title" className="label">Title</label>
                        <input id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                     <div>
                        <label htmlFor="post-category" className="label">Category</label>
                        <select id="post-category" value={category} onChange={e => setCategory(e.target.value)} className="input">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="post-content" className="label">Content</label>
                        <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} rows={6} required className="input" />
                    </div>
                     <div className="flex justify-end gap-4 pt-4 border-t dark:border-dark-border">
                        <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !title || !content}>
                            {loading ? <Spinner size="sm" /> : 'Publish Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewPostModal;
