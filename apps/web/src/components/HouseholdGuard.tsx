import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteHouseholdGuard, HouseholdRequirement } from '@/hooks/useHouseholdGuard';
import { LoadingPage } from '@homebudget/ui';

interface HouseholdGuardProps {
  children: React.ReactNode;
  requirement?: HouseholdRequirement;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const HouseholdGuard: React.FC<HouseholdGuardProps> = ({
  children,
  requirement = HouseholdRequirement.REQUIRED,
  redirectTo = '/',
  fallback
}) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    households,
    isLoading,
    hasChecked,
    currentHousehold,
    shouldRedirect,
    isRouteAccessible,
    shouldShowEmptyState
  } = useRouteHouseholdGuard(requirement);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Redirect if household is required but user has none
  useEffect(() => {
    if (shouldRedirect) {
      router.push(redirectTo);
    }
  }, [shouldRedirect, router, redirectTo]);

  // Show loading while checking authentication and households
  if (authLoading || isLoading) {
    return (
      <LoadingPage
        title="Checking Access"
        subtitle="Please wait while we verify your household membership..."
      />
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Household required but user has none (will redirect)
  if (shouldRedirect) {
    return null; // Will redirect via useEffect
  }

  // Show empty state for optional household routes
  if (shouldShowEmptyState && fallback) {
    return <>{fallback}</>;
  }

  // Route is accessible
  if (isRouteAccessible) {
    return <>{children}</>;
  }

  // Fallback - shouldn't reach here normally
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Access Restricted
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          This page requires household membership to access.
        </p>
        <button
          onClick={() => router.push('/households')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create or Join Household
        </button>
      </div>
    </div>
  );
};

// HOC wrapper for pages
export const withHouseholdGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requirement?: HouseholdRequirement;
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <HouseholdGuard {...options}>
        <Component {...props} />
      </HouseholdGuard>
    );
  };

  WrappedComponent.displayName = `withHouseholdGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Specialized guards for common use cases
export const RequireHousehold: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HouseholdGuard requirement={HouseholdRequirement.REQUIRED}>
    {children}
  </HouseholdGuard>
);

export const AllowNoHousehold: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <HouseholdGuard requirement={HouseholdRequirement.OPTIONAL} fallback={fallback}>
    {children}
  </HouseholdGuard>
);

export const PublicAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HouseholdGuard requirement={HouseholdRequirement.GUEST_ALLOWED}>
    {children}
  </HouseholdGuard>
); 