
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getListings, getSemanticKeywords } from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Listing } from '../types';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import Pagination from '../components/Pagination';
import CameroonMap from '../components/CameroonMap';
import Spinner from '../components/Spinner';
import { regions, getCitiesByRegion, getRegionFromCity } from '../services/locationData';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import EmptyState from '../components/EmptyState';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from '../components/BookingModal';
import SEO from '../components/SEO';
import { ListingStatus } from '../constants';


const ITEMS_PER_PAGE = 8;
type ViewMode = 'grid' | 'map';
const MARKETPLACE_STATE_KEY = 'agroconnect_marketplace_state';

const getInitialState = () => {
    try {
        const saved = localStorage.getItem(MARKETPLACE_STATE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};


const ProductsPage: React.FC = () => {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialState = getInitialState();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedListingForBooking, setSelectedListingForBooking] = useState<Listing | null>(null);

  const handleBookNow = (listing: Listing) => {
    setSelectedListingForBooking(listing);
    setIsBookingModalOpen(true);
  };

  const CATEGORIES = useMemo(() => [
      t('categoryAll'), t('categoryVegetables'), t('categoryFruits'), t('categoryGrains'), 
      t('categoryLivestock'), t('categoryPoultry'), t('categoryTools'), t('categoryFertilizers'), 
      t('categoryCrafts'), t('categoryServices')
  ], [t]);
  
  const SORT_OPTIONS = useMemo(() => ({
    'newest': t('sortNewest'),
    'price-asc': t('sortPriceAsc'),
    'price-desc': t('sortPriceDesc'),
  }), [t]);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(initialState.selectedCategory || CATEGORIES[0]);
  const [selectedRegion, setSelectedRegion] = useState(initialState.selectedRegion || 'All Regions');
  const [sortBy, setSortBy] = useState(initialState.sortBy || 'newest');
  const [minPrice, setMinPrice] = useState(initialState.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialState.maxPrice || '');
  const [minRating, setMinRating] = useState(initialState.minRating || '0');
  const [currentPage, setCurrentPage] = useState(initialState.currentPage || 1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [semanticKeywords, setSemanticKeywords] = useState<string[]>([]);
  const [isSemanticLoading, setIsSemanticLoading] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Geolocation state
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const { status: geoStatus, region: detectedRegion, error: geoError, getLocation } = useGeolocation();

  useEffect(() => {
    if (geoStatus === 'success' && detectedRegion) {
        setIsNearMeActive(true);
        setSelectedRegion(detectedRegion);
        addToast(`Showing results near you in the ${detectedRegion} region.`, 'success');

        const userRegion = user?.location ? getRegionFromCity(user.location) : null;
        if (user && detectedRegion !== userRegion) {
            addToast(
                `Your profile location seems different. Update it for a better experience.`,
                'info',
                [{
                    label: 'Update Profile',
                    onClick: () => navigate('/settings'),
                }]
            );
        }
    }
    if (geoStatus === 'error' && geoError) {
        addToast(geoError, 'error');
        setIsNearMeActive(false);
    }
  }, [geoStatus, detectedRegion, geoError, addToast, user, navigate]);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    getListings()
      .then(data => {
        setAllListings(data.filter(l => l.status === ListingStatus.Active));
      })
      .catch(err => {
        setError("Failed to fetch listings. Please try again later.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    const stateToSave = {
      selectedCategory,
      selectedRegion,
      sortBy,
      currentPage,
      minPrice,
      maxPrice,
      minRating,
    };
    localStorage.setItem(MARKETPLACE_STATE_KEY, JSON.stringify(stateToSave));
  }, [selectedCategory, selectedRegion, sortBy, currentPage, minPrice, maxPrice, minRating]);
  
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchParams({ q: searchTerm });
    setCurrentPage(1);

    if (searchTerm.trim().length > 2) {
        setIsSemanticLoading(true);
        try {
            const keywords = await getSemanticKeywords(searchTerm);
            setSemanticKeywords(keywords);
        } catch (err) {
            console.error("Semantic search failed", err);
            setSemanticKeywords([]);
        } finally {
            setIsSemanticLoading(false);
        }
    } else {
        setSemanticKeywords([]);
    }
  }, [searchTerm, setSearchParams]);
  
  const handleToggleNearMe = () => {
    if (isNearMeActive) {
        setIsNearMeActive(false);
        setSelectedRegion('All Regions');
    } else {
        getLocation();
    }
  };

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSearchParams({});
    setSelectedCategory(CATEGORIES[0]);
    setSelectedRegion('All Regions');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('0');
    setCurrentPage(1);
    setSemanticKeywords([]);
    setIsNearMeActive(false);
    addToast('All filters have been cleared.', 'info');
  }, [setSearchParams, addToast, CATEGORIES]);

  const handleClearFiltersAndCloseModal = () => {
    handleClearFilters();
    setIsFilterModalOpen(false);
  };

  const filteredListings = useMemo(() => {
    let listings = [...allListings];
    const searchTerms = [ ...searchTerm.toLowerCase().split(' ').filter(Boolean), ...semanticKeywords.map(k => k.toLowerCase()) ];
    if (searchTerms.length > 0) { listings = listings.filter(l => searchTerms.some(term => l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term) || l.category.toLowerCase().includes(term))); }
    if (selectedCategory !== t('categoryAll')) {
      listings = listings.filter(l => l.category === selectedCategory);
    }
    if (selectedRegion !== 'All Regions') { const citiesInRegion = getCitiesByRegion(selectedRegion); listings = listings.filter(l => l.seller.location && citiesInRegion.includes(l.seller.location)); }
    if (minPrice) listings = listings.filter(l => l.price >= parseFloat(minPrice));
    if (maxPrice) listings = listings.filter(l => l.price <= parseFloat(maxPrice));
    if (minRating !== '0') listings = listings.filter(l => (l.seller.averageSellerRating || 0) >= parseFloat(minRating));
    listings.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'newest': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return listings;
  }, [allListings, searchTerm, semanticKeywords, selectedCategory, selectedRegion, sortBy, t, minPrice, maxPrice, minRating]);
  
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredListings, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory !== CATEGORIES[0]) count++;
    if (selectedRegion !== 'All Regions') count++;
    if (isNearMeActive) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (minRating !== '0') count++;
    return count;
  }, [searchTerm, selectedCategory, CATEGORIES, selectedRegion, minPrice, maxPrice, minRating, isNearMeActive]);

  if (error) return <div className="text-center text-red-500">{error}</div>;

  const FilterControls = ({ inModal }: { inModal?: boolean }) => (
    <>
      <form onSubmit={handleSearch} className={inModal ? '' : 'lg:col-span-2'}>
        <label htmlFor="search-input" className="label text-sm">{t('searchFilter')}</label>
        <div className="flex">
          <input id="search-input" type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="e.g., Irish Potatoes..." className="input rounded-r-none" />
          <button type="submit" className="btn btn-primary rounded-l-none" disabled={isSemanticLoading}> {isSemanticLoading ? <Spinner size="sm"/> : t('search')} </button>
        </div>
      </form>
      <div><label htmlFor="category-select" className="label text-sm">{t('categoryFilter')}</label><select id="category-select" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }} className="input"> {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)} </select></div>
      <div>
        <label htmlFor="region-select" className="label text-sm">{t('regionFilter')}</label>
        <div className="flex gap-2">
            <select
                id="region-select"
                value={selectedRegion}
                onChange={e => {
                    setSelectedRegion(e.target.value);
                    setIsNearMeActive(false);
                    setCurrentPage(1);
                }}
                className="input flex-grow"
                disabled={isNearMeActive || geoStatus === 'loading'}
            >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
                type="button"
                onClick={handleToggleNearMe}
                className={`btn ${isNearMeActive ? 'btn-primary' : 'btn-secondary'} flex-shrink-0`}
                disabled={geoStatus === 'loading'}
                title={isNearMeActive ? "Disable 'Near Me' filter" : "Find listings near my current location"}
            >
                {geoStatus === 'loading' ? <Spinner size="sm" /> : '📍'}
            </button>
        </div>
      </div>
      <div className={inModal ? 'grid grid-cols-2 gap-2' : 'flex gap-2'}>
        <div><label htmlFor="min-price" className="label text-sm">Min Price</label><input id="min-price" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" className="input" /></div>
        <div><label htmlFor="max-price" className="label text-sm">Max Price</label><input id="max-price" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" className="input" /></div>
      </div>
      <div><label htmlFor="min-rating" className="label text-sm">Min Rating</label><select id="min-rating" value={minRating} onChange={e => setMinRating(e.target.value)} className="input"><option value="0">Any</option><option value="4">4 stars & up</option><option value="3">3 stars & up</option><option value="2">2 stars & up</option></select></div>
      <div><label htmlFor="sort-select" className="label text-sm">{t('sortByFilter')}</label><select id="sort-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }} className="input"> {Object.entries(SORT_OPTIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)} </select></div>
    </>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <SEO
        title="Marketplace | AgroConnect"
        description="Browse a wide variety of fresh produce, livestock, farm tools, and agricultural services from local sellers across Cameroon on the AgroConnect marketplace."
        keywords="Cameroon marketplace, buy vegetables, buy fruits, farm equipment, agricultural services, local food"
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        listing={selectedListingForBooking}
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-dark dark:text-dark-text">{t('marketplaceTitle')}</h1>
        <p className="text-gray-muted dark:text-dark-muted mt-2">{t('marketplaceSubtitle')}</p>
      </div>

      {/* Desktop Filters */}
      <div className="bg-white dark:bg-dark-surface p-2 rounded-lg shadow-md sticky top-20 z-30 hidden lg:block">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7 gap-2 items-end">
          <FilterControls />
        </div>
        <div className="flex justify-between items-center mt-2">
          <button onClick={handleClearFilters} className="btn btn-ghost btn-sm">{t('clearFilters')}</button>
          <div className="p-1 bg-secondary rounded-md flex"><button onClick={() => setViewMode('grid')} className={`btn btn-sm ${viewMode === 'grid' ? 'btn-light' : 'btn-ghost'}`}>{t('gridView')}</button><button onClick={() => setViewMode('map')} className={`btn btn-sm ${viewMode === 'map' ? 'btn-light' : 'btn-ghost'}`}>{t('mapView')}</button></div>
        </div>
      </div>

      {/* Mobile Filter Bar */}
      <div className="lg:hidden bg-white dark:bg-dark-surface p-2 rounded-lg shadow-md sticky top-20 z-30 flex justify-between items-center">
        <button onClick={() => setIsFilterModalOpen(true)} className="btn btn-secondary flex items-center gap-2 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            Filters
            {activeFilterCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
        </button>
        <div className="p-1 bg-secondary rounded-md flex"><button onClick={() => setViewMode('grid')} className={`btn btn-sm ${viewMode === 'grid' ? 'btn-light' : 'btn-ghost'}`}>{t('gridView')}</button><button onClick={() => setViewMode('map')} className={`btn btn-sm ${viewMode === 'map' ? 'btn-light' : 'btn-ghost'}`}>{t('mapView')}</button></div>
      </div>

      {/* Filter Modal for Mobile */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-end sm:items-center animate-fade-in" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-white dark:bg-dark-surface w-full sm:max-w-md rounded-t-lg sm:rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-dark-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 -mr-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <FilterControls inModal />
            </div>
            <div className="flex justify-between items-center p-4 border-t dark:border-dark-border bg-gray-50 dark:bg-dark-border/50 rounded-b-lg">
              <button onClick={handleClearFiltersAndCloseModal} className="btn btn-ghost">Clear All</button>
              <button onClick={() => setIsFilterModalOpen(false)} className="btn btn-primary">Show Results</button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'map' && <div className="animate-fade-in"><CameroonMap listings={filteredListings} /></div>}
      
      {viewMode === 'grid' && (
        <div className="animate-fade-in">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : paginatedListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {paginatedListings.map(listing => <ProductCard key={listing.id} listing={listing} onBookNow={handleBookNow} />)}
              </div>
              {filteredListings.length > ITEMS_PER_PAGE && <Pagination currentPage={currentPage} totalItems={filteredListings.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={(page) => setCurrentPage(page)} />}
            </>
          ) : (
            <div className="py-12"><EmptyState icon="🤷‍♀️" title="No Products Found" message="We couldn't find any products matching your current filters. Try adjusting your search." actionText={t('clearFilters')} actionOnClick={handleClearFilters} /></div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
