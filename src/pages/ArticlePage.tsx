
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockGetArticleById, mockToggleSaveArticle, mockAskAboutArticle as apiAskAboutArticle } from '../services/mockApi';
import type { Article } from '../types';
import Spinner from '../components/Spinner';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import ArticleQABot from '../components/ArticleQABot';

const ArticlePage: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const { user, isAuthenticated, updateUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (user && article) {
            setIsSaved(user.savedArticleIds?.includes(article.id) || false);
        }
    }, [user, article]);

    useEffect(() => {
        const fetchData = async () => {
            if (!articleId) return;
            setLoading(true);
            try {
                const data = await mockGetArticleById(articleId);
                if (!data) {
                    addToast("Article not found.", "error");
                    navigate('/community');
                } else {
                    setArticle(data);
                }
            } catch (error) {
                addToast("Failed to load article.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [articleId, addToast, navigate]);

    const handleToggleSave = async () => {
        if (!isAuthenticated || !user || !article) {
            addToast("Please log in to save articles.", "info");
            navigate('/login');
            return;
        }
        
        // Optimistic update
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        
        const currentSaved = user.savedArticleIds || [];
        const updatedSavedIds = newSavedState
            ? [...currentSaved, article.id]
            : currentSaved.filter(id => id !== article.id);
        updateUser({ savedArticleIds: updatedSavedIds });

        try {
            await mockToggleSaveArticle(user.id, article.id);
            addToast(newSavedState ? "Article saved!" : "Article removed from saved.", "success");
        } catch (error) {
            addToast("Failed to update saved articles.", "error");
            // Revert on error
            setIsSaved(!newSavedState);
            updateUser({ savedArticleIds: currentSaved });
        }
    };
    
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast("Article link copied to clipboard!", "success");
    };

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    if (!article) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <BreadcrumbNavigation paths={[{ name: 'Community', path: '/community' }, { name: 'Article' }]} />
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl overflow-hidden">
                <img src={article.featuredImage} alt={article.title} className="w-full h-96 object-cover" loading="lazy" decoding="async" />
                <div className="p-8">
                    <p className="text-primary font-semibold">{article.category}</p>
                    <h1 className="text-4xl font-bold text-slate-dark dark:text-white mt-2">{article.title}</h1>
                    <div className="text-sm text-gray-muted dark:text-dark-muted mt-4">
                        By {article.authorName} on {new Date(article.createdAt).toLocaleDateString()}
                    </div>
                    
                     <div className="flex items-center gap-4 mt-6 py-4 border-y dark:border-dark-border">
                        <button onClick={handleToggleSave} className="btn btn-light flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 19V5z" />
                            </svg>
                            {isSaved ? 'Saved' : 'Save Article'}
                        </button>
                        <button onClick={handleShare} className="btn btn-secondary flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                            Share
                        </button>
                    </div>

                    <div className="prose dark:prose-invert max-w-none mt-8 text-slate-dark dark:text-dark-text">
                        {article.content.split('\n\n').map((paragraph, index) => {
                            if (paragraph.startsWith('### ')) {
                                return <h3 key={index} className="text-xl font-semibold mt-6 mb-2">{paragraph.substring(4)}</h3>
                            }
                            if (paragraph.startsWith('- ')) {
                                 return <ul key={index} className="list-disc list-inside space-y-2 my-4">
                                     {paragraph.split('\n').map((item, i) => <li key={i}>{item.substring(2)}</li>)}
                                 </ul>
                            }
                            return <p key={index}>{paragraph}</p>
                        })}
                    </div>

                    <div className="mt-12 pt-8 border-t dark:border-dark-border">
                        <ArticleQABot articleContent={article.content} articleTitle={article.title} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticlePage;
