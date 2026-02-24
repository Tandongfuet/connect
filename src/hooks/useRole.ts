import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../constants';

export const useRole = () => {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    const isVerified = user?.verificationStatus === 'Verified';
    const isAdmin = user?.role === Role.Admin;
    const isSupport = user?.role === Role.SupportAgent;

    return {
      canViewAdminPanel: isAdmin,
      canViewSupportPanel: isSupport,
      canCreateListing: !!user && [Role.Farmer, Role.ServiceProvider].includes(user.role) && isVerified,
      canPurchase: user?.role === Role.Buyer,
      canViewCart: !!user && user?.role !== Role.Admin && user?.role !== Role.SupportAgent,
      
      // Granular Admin/Support Permissions
      canManageDisputes: isAdmin || isSupport,
      canManageVerifications: isAdmin || isSupport,
      canViewAllUsers: isAdmin || isSupport,
      canViewActivityLogs: isAdmin || isSupport,

      // Admin-Only Permissions
      canPerformUserActions: isAdmin, // (Suspend, Delete, Change Role)
      canManagePlatformFinances: isAdmin,
      canManageSecurityAlerts: isAdmin,
      canPerformListingActions: isAdmin, // (Approve, Reject, Delete)
    };
  }, [user]);

  return useMemo(() => ({
    userRole: user?.role,
    isAdmin: user?.role === Role.Admin,
    isBuyer: user?.role === Role.Buyer,
    isFarmer: user?.role === Role.Farmer,
    isServiceProvider: user?.role === Role.ServiceProvider,
    isSupportAgent: user?.role === Role.SupportAgent,
    isVerified: user?.verificationStatus === 'Verified',
    permissions,
  }), [user, permissions]);
};