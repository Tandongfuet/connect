import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import type { CartItem, Listing } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (listing: Listing, quantity: number) => void;
  removeFromCart: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const removalTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const getCartKey = useCallback(() => {
    return user ? `agroconnect_cart_${user.id}` : 'agroconnect_cart_guest';
  }, [user]);

  // Load cart from localStorage on initial render or when user changes
  useEffect(() => {
    try {
      const cartKey = getCartKey();
      const storedCart = localStorage.getItem(cartKey);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      } else {
        setCartItems([]); // Clear cart if no stored data for this user/guest
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
      setCartItems([]);
    }
  }, [getCartKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      const cartKey = getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems, getCartKey]);


  const addToCart = (listing: Listing, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.listing.id === listing.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.listing.id === listing.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      // Create the lightweight listing object for the cart
      const cartListing = {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        image: listing.images[0]?.url || '', // Handle no images case
        stock: listing.stock,
        isService: listing.isService,
        seller: {
          id: listing.seller.id,
          name: listing.seller.name,
          profileImage: listing.seller.profileImage,
        },
      };

      return [...prevItems, { listing: cartListing, quantity }];
    });
  };

  const removeFromCart = (listingId: string) => {
    const itemToRemove = cartItems.find(item => item.listing.id === listingId);
    if (!itemToRemove) return;

    // Temporarily store the cart for undo
    const originalCart = [...cartItems];
    
    // Optimistically remove
    setCartItems(prevItems => prevItems.filter(item => item.listing.id !== listingId));
    
    // Clear any pending removal timeout
    if (removalTimeout.current) {
        clearTimeout(removalTimeout.current);
    }

    addToast(`"${itemToRemove.listing.title}" removed from cart.`, 'info', [{
        label: 'Undo',
        onClick: () => {
            setCartItems(originalCart); // Restore the cart
            if (removalTimeout.current) clearTimeout(removalTimeout.current);
            addToast('Item restored to cart.', 'success');
        },
    }]);

    // Set a timeout to "finalize" the removal if not undone.
    // In this mock setup, there's no backend finalization, but this pattern is useful.
    removalTimeout.current = setTimeout(() => {
        // This could be where you'd make a final API call in a real app
    }, 5000);
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(listingId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.listing.id === listingId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };
  
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cartItems.reduce((total, item) => total + item.listing.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};