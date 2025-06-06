import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingPage } from '@homebudget/ui';
import supabase from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth?error=oauth_failed');
          return;
        }

        if (data?.session) {
          // Authentication successful, redirect to dashboard
          router.push('/');
        } else {
          // No session found, redirect to auth page
          router.push('/auth');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/auth?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <LoadingPage 
      title="Completing Authentication" 
      subtitle="Please wait while we complete your Google sign-in..." 
    />
  );
} 