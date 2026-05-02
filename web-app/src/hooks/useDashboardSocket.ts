import { useState, useEffect, useRef } from 'react';

export function useDashboardSocket(apiBase: string, token: string, onSubscriptionUpdate?: () => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const [alertState, setAlertState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) return;

    const connectWS = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const wsUrl = `${apiBase.replace('http', 'ws').replace('/api/v1', '')}/ws?token=${token}`;
      console.log(`[Socket] Connecting to secure WebSocket...`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('%c[Socket] Connected ✅', 'color: #10b981; font-weight: bold;');
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
      };
      
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          // Match by event OR type (backend uses Type for messages)
          const eventType = data.event || data.type;

          if (eventType === 'alert') {
            setAlertState(prev => ({...prev, [data.camera_id]: true}));
          } else if (eventType === 'clear_alert') {
            setAlertState(prev => ({...prev, [data.camera_id]: false}));
          } else if (eventType === 'subscription_updated') {
            console.log('%c[Socket] Subscription Updated! 🚀', 'color: #3b82f6; font-weight: bold;');
            if (onSubscriptionUpdate) onSubscriptionUpdate();
          }
        } catch(err) {
          console.error('[Socket] Message Parse Error');
        }
      };

      ws.onclose = () => {
        console.log('[Socket] Closed. Retrying in 5s...');
        wsRef.current = null;
        reconnectRef.current = setTimeout(connectWS, 5000);
      };
    };

    const initialTimer = setTimeout(connectWS, 1000);

    return () => {
      clearTimeout(initialTimer);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [apiBase, token]);

  return { alertState, setAlertState };
}
