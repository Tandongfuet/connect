
import React, { useState, useEffect } from 'react';
import { mockGetPlatformSettings } from '../services/mockApi';

const DefaultLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={className}
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="50" fill="currentColor" />
    <rect x="30" y="55" width="40" height="25" rx="2" fill="#F5F5DC" />
    <path 
      d="M 50 25 L 20 55 L 80 55 Z" 
      fill="#388E3C"
    />
    <rect x="45" y="62" width="10" height="18" rx="2" fill="#388E3C" opacity="0.7"/>
    <path
      d="M 50 28 C 50 28, 58 15, 65 20 C 72 25, 55 30, 50 28 Z"
      fill="#FFEB3B"
    />
  </svg>
);

const BrandIcon: React.FC<{ className?: string }> = ({ className }) => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    // Initial fetch of settings
    mockGetPlatformSettings().then(settings => {
      if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
    });

    // Reactive listener for settings updates from the Admin Panel
    const handleSettingsUpdate = (e: any) => {
      const settings = e.detail;
      if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
      else setLogoUrl('');
    };

    window.addEventListener('agroconnect_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('agroconnect_settings_updated', handleSettingsUpdate);
  }, []);

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt="AgroConnect Logo" 
        className={`${className} object-contain rounded-xl overflow-hidden shadow-sm`} 
        onError={() => setLogoUrl('')} // Fallback if image fails to load
      />
    );
  }

  return <DefaultLogo className={className} />;
};

export default BrandIcon;
