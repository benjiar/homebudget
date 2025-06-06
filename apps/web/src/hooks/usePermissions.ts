import { useAuth } from '@/contexts/AuthContext';
import { 
  Permission, 
  HouseholdRole,
  hasPermission
} from '@homebudget/types';
import { useState, useEffect } from 'react';

interface UserHousehold {
  household_id: string;
  role: HouseholdRole;
  is_active: boolean;
}

interface UsePermissionsResult {
  hasPermissionInHousehold: (householdId: string, permission: Permission) => boolean;
  canAccessHousehold: (householdId: string) => boolean;
  getUserRole: (householdId: string) => HouseholdRole | null;
  isOwner: (householdId: string) => boolean;
  isAdmin: (householdId: string) => boolean;
  canManageHousehold: (householdId: string) => boolean;
  canManageMembers: (householdId: string) => boolean;
  canCreateReceipts: (householdId: string) => boolean;
  canEditReceipts: (householdId: string) => boolean;
  canDeleteReceipts: (householdId: string) => boolean;
  canManageCategories: (householdId: string) => boolean;
  canSetBudgets: (householdId: string) => boolean;
  canViewReports: (householdId: string) => boolean;
  canExportData: (householdId: string) => boolean;
  loading: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { user, session } = useAuth();
  const [userHouseholds, setUserHouseholds] = useState<UserHousehold[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMemberships = async () => {
      if (!user || !session) {
        setUserHouseholds([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/households', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const households = await response.json();
          const memberships: UserHousehold[] = [];
          
          for (const household of households) {
            const userMembership = household.members?.find((m: any) => m.user?.id === user.id);
            if (userMembership && userMembership.is_active) {
              memberships.push({
                household_id: household.id,
                role: userMembership.role,
                is_active: userMembership.is_active,
              });
            }
          }
          
          setUserHouseholds(memberships);
        }
      } catch (error) {
        console.error('Failed to fetch user memberships:', error);
        setUserHouseholds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMemberships();
  }, [user, session]);

  const checkPermission = (householdId: string, permission: Permission): boolean => {
    if (!user) return false;
    
    const membership = userHouseholds.find(m => m.household_id === householdId && m.is_active);
    if (!membership) return false;
    
    return hasPermission(membership.role, permission);
  };

  const checkAccess = (householdId: string): boolean => {
    if (!user) return false;
    return userHouseholds.some(m => m.household_id === householdId && m.is_active);
  };

  const getRole = (householdId: string): HouseholdRole | null => {
    if (!user) return null;
    const membership = userHouseholds.find(m => m.household_id === householdId && m.is_active);
    return membership?.role || null;
  };

  const checkOwner = (householdId: string): boolean => {
    const role = getRole(householdId);
    return role === HouseholdRole.OWNER;
  };

  const checkAdmin = (householdId: string): boolean => {
    const role = getRole(householdId);
    return role === HouseholdRole.OWNER || role === HouseholdRole.ADMIN;
  };

  return {
    hasPermissionInHousehold: checkPermission,
    canAccessHousehold: checkAccess,
    getUserRole: getRole,
    isOwner: checkOwner,
    isAdmin: checkAdmin,
    loading,
    
    // Convenience methods for common checks
    canManageHousehold: (householdId: string) => checkOwner(householdId),
    canManageMembers: (householdId: string) => checkAdmin(householdId),
    
    // Receipt permissions
    canCreateReceipts: (householdId: string) => checkPermission(householdId, Permission.CREATE_RECEIPTS),
    canEditReceipts: (householdId: string) => checkPermission(householdId, Permission.UPDATE_RECEIPTS),
    canDeleteReceipts: (householdId: string) => checkPermission(householdId, Permission.DELETE_RECEIPTS),
    
    // Category permissions
    canManageCategories: (householdId: string) => checkPermission(householdId, Permission.UPDATE_CATEGORIES),
    canSetBudgets: (householdId: string) => checkPermission(householdId, Permission.SET_BUDGETS),
    
    // Reporting permissions
    canViewReports: (householdId: string) => checkPermission(householdId, Permission.VIEW_REPORTS),
    canExportData: (householdId: string) => checkPermission(householdId, Permission.EXPORT_DATA),
  };
} 