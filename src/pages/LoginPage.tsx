import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import BrandIcon from '../components/BrandIcon';
import Spinner from '../components/Spinner';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, socialLogin } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      addToast('Welcome back!', 'success');
      if (rememberMe) localStorage.setItem('rememberedEmail', email);
      else localStorage.removeItem('rememberedEmail');
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    try {
      // Simulate OAuth redirect delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockProfile = {
        name: provider === 'google' ? 'Google Demo User' : 'Facebook Demo User',
        email: `${provider}.demo@agroconnect.cm`,
        profileImage: `https://ui-avatars.com/api/?name=${provider === 'google' ? 'G+U' : 'F+U'}&background=${provider === 'google' ? 'db4437' : '4267b2'}&color=fff`,
      };
      
      await socialLogin(mockProfile);
      addToast(`Successfully logged in via ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`, 'success');
      navigate('/dashboard');
    } catch (error: any) {
      addToast('Social login failed. Please try traditional login.', 'error');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl bg-white dark:bg-dark-surface rounded-3xl shadow-2xl overflow-hidden md:flex animate-pop-in border border-gray-100 dark:border-dark-border">
        
        {/* Left Side: Brand & Visuals */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-primary-dark via-primary to-primary-light p-12 flex-col justify-between items-center text-white relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
            </svg>
          </div>
          
          <div className="relative z-10 text-center animate-fade-in-down">
            <BrandIcon className="h-24 w-24 mx-auto text-white drop-shadow-xl" />
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight">AgroConnect</h1>
            <p className="mt-4 text-primary-light font-medium text-lg opacity-90">
              Your gateway to Cameroon's agricultural digital future.
            </p>
          </div>

          <div className="relative z-10 text-sm opacity-75 font-light">
            © 2025 AgroConnect. All rights reserved.
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-16 flex flex-col justify-center bg-white dark:bg-dark-surface">
            <div className="text-center md:text-left mb-10">
                <div className="flex justify-center md:hidden mb-6">
                    <BrandIcon className="h-16 w-16 text-primary drop-shadow-md" />
                </div>
                <h2 className="text-4xl font-bold text-slate-dark dark:text-dark-text animate-fade-in-up">
                    {t('signInTitle')}
                </h2>
                <p className="mt-2 text-gray-muted dark:text-dark-muted text-lg">
                    Join the digital harvest today.
                </p>
            </div>

            <div className="space-y-4 mb-8">
                <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={!!socialLoading || loading}
                    className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-dark dark:text-dark-text font-bold hover:bg-gray-50 dark:hover:bg-dark-bg transition-all shadow-sm active:scale-[0.98]"
                >
                    {socialLoading === 'google' ? <Spinner size="sm" /> : (
                        <>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={!!socialLoading || loading}
                    className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-[#1877F2] text-white font-bold hover:bg-[#166fe5] transition-all shadow-md active:scale-[0.98]"
                >
                    {socialLoading === 'facebook' ? <Spinner size="sm" /> : (
                        <>
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Continue with Facebook
                        </>
                    )}
                </button>
            </div>

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-dark-border" /></div>
                <div className="relative flex justify-center text-sm font-medium"><span className="bg-white dark:bg-dark-surface px-4 text-gray-400">or use email</span></div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="label text-slate-dark dark:text-gray-200 ml-1">
                    {t('emailLabel')}
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    required
                    className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl text-base"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password-input" className="label text-slate-dark dark:text-gray-200 ml-1">
                    {t('passwordLabel')}
                  </label>
                  <input
                    id="password-input"
                    type="password"
                    required
                    className="input h-14 bg-gray-50/50 dark:bg-dark-bg border-gray-200 dark:border-dark-border focus:ring-4 focus:ring-primary/20 rounded-2xl text-base"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="error-text justify-center bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:bg-dark-bg"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-slate-dark dark:text-dark-text">
                    {t('rememberMe')}
                  </label>
                </div>

                <Link to="/forgot-password" size="sm" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                    {t('forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                disabled={loading || !!socialLoading}
              >
                {loading ? <Spinner size="sm" /> : t('signInButton')}
              </button>
            </form>

            <div className="mt-10 text-center">
                <p className="text-gray-muted dark:text-dark-muted font-medium">
                    {t('createAccountSubtitle')}{' '}
                    <Link to="/register" className="font-bold text-primary hover:underline ml-1">
                        {t('startJourneyLink')}
                    </Link>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;