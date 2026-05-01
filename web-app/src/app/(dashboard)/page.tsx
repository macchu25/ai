"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Components
import Footer from '@/components/Footer';
import HeroSection from '@/components/dashboard/HeroSection';
import LiveCameraSection from '@/components/dashboard/LiveCameraSection';
import MedicalSection from '@/components/dashboard/MedicalSection';
import FeedbackSection from '@/components/dashboard/FeedbackSection';

// Styles
import '@/app/dashboard.css';

import { useDashboardSocket } from '@/hooks/useDashboardSocket';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cameras, setCameras] = useState<any[]>([]);
  
  const token = (session?.user as any)?.accessToken;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  
  const { alertState } = useDashboardSocket(apiBase, token);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && token) {
      const loadCams = async () => {
        try {
          const res = await fetch(`${apiBase}/cameras`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          setCameras(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) { 
          setCameras([]);
        }
      };
      loadCams();
    }
  }, [status, token, router, apiBase]);

  // Memoized Live Stats for performance
  const onlineCams = useMemo(() => {
    const safeCameras = Array.isArray(cameras) ? cameras : [];
    return safeCameras.filter((c: any) => c.status === 'online').length;
  }, [cameras]);

  const activeAlerts = useMemo(() => {
    return Object.values(alertState).filter(v => v).length;
  }, [alertState]);

  return (
    <div className="dashboard-3d-layout" id="tong-quan">
      <HeroSection 
        onlineCams={onlineCams} 
        activeAlerts={activeAlerts} 
      />
      
      <MedicalSection />
      
      <FeedbackSection />
      
      <Footer />
    </div>
  );
}
