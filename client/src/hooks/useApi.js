// SMART ECCD – Generic API Hook

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for API calls with loading/error state.
 *
 * @param {Function} apiFn - Async function that returns an axios response
 * @param {Array} deps - Effect dependencies (re-fetches when these change)
 * @param {boolean} immediate - Whether to call on mount (default true)
 */
const useApi = (apiFn, deps = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => {
    if (immediate) execute();
  }, [immediate, ...deps]); // eslint-disable-line

  return { data, loading, error, refetch: execute };
};

export default useApi;
