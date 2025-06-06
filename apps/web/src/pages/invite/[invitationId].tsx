import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@homebudget/ui';

export default function InvitationPage() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const { invitationId } = router.query;
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth with invitation ID in state
      router.push(`/auth?redirect=/invite/${invitationId}`);
    }
  }, [user, loading, router, invitationId]);

  const handleAcceptInvitation = async () => {
    if (!invitationId || !session) return;

    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }

      setSuccess(true);
      
      // Redirect to households page after a short delay
      setTimeout(() => {
        router.push('/households');
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h1>
          <p className="text-gray-600 mb-4">
            You have successfully joined the household. Redirecting to your households...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Household Invitation</h1>
          <p className="text-gray-600">
            You&apos;ve been invited to join a household. Click below to accept the invitation.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
          
          <Button
            onClick={() => router.push('/households')}
            disabled={isAccepting}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 