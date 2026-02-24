import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import GeneralPageSkeleton from './GeneralPageSkeleton';

/**
 * A route guard that allows access only to authenticated users with the 'Admin' role.
 * It handles the loading state to prevent flicker before checking the user's role.
 * It assumes it is nested within a ProtectedRoute that handles the initial authentication check.
 */
const AdminGuard: React.FC = () => {
    const { loading } = useAuth();
    const { isAdmin } = useRole();

    if (loading) {
        // Wait for the authentication state to be determined before checking role
        return (
            <div className="p-8">
                <GeneralPageSkeleton />
            </div>
        );
    }
    
    // If authenticated (guaranteed by parent ProtectedRoute) and is an admin, allow access
    if (isAdmin) {
        return <Outlet />; // Render the nested admin routes
    }

    // If authenticated but not an admin, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
};

export default AdminGuard;