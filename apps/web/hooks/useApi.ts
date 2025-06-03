import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions<T, Args extends any[]> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi<T, Args extends any[]>(
  apiCall: (...args: Args) => Promise<T>,
  options: UseApiOptions<T, Args> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (...args: Args) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall(...args);
      setData(result);
      options.onSuccess?.(result);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options.onError?.(error);
      toast.error(options.errorMessage || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, options]);

  return {
    data,
    error,
    isLoading,
    execute,
  };
} 