"use client"

import { useState, useEffect } from 'react';
import { PlusCircle, Search, Download, History, ShieldAlert, CheckCircle2, Video, MapPin, Link as LinkIcon, Trash2, Database, LayoutGrid, Pencil, Power, X, Crosshair, Loader2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from '@/app/context/NotificationContext';

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
      const token = (session.user as any).accessToken;
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch real cameras
      fetch('http://localhost:8080/api/v1/cameras', { headers })
        .then(res => res.json())
        .then(data => setCameras(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Lỗi fetch cameras:", err);
          setCameras([]);
        });

      // Fetch real incidents
      fetch('http://localhost:8080/api/v1/incidents', { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mapped = data.map((item: any) => ({
              id: item.id || item._id,
              camera: item.camera_name || "Camera #"+(item.camera_id?.substring(0,8) || "Unknown"),
              type: item.type,
              conf: item.confidence_score || 0,
              createdAt: item.detected_at ? new Date(item.detected_at).toLocaleString('vi-VN') : "N/A",
              status: item.status === 'active' ? 'Active' : 'Resolved'
            }));
            setIncidents(mapped);
          }
        })
        .catch(err => console.error("Lỗi fetch sự cố:", err));
    }
  }, [status, session, router]);

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
          if (data && data.display_name) {
            setCamLocation(data.display_name);
            showToast("Đã tự động lấy địa chỉ!", "success");
          } else {
            setCamLocation(`Vĩ độ: ${latitude.toFixed(5)}, Kinh độ: ${longitude.toFixed(5)}`);
            showToast("Đã lấy tọa độ GPS.", "success");
          }
        } catch (err) {
          setCamLocation(`Vĩ độ: ${latitude.toFixed(5)}, Kinh độ: ${longitude.toFixed(5)}`);
          showToast("Đã lấy tọa độ GPS.", "success");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        showToast("Lỗi: Vui lòng cấp quyền vị trí cho trình duyệt.", "error");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleTestAndAddRTSP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName) return showToast("Vui lòng nhập tên Camera.", "error");
    
    const token = (session?.user as any)?.accessToken;
    if (!token) {
      showToast("Lỗi xác thực: Không tìm thấy Token.", "error");
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    try {
      // 1. Kiểm tra Hồ Sơ Sức Khỏe xem đã có số điện thoại người thân chưa
      let hasContact = false;
      try {
        const profileRes = await fetch('http://localhost:8080/api/v1/health-profiles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.contacts && profileData.contacts.length > 0) {
            hasContact = true;
          }
        }
      } catch (err) {
        console.error("Lỗi fetch health-profiles", err);
      }

      if (!hasContact) {
        const goToSetup = await confirm(
          "Yêu cầu thông tin Y tế",
          "BẮT BUỘC: Hệ thống cần có Số Điện Thoại Người Thân để tự động gọi khi xảy ra sự cố. Vui lòng quay lại trang 'Hồ Sơ Y Tế' và thêm ít nhất 1 liên hệ trước khi cài đặt Camera.",
          "Đến phần setup",
          "primary"
        );
        if (goToSetup) {
          router.push('/profile');
        }
        setIsTesting(false);
        return;
      }

      // 2. Tiếp tục thêm Camera nếu hợp lệ
      const body: any = {
        name: camName,
        location: camLocation || "Mặc định",
        rtsp_url: rtspUrl,
        status: editingCamId ? undefined : "online" // Don't overwrite status if editing
      };

      if (editingCamId) {
        body.id = editingCamId;
      }

      const res = await fetch('http://localhost:8080/api/v1/cameras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        showToast("Phiên làm việc đã hết hạn.", "error");
        return;
      }
      if (res.ok) {
        showToast(editingCamId ? "Đã cập nhật camera!" : "Đã lưu camera mới!", "success");
        setEditingCamId(null);
        setCamName('');
        setCamLocation('');
        setRtspUrl('');
        window.location.reload();
      }
    } catch (err) {
      showToast("Lỗi kết nối Backend.", "error");
    } finally {
      setIsTesting(false);
    }
  };

  const toggleCamStatus = async (cam: any) => {
    const token = (session?.user as any)?.accessToken;
    const newStatus = cam.status === 'online' ? 'offline' : 'online';
    
    try {
      await fetch('http://localhost:8080/api/v1/cameras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...cam,
          status: newStatus
        }),
      });
      setCameras(prev => prev.map(c => c.id === cam.id ? {...c, status: newStatus} : c));
    } catch (err) {
      console.error("Lỗi toggle status:", err);
    }
  };

  const startEditing = (cam: any) => {
    setEditingCamId(cam.id);
    setCamName(cam.name);
    setCamLocation(cam.location);
    setRtspUrl(cam.rtsp_url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <span className="stat-value">24 Vụ việc</span>
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

      {/* Camera Infrastructure Section */}
      <section className="infrastructure-section">
        <div className="glass-card-premium config-panel">
          <div className="card-header-row">
             <div className="header-main">
                <LayoutGrid size={20} color="var(--accent)" />
                <h3>{editingCamId ? 'Cập nhật Camera' : 'Thiết lập Camera Mới'}</h3>
             </div>
             {editingCamId && (
               <button className="btn-cancel-edit" onClick={() => {
                 setEditingCamId(null);
                 setCamName('');
                 setCamLocation('');
                 setRtspUrl('');
               }}>
                 <X size={16} /> Hủy chỉnh sửa
               </button>
             )}
          </div>
          
          <form onSubmit={handleTestAndAddRTSP} className="premium-form-grid">
            <div className="input-field">
              <Video size={18} className="field-icon" />
              <input 
                placeholder="Tên Camera" 
                value={camName} onChange={e => setCamName(e.target.value)}
              />
            </div>
            <div className="input-field">
              <MapPin size={18} className="field-icon" />
              <input 
                placeholder="Vị trí lắp đặt" 
                value={camLocation} onChange={e => setCamLocation(e.target.value)}
              />
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="btn-locate"
                title="Tự động lấy vị trí hiện tại"
              >
                {isLocating ? <Loader2 size={16} className="spin" /> : <Crosshair size={16} />}
              </button>
            </div>
            <div className="input-field wide">
              <LinkIcon size={18} className="field-icon" />
              <input 
                placeholder="RTSP Stream URL (Rỗng nếu dùng WebCam)" 
                value={rtspUrl} onChange={e => setRtspUrl(e.target.value)}
              />
            </div>
            <button type="submit" className={`btn-save-config ${editingCamId ? 'editing' : ''}`} disabled={isTesting}>
              {isTesting ? 'Đang xử lý...' : (editingCamId ? 'Cập nhật ngay' : 'Thêm Camera Mới')}
            </button>
          </form>

          <div className="active-devices-list">
            <div className="list-title">Danh sách Device đang online:</div>
             <div className="device-chips">
              {cameras.map((cam: any) => (
                <div key={cam.id} className={`device-chip ${cam.status}`}>
                  <div className={`indicator ${cam.status === 'online' ? 'pulse' : ''}`}></div>
                  <div className="chip-content">
                    <span className="name">{cam.name}</span>
                    <span className="loc">{cam.location}</span>
                  </div>
                  <div className="chip-actions">
                    <button onClick={() => toggleCamStatus(cam)} className={`action-btn power ${cam.status}`} title="Bật/Tắt Camera">
                      <Power size={14} />
                    </button>
                    <button onClick={() => startEditing(cam)} className="action-btn edit" title="Sửa tên/địa chỉ">
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={async () => {
                        const isConfirmed = await confirm(
                          "Xác nhận xóa?",
                          `Bạn có chắc chắn muốn xóa camera "${cam.name}"? Hành động này không thể hoàn tác.`
                        );

                        if (isConfirmed) {
                          try {
                            const token = (session?.user as any)?.accessToken;
                            const res = await fetch(`http://localhost:8080/api/v1/cameras/${cam.id}`, { 
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                              showToast(`Đã xóa camera ${cam.name}`, "success");
                              setCameras(prev => prev.filter(c => c.id !== cam.id));
                            } else {
                              showToast("Không thể xóa camera.", "error");
                            }
                          } catch (err) {
                            showToast("Lỗi kết nối khi xóa.", "error");
                          }
                        }
                      }}
                      className="action-btn delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* History Table Section */}
      <section className="history-section">
        <div className="table-header-row">
          <div className="header-main">
             <Database size={20} />
             <h2>Nhật ký vận hành</h2>
          </div>
          <button onClick={() => showToast("Đang chuẩn bị dữ liệu...", "info")} className="btn-export">
             <Download size={18} />
             <span>Xuất CSV</span>
          </button>
        </div>

        <div className="premium-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Mã sự cố</th>
                <th>Thiết bị</th>
                <th>Loại hình</th>
                <th>Độ tin cậy</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident, idx) => (
                <tr key={idx}>
                  <td><span className="id-pill">#{incident.id?.substring(0,8)}</span></td>
                  <td>
                    <div className="device-cell">
                      <div className="device-dot"></div>
                      {incident.camera}
                    </div>
                  </td>
                  <td>
                     <span className={`type-badge ${incident.type.toLowerCase()}`}>
                        {incident.type}
                     </span>
                  </td>
                  <td>
                    <div className="confidence-track">
                       <div className="confidence-label">{(incident.conf * 100).toFixed(0)}%</div>
                       <div className="progress-bg">
                          <div className="progress-fill" style={{ width: `${incident.conf * 100}%` }}></div>
                       </div>
                    </div>
                  </td>
                  <td className="time-cell">{incident.createdAt}</td>
                  <td>
                    <div className={`status-pill ${incident.status.toLowerCase()}`}>
                       <div className="pulse-dot"></div>
                       {incident.status === 'Active' ? 'Đang xử lý' : 'Đã hoàn thành'}
                    </div>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    Chưa có nhật ký sự cố nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .incidents-container {
          padding: 20px;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          gap: 20px;
        }

        .title-premium {
          font-size: 2.2rem;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          font-size: 1rem;
        }

        .stats-row {
          display: flex;
          gap: 16px;
        }

        .glass-stat-card {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 20px 24px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 200px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.alert { background: #fef2f2; color: #ef4444; }
        .stat-icon.success { background: #f0fdf4; color: #22c55e; }

        .stat-label { font-size: 0.75rem; color: #64748b; display: block; }
        .stat-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; }

        /* Infrastructure Config */
        .glass-card-premium {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 32px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.04);
        }

        .card-header-row { margin-bottom: 24px; }
        .header-main { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #1e293b; font-size: 1.1rem; }
        .header-main h3, .header-main h2 { margin: 0; font-size: inherit; }

        .premium-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr auto;
          gap: 16px;
          margin-bottom: 30px;
        }

        .input-field {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          padding: 0 16px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-field:focus-within {
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .field-icon {
          color: #94a3b8;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .input-field input {
          flex: 1;
          width: 100%;
          border: none;
          background: transparent;
          padding: 14px 0;
          font-size: 0.95rem;
          color: #1e293b;
          outline: none;
        }

        .btn-locate {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-locate:hover {
          background: #3b82f6;
          color: white;
          transform: scale(1.05);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .btn-save-config {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0 32px;
          border-radius: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
        }

        .btn-save-config:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .active-devices-list {
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          padding-top: 24px;
        }

        .list-title { font-size: 0.85rem; color: #64748b; margin-bottom: 16px; font-weight: 600; }
        .device-chips { display: flex; gap: 12px; flex-wrap: wrap; }

        .device-chip {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 8px 12px 8px 16px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }

        .indicator { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
        .device-chip.online .indicator { background: #10b981; }
        .indicator.pulse { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .chip-content { display: flex; flex-direction: column; }
        .device-chip .name { font-size: 0.9rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
        .device-chip .loc { font-size: 0.7rem; color: #64748b; }

        .chip-actions { display: flex; gap: 6px; margin-left: 8px; }
        .action-btn {
          background: #f1f5f9;
          color: #64748b;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover { background: #e2e8f0; color: #1e293b; }
        .action-btn.delete:hover { background: #fee2e2; color: #ef4444; }
        .action-btn.edit:hover { background: #eff6ff; color: #3b82f6; }
        .action-btn.power.online { color: #10b981; background: #ecfdf5; }
        .action-btn.power.offline { color: #94a3b8; background: #f1f5f9; }
        .action-btn.power:hover { opacity: 0.8; }

        .btn-cancel-edit {
          background: #f1f5f9;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          margin-left: 12px;
        }

        .btn-save-config.editing { background: #10b981; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2); }

        /* History Section */
        .history-section { margin-top: 40px; }
        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .btn-export {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #1e293b;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-export:hover { background: #f8fafc; border-color: #cbd5e1; }

        .premium-table-wrapper {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.03);
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .modern-table th {
          padding: 20px 24px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .modern-table td {
          padding: 16px 24px;
          font-size: 0.9rem;
          color: #1e293b;
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        }

        .modern-table tr:last-child td { border-bottom: none; }
        .modern-table tbody tr:hover { background: rgba(59, 130, 246, 0.02); }

        .id-pill {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #64748b;
        }

        .device-cell { display: flex; align-items: center; gap: 8px; font-weight: 700; }
        .device-dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }

        .type-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .type-badge.fall { background: #fee2e2; color: #ef4444; }
        .type-badge.normal { background: #f1f5f9; color: #64748b; }

        .confidence-track { width: 100%; max-width: 120px; }
        .confidence-label { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; }
        .progress-bg { width: 100%; height: 4px; background: #f1f5f9; border-radius: 2px; }
        .progress-fill { height: 100%; background: #3b82f6; border-radius: 2px; }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .status-pill.active { background: #fff7ed; color: #f97316; }
        .status-pill.resolved { background: #f0fdf4; color: #16a34a; }

        .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: pulse-opacity 1.5s infinite; }
        @keyframes pulse-opacity { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

        @media (max-width: 1100px) {
          .premium-form-grid { grid-template-columns: 1fr 1fr; }
          .page-header { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
