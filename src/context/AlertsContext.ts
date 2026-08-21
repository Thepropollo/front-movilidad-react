import { createContext, useContext } from 'react';

export interface AlertItem {
  id: number;
  type: string;
  severity: 'alta' | 'media' | 'baja';
  title: string;
  message: string;
  route: string | null;
  created_at: string;
  read: boolean;
}

export interface AlertsContextValue {
  alerts: AlertItem[];
  unreadCount: number;
  importantUnreadCount: number;
  loading: boolean;
  refresh: () => void;
  markRead: (id: number) => Promise<void>;
}

export const AlertsContext = createContext<AlertsContextValue | undefined>(
  undefined
);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts debe usarse dentro de un AlertsProvider');
  }
  return context;
};
