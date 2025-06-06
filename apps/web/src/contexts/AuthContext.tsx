import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import supabase from '@/lib/supabaseClient';
import { invalidateHouseholdsCache } from '@/lib/householdsCache';

interface AuthResponse {
  error: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        const previousUser = user;
        const newUser = newSession?.user ?? null;
        
        setSession(newSession);
        setUser(newUser);
        
        // Only invalidate cache on specific events to prevent loops
        if (event === 'SIGNED_OUT') {
          // Clear cache completely on logout
          invalidateHouseholdsCache();
          console.log('🗑️ AUTH: Cache invalidated on sign out');
        } else if (event === 'SIGNED_IN' && previousUser?.id !== newUser?.id) {
          // Only invalidate on sign in if it's a different user
          if (newUser) {
            invalidateHouseholdsCache(newUser.id);
            console.log('🗑️ AUTH: Cache invalidated on sign in for new user');
          }
        }
        // Remove TOKEN_REFRESHED invalidation to prevent loops
        
        // No longer loading after first auth state change
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Remove user dependency to prevent loops

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Cache will be invalidated by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAccessToken = (): string | null => {
    return session?.access_token ?? null;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
