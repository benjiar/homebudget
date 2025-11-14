import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button, LoadingPage, LoadingCard } from '@homebudget/ui';
import { Layout } from '@/components/Layout';
import {
  Household,
  HouseholdRole
} from '@homebudget/types';
import InviteMemberModal from '../../components/InviteMemberModal';

export default function HouseholdDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Load household data
  useEffect(() => {
    if (id && user) {
      loadHousehold();
    }
  }, [id, user]);

  const loadHousehold = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/households/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load household');
      }

      const data = await response.json();
      setHousehold(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load household'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRole = (): HouseholdRole | null => {
    if (!household || !user) return null;
    const membership = household.members?.find(m => m.user_id === user.id);
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

  const canInviteMembers = (): boolean => {
    const role = getUserRole();
    return role === HouseholdRole.OWNER || role === HouseholdRole.ADMIN;
  };

  const handleInviteSent = () => {
    setMessage({ type: 'success', text: 'Invitation sent successfully!' });
    loadHousehold();
  };

  // Loading state
  if (loading) {
    return (
      <LoadingPage
        title="Loading"
        subtitle="Please wait while we load your data..."
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title={household?.name || 'Household'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center w-full sm:w-auto">
            <Button
              onClick={() => router.push('/households')}
              className="mr-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 shadow-none"
              aria-label="Go back to households"
            >
              ← Back
            </Button>
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                </div>
              ) : household ? (
                <>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 truncate">
                    {household.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 truncate">
                    {household.description || 'No description'}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success'
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

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'members', label: 'Members', icon: '👥' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingCard lines={5} />
            <LoadingCard lines={4} />
          </div>
        ) : household ? (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Household Info</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Name:</span>
                      <span className="font-medium text-slate-900">{household.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Currency:</span>
                      <span className="font-medium text-slate-900">{household.currency}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Members:</span>
                      <span className="font-medium text-slate-900">{household.members?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Created:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(household.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Your Role:</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(getUserRole()!)}`}>
                        {getUserRole()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push(`/receipts?household=${id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                    >
                      <span className="flex items-center space-x-3">
                        <span>📄</span>
                        <span>View Receipts</span>
                      </span>
                    </Button>
                    <Button
                      onClick={() => router.push(`/categories?household=${id}`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white justify-start"
                    >
                      <span className="flex items-center space-x-3">
                        <span>📂</span>
                        <span>Manage Categories</span>
                      </span>
                    </Button>
                    <Button
                      onClick={() => router.push(`/budget?household=${id}`)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white justify-start"
                    >
                      <span className="flex items-center space-x-3">
                        <span>💰</span>
                        <span>Budget Overview</span>
                      </span>
                    </Button>
                    <Button
                      onClick={() => router.push(`/reports?household=${id}`)}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white justify-start"
                    >
                      <span className="flex items-center space-x-3">
                        <span>📊</span>
                        <span>View Reports</span>
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-slate-900">Members</h3>
                  {canInviteMembers() && (
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                      Invite Member
                    </Button>
                  )}
                </div>
                <div className="divide-y divide-slate-200">
                  {household.members?.map((member) => (
                    <div key={member.id} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {member.user?.avatar_url ? (
                            <img
                              src={member.user.avatar_url}
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="text-slate-700 text-sm font-medium">
                                {member.user?.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {member.user?.full_name || member.user?.email}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        {member.role !== HouseholdRole.OWNER && member.user_id !== user.id && canInviteMembers() && (
                          <Button
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Household Settings</h3>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-md font-medium text-red-900 mb-3">Danger Zone</h4>
                    <p className="text-sm text-slate-600 mb-4">
                      {getUserRole() === HouseholdRole.OWNER
                        ? 'Permanently delete this household and all its data.'
                        : 'Leave this household.'
                      }
                    </p>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {getUserRole() === HouseholdRole.OWNER ? 'Delete Household' : 'Leave Household'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-500">Household not found</div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        householdId={id as string}
        onInviteSent={handleInviteSent}
      />
    </Layout>
  );
} 