import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

export function useTemoignages() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      }
      const response = await api.getTestimonials();
      if (response?.success === false) throw new Error(response.message || 'Réponse invalide');
      const items = Array.isArray(response?.data) ? response.data : [];
      setData(items.map((item, index) => ({ ...item, id: item.id ?? index })));
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les témoignages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { Promise.resolve().then(() => load(true)); }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { data, loading, refreshing, loadingMore: false, error, hasMore: false, refresh, loadMore: () => {} };
}
