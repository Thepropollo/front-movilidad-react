import React, { useEffect, useState } from 'react';
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
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [importantUnreadCount, setImportantUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const applyPayload = (data: AlertsPayload | null) => {
    setAlerts(data?.alerts ?? []);
    setUnreadCount(data?.unread_count ?? 0);
    setImportantUnreadCount(data?.important_unread_count ?? 0);
  };

  const fetchAlerts = () => {
    setLoading(true);
    api
      .get('/alertas')
      .then(({ data }) => applyPayload(data))
      .catch(() => applyPayload(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api
      .get('/alertas')
      .then(({ data }) => applyPayload(data))
      .catch(() => applyPayload(null))
      .finally(() => setLoading(false));
  }, []);

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
      fetchAlerts();
    }
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        importantUnreadCount,
        loading,
        refresh: fetchAlerts,
        markRead,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};
