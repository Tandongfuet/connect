import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => {
  useEffect(() => {
    // Set the page title
    document.title = title;

    // Helper function to find and update or create a meta tag
    const setMetaTag = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    // Set meta description
    setMetaTag('description', description);

    // Set meta keywords if provided
    if (keywords) {
        setMetaTag('keywords', keywords);
    }

  }, [title, description, keywords]);

  return null; // This component does not render any visible elements
};

export default SEO;
