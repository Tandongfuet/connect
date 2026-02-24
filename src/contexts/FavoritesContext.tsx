import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { mockGetWishlist as getWishlist, mockAddToWishlist as apiAddToWishlist, mockRemoveFromWishlist as apiRemoveFromWishlist } from '../services/mockApi';

interface WishlistContextType {
    wishlistIds: Set<string>;
    isInWishlist: (listingId: string) => boolean;
    toggleWishlist: (listingId: string) => void;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setWishlistIds(new Set());
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const wishlistListings = await getWishlist(user.id);
            setWishlistIds(new Set(wishlistListings.map(l => l.id)));
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const isInWishlist = (listingId: string) => wishlistIds.has(listingId);

    const addToWishlist = useCallback(async (listingId: string) => {
        if (!user) return;
        setWishlistIds(prev => new Set(prev).add(listingId)); 
        try {
            await apiAddToWishlist(user.id, listingId);
            addToast('Added to wishlist!', 'success');
        } catch (error: any) {
            console.error("Failed to add to wishlist", error);
            addToast(error.message || 'Failed to add to wishlist.', 'error');
            setWishlistIds(prev => { 
                const newSet = new Set(prev);
                newSet.delete(listingId);
                return newSet;
            });
        }
    }, [user, addToast]);

    const removeFromWishlist = useCallback(async (listingId: string) => {
        if (!user) return;
        setWishlistIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(listingId);
            return newSet;
        });
        try {
            await apiRemoveFromWishlist(user.id, listingId);
            addToast('Removed from wishlist.', 'info');
        } catch (error: any) {
            console.error("Failed to remove from wishlist", error);
            addToast(error.message || 'Failed to remove from wishlist.', 'error');
            setWishlistIds(prev => new Set(prev).add(listingId));
        }
    }, [user, addToast]);

    const toggleWishlist = useCallback((listingId: string) => {
        if (isInWishlist(listingId)) {
            removeFromWishlist(listingId);
        } else {
            addToWishlist(listingId);
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    const value = { wishlistIds, isInWishlist, toggleWishlist, loading };
    
    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};