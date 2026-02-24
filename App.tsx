import React, { useState, useMemo, createContext, useContext, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/FavoritesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { DashboardLayoutProvider } from './contexts/DashboardLayoutContext';

// Layout & Components
import Header from './components/Header';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import AdminGuard from './components/AdminGuard';
import ToastContainer from './components/ToastContainer';
import ScrollToTop from './components/ScrollToTop';
import GeneralPageSkeleton from './components/GeneralPageSkeleton';

// Lazy-loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ListingFormPage = lazy(() => import('./pages/ListingFormPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const SellerProfilePage = lazy(() => import('./pages/SellerProfilePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const FeesPolicyPage = lazy(() => import('./pages/FeesPolicyPage'));
const SeasonalCalendarPage = lazy(() => import('./pages/SeasonalCalendarPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DisputeThreadPage = lazy(() => import('./pages/DisputeThreadPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ForumThreadPage = lazy(() => import('./pages/ForumThreadPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const AgroBot = lazy(() => import('./components/AgroBot'));

// Theme Context
type Theme = 'light' | 'dark';
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};

const AuthRedirect: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <SplashScreen />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <SplashScreen />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
};

const AppLayout: React.FC<{ onAgroBotToggle: () => void }> = ({ onAgroBotToggle }) => {
    const location = useLocation();
    const noFooterPages = ['/dashboard', '/settings', '/admin', '/chat', '/disputes', '/listing'];
    const shouldHideFooter = noFooterPages.some(path => location.pathname.startsWith(path));

    return (
        <div className="flex flex-col min-h-screen bg-cream-light dark:bg-dark-bg transition-colors duration-300">
            <Header onAgroBotToggle={onAgroBotToggle} />
            <main className="flex-grow container mx-auto px-4 py-8">
                <Outlet />
            </main>
            {!shouldHideFooter && <Footer />}
        </div>
    );
};

const AppContent: React.FC = () => {
    const [isAgroBotOpen, setIsAgroBotOpen] = useState(false);
    const { isAuthenticated } = useAuth();

    return (
        <div className="font-sans">
            <ToastContainer />
            <Suspense fallback={<GeneralPageSkeleton />}>
                <Routes>
                    <Route element={<AppLayout onAgroBotToggle={() => setIsAgroBotOpen(!isAgroBotOpen)} />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route element={<AuthRedirect />}>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                        </Route>
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/products/:id" element={<ProductDetailsPage />} />
                        <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
                        <Route path="/user/:userId" element={<UserProfilePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/fees-policy" element={<FeesPolicyPage />} />
                        <Route path="/seasonal-calendar" element={<SeasonalCalendarPage />} />
                        <Route path="/community" element={<CommunityPage />} />
                        <Route path="/community/forum/:postId" element={<ForumThreadPage />} />
                        <Route path="/community/hub/:articleId" element={<ArticlePage />} />
                        <Route path="/search" element={<SearchResultsPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/listing/new" element={<ListingFormPage />} />
                            <Route path="/listing/edit/:listingId" element={<ListingFormPage />} />
                            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                            <Route path="/chat/:contactId?" element={<ChatPage />} />
                            <Route path="/disputes/:disputeId" element={<DisputeThreadPage />} />
                            <Route element={<AdminGuard />}>
                                <Route path="/admin" element={<AdminPanelPage />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </Suspense>
            {isAuthenticated && (
                <Suspense fallback={null}>
                    <AgroBot isOpen={isAgroBotOpen} onClose={() => setIsAgroBotOpen(false)} />
                </Suspense>
            )}
        </div>
    );
}

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const themeValue = useMemo(() => ({ theme, toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light') }), [theme]);

    return (
        <HashRouter>
            <ScrollToTop />
            <LanguageProvider>
                <ToastProvider>
                    <AuthProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <NotificationProvider>
                                    <DashboardLayoutProvider>
                                        <ThemeContext.Provider value={themeValue}>
                                            <AppContent />
                                        </ThemeContext.Provider>
                                    </DashboardLayoutProvider>
                                </NotificationProvider>
                            </WishlistProvider>
                        </CartProvider>
                    </AuthProvider>
                </ToastProvider>
            </LanguageProvider>
        </HashRouter>
    );
};

export default App;