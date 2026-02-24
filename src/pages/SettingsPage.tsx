
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockUpdateUserProfile, mockChangePassword, mockDeleteUser } from '../services/mockApi';
import Spinner from '../components/Spinner';
import type { User } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { useLanguage } from '../contexts/LanguageContext';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { useGeolocation } from '../hooks/useGeolocation';

type Tab = 'profile' | 'security' | 'notifications' | 'account';

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

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    
    if (!user) {
        return <div className="flex justify-center"><Spinner size="lg" /></div>;
    }

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab 
                ? 'bg-primary text-white' 
                : 'text-slate-dark dark:text-dark-text hover:bg-secondary dark:hover:bg-dark-border'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <BreadcrumbNavigation paths={[{ name: 'Dashboard', path: '/dashboard' }, { name: 'Settings' }]} />
            <h1 className="text-3xl font-bold text-slate-dark dark:text-white mb-8">{t('settingsTitle')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1">
                    <nav className="space-y-2">
                        <TabButton tab="profile" label={t('settingsProfile')} />
                        <TabButton tab="security" label={t('settingsSecurity')} />
                        <TabButton tab="notifications" label={t('settingsNotifications')} />
                        <TabButton tab="account" label={t('settingsAccount')} />
                    </nav>
                </aside>
                <main className="md:col-span-3 bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md">
                    {activeTab === 'profile' && <ProfileSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'account' && <AccountSettings />}
                </main>
            </div>
        </div>
    );
};

// --- Profile Settings Component ---
const ProfileSettings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { addToast } = useToast();
    
    const [formData, setFormData] = useState({ name: user!.name, phoneNumber: user!.phoneNumber || '', location: user!.location || '' });
    const [imagePreview, setImagePreview] = useState<string | null>(user!.profileImage || null);
    const [saving, setSaving] = useState(false);
    const { status: geoStatus, city: detectedCity, error: geoError, getLocation } = useGeolocation();
    
    useEffect(() => {
        if (geoStatus === 'success' && detectedCity) {
            setFormData(prev => ({ ...prev, location: detectedCity }));
            addToast(`Location detected: ${detectedCity}`, 'success');
        }
        if (geoStatus === 'error' && geoError) {
            addToast(geoError, 'error');
        }
    }, [geoStatus, detectedCity, geoError, addToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_FILE_SIZE_MB = 5;
        const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            addToast(`Unsupported file type. Please use JPG or PNG.`, 'error');
            e.target.value = '';
            return;
        }
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            addToast(`Image is too large (max ${MAX_FILE_SIZE_MB}MB).`, 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updatedUserData = await mockUpdateUserProfile(user!.id, { ...formData, profileImage: imagePreview || undefined });
            updateUser(updatedUserData);
            addToast('Profile updated successfully!', 'success');
        } catch (error: any) {
            addToast(error.message || 'Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold">Public Profile</h2>
            <div className="flex items-center space-x-6">
                 {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-4xl"
                        style={{ backgroundColor: getColorForName(user!.name) }}
                    >
                        {getInitials(user!.name)}
                    </div>
                )}
                <div>
                    <label htmlFor="photo-upload" className="btn btn-secondary cursor-pointer">Change Photo</label>
                    <input id="photo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label htmlFor="name" className="label">Full Name</label><input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required /></div>
                <div><label htmlFor="email" className="label">Email Address (Read-only)</label><input type="email" name="email" id="email" value={user!.email} disabled /></div>
                <div><label htmlFor="phoneNumber" className="label">Phone Number</label><input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
                <div>
                    <label htmlFor="location" className="label">Location</label>
                    <div className="flex gap-2">
                        <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="flex-grow" />
                        <button type="button" onClick={getLocation} className="btn btn-secondary flex-shrink-0" disabled={geoStatus === 'loading'}>
                            {geoStatus === 'loading' ? <Spinner size="sm" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Save Changes'}</button></div>
        </form>
    );
};

// --- Security Settings Component ---
const SecuritySettings: React.FC = () => {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            addToast("New passwords do not match.", "error");
            return;
        }
        setLoading(true);
        try {
            await mockChangePassword(user!.id, passwords.currentPassword, passwords.newPassword);
            addToast("Password changed successfully!", "success");
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
             <h2 className="text-xl font-bold">Change Password</h2>
             <div><label className="label">Current Password</label><input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required /></div>
             <div><label className="label">New Password</label><input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required /></div>
             <div><label className="label">Confirm New Password</label><input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required /></div>
             <div className="flex justify-end pt-4 border-t"><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <Spinner size="sm"/> : 'Update Password'}</button></div>
        </form>
    );
};

// --- Notification Settings Component ---
const NotificationSettings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [prefs, setPrefs] = useState(user!.notificationPreferences || { newMessages: true, orderUpdates: true, communityUpdates: true });
    
    const handleToggle = (key: keyof typeof prefs) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(newPrefs);
        updateUser({ notificationPreferences: newPrefs }); // Optimistic update
    };

    const Toggle: React.FC<{ label: string, description: string, isEnabled: boolean, onToggle: () => void }> = ({ label, description, isEnabled, onToggle }) => (
        <div className="flex justify-between items-center py-3 border-b dark:border-dark-border">
            <div>
                <p className="font-medium text-slate-dark dark:text-white">{label}</p>
                <p className="text-sm text-gray-muted dark:text-dark-muted">{description}</p>
            </div>
            <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
         <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold text-slate-dark dark:text-white">Notification Preferences</h2>
             <Toggle label="New Messages" description="Receive a notification for new chat messages." isEnabled={prefs.newMessages} onToggle={() => handleToggle('newMessages')} />
             <Toggle label="Order Updates" description="Get notified about the status of your orders." isEnabled={prefs.orderUpdates} onToggle={() => handleToggle('orderUpdates')} />
             <Toggle label="Community Updates" description="Get notified when someone replies to your post." isEnabled={prefs.communityUpdates} onToggle={() => handleToggle('communityUpdates')} />
        </div>
    );
};


// --- Account Settings Component ---
const AccountSettings: React.FC = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    
    const handleDeleteAccount = async () => {
        setConfirmOpen(false);
        try {
            await mockDeleteUser(user!.id);
            addToast("Your account has been successfully deleted.", "success");
            logout();
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };
    
    return (
        <div className="space-y-6 animate-fade-in">
             <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
             <p className="text-gray-muted">This action is irreversible. All your data, including listings, orders, and wallet balance, will be permanently deleted. This cannot be undone.</p>
             <div className="flex justify-start">
                 <button onClick={() => setConfirmOpen(true)} className="btn btn-danger">Delete My Account</button>
             </div>
             <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Are you absolutely sure?"
                message="This will permanently delete your account and all associated data."
                confirmButtonText="Yes, delete my account"
             />
        </div>
    );
};

export default SettingsPage;