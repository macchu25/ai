import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { ENDPOINTS } from '../constants/config';
import { useAuthStore } from '../store/authStore';

interface AlertState {
  [cameraId: string]: boolean;
}

interface WSContextType {
  alertState: AlertState;
  connected: boolean;
  clearAlert: (cameraId: string) => void;
}

const WSContext = createContext<WSContextType>({
  alertState: {},
  connected: false,
  clearAlert: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.user?.token);
  const [alertState, setAlertState] = useState<AlertState>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(ENDPOINTS.websocket);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'alert') {
          setAlertState((prev) => ({ ...prev, [data.camera_id]: true }));
        }
      } catch (_) {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 5000);
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearAlert = (cameraId: string) =>
    setAlertState((prev) => ({ ...prev, [cameraId]: false }));

  return (
    <WSContext.Provider value={{ alertState, connected, clearAlert }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWebSocket = () => useContext(WSContext);
