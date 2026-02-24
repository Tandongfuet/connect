

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockGetForumPostById, mockCreateForumReply, mockToggleLike, mockFlagContent } from '../services/mockApi';
import type { ForumPost, ForumReply } from '../types';
import Spinner from '../components/Spinner';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import FlagContentModal from '../components/FlagContentModal';
import ForumThreadSkeleton from '../components/ForumThreadSkeleton';

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


const ForumThreadPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const { user, isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [post, setPost] = useState<ForumPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [flaggingContent, setFlaggingContent] = useState<{ id: string; type: 'post' | 'reply' } | null>(null);

    const fetchData = useCallback(async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const postData = await mockGetForumPostById(postId);
            if (!postData) {
                addToast("Forum post not found.", "error");
                navigate('/community');
            } else {
                setPost(postData);
            }
        } catch (error) {
            addToast("Failed to load post.", "error");
        } finally {
            setLoading(false);
        }
    }, [postId, addToast, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !post || !replyContent.trim()) return;
        
        setIsSubmitting(true);
        try {
            const updatedPost = await mockCreateForumReply(user, post.id, replyContent);
            setPost(updatedPost);
            setReplyContent('');
        } catch (error) {
            addToast("Failed to post reply.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleLike = async (contentId: string, type: 'post' | 'reply') => {
        if (!user) {
            addToast("Please log in to like content.", "info");
            navigate('/login');
            return;
        }
        // Optimistic update
        setPost(prevPost => {
            if (!prevPost) return null;
            let newPost = JSON.parse(JSON.stringify(prevPost)); // Deep copy to avoid mutation issues
            
            const toggle = (likes: string[]) => {
                if (likes.includes(user.id)) return likes.filter(id => id !== user.id);
                return [...likes, user.id];
            };

            if (type === 'post') {
                newPost.likes = toggle(newPost.likes);
            } else {
                const reply = newPost.replies.find((r: ForumReply) => r.id === contentId);
                if (reply) {
                    reply.likes = toggle(reply.likes);
                }
            }
            return newPost;
        });
        await mockToggleLike(user.id, contentId, type);
    };

    const handleFlagSubmit = async (reason: string) => {
        if (!user || !flaggingContent) return;
        await mockFlagContent(user, flaggingContent.id, flaggingContent.type, reason);
        addToast("Content has been flagged for review.", "success");
        setFlaggingContent(null);
        fetchData(); // To show updated flagged state
    };
    
    const ContentActions: React.FC<{ content: ForumPost | ForumReply, type: 'post' | 'reply' }> = ({ content, type }) => (
        <div className="flex items-center gap-4 mt-2">
            <button onClick={() => handleLike(content.id, type)} className={`flex items-center gap-1 text-sm ${content.likes.includes(user?.id || '') ? 'text-primary' : 'text-gray-muted hover:text-primary'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.562 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                {content.likes.length}
            </button>
            <button onClick={() => isAuthenticated ? setFlaggingContent({ id: content.id, type }) : navigate('/login')} className="text-gray-muted hover:text-red-500 text-sm">Flag</button>
        </div>
    );
    
    if (loading) return <ForumThreadSkeleton />;
    if (!post) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <BreadcrumbNavigation paths={[{ name: 'Community', path: '/community' }, { name: 'Forum Post' }]} />
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl overflow-hidden">
                {/* Post */}
                <div className="p-6 border-b dark:border-dark-border">
                    <p className="text-sm text-primary font-semibold">{post.category}</p>
                    <h1 className="text-3xl font-bold text-slate-dark dark:text-white mt-2">{post.title}</h1>
                     <div className="flex items-center gap-3 mt-4">
                        {post.authorProfileImage ? (
                            <img src={post.authorProfileImage} alt={post.authorName} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                             <div
                                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                                style={{ backgroundColor: getColorForName(post.authorName) }}
                            >
                                {getInitials(post.authorName)}
                            </div>
                        )}
                        <div>
                            <Link to={`/user/${post.authorId}`} className="font-semibold text-slate-dark dark:text-gray-200 hover:text-primary">{post.authorName}</Link>
                            <p className="text-xs text-gray-muted dark:text-dark-muted">{new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="mt-4 text-slate-dark dark:text-dark-text whitespace-pre-wrap">{post.content}</p>
                    <ContentActions content={post} type="post" />
                </div>
                
                {/* Replies */}
                <div className="p-6 space-y-6">
                    <h2 className="text-xl font-bold text-slate-dark dark:text-white">{post.replies.length} Replies</h2>
                    {post.replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-4">
                             {reply.authorProfileImage ? (
                                <img src={reply.authorProfileImage} alt={reply.authorName} className="w-10 h-10 rounded-full object-cover mt-1" />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 mt-1"
                                    style={{ backgroundColor: getColorForName(reply.authorName) }}
                                >
                                    {getInitials(reply.authorName)}
                                </div>
                            )}
                             <div className="flex-1">
                                 <div className="bg-secondary dark:bg-dark-border p-3 rounded-lg">
                                    <Link to={`/user/${reply.authorId}`} className="font-semibold text-sm text-slate-dark dark:text-gray-200 hover:text-primary">{reply.authorName}</Link>
                                    <p className="text-sm text-slate-dark dark:text-dark-text mt-1">{reply.content}</p>
                                 </div>
                                  <ContentActions content={reply} type="reply" />
                             </div>
                        </div>
                    ))}
                </div>

                {/* Reply Form */}
                {isAuthenticated ? (
                     <div className="p-6 border-t dark:border-dark-border bg-gray-50 dark:bg-dark-border/50">
                        <h3 className="font-semibold mb-2">Leave a Reply</h3>
                        <form onSubmit={handleReplySubmit}>
                            <textarea
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                rows={4}
                                className="input"
                                placeholder="Share your thoughts..."
                                required
                            />
                            <div className="text-right mt-2">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !replyContent.trim()}>
                                    {isSubmitting ? <Spinner size="sm" /> : 'Post Reply'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="p-6 text-center border-t dark:border-dark-border bg-gray-50 dark:bg-dark-border/50">
                        <p>
                            <button onClick={() => navigate('/login')} className="font-semibold text-primary hover:underline">Log in</button> or <button onClick={() => navigate('/register')} className="font-semibold text-primary hover:underline">sign up</button> to join the conversation.
                        </p>
                    </div>
                )}
            </div>
            
            {flaggingContent && (
                <FlagContentModal
                    isOpen={!!flaggingContent}
                    onClose={() => setFlaggingContent(null)}
                    onSubmit={handleFlagSubmit}
                    contentType={flaggingContent.type}
                    subjectName="this content"
                />
            )}
        </div>
    );
};

export default ForumThreadPage;