"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Components
import Footer from '@/components/Footer';
import HeroSection from '@/components/dashboard/HeroSection';
import MedicalSection from '@/components/dashboard/MedicalSection';
import StatsSection from '@/components/dashboard/StatsSection';
import FeedbackSection from '@/components/dashboard/FeedbackSection';

// Styles
import '../dashboard.css';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [alertState, setAlertState] = useState<Record<string, boolean>>({});

  // Memoized Live Stats for performance
  const onlineCams = useMemo(() => {
    const safeCameras = Array.isArray(cameras) ? cameras : [];
    return safeCameras.filter((c: any) => c.status === 'online').length;
  }, [cameras]);

  const activeAlerts = useMemo(() => {
    return Object.values(alertState).filter(v => v).length;
  }, [alertState]);

  useEffect(() => {
    // Auth Guard
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user) {
      const token = (session.user as any).accessToken;

      // 1. Load Cameras Initial State
      const loadCams = async () => {
        try {
          const res = await fetch('http://localhost:8080/api/v1/cameras', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to fetch cameras');
          const data = await res.json();
          setCameras(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) { 
          console.error('[Dashboard] Camera fetch error:', err); 
          setCameras([]);
        }
      };
      
      loadCams();

      // 2. Real-time Alerts via WebSocket
      const connectWS = () => {
        // Prevent double connection if one is already active or connecting
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
          return;
        }

        const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        const wsUrl = `ws://${host}:8080/ws`;
        
        console.log(`[Dashboard] Attempting connection to ${wsUrl}...`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('%c[Dashboard] WebSocket Connected ✅', 'color: #10b981; font-weight: bold;');
          if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };
        
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'alert') {
              setAlertState(prev => ({...prev, [data.camera_id]: true}));
            }
          } catch(err) {
            console.error('[Dashboard] WS Message Parse Error');
          }
        };

        ws.onerror = (err) => {
          // Only log error if we don't have an active connection
          if (ws.readyState !== WebSocket.OPEN) {
             console.warn('[Dashboard] WebSocket connection could not be established.');
          }
        };
        
        ws.onclose = () => {
          console.log('[Dashboard] WebSocket Closed. Retrying in 5s...');
          wsRef.current = null;
          reconnectRef.current = setTimeout(connectWS, 5000);
        };
      };

      // Small delay to ensure clean mount
      const initialTimer = setTimeout(connectWS, 1000);

      return () => {
        clearTimeout(initialTimer);
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        if (wsRef.current) {
          wsRef.current.onclose = null; // Prevent reconnect on unmount
          wsRef.current.close();
        }
      };
    }
  }, [status, session, router]);

  return (
    <div className="dashboard-3d-layout" id="tong-quan">
      <HeroSection 
        onlineCams={onlineCams} 
        activeAlerts={activeAlerts} 
      />

      
      <MedicalSection />
      
      <StatsSection />
      
      <FeedbackSection />
      
      <Footer />
    </div>
  );
}
