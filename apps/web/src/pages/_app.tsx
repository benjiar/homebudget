import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '../contexts/HouseholdContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <Component {...pageProps} />
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default MyApp;
