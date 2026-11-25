import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { adaptMedia } from '../utils/adapters';

// Catégories API pour un onglet. L'onglet « Vidéos » couvre aussi les liens
// (catégorie "link"), qui contiennent les vidéos YouTube : l'API n'accepte
// qu'une catégorie par requête, on interroge donc chacune puis on fusionne.
function categoriesFor(type, category) {
  if (category) return [category];
  if (type === 'pdf') return ['fichier'];
  if (type === 'video') return ['video', 'link'];
  if (type && type !== 'all') return [type];
  return [undefined];
}

const byDateDesc = (a, b) => String(b.created_at || b.date || '').localeCompare(String(a.created_at || a.date || ''));

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

  const fetchData = useCallback(async (reset = false, force = false) => {
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
      const cats = categoriesFor(type, category);
      // Première page : la copie gardée s'affiche tout de suite (une seule catégorie), puis la version à jour.
      const onCached = reset && cats.length === 1 ? (cached) => {
        if (id !== requestId.current || !cached?.success) return;
        setData((cached.data?.items || []).map((item) => adaptMedia(item)));
        setLoading(false);
      } : undefined;
      const responses = await Promise.all(cats.map((categorie) => (
        api.getMedias({ page, perPage: limit, categorie, q }, { onCached, force })
      )));
      if (id !== requestId.current) return;
      const ok = responses.filter((res) => res?.success);
      if (ok.length > 0) {
        let items = ok.flatMap((res) => (res.data?.items || []).map((item) => adaptMedia(item)));
        if (cats.length > 1) items = items.sort(byDateDesc);
        setData((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(ok.some((res) => {
          const meta = res.data?.meta;
          return meta ? meta.page < meta.pages : false;
        }));
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
    fetchData(true, true);
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

  const lastRequest = useRef(0);

  const search = useCallback(async (q) => {
    setQuery(q);
    const id = ++lastRequest.current;
    if (!q || q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.searchMedia(q);
      // Ignore les réponses d'une frappe précédente arrivées en retard.
      if (id !== lastRequest.current) return;
      if (res?.success) setResults((res.data?.items || []).map((item) => adaptMedia(item)));
    } catch {}
    finally { if (id === lastRequest.current) setLoading(false); }
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
      const show = (res) => {
        if (res?.success) setData((res.data?.items || []).map((item) => adaptMedia(item)));
      };
      show(await api.getRecent(limit, { onCached: (cached) => { show(cached); setLoading(false); } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
