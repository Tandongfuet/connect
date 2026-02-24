import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockGetUserById, mockToggleFollow, mockGetFollowerUsers, mockGetFollowingUsers } from '../services/mockApi';
import type { User } from '../types';
import Spinner from '../components/Spinner';
import VerificationBadge from '../components/VerificationBadge';
import BadgeDisplay from '../components/BadgeDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import UserFollowCard from '../components/UserFollowCard';
import SellerProfileSkeleton from '../components/SellerProfileSkeleton';

type Tab = 'followers' | 'following';

const UserProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser, isAuthenticated, updateUser } = useAuth();
    const { addToast } = useToast();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('followers');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                const [userData, followersData, followingData] = await Promise.all([
                    mockGetUserById(userId),
                    mockGetFollowerUsers(userId),
                    mockGetFollowingUsers(userId),
                ]);

                if (userData) {
                    setProfileUser(userData);
                    setFollowers(followersData);
                    setFollowing(followingData);
                    if (currentUser) {
                        setIsFollowing(currentUser.following?.includes(userData.id) || false);
                    }
                    setFollowerCount(userData.followerCount);
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, currentUser]);

    const handleFollowToggle = async () => {
        if (!isAuthenticated || !currentUser || !profileUser) {
            addToast("Please log in to follow users.", "info");
            return;
        }
        if (currentUser.id === profileUser.id) return;

        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);
        setFollowerCount(prev => newFollowingState ? prev + 1 : prev - 1);
        
        const currentFollowing = currentUser.following || [];
        const updatedFollowing = newFollowingState
            ? [...currentFollowing, profileUser.id]
            : currentFollowing.filter(id => id !== profileUser.id);
        updateUser({ following: updatedFollowing });

        try {
            await mockToggleFollow(currentUser.id, profileUser.id);
        } catch (error) {
            addToast("Action failed. Please try again.", "error");
            setIsFollowing(!newFollowingState);
            setFollowerCount(prev => !newFollowingState ? prev + 1 : prev - 1);
            updateUser({ following: currentFollowing });
        }
    };
    
    const TabButton: React.FC<{ tab: Tab; label: string; count: number }> = ({ tab, label, count }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-base font-semibold border-b-2 transition-colors ${
                activeTab === tab 
                ? 'text-primary border-primary' 
                : 'text-gray-muted dark:text-dark-muted border-transparent hover:text-slate-dark dark:hover:text-dark-text'
            }`}
        >
            <span>{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-dark-border'}`}>{count}</span>
        </button>
    );
    
    const UserList: React.FC<{users: User[]; emptyMessage: string;}> = ({ users, emptyMessage }) => {
        if (users.length === 0) {
            return <p className="text-gray-muted text-center py-8">{emptyMessage}</p>;
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => <UserFollowCard key={u.id} user={u} />)}
            </div>
        );
    };

    if (loading) return <SellerProfileSkeleton />;
    if (!profileUser) return <div className="text-center p-8">User not found.</div>;

    const isOwnProfile = currentUser?.id === profileUser.id;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <BreadcrumbNavigation paths={[{ name: 'Community', path: '/community' }, { name: 'User Profile' }]} />
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-200 border-4 border-primary-light">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <h1 className="text-3xl font-bold text-slate-dark dark:text-white">User Profile</h1>
                            <VerificationBadge tier={profileUser.verificationTier} />
                        </div>
                        <p className="text-gray-muted dark:text-dark-muted mt-1">{profileUser.role}</p>
                        <p className="text-gray-muted dark:text-dark-muted mt-2">📍 {profileUser.location || 'Location not set'}</p>
                        <p className="text-sm text-gray-muted dark:text-dark-muted mt-1">Joined on {new Date(profileUser.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-dark dark:text-dark-text mt-1">{followerCount} Followers | {profileUser.following?.length || 0} Following</p>
                    </div>
                    {!isOwnProfile && isAuthenticated && (
                        <button onClick={handleFollowToggle} className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}>
                            {isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-4">Badges</h2>
                <BadgeDisplay badgeIds={profileUser.badges || []} />
            </div>

            <div className="mt-8 border-b dark:border-dark-border mb-6">
                <nav className="flex -mb-px space-x-6">
                    <TabButton tab="followers" label="Followers" count={followers.length} />
                    <TabButton tab="following" label="Following" count={following.length} />
                </nav>
            </div>
            
            <div className="animate-fade-in">
                {activeTab === 'followers' && <UserList users={followers} emptyMessage="This user has no followers yet." />}
                {activeTab === 'following' && <UserList users={following} emptyMessage="This user is not following anyone yet." />}
            </div>
        </div>
    );
};

export default UserProfilePage;