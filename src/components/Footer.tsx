import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Role } from '../constants';

const FooterLink: React.FC<{ to: string; state?: any; children: React.ReactNode }> = ({ to, state, children }) => (
    <li>
        <Link to={to} state={state} className="text-cream-light/80 hover:text-accent transition-colors text-sm">
            {children}
        </Link>
    </li>
);

const SocialIcon: React.FC<{ href: string; children: React.ReactNode; label: string }> = ({ href, children, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-cream-light/80 hover:text-accent transition-colors" aria-label={label}>
        {children}
    </a>
);


const Footer: React.FC = () => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [email, setEmail] = useState('');

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            addToast(`Thank you for subscribing, ${email}!`, 'success');
            setEmail('');
        }
    };

    return (
        <footer className="bg-primary-dark text-cream-light/80">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {/* Column 1: Newsletter */}
                    <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-4">{t('newsletterTitle')}</h3>
                        <p className="text-sm mb-4">{t('newsletterDescription')}</p>
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email address"
                                className="input !bg-primary-dark/50 !border-cream-light/30 !text-white placeholder:text-cream-light/60 flex-grow"
                                required
                            />
                            <button type="submit" className="btn btn-light">{t('subscribe')}</button>
                        </form>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t('quickLinks')}</h3>
                        <ul className="space-y-2">
                            <FooterLink to="/about">{t('about')}</FooterLink>
                            <FooterLink to="/products">{t('marketplace')}</FooterLink>
                            <FooterLink to="/community">{t('community')}</FooterLink>
                            <FooterLink to="/seasonal-calendar">{t('seasonalCalendar')}</FooterLink>
                        </ul>
                    </div>

                    {/* Column 3: Join Us */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t('joinUs')}</h3>
                        <ul className="space-y-2">
                            <FooterLink to="/register" state={{ defaultRole: Role.Farmer }}>{t('joinAsFarmer')}</FooterLink>
                            <FooterLink to="/register" state={{ defaultRole: Role.Buyer }}>{t('joinAsBuyer')}</FooterLink>
                            <FooterLink to="/register" state={{ defaultRole: Role.ServiceProvider }}>{t('joinAsServiceProvider')}</FooterLink>
                        </ul>
                    </div>
                    
                    {/* Column 4: Support */}
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t('support')}</h3>
                        <ul className="space-y-2">
                            <FooterLink to="/contact">{t('contactUs')}</FooterLink>
                            <FooterLink to="/faq">{t('faqLink')}</FooterLink>
                            <FooterLink to="/fees-policy">{t('feesPolicy')}</FooterLink>
                            <FooterLink to="/terms-of-service">{t('termsLink')}</FooterLink>
                            <FooterLink to="/privacy-policy">{t('privacyLink')}</FooterLink>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-cream-light/20 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-center sm:text-left">
                        <h3 className="text-lg font-semibold text-white">AgroConnect</h3>
                        <p className="text-sm mt-1">{t('footerTagline')}</p>
                        <p className="text-sm mt-1 text-cream-light/70">by <span className="font-bold text-white">EFUELATEH GEORGE</span></p>
                    </div>
                    <div className="flex flex-col items-center sm:items-end gap-4">
                        <div className="flex items-center gap-5">
                            <SocialIcon href="https://facebook.com" label="Facebook">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.588 0 0 .588 0 1.325v21.351C0 23.412.588 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.737 0 1.325-.588 1.325-1.325V1.325C24 .588 23.412 0 22.675 0z" /></svg>
                            </SocialIcon>
                            <SocialIcon href="https://twitter.com" label="Twitter">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.223.085c.645 1.956 2.525 3.379 4.75 3.419a9.9 9.9 0 01-7.557 2.222c-.482 0-.962-.028-1.433-.085a13.945 13.945 0 007.554 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                            </SocialIcon>
                            <SocialIcon href="https://linkedin.com" label="LinkedIn">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            </SocialIcon>
                        </div>
                        <p className="text-sm">AgroConnect © 2025</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;