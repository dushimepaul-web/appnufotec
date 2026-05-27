// src/hooks/useMedias.js
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useMedias({ type = 'all', limit = 20, category } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchData = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (!reset && loadingMore) return;

    try {
      reset ? setLoading(true) : setLoadingMore(true);
      const res = await api.getMedias({ type, limit, offset: currentOffset, category });
      if (res.success) {
        const newData = res.data || [];
        setData(prev => reset ? newData : [...prev, ...newData]);
        setHasMore(res.pagination?.has_more ?? false);
        setOffset(currentOffset + limit);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [type, limit, category, offset, loadingMore]);

  useEffect(() => {
    setOffset(0);
    setData([]);
    fetchData(true);
  }, [type, category]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    fetchData(true);
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchData(false);
    }
  }, [hasMore, loadingMore, loading, fetchData]);

  return { data, loading, refreshing, loadingMore, error, hasMore, refresh, loadMore };
}

export function useMedia(identifier) {
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!identifier) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.getMedia(identifier);
        if (!cancelled && res.success) {
          setData(res.data);
          setComments(res.comments || []);
          setSimilar(res.similar || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [identifier]);

  return { data, comments, similar, loading, error };
}

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q) => {
    setQuery(q);
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.search(q);
      if (res.success) setResults(res.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  return { results, loading, query, search };
}

export function usePopular() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPopular(20)
      .then(res => { if (res.success) setData(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useCategories() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.getCategories()
      .then(res => { if (res.success) setData(res.data || []); })
      .catch(() => {});
  }, []);
  return { data };
}
