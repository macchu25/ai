import { useState, useEffect, useRef } from 'react';

export function useDashboardSocket(apiBase: string, token: string, onSubscriptionUpdate?: (payload?: any) => Promise<void> | void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const [alertState, setAlertState] = useState<Record<string, boolean>>({});
  const onSubscriptionUpdateRef = useRef(onSubscriptionUpdate);

  useEffect(() => {
    onSubscriptionUpdateRef.current = onSubscriptionUpdate;
  }, [onSubscriptionUpdate]);

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
          } else if (eventType === 'local_warning') {
            console.log('%c[Socket] Local Warning Triggered! 🔊', 'color: #ef4444; font-weight: bold;');
            // Play a synthetic alarm sound
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playSiren = (timeOffset: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, ctx.currentTime + timeOffset);
                osc.frequency.setValueAtTime(1200, ctx.currentTime + timeOffset + 0.25);
                gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
                gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + timeOffset + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + timeOffset + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + timeOffset);
                osc.stop(ctx.currentTime + timeOffset + 0.5);
            };
            // Beep 3 times
            playSiren(0);
            playSiren(0.6);
            playSiren(1.2);
            
            setAlertState(prev => ({...prev, [data.camera_id]: true}));
          } else if (eventType === 'subscription_updated') {
            console.log('%c[Socket] Subscription Updated! 🚀', 'color: #3b82f6; font-weight: bold;');
            if (onSubscriptionUpdateRef.current) onSubscriptionUpdateRef.current(data.payload);
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
