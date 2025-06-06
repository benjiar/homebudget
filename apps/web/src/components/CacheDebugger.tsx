import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { householdsCache } from '@/lib/householdsCache';

export const CacheDebugger: React.FC<{ showDebug?: boolean }> = ({ showDebug = false }) => {
  const { user } = useAuth();
  const [cacheStatus, setCacheStatus] = useState<{
    isStale: boolean;
    requestCount: number;
    lastUpdate: string;
  }>({ isStale: true, requestCount: 0, lastUpdate: 'Never' });

  useEffect(() => {
    if (!showDebug || !user) return;

    let requestCount = 0;
    const originalGet = householdsCache.get;
    
    // Monitor cache requests
    householdsCache.get = async (userId: string, accessToken: string) => {
      requestCount++;
      setCacheStatus(prev => ({
        ...prev,
        requestCount,
        lastUpdate: new Date().toLocaleTimeString(),
        isStale: householdsCache.isStale(userId)
      }));
      
      return originalGet.call(householdsCache, userId, accessToken);
    };

    const interval = setInterval(() => {
      if (user) {
        setCacheStatus(prev => ({
          ...prev,
          isStale: householdsCache.isStale(user.id)
        }));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      householdsCache.get = originalGet;
    };
  }, [showDebug, user]);

  if (!showDebug) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="text-green-400 font-bold mb-2">🏠 Cache Debug</div>
      <div>Requests: {cacheStatus.requestCount}</div>
      <div>Is Stale: {cacheStatus.isStale ? '❌' : '✅'}</div>
      <div>Last Update: {cacheStatus.lastUpdate}</div>
      <div className="text-xs text-slate-400 mt-2">
        {cacheStatus.requestCount > 10 ? '⚠️ Too many requests!' : '✅ Healthy'}
      </div>
    </div>
  );
}; 