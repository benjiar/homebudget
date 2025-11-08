import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { LoadingPage } from '@homebudget/ui';
import supabase from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let authStateSubscription: { unsubscribe: () => void } | null = null;

    const handleAuthCallback = async () => {
      if (hasProcessed.current) return;

      try {
        // Set up auth state change listener to catch OAuth callback
        // This is the primary way to detect successful OAuth sign-in
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth callback state change:', event, session ? 'Session present' : 'No session');
            
            if (hasProcessed.current) return;

            if (event === 'SIGNED_IN' && session) {
              // Authentication successful
              hasProcessed.current = true;
              if (authStateSubscription) {
                authStateSubscription.unsubscribe();
              }
              router.push('/');
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Token refreshed, user is signed in
              hasProcessed.current = true;
              if (authStateSubscription) {
                authStateSubscription.unsubscribe();
              }
              router.push('/');
            }
          }
        );

        authStateSubscription = subscription;

        // Check current session - Supabase automatically processes hash fragments
        const checkSession = async () => {
          if (hasProcessed.current) return;

          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            hasProcessed.current = true;
            if (authStateSubscription) {
              authStateSubscription.unsubscribe();
            }
            router.push('/auth?error=oauth_failed');
            return;
          }

          if (data?.session) {
            // Session available, redirect to dashboard
            hasProcessed.current = true;
            if (authStateSubscription) {
              authStateSubscription.unsubscribe();
            }
            router.push('/');
          }
        };

        // Check immediately
        await checkSession();

        // Also check after a delay to ensure hash fragments are processed
        timeoutId = setTimeout(async () => {
          if (!hasProcessed.current) {
            await checkSession();
            
            // If still no session after delay, wait a bit more then redirect
            if (!hasProcessed.current) {
              timeoutId = setTimeout(() => {
                if (!hasProcessed.current) {
                  console.warn('OAuth callback timeout - no session found');
                  hasProcessed.current = true;
                  if (authStateSubscription) {
                    authStateSubscription.unsubscribe();
                  }
                  router.push('/auth?error=oauth_failed');
                }
              }, 2000);
            }
          }
        }, 1000);

      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        hasProcessed.current = true;
        if (authStateSubscription) {
          authStateSubscription.unsubscribe();
        }
        router.push('/auth?error=unexpected');
      }
    };

    handleAuthCallback();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, [router]);

  return (
    <LoadingPage 
      title="Completing Authentication" 
      subtitle="Please wait while we complete your Google sign-in..." 
    />
  );
} 