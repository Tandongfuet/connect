

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getForumPosts, getArticles } from '../services/api';
import type { ForumPost, Article } from '../types';
import Spinner from '../components/Spinner';
import NewPostModal from '../components/NewPostModal';
import AgroBot, { type AgroBotRef } from '../components/AgroBot';
import { useLanguage } from '../contexts/LanguageContext';
import CommunityPageSkeleton from '../components/CommunityPageSkeleton';

const EventsList = lazy(() => import('../components/community/EventsList'));

type Tab = 'forum' | 'hub' | 'agrobot' | 'events';
const FORUM_CATEGORIES = ['All', 'Crop Advice', 'Market Trends', 'Pest Control', 'Logistics', 'General'];
const HUB_CATEGORIES = ['All', 'Farming Techniques', 'Pest Management', 'Financial Literacy', 'Marketplace Tips', 'AgroBot FAQs'];
const AGROBOT_QUICK_TOPICS = [
    "Best crops for rainy season",
    "How to treat cassava mosaic",
    "How does escrow work?",
    "Tips for writing better product listings",
];

// Helper functions for avatar fallback
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


const CommunityPage: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('forum');
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

    // Filters & Refs
    const [selectedForumCategory, setSelectedForumCategory] = useState('All');
    const [selectedHubCategory, setSelectedHubCategory] = useState('All');
    const [hubSearchTerm, setHubSearchTerm] = useState('');
    const agroBotRef = useRef<AgroBotRef>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [postsData, articlesData] = await Promise.all([
                getForumPosts(),
                getArticles()
            ]);
            setPosts(postsData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setArticles(articlesData);
        } catch (error) {
            addToast("Failed to load community content.", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleNewPostClick = () => {
        if (!isAuthenticated) {
            addToast("Please log in to create a new post.", "info");
            navigate('/login');
        } else {
            setIsNewPostModalOpen(true);
        }
    };
    
    // --- Sidebar Components ---
    const ForumSidebar = () => (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-slate-dark dark:text-white mb-3">Categories</h3>
            <div className="space-y-1">
                {FORUM_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSelectedForumCategory(cat)} className={`w-full text-left p-2 rounded-md text-sm ${selectedForumCategory === cat ? 'bg-primary text-white font-semibold' : 'text-slate-dark dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-border'}`}>
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
    
    const HubSidebar = () => (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md space-y-4">
            <div>
                <label htmlFor="hub-search" className="label text-sm">{t('search')}</label>
                <input id="hub-search" type="search" placeholder="Search articles..." value={hubSearchTerm} onChange={e => setHubSearchTerm(e.target.value)} className="input" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-dark dark:text-white mb-3">Categories</h3>
                <div className="space-y-1">
                    {HUB_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setSelectedHubCategory(cat)} className={`w-full text-left p-2 rounded-md text-sm ${selectedHubCategory === cat ? 'bg-primary text-white font-semibold' : 'text-slate-dark dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-border'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const AgroBotSidebar = () => (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md space-y-4">
            <div>
                <h3 className="font-semibold text-slate-dark dark:text-white mb-3">Quick Actions</h3>
                 <button onClick={() => agroBotRef.current?.clearMessages()} className="btn btn-secondary w-full mb-4">
                    New Chat
                </button>
            </div>
            <div>
                <h3 className="font-semibold text-slate-dark dark:text-white mb-3">Quick Topics</h3>
                <div className="space-y-2">
                    {AGROBOT_QUICK_TOPICS.map(topic => (
                        <button key={topic} onClick={() => agroBotRef.current?.sendMessage(topic)} className="w-full text-left p-2 rounded-md text-sm text-primary hover:bg-secondary dark:hover:bg-dark-border">
                            {topic}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- Main Content Components ---
    const filteredPosts = useMemo(() => {
        if (selectedForumCategory === 'All') return posts;
        return posts.filter(p => p.category === selectedForumCategory);
    }, [posts, selectedForumCategory]);

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const categoryMatch = selectedHubCategory === 'All' || article.category === selectedHubCategory;
            const searchMatch = hubSearchTerm.trim() === '' || 
                                article.title.toLowerCase().includes(hubSearchTerm.toLowerCase()) ||
                                article.tags.some(tag => tag.toLowerCase().includes(hubSearchTerm.toLowerCase()));
            return categoryMatch && searchMatch;
        });
    }, [articles, selectedHubCategory, hubSearchTerm]);

    const ForumFeed = () => (
        <div className="space-y-4">
             <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-slate-dark dark:text-white">👋 Welcome to the AgroConnect Community Forum!</h2>
                <p className="text-gray-muted dark:text-dark-muted mt-1 text-sm">Ask questions, share experiences, and connect with others.</p>
            </div>
            {filteredPosts.map(post => (
                <Link to={`/community/forum/${post.id}`} key={post.id} className="block bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                     <div className="flex justify-between items-start">
                         <h3 className="text-xl font-bold text-slate-dark dark:text-white">{post.title}</h3>
                         <div className="text-right text-sm text-gray-muted dark:text-dark-muted flex-shrink-0 ml-4">
                             <p>{post.replies.length} replies</p>
                            <p>{post.likes.length} likes</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3 mt-3 pt-3 border-t dark:border-dark-border">
                        {post.authorProfileImage ? (
                            <img src={post.authorProfileImage} alt={post.authorName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                                style={{ backgroundColor: getColorForName(post.authorName) }}
                            >
                                {getInitials(post.authorName)}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold">{post.authorName}</p>
                            <p className="text-xs text-gray-muted">{new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
    
    const HubContent = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-slate-dark dark:text-white">📚 Learn & Grow with AgroConnect!</h2>
                <p className="text-gray-muted dark:text-dark-muted mt-1 text-sm">Explore practical guides and marketplace tips tailored for Cameroonian agriculture.</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArticles.map(article => (
                    <Link to={`/community/hub/${article.id}`} key={article.id} className="group border rounded-lg shadow-sm bg-white dark:bg-dark-surface dark:border-dark-border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                         <div className="relative"><img src={article.featuredImage} alt={article.title} className="w-full h-48 object-cover" loading="lazy" /></div>
                         <div className="p-4 flex flex-col flex-grow">
                             <p className="text-sm text-primary font-semibold">{article.category}</p>
                             <h3 className="text-lg font-bold text-slate-dark dark:text-dark-text mt-1 flex-grow group-hover:text-primary transition-colors">{article.title}</h3>
                             <div className="mt-4 pt-4 border-t dark:border-dark-border text-xs text-gray-muted dark:text-dark-muted">By {article.authorName} on {new Date(article.createdAt).toLocaleDateString()}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
    
    // --- Main Render ---
    const TabButton: React.FC<{ tab: Tab, label: string, icon: string }> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-base font-semibold border-b-2 transition-colors ${
                activeTab === tab 
                ? 'text-primary border-primary' 
                : 'text-gray-muted dark:text-dark-muted border-transparent hover:text-slate-dark dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
            }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-dark dark:text-dark-text">{t('communityTitle')}</h1>
                    <p className="text-gray-muted dark:text-dark-muted mt-1">{t('communitySubtitle')}</p>
                </div>
                {activeTab === 'forum' && (
                    <button onClick={handleNewPostClick} className="btn btn-primary flex-shrink-0">
                        + {t('newPost')}
                    </button>
                )}
            </div>
            
            <div className="border-b dark:border-dark-border mb-6">
                 <div className="flex">
                    <TabButton tab="forum" label={t('communityForum')} icon="🧵" />
                    <TabButton tab="hub" label={t('educationalHub')} icon="📚" />
                    <TabButton tab="events" label="Events" icon="🗓️" />
                    <TabButton tab="agrobot" label={t('agrobotAI')} icon="🤖" />
                 </div>
            </div>

            {loading ? (
                <CommunityPageSkeleton />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="md:col-span-1 h-fit md:sticky top-24">
                        {activeTab === 'forum' && <ForumSidebar />}
                        {activeTab === 'hub' && <HubSidebar />}
                        {activeTab === 'agrobot' && <AgroBotSidebar />}
                        {activeTab === 'events' && <div></div> /* No sidebar for events yet */}
                    </aside>
                    <main className="md:col-span-3">
                         <div className="animate-fade-in">
                            {activeTab === 'forum' && <ForumFeed />}
                            {activeTab === 'hub' && <HubContent />}
                            {activeTab === 'events' && <Suspense fallback={<Spinner />}><EventsList /></Suspense>}
                            {activeTab === 'agrobot' && <AgroBot isOpen={true} onClose={() => setActiveTab('forum')} ref={agroBotRef} />}
                        </div>
                    </main>
                </div>
            )}
            
            <NewPostModal 
                isOpen={isNewPostModalOpen}
                onClose={() => setIsNewPostModalOpen(false)}
                onPostCreated={fetchData}
            />
        </div>
    );
};

export default CommunityPage;
