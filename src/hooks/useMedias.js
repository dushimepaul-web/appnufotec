import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { adaptMedia } from '../utils/adapters';

function categorieFor(type, category) {
  if (category) return category;
  if (type === 'pdf') return 'fichier';
  if (type && type !== 'all') return type;
  return undefined;
}

export function useMedias({ type = 'all', limit = 20, category, q } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const inFlight = useRef(false);
  const requestId = useRef(0);

  const fetchData = useCallback(async (reset = false) => {
    if (inFlight.current && !reset) return;
    inFlight.current = true;
    const id = ++requestId.current;
    const page = reset ? 1 : pageRef.current + 1;

    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      const res = await api.getMedias({
        page,
        perPage: limit,
        categorie: categorieFor(type, category),
        q,
      });
      if (id !== requestId.current) return;
      if (res?.success) {
        const items = (res.data?.items || []).map((item) => adaptMedia(item));
        setData((prev) => (reset ? items : [...prev, ...items]));
        const meta = res.data?.meta;
        setHasMore(meta ? meta.page < meta.pages : false);
        pageRef.current = page;
      }
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e.message);
    } finally {
      if (id !== requestId.current) return;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  }, [type, limit, category, q]);

  useEffect(() => {
    pageRef.current = 0;
    Promise.resolve().then(() => {
      setData([]);
      setHasMore(true);
      fetchData(true);
    });
  }, [fetchData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    pageRef.current = 0;
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
    if (!identifier) {
      Promise.resolve().then(() => {
        setData(null);
        setComments([]);
        setSimilar([]);
        setError(null);
        setLoading(false);
      });
      return;
    }
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setData(null);
      setComments([]);
      setSimilar([]);
      setError(null);
      try {
        const res = await api.getMedia(identifier);
        if (!cancelled) {
          if (res?.success) {
            const media = adaptMedia(res.data, true);
            setData(media);
            setSimilar(media?.similar || []);
          } else {
            setError(res?.message || 'Média introuvable.');
          }
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
      const res = await api.searchMedia(q);
      if (res?.success) setResults((res.data?.items || []).map((item) => adaptMedia(item)));
    } catch {}
    finally { setLoading(false); }
  }, []);

  return { results, loading, query, search };
}

export function usePopular() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPopular(20)
      .then((res) => { if (res?.success) setData((res.data?.items || []).map((item) => adaptMedia(item))); })
      .catch((e) => { setError(e.message); })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useCategories() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.getCategories()
      .then((res) => { if (res?.success) setData(res.data || []); })
      .catch(() => {});
  }, []);
  return { data };
}

export function useRecent(limit = 20) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getRecent(limit);
      if (res?.success) setData((res.data?.items || []).map((item) => adaptMedia(item)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
