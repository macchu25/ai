"use client"

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from '@/app/context/NotificationContext';
import { useDashboardSocket } from '@/hooks/useDashboardSocket';
import { useLanguage } from '@/app/context/LanguageContext';

// Components
import CameraManager from '@/components/dashboard/CameraManager';
import IncidentTable from '@/components/dashboard/IncidentTable';
import WebcamTestModal from '@/components/dashboard/WebcamTestModal';

// Styles
import '@/app/incidents.css';

export default function IncidentsPage() {
  const { showToast, confirm } = useNotification();
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [rtspUrl, setRtspUrl] = useState('');
  const [camName, setCamName] = useState('');
  const [camLocation, setCamLocation] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [editingCamId, setEditingCamId] = useState<string | null>(null);
  const [activeTestCam, setActiveTestCam] = useState<any | null>(null);
  
  const token = session?.user ? (session.user as any).accessToken : '';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  useDashboardSocket(apiBase, token, undefined, () => {
    loadData();
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      loadData();
    }
  }, [status, session, router]);

  const loadData = async () => {
    const token = (session?.user as any)?.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

    try {
      const [camRes, incRes] = await Promise.all([
        fetch(`${apiBase}/cameras`, { headers }),
        fetch(`${apiBase}/incidents`, { headers })
      ]);

      const camData = await camRes.json();
      setCameras(Array.isArray(camData) ? camData : []);

      const incData = await incRes.json();
      if (Array.isArray(incData)) {
        setIncidents(incData.map((item: any) => ({
          id: item.id || item._id,
          camera: item.camera_name || "Camera #"+(item.camera_id?.substring(0,8) || "Unknown"),
          type: item.type || "Cảnh báo",
          conf: item.confidence_score || 0,
          createdAt: item.detected_at ? new Date(item.detected_at).toLocaleString('vi-VN') : "N/A",
          status: item.status === 'active' ? 'Active' : 'Resolved',
          videoUrl: item.video_url || '',
          cloudVideoUrl: item.cloud_video_url || ''
        })));
      }
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast(t('incidents.toastGpsNotSupported'), "error");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`);
          const data = await res.json();
          setCamLocation(data?.display_name || `Vĩ độ: ${latitude.toFixed(5)}, Kinh độ: ${longitude.toFixed(5)}`);
          showToast(t('incidents.toastGpsSuccess'), "success");
        } catch (err) {
          setCamLocation(`Vĩ độ: ${latitude.toFixed(5)}, Kinh độ: ${longitude.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        showToast(t('incidents.toastGpsPermissionDenied'), "error");
        setIsLocating(false);
      }
    );
  };

  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName) return showToast(t('incidents.toastCamNameRequired'), "error");
    
    const token = (session?.user as any)?.accessToken;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    setIsTesting(true);

    try {
      // Check health profile for contacts
      const profileRes = await fetch(`${apiBase}/health-profiles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (!profileData.contacts || profileData.contacts.length === 0) {
        const goToSetup = await confirm(t('incidents.confirmReqMedicalContactTitle'), t('incidents.confirmReqMedicalContactDesc'), t('incidents.confirmReqMedicalContactBtn'), "primary");
        if (goToSetup) router.push('/profile');
        return;
      }

      const res = await fetch(`${apiBase}/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: editingCamId || undefined,
          name: camName,
          location: camLocation || "Mặc định",
          rtsp_url: rtspUrl,
          status: editingCamId ? undefined : "online"
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(editingCamId ? t('incidents.toastCamUpdated') : t('incidents.toastCamAdded'), "success");
        setEditingCamId(null); setCamName(''); setCamLocation(''); setRtspUrl('');
        loadData();
      } else if (res.status === 403 && data.error === "Giới hạn gói cước") {
        const goToUpgrade = await confirm(
          t('incidents.confirmLimitFreeTitle'), 
          data.message || "Bạn đã đạt giới hạn tối đa của gói Free. Vui lòng nâng cấp để thêm nhiều camera hơn.",
          t('incidents.confirmReqMedicalContactBtn'),
          "primary"
        );
        if (goToUpgrade) router.push('/subscription');
      } else {
        showToast(data.message || data.error || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      showToast(t('incidents.toastConnError'), "error");
    } finally {
      setIsTesting(false);
    }
  };

  const toggleCamStatus = async (cam: any) => {
    const token = (session?.user as any)?.accessToken;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const newStatus = cam.status === 'online' ? 'offline' : 'online';
    
    try {
      await fetch(`${apiBase}/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...cam, status: newStatus }),
      });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteCamera = async (cam: any) => {
    const isConfirmed = await confirm(t('profile.confirmDeleteTitle'), t('incidents.confirmDeleteCamDesc').replace('{name}', cam.name));
    if (!isConfirmed) return;

    try {
      const token = (session?.user as any)?.accessToken;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/cameras/${cam.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(t('incidents.toastCamDeleted'), "success");
        loadData();
      }
    } catch (err) { showToast(t('incidents.toastDeleteFailed'), "error"); }
  };

  return (
    <div className="incidents-container pt-10">
      <header className="page-header-premium mb-10">
        <div>
          <h1 className="page-title-premium">{t('incidents.title')}</h1>
          <p className="page-subtitle-premium">
            {t('incidents.subtitle')}
          </p>
        </div>
      </header>
      <div className="stats-row">
          <div className="glass-stat-card">
              <div className="stat-icon alert"><ShieldAlert size={20} /></div>
              <div className="stat-info">
                 <span className="stat-label">{t('incidents.statMonth')}</span>
                 <span className="stat-value">{incidents.length} {t('incidents.incidentsUnit')}</span>
              </div>
          </div>
          <div className="glass-stat-card">
              <div className="stat-icon success"><CheckCircle2 size={20} /></div>
              <div className="stat-info">
                 <span className="stat-label">{t('incidents.statResolved')}</span>
                 <span className="stat-value">{t('incidents.resolvedPercent')}</span>
              </div>
          </div>
        </div>

      <div className="mt-12">
        <div className="mt-10">
        <CameraManager 
          cameras={cameras}
          camName={camName} setCamName={setCamName}
          camLocation={camLocation} setCamLocation={setCamLocation}
          rtspUrl={rtspUrl} setRtspUrl={setRtspUrl}
          isTesting={isTesting} isLocating={isLocating}
          editingCamId={editingCamId} setEditingCamId={setEditingCamId}
          handleGetLocation={handleGetLocation}
          handleSaveCamera={handleSaveCamera}
          toggleCamStatus={toggleCamStatus}
          handleDeleteCamera={handleDeleteCamera}
          onOpenWebcamTest={setActiveTestCam}
          token={token}
          onRefreshData={loadData}
        />
      </div>

      <div className="mt-10">
        <IncidentTable 
          incidents={incidents} 
          onExport={() => showToast(t('incidents.exportInfo'), "info")} 
        />
      </div>

      {activeTestCam && (
        <WebcamTestModal 
          camera={activeTestCam} 
          onClose={() => {
            setActiveTestCam(null);
            loadData();
          }} 
          token={token}
        />
      )}
    </div>
  </div>
  );
}
