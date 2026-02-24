import React from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '../types';
import { getCityData } from '../services/locationData';

interface ProductPreviewPopupProps {
    listing: Listing;
}

const ProductPreviewPopup: React.FC<ProductPreviewPopupProps> = ({ listing }) => {
    const cityData = getCityData(listing.seller.location);
    if (!cityData) return null;

    // Position the popup above and to the right of the pin
    const popupStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${cityData.coords.y - 10}px`, // Align bottom of popup with pin
        left: `${cityData.coords.x + 15}px`,
        transform: 'translateY(-100%)', // Shift upwards by its own height
        pointerEvents: 'auto',
    };

    return (
        <div 
            style={popupStyle}
            className="z-10 w-56 animate-fade-in"
        >
            <Link to={`/products/${listing.id}`} className="block bg-white dark:bg-dark-surface rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <img src={listing.images[0]?.url} alt={listing.title} className="w-full h-28 object-cover" />
                <div className="p-3">
                    <h4 className="text-base font-bold text-slate-dark dark:text-white truncate">{listing.title}</h4>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <img src={listing.seller.profileImage} alt={listing.seller.name} className="w-6 h-6 rounded-full" />
                        <span className="text-xs text-gray-muted dark:text-dark-muted truncate">{listing.seller.name}</span>
                    </div>

                    <p className="text-lg font-extrabold text-primary mt-2">XAF {listing.price.toLocaleString('fr-CM')}</p>
                </div>
            </Link>
        </div>
    );
};

export default ProductPreviewPopup;