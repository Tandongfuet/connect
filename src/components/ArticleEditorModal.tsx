import React, { useState, useEffect } from 'react';
import type { Article } from '../types';
import Spinner from './Spinner';
import { useToast } from '../contexts/ToastContext';
import { apiGenerateArticleContent } from '../services/api';

interface ArticleEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    article: Article | null;
    onSave: (articleData: any) => Promise<void>;
}

const CATEGORIES = ['Farming Tips & Techniques', 'Pest & Disease Control', 'Financial Literacy', 'Marketplace Tips', 'AgroBot FAQs'];

const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({ isOpen, onClose, article, onSave }) => {
    const isEditing = !!article;
    const [formData, setFormData] = useState({
        title: '',
        category: CATEGORIES[0],
        featuredImage: '',
        content: '',
        tags: '',
    });
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();
    
    // AI state
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            if (isEditing && article) {
                setFormData({
                    title: article.title,
                    category: article.category,
                    featuredImage: article.featuredImage,
                    content: article.content,
                    tags: article.tags.join(', '),
                });
            } else {
                setFormData({ title: '', category: CATEGORIES[0], featuredImage: '', content: '', tags: '' });
            }
            setAiPrompt(''); // Reset AI prompt on open
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isEditing, article, onClose]);


    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 5;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            addToast(`Image is too large. Max size is ${MAX_SIZE_MB}MB.`, 'error');
            return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            addToast('Invalid file type. Please upload a JPG or PNG.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, featuredImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };
    
    const handleGenerateContent = async () => {
        setIsAiGenerating(true);
        try {
            const content = await apiGenerateArticleContent(aiPrompt);
            setFormData(prev => ({ ...prev, content }));
            addToast("AI has generated the article content!", "success");
        } catch (error: any) {
            addToast(error.message || "Failed to generate content.", "error");
        } finally {
            setIsAiGenerating(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const articleData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            };
            await onSave(articleData);
        } catch (error) {
            addToast("Failed to save article.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-6">{isEditing ? 'Edit Article' : 'Create New Article'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                     <div>
                        <label htmlFor="title" className="label">Title</label>
                        <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="category" className="label">Category</label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} className="input">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="featuredImageFile" className="label">Featured Image</label>
                        <input id="featuredImageFile" name="featuredImageFile" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" className="input" />
                        {formData.featuredImage && (
                            <div className="mt-4">
                                <img src={formData.featuredImage} alt="Preview" className="max-h-40 rounded-lg shadow-md" />
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 space-y-4">
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">✨</span>
                            AI Content Generation
                        </h3>
                        <div>
                            <label htmlFor="ai-prompt" className="label text-sm">Article Topic or Prompt</label>
                            <div className="flex gap-2">
                                <input 
                                    id="ai-prompt" 
                                    type="text" 
                                    value={aiPrompt} 
                                    onChange={e => setAiPrompt(e.target.value)} 
                                    placeholder="e.g., Best practices for irrigating maize"
                                    className="input flex-grow"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleGenerateContent} 
                                    className="btn btn-primary" 
                                    disabled={isAiGenerating || !aiPrompt.trim()}
                                    style={{backgroundColor: '#6b21a8'}}
                                >
                                    {isAiGenerating ? <Spinner size="sm" /> : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>

                     <div>
                        <label htmlFor="content" className="label">Content (Markdown supported)</label>
                        <textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={10} required className="input" />
                    </div>
                    <div>
                        <label htmlFor="tags" className="label">Tags (comma-separated)</label>
                        <input id="tags" name="tags" type="text" value={formData.tags} onChange={handleChange} placeholder="e.g., irrigation, organic, tips" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-surface py-4 -mx-8 px-8">
                        <button type="button" onClick={onClose} className="btn btn-light" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : (isEditing ? 'Save Changes' : 'Publish Article')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArticleEditorModal;