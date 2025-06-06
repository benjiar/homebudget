import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingPage, LoadingCard, LoadingSkeleton } from '@homebudget/ui';
import { Layout } from '@/components/Layout';
import { invalidateHouseholdsCache, householdsCache } from '@/lib/householdsCache';
import { Household, CreateHouseholdRequest, Currency, HouseholdRole, validateCurrency } from '@homebudget/types';

interface CreateHouseholdFormData {
  name: string;
  description: string;
  currency: Currency;
}

export default function HouseholdsPage() {
  const { user, getAccessToken, loading } = useAuth();
  const router = useRouter();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create household form state
  const [createForm, setCreateForm] = useState<CreateHouseholdFormData>({
    name: '',
    description: '',
    currency: Currency.ILS,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Load households
  useEffect(() => {
    if (user) {
      loadHouseholds();
    }
  }, [user]);

  const loadHouseholds = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Use the new households cache system
      const cachedHouseholds = await householdsCache.get(user.id, accessToken);
      setHouseholds(cachedHouseholds);
      console.log(`🏠 HOUSEHOLDS PAGE: Loaded ${cachedHouseholds.length} households`);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load households' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    // Validate currency
    const currencyValidation = validateCurrency(createForm.currency);
    if (!currencyValidation.isValid) {
      setMessage({ 
        type: 'error', 
        text: currencyValidation.errors[0]?.message || 'Invalid currency selected' 
      });
      setIsCreating(false);
      return;
    }

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create household');
      }

      const newHousehold = await response.json();
      
      // Invalidate cache and refresh households
      if (user) {
        invalidateHouseholdsCache(user.id);
        const refreshedHouseholds = await householdsCache.get(user.id, accessToken);
        setHouseholds(refreshedHouseholds);
      }
      
      setShowCreateForm(false);
      setCreateForm({ name: '', description: '', currency: Currency.ILS });
      setMessage({ type: 'success', text: 'Household created successfully!' });
    } catch (error) {
      setShowCreateForm(false);
      setCreateForm({ name: '', description: '', currency: Currency.ILS });
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create household' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLeaveHousehold = async (householdId: string) => {
    if (!confirm('Are you sure you want to leave this household?')) {
      return;
    }

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/households/${householdId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to leave household');
      }

      // Invalidate cache and refresh households
      if (user) {
        invalidateHouseholdsCache(user.id);
        const refreshedHouseholds = await householdsCache.get(user.id, accessToken);
        setHouseholds(refreshedHouseholds);
      }
      
      setMessage({ type: 'success', text: 'Left household successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to leave household' 
      });
    }
  };

  const getUserRole = (household: Household): HouseholdRole | null => {
    const membership = household.members?.find(m => m.user_id === user?.id);
    return membership?.role || null;
  };

  const getRoleColor = (role: HouseholdRole): string => {
    switch (role) {
      case HouseholdRole.OWNER:
        return 'bg-violet-100 text-violet-800';
      case HouseholdRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case HouseholdRole.MEMBER:
        return 'bg-emerald-100 text-emerald-800';
      case HouseholdRole.VIEWER:
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Households" 
        subtitle="Please wait while we load your households..." 
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="Households">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">My Households</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your households and their members
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
          >
            Create Household
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 text-sm">{message.text}</div>
            </div>
          </div>
        )}

        {/* Create Household Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Create New Household</h2>
                
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Household Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      placeholder="Enter household name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Describe your household"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-2">
                      Currency
                    </label>
                    <select
                      id="currency"
                      value={createForm.currency}
                      onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value as Currency })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    >
                      <option value={Currency.ILS}>₪ ILS - New Israeli Shekel</option>
                      <option value={Currency.USD}>$ USD - US Dollar</option>
                      <option value={Currency.EUR}>€ EUR - Euro</option>
                      <option value={Currency.GBP}>£ GBP - British Pound</option>
                      <option value={Currency.CAD}>C$ CAD - Canadian Dollar</option>
                      <option value={Currency.AUD}>A$ AUD - Australian Dollar</option>
                      <option value={Currency.JPY}>¥ JPY - Japanese Yen</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                    >
                      {isCreating ? 'Creating...' : 'Create Household'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 shadow-none h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingCard key={i} lines={4} />
            ))}
          </div>
        ) : (
          <>
            {/* Households Grid */}
            {households.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {households.map((household) => {
                  const userRole = getUserRole(household);
                  return (
                    <div key={household.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">{household.name}</h3>
                          {household.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{household.description}</p>
                          )}
                        </div>
                        {userRole && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-3 ${getRoleColor(userRole)}`}>
                            {userRole}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Currency:</span>
                          <span className="font-medium text-slate-900">{household.currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Members:</span>
                          <span className="font-medium text-slate-900">{household.members?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Created:</span>
                          <span className="font-medium text-slate-900">
                            {new Date(household.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={() => router.push(`/households/${household.id}`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                        >
                          Manage
                        </Button>
                        {userRole && userRole !== HouseholdRole.OWNER && (
                          <Button
                            onClick={() => handleLeaveHousehold(household.id)}
                            className="bg-red-600 hover:bg-red-700 text-white h-10 px-4"
                          >
                            Leave
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No households yet</h3>
                <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                  Create your first household to start tracking expenses with your family or roommates.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Your First Household
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 