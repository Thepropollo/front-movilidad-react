import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { AlertsContext, type AlertItem } from './AlertsContext';

interface AlertsPayload {
  alerts?: AlertItem[];
  unread_count?: number;
  important_unread_count?: number;
}

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [importantUnreadCount, setImportantUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  const applyPayload = useCallback((data: AlertsPayload | null) => {
    setAlerts(data?.alerts ?? []);
    setUnreadCount(data?.unread_count ?? 0);
    setImportantUnreadCount(data?.important_unread_count ?? 0);
  }, []);

  const fetchAlerts = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api
      .get('/alertas')
      .then(({ data }) => applyPayload(data))
      .catch(() => applyPayload(null))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [applyPayload]);

  useEffect(() => {
    fetchAlerts(!firstLoad.current);
    firstLoad.current = false;
  }, [fetchAlerts, location.pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => fetchAlerts(true), 20000);
    const onFocus = () => fetchAlerts(true);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAlerts]);

  const markRead = async (id: number) => {
    const target = alerts.find((a) => a.id === id);
    if (!target || target.read) return;

    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    if (target.severity === 'alta') {
      setImportantUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      await api.post(`/alertas/${id}/leida`);
    } catch {
      fetchAlerts(true);
    }
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        importantUnreadCount,
        loading,
        refresh: () => fetchAlerts(true),
        markRead,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};
