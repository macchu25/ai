"use client"

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from '@/app/context/NotificationContext';

// Components
import CameraManager from '@/components/dashboard/CameraManager';
import IncidentTable from '@/components/dashboard/IncidentTable';

// Styles
import '@/app/incidents.css';

export default function IncidentsPage() {
  const { showToast, confirm } = useNotification();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [rtspUrl, setRtspUrl] = useState('');
  const [camName, setCamName] = useState('');
  const [camLocation, setCamLocation] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [editingCamId, setEditingCamId] = useState<string | null>(null);

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
          type: item.type,
          conf: item.confidence_score || 0,
          createdAt: item.detected_at ? new Date(item.detected_at).toLocaleString('vi-VN') : "N/A",
          status: item.status === 'active' ? 'Active' : 'Resolved'
        })));
      }
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Trình duyệt không hỗ trợ định vị GPS.", "error");
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
          showToast("Đã lấy vị trí!", "success");
        } catch (err) {
          setCamLocation(`Vĩ độ: ${latitude.toFixed(5)}, Kinh độ: ${longitude.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        showToast("Lỗi: Vui lòng cấp quyền vị trí.", "error");
        setIsLocating(false);
      }
    );
  };

  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName) return showToast("Vui lòng nhập tên Camera.", "error");
    
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
        const goToSetup = await confirm("Yêu cầu thông tin Y tế", "Bạn cần thêm ít nhất 1 liên hệ người thân trước.", "Thiết lập ngay", "primary");
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

      if (res.ok) {
        showToast(editingCamId ? "Đã cập nhật!" : "Đã thêm mới!", "success");
        setEditingCamId(null); setCamName(''); setCamLocation(''); setRtspUrl('');
        loadData();
      }
    } catch (err) {
      showToast("Lỗi kết nối.", "error");
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
    const isConfirmed = await confirm("Xác nhận xóa?", `Xóa camera "${cam.name}"?`);
    if (!isConfirmed) return;

    try {
      const token = (session?.user as any)?.accessToken;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/cameras/${cam.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Đã xóa!", "success");
        loadData();
      }
    } catch (err) { showToast("Lỗi xóa.", "error"); }
  };

  return (
    <div className="incidents-container">
      <header className="page-header">
        <div className="header-text">
          <h1 className="title-premium">Lịch Sử Sự Cố & Quản Trị</h1>
          <p className="subtitle">Giám sát và cấu hình hạ tầng camera an ninh thông minh</p>
        </div>
        <div className="stats-row">
          <div className="glass-stat-card">
             <div className="stat-icon alert"><ShieldAlert size={20} /></div>
             <div className="stat-info">
                <span className="stat-label">Sự cố tháng này</span>
                <span className="stat-value">{incidents.length} Vụ việc</span>
             </div>
          </div>
          <div className="glass-stat-card">
             <div className="stat-icon success"><CheckCircle2 size={20} /></div>
             <div className="stat-info">
                <span className="stat-label">Xử lý an toàn</span>
                <span className="stat-value">100%</span>
             </div>
          </div>
        </div>
      </header>

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
      />

      <IncidentTable 
        incidents={incidents} 
        onExport={() => showToast("Đang chuẩn bị dữ liệu...", "info")} 
      />
    </div>
  );
}
