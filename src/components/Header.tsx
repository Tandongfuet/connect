
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRole } from '../hooks/useRole';
import BrandIcon from './BrandIcon';
import { useTheme } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

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

interface HeaderProps {
    onAgroBotToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAgroBotToggle }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAllAsRead, markAsRead, hasNewMessageIndicator, clearNewMessageIndicator } = useNotification();
  const { isAdmin } = useRole();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'profile' | 'notification' | 'language' | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileButtonRef.current?.contains(event.target as Node) ||
        notificationButtonRef.current?.contains(event.target as Node) ||
        languageButtonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      
      if (openMenu === 'profile' && profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      } else if (openMenu === 'notification' && notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      } else if (openMenu === 'language' && languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);


  const toggleMenu = (menu: 'profile' | 'notification' | 'language') => {
    if (menu === 'notification' && hasNewMessageIndicator) {
        clearNewMessageIndicator();
    }
    setOpenMenu(prev => (prev === menu ? null : menu));
  };
  
  const handleMarkAllRead = () => {
    markAllAsRead();
    setOpenMenu(null);
  }
  
  const handleNotificationClick = (notificationId: string) => {
      markAsRead(notificationId);
      closeMenus();
  };

  const closeMenus = () => {
      setOpenMenu(null);
      setIsMobileMenuOpen(false);
  }

  const handleLogout = () => {
    logout();
    closeMenus();
  }

  const languageOptions = {
      en: 'English',
      fr: 'Français',
      pi: 'Pidgin',
  };


  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-slate-dark hover:text-primary dark:text-dark-text dark:hover:text-primary'}`;
  
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-primary text-white' : 'text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border'}`;

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40 dark:bg-dark-surface dark:border-b dark:border-dark-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Left Grouping: Logo */}
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center gap-2">
                  <BrandIcon className="h-10 w-10 lg:h-12 lg:w-12 text-primary" />
                  <div>
                    <span className="text-xl lg:text-2xl font-bold text-primary leading-tight">AgroConnect</span>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Center: Main Nav */}
            <div className="flex-1 hidden md:flex items-center justify-center">
              <nav className="flex space-x-1">
                  <NavLink to="/" className={navLinkClass} end>{t('home')}</NavLink>
                  <NavLink to="/products" className={navLinkClass}>{t('marketplace')}</NavLink>
                  <NavLink to="/community" className={navLinkClass}>{t('community')}</NavLink>
                  <NavLink to="/seasonal-calendar" className={navLinkClass}>{t('seasonalCalendar')}</NavLink>
                  <NavLink to="/about" className={navLinkClass}>{t('about')}</NavLink>
                  <NavLink to="/contact" className={navLinkClass}>{t('contactUs')}</NavLink>
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex-shrink-0 flex items-center space-x-1 md:space-x-2">
               <button onClick={toggleTheme} className="text-gray-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-text p-2" aria-label="Toggle theme">
                  {theme === 'light' ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  )}
              </button>

              <div className="relative">
                <button ref={languageButtonRef} onClick={() => toggleMenu('language')} className="text-gray-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-text p-2 flex items-center gap-1 font-semibold text-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.37 5.43a6 6 0 017.26 0 1 1 0 001.37-1.45 8 8 0 00-10 0 1 1 0 001.37 1.45zM12.9 15.58a1 1 0 00-1.45-1.37 6 6 0 01-2.9 0 1 1 0 10-1.45 1.37 8 8 0 005.8 0z" /></svg>
                   {language.toUpperCase()}
                </button>
                 {openMenu === 'language' && (
                  <div ref={languageMenuRef} className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 border dark:bg-dark-surface dark:border-dark-border animate-fade-in-down">
                      <ul className="py-1">
                          {Object.entries(languageOptions).map(([lang, name]) => (
                             <li key={lang}>
                                <button onClick={() => { setLanguage(lang as 'en' | 'fr' | 'pi'); closeMenus(); }} className="w-full text-left px-4 py-2 text-sm text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border">
                                    {name}
                                </button>
                             </li>
                          ))}
                      </ul>
                  </div>
                )}
              </div>
              
              {isAuthenticated && (
                  <>
                    <button onClick={onAgroBotToggle} className="text-gray-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-text p-2" aria-label="Open AgroBot Assistant">
                        <span className="text-2xl" role="img" aria-label="robot emoji">🤖</span>
                    </button>
                    <div className="relative">
                        <button ref={notificationButtonRef} onClick={() => toggleMenu('notification')} className={`relative text-gray-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-text p-2 transition-shadow ${hasNewMessageIndicator ? 'animate-pulse-subtle rounded-full' : ''}`} aria-label="View notifications">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>
                            )}
                        </button>
                        {openMenu === 'notification' && (
                             <div ref={notificationMenuRef} className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border dark:bg-dark-surface dark:border-dark-border animate-fade-in-down">
                                <div className="p-3 font-semibold border-b text-slate-dark dark:text-dark-text dark:border-dark-border flex justify-between items-center">
                                    <span>{t('notifications')}</span>
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkAllRead} className="text-xs font-medium text-primary hover:underline">
                                            {t('markAllAsRead')}
                                        </button>
                                    )}
                                </div>
                                <ul className="py-1 max-h-80 overflow-y-auto">
                                    {notifications.length > 0 ? notifications.slice(0, 5).map(n => (
                                         <li key={n.id} className={!n.isRead ? 'bg-primary-light/30 dark:bg-primary/20' : ''}>
                                            <Link to={n.link} onClick={() => handleNotificationClick(n.id)} className="block px-4 py-2 text-sm text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border">
                                                {n.message}
                                                <p className="text-xs text-gray-muted dark:text-dark-muted mt-1">{new Date(n.timestamp).toLocaleDateString()}</p>
                                            </Link>
                                         </li>
                                    )) : (
                                        <li className="px-4 py-3 text-sm text-center text-gray-muted dark:text-dark-muted">{t('noNotifications')}</li>
                                    )}
                                </ul>
                                 <div className="border-t dark:border-dark-border p-2 text-center">
                                    <Link to="/notifications" onClick={closeMenus} className="text-sm font-medium text-primary hover:underline">
                                        {t('viewAllNotifications')}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </>
              )}

              <Link to="/cart" className="relative text-gray-muted hover:text-primary dark:text-dark-muted dark:hover:text-dark-text p-2" aria-label="View shopping cart">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {itemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{itemCount}</span>
                  )}
              </Link>

              {isAuthenticated && user ? (
                  <div className="relative">
                      <button ref={profileButtonRef} id="user-profile-menu-button" onClick={() => toggleMenu('profile')} className="flex items-center space-x-2" aria-label="Open user menu">
                          {user.profileImage ? (
                              <img src={user.profileImage} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                              <div
                                  className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                                  style={{ backgroundColor: getColorForName(user.name) }}
                                  aria-label={user.name}
                              >
                                  {getInitials(user.name)}
                              </div>
                          )}
                      </button>
                       {openMenu === 'profile' && (
                          <div ref={profileMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border dark:bg-dark-surface dark:border-dark-border animate-fade-in-down">
                              <div className="py-1">
                                  <div className="px-4 py-2 border-b dark:border-dark-border">
                                      <p className="text-sm font-semibold text-slate-dark dark:text-dark-text truncate">{user?.name}</p>
                                      <p className="text-xs text-gray-muted dark:text-dark-muted truncate">{user?.email}</p>
                                  </div>
                                  <Link to="/dashboard" onClick={closeMenus} className="block px-4 py-2 text-sm text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border">{t('dashboard')}</Link>
                                  <Link to="/settings" onClick={closeMenus} className="block px-4 py-2 text-sm text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border">{t('settings')}</Link>
                                  {isAdmin && <Link to="/admin" onClick={closeMenus} className="block px-4 py-2 text-sm text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border">{t('adminPanel')}</Link>}
                                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-slate-dark hover:bg-secondary dark:text-dark-text dark:hover:bg-dark-border">{t('logout')}</button>
                              </div>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="hidden md:flex items-center space-x-2">
                      <Link to="/login" className="btn btn-light">{t('login')}</Link>
                      <Link to="/register" className="btn btn-primary">{t('signUp')}</Link>
                  </div>
              )}
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" aria-label="Open main menu">
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className="md:hidden animate-fade-in-down bg-white dark:bg-dark-surface" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/" className={mobileNavLinkClass} onClick={closeMenus} end>{t('home')}</NavLink>
            <NavLink to="/products" className={mobileNavLinkClass} onClick={closeMenus}>{t('marketplace')}</NavLink>
            <NavLink to="/community" className={mobileNavLinkClass} onClick={closeMenus}>{t('community')}</NavLink>
            <NavLink to="/seasonal-calendar" className={mobileNavLinkClass} onClick={closeMenus}>{t('seasonalCalendar')}</NavLink>
            <NavLink to="/about" className={mobileNavLinkClass} onClick={closeMenus}>{t('about')}</NavLink>
            <NavLink to="/contact" className={mobileNavLinkClass} onClick={closeMenus}>{t('contactUs')}</NavLink>
          </div>
          {!isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center px-4">
                <Link to="/login" className="btn btn-light w-full" onClick={closeMenus}>{t('login')}</Link>
                <Link to="/register" className="btn btn-primary w-full ml-2" onClick={closeMenus}>{t('signUp')}</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Header;
