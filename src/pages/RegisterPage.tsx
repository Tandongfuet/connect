import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import BrandIcon from '../components/BrandIcon';
import Spinner from '../components/Spinner';
import { Role } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import PasswordStrengthIndicator, { checkPasswordStrength } from '../components/PasswordStrengthIndicator';
import OnboardingTour, { type TourStep } from '../components/OnboardingTour';

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { register, socialLogin } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ((location.state as any)?.defaultRole as Role) || Role.Buyer,
    });
    const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
    const [isRestrictedRole, setIsRestrictedRole] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        setTimeout(() => setShowTour(true), 500);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'role') setIsRestrictedRole(value === Role.Admin || value === Role.SupportAgent);
        setFormData({ ...formData, [name]: value });
        if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };
        let isValid = true;
        const { level } = checkPasswordStrength(formData.password);
        if (level === 'Weak') { newErrors.password = t('passwordIsWeakError'); isValid = false; }
        if (formData.password !== formData.confirmPassword) { newErrors.confirmPassword = 'Passwords do not match.'; isValid = false; }
        setErrors(newErrors);
        return isValid;
    };

    const handleSocialRegister = async (provider: 'google' | 'facebook') => {
        setSocialLoading(provider);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const mockProfile = {
                name: provider === 'google' ? 'Google New User' : 'Facebook New User',
                email: `${provider}.new@agroconnect.cm`,
                profileImage: `https://ui-avatars.com/api/?name=${provider === 'google' ? 'G+N' : 'F+N'}&background=${provider === 'google' ? 'db4437' : '4267b2'}&color=fff`,
            };
            
            // In a real app, we'd pass the profile + the selected role to the backend
            // For mock, we'll assume the mockLoginOrRegisterWithSocial handles it or just creates a Buyer
            await socialLogin(mockProfile);
            addToast(`Welcome to AgroConnect! Your ${formData.role} account is ready.`, 'success');
            navigate('/dashboard');
        } catch (error: any) {
            addToast('Social registration failed.', 'error');
        } finally {
            setSocialLoading(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRestrictedRole) return;
        if (!validateForm()) return;
        setLoading(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            await register(fullName, formData.email, formData.password, formData.role);
            addToast('Registration successful! Please log in.', 'success');
            sessionStorage.setItem('postRegEmail', formData.email);
            navigate('/login');
        } catch (error: any) {
            if (error.message.includes('already exists')) setErrors(prev => ({...prev, email: 'Email already exists.'}));
            else addToast(error.message || 'Registration failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isSeller = formData.role === Role.Farmer || formData.role === Role.ServiceProvider;

    return (
        <div className="min-h-[90vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
            <OnboardingTour steps={[{ target: '#role-select', title: 'Your Role', content: 'Select if you are a Buyer, Farmer, or Provider.' }]} isOpen={showTour} onClose={() => setShowTour(false)} />
            
            <div className="w-full max-w-6xl bg-white dark:bg-dark-surface rounded-3xl shadow-2xl overflow-hidden md:flex animate-pop-in border border-gray-100 dark:border-dark-border">
                
                {/* Left Side: Auth Form */}
                <div className="w-full md:w-7/12 p-8 sm:p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <div className="flex justify-center md:hidden mb-4">
                            <BrandIcon className="h-14 w-14 text-primary" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-dark dark:text-dark-text animate-fade-in-up">
                            {t('createAccountTitle')}
                        </h2>
                        <p className="mt-3 text-gray-muted dark:text-dark-muted text-lg animate-fade-in-up">
                            {t('createAccountSubtitle')}{' '}
                            <Link to="/login" className="font-bold text-primary hover:underline ml-1">
                                {t('signInButton')}
                            </Link>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => handleSocialRegister('google')}
                            disabled={!!socialLoading || loading}
                            className="flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-dark dark:text-dark-text font-bold hover:bg-gray-50 dark:hover:bg-dark-bg transition-all shadow-sm active:scale-[0.98]"
                        >
                            {socialLoading === 'google' ? <Spinner size="sm" /> : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                                    </svg>
                                    Google
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialRegister('facebook')}
                            disabled={!!socialLoading || loading}
                            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#1877F2] text-white font-bold hover:bg-[#166fe5] transition-all shadow-md active:scale-[0.98]"
                        >
                            {socialLoading === 'facebook' ? <Spinner size="sm" /> : (
                                <>
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    Facebook
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-dark-border" /></div>
                        <div className="relative flex justify-center text-sm font-medium"><span className="bg-white dark:bg-dark-surface px-4 text-gray-400 uppercase tracking-widest">or sign up with email</span></div>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <label htmlFor="role-select" className="label ml-1">{t('roleLabel')}</label>
                            <select id="role-select" name="role" value={formData.role} onChange={handleChange} className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl text-base">
                                <option value={Role.Buyer}>{t('buyerRole')}</option>
                                <option value={Role.Farmer}>{t('farmerRole')}</option>
                                <option value={Role.ServiceProvider}>{t('serviceProviderRole')}</option>
                            </select>
                        </div>

                        {!isRestrictedRole && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                        <label className="label ml-1">{t('firstNameLabel')}</label>
                                        <input name="firstName" type="text" required className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl" value={formData.firstName} onChange={handleChange} placeholder={t('firstNamePlaceholder')} />
                                        {errors.firstName && <p className="error-text text-xs mt-1 ml-1"><ErrorIcon /> {errors.firstName}</p>}
                                    </div>
                                    <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                        <label className="label ml-1">{t('lastNameLabel')}</label>
                                        <input name="lastName" type="text" required className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl" value={formData.lastName} onChange={handleChange} placeholder={t('lastNamePlaceholder')} />
                                        {errors.lastName && <p className="error-text text-xs mt-1 ml-1"><ErrorIcon /> {errors.lastName}</p>}
                                    </div>
                                </div>
                                <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                                    <label className="label ml-1">{t('emailLabel')}</label>
                                    <input name="email" type="email" required className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl" value={formData.email} onChange={handleChange} placeholder={t('emailPlaceholder')} />
                                    {errors.email && <p className="error-text text-xs mt-1 ml-1"><ErrorIcon /> {errors.email}</p>}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                        <label className="label ml-1">{t('passwordLabel')}</label>
                                        <input name="password" type="password" required className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                        <PasswordStrengthIndicator password={formData.password} />
                                    </div>
                                    <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                        <label className="label ml-1">{t('confirmPasswordLabel')}</label>
                                        <input name="confirmPassword" type="password" required className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                                        {errors.confirmPassword && <p className="error-text text-xs mt-1 ml-1"><ErrorIcon /> {errors.confirmPassword}</p>}
                                    </div>
                                </div>

                                {isSeller && (
                                    <div className="p-4 bg-primary/5 dark:bg-primary/10 border-l-4 border-primary rounded-r-2xl animate-fade-in">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-5 w-5 rounded text-primary focus:ring-primary" />
                                            <span className="text-sm text-slate-dark dark:text-dark-text leading-tight">{t('iHaveReadAndAgree')} <Link to="/fees-policy" className="text-primary font-bold hover:underline">{t('feesAndCommissionPolicyLink')}</Link>.</span>
                                        </label>
                                    </div>
                                )}

                                <div className="animate-fade-in-up pt-4">
                                    <button type="submit" className="btn btn-primary w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={loading || !!socialLoading || (isSeller && !agreedToTerms)}>
                                        {loading ? <Spinner size="sm" /> : t('createAccountButton')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Right Side: Visual Content */}
                <div className="hidden md:flex md:w-5/12 bg-gradient-to-tr from-primary-dark to-primary p-12 flex-col justify-center items-center text-white text-center relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=2070')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                    <div className="relative z-10 animate-fade-in-down">
                        <BrandIcon className="h-28 w-28 mx-auto text-white drop-shadow-xl mb-8" />
                        <h1 className="text-4xl font-extrabold mb-4">Join the Ecosystem</h1>
                        <p className="text-lg text-primary-light font-medium leading-relaxed opacity-90">
                            Empowering smallholder farmers and bridging the urban marketplace gap across Cameroon.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;