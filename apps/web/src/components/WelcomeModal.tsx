import { useState } from 'react';
import { useRouter } from 'next/router';
import { Modal, Button } from '@homebudget/ui';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasNoHouseholds?: boolean; // Indicates if this is a required action
}

export default function WelcomeModal({ isOpen, onClose, hasNoHouseholds = false }: WelcomeModalProps) {
  const router = useRouter();
  const [invitationId, setInvitationId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateHousehold = () => {
    // Don't close the modal if user has no households (they'll be redirected)
    if (!hasNoHouseholds) {
      onClose();
    }
    router.push('/households');
  };

  const handleJoinInvitation = async () => {
    if (!invitationId.trim()) {
      setError('Please enter an invitation ID');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Extract invitation ID from URL if a full URL is pasted
      let extractedId = invitationId.trim();

      // Check if it's a full URL and extract the ID
      const urlMatch = extractedId.match(/\/invite\/([a-f0-9-]+)/i);
      if (urlMatch) {
        extractedId = urlMatch[1];
      } else {
        // Remove any URL parts, keep only the ID (UUID format)
        extractedId = extractedId.split('/').pop() || extractedId;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(extractedId)) {
        setError('Invalid invitation ID format. Please check your invitation link.');
        setIsJoining(false);
        return;
      }

      // Navigate to the invitation acceptance page
      router.push(`/invite/${extractedId}`);
      // Don't close the modal if user has no households (they'll be redirected)
      if (!hasNoHouseholds) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household');
      setIsJoining(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={hasNoHouseholds ? () => {} : onClose} // Prevent closing if user has no households
      size="lg"
      closeOnOverlayClick={!hasNoHouseholds}
      closeOnEscape={!hasNoHouseholds}
      showCloseButton={!hasNoHouseholds}
    >
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🏠</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Welcome to HomeBudget!
          </h2>
          <p className="text-lg text-slate-600">
            Get started by creating a household or joining an existing one
          </p>
        </div>

        {!showJoinForm ? (
          /* Initial Options */
          <div className="space-y-4">
            <button
              onClick={handleCreateHousehold}
              className="w-full p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold mb-1 flex items-center">
                    <span className="mr-3 text-2xl group-hover:scale-110 transition-transform duration-300">✨</span>
                    Create New Household
                  </div>
                  <p className="text-blue-100 text-sm">
                    Start fresh with your own household
                  </p>
                </div>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold mb-1 flex items-center">
                    <span className="mr-3 text-2xl group-hover:scale-110 transition-transform duration-300">👥</span>
                    Join Existing Household
                  </div>
                  <p className="text-emerald-100 text-sm">
                    Accept an invitation to join a household
                  </p>
                </div>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          /* Join Form */
          <div className="space-y-6">
            <div>
              <label htmlFor="invitationId" className="block text-sm font-medium text-slate-700 mb-2">
                Invitation ID or Link
              </label>
              <input
                type="text"
                id="invitationId"
                value={invitationId}
                onChange={(e) => {
                  setInvitationId(e.target.value);
                  setError(null);
                }}
                placeholder="Enter invitation ID or paste invitation link"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <p className="mt-2 text-sm text-slate-500">
                You can find the invitation ID in the invitation email or link you received
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowJoinForm(false);
                  setInvitationId('');
                  setError(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0"
              >
                Back
              </Button>
              <Button
                onClick={handleJoinInvitation}
                disabled={isJoining || !invitationId.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isJoining ? 'Joining...' : 'Join Household'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

