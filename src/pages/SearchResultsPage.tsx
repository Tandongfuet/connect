
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { globalSearch } from '../services/api';
import type { Listing, Article, User } from '../types';
import Spinner from '../components/Spinner';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import VerificationBadge from '../components/VerificationBadge';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import SearchResultsSkeleton from '../components/SearchResultsSkeleton';
import BookingModal from '../components/BookingModal';

type Tab = 'products' | 'articles' | 'sellers';

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

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<{ listings: Listing[]; articles: Article[]; users: User[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('products');

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedListingForBooking, setSelectedListingForBooking] = useState<Listing | null>(null);

    const handleBookNow = (listing: Listing) => {
        setSelectedListingForBooking(listing);
        setIsBookingModalOpen(true);
    };

    useEffect(() => {
        const performSearch = async () => {
            if (!query) {
                setResults({ listings: [], articles: [], users: [] });
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const searchResults = await globalSearch(query);
                setResults(searchResults);
                // Default to the tab with the most results
                const resultCounts = [
                    { tab: 'products', count: searchResults.listings.length },
                    { tab: 'articles', count: searchResults.articles.length },
                    { tab: 'sellers', count: searchResults.users.length },
                ];
                const bestTab = resultCounts.sort((a, b) => b.count - a.count)[0].tab;
                setActiveTab(bestTab as Tab);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };
        performSearch();
    }, [query]);
    
    const TabButton: React.FC<{ tab: Tab; label: string; count: number }> = ({ tab, label, count }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-base font-semibold border-b-2 transition-colors ${
                activeTab === tab 
                ? 'text-primary border-primary' 
                : 'text-gray-muted dark:text-dark-muted border-transparent hover:text-slate-dark dark:hover:text-dark-text'
            }`}
        >
            <span>{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-border'}`}>{count}</span>
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto">
             <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                listing={selectedListingForBooking}
            />
            <BreadcrumbNavigation paths={[{ name: 'Search Results' }]} />
            <h1 className="text-3xl font-bold text-slate-dark dark:text-white">Search Results</h1>
            <p className="text-gray-muted dark:text-dark-muted">Showing results for: <span className="font-semibold text-slate-dark dark:text-white">"{query}"</span></p>

            {loading ? (
                <SearchResultsSkeleton />
            ) : results ? (
                <div className="mt-8">
                    <div className="border-b dark:border-dark-border">
                        <nav className="flex -mb-px space-x-6">
                            <TabButton tab="products" label="Products" count={results.listings.length} />
                            <TabButton tab="articles" label="Articles" count={results.articles.length} />
                            <TabButton tab="sellers" label="Sellers" count={results.users.length} />
                        </nav>
                    </div>

                    <div className="mt-6 animate-fade-in">
                        {activeTab === 'products' && (
                            results.listings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {results.listings.map(listing => <ProductCard key={listing.id} listing={listing} onBookNow={handleBookNow} />)}
                                </div>
                            ) : <EmptyState icon="🤷‍♀️" title="No Products Found" message="We couldn't find any products matching your search." />
                        )}
                        {activeTab === 'articles' && (
                             results.articles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.articles.map(article => (
                                        <Link to={`/community/hub/${article.id}`} key={article.id} className="group border rounded-lg shadow-sm bg-white dark:bg-dark-surface dark:border-dark-border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                             <img src={article.featuredImage} alt={article.title} className="w-full h-48 object-cover" />
                                             <div className="p-4 flex flex-col flex-grow">
                                                 <p className="text-sm text-primary font-semibold">{article.category}</p>
                                                 <h3 className="text-lg font-bold text-slate-dark dark:text-dark-text mt-1 flex-grow group-hover:text-primary transition-colors">{article.title}</h3>
                                                 <div className="mt-4 pt-4 border-t dark:border-dark-border text-xs text-gray-muted dark:text-dark-muted">By {article.authorName}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                             ) : <EmptyState icon="📚" title="No Articles Found" message="We couldn't find any articles matching your search." />
                        )}
                        {activeTab === 'sellers' && (
                             results.users.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.users.map(user => (
                                        <Link to={`/seller/${user.id}`} key={user.id} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow">
                                            {user.profileImage ? (
                                                <img src={user.profileImage} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                                            ) : (
                                                <div
                                                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl"
                                                    style={{ backgroundColor: getColorForName(user.name) }}
                                                >
                                                    {getInitials(user.name)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-dark dark:text-dark-text">{user.name}</p>
                                                    <VerificationBadge tier={user.verificationTier} />
                                                </div>
                                                <p className="text-sm text-gray-muted dark:text-dark-muted">{user.role}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : <EmptyState icon="👥" title="No Sellers Found" message="We couldn't find any sellers matching your search." />
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default SearchResultsPage;
