"use client"

import { useState, useEffect } from 'react';
import { PlusCircle, Search, Download, History, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function IncidentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  
  const [rtspUrl, setRtspUrl] = useState('');
  const [camName, setCamName] = useState('');
  const [camLocation, setCamLocation] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const token = (session.user as any).accessToken;
      const headers = { 'Authorization': `Bearer ${token}` };

      // Lấy danh sách camera thực
      fetch('http://localhost:8080/api/v1/cameras', { headers })
        .then(res => res.json())
        .then(data => setCameras(data || []));

      // Lấy danh sách sự cố thực từ MongoDB
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
  }, [status, session]);

  const handleTestAndAddRTSP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName) return alert("Vui lòng nhập tên Camera.");
    
    const token = (session?.user as any)?.accessToken;
    setIsTesting(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/cameras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: camName,
          location: camLocation || "Mặc định",
          rtsp_url: rtspUrl,
          status: "online"
        }),
      });
      if (res.ok) {
        alert("Đã lưu camera mới!");
        window.location.reload();
      }
    } catch (err) {
      alert("Lỗi kết nối Backend.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="incidents-page">
      <header style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Lịch Sử Sự Cố & Quản Trị</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border)', flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
             <ShieldAlert color="var(--danger)" />
             <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tổng sự cố tháng này</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>24 Vụ việc</div>
             </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border)', flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
             <CheckCircle2 color="var(--success)" />
             <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Đã xử lý an toàn</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>100%</div>
             </div>
          </div>
        </div>
      </header>

      {/* Camera Config Section */}
      <section style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '24px', marginBottom: '40px', border: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <PlusCircle size={20} color="var(--accent)" /> Thiết lập Camera Mới
        </h3>
        <form onSubmit={handleTestAndAddRTSP} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '16px' }}>
          <input 
            placeholder="Tên Camera" 
            value={camName} onChange={e => setCamName(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white' }}
          />
          <input 
            placeholder="Vị trí" 
            value={camLocation} onChange={e => setCamLocation(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white' }}
          />
          <input 
            placeholder="RTSP Stream URL (Rỗng nếu dùng WebCam)" 
            value={rtspUrl} onChange={e => setRtspUrl(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'white' }}
          />
          <button type="submit" className="btn btn-primary" disabled={isTesting}>
            {isTesting ? 'Đang lưu...' : 'Lưu Config'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Danh sách Device đang online:</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {cameras.map((cam: any) => (
              <div key={cam.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-primary)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{cam.name}</span>
                <button 
                   onClick={async () => {
                     if (confirm(`Xóa ${cam.name}?`)) {
                        const token = (session?.user as any)?.accessToken;
                        await fetch(`http://localhost:8080/api/v1/cameras/${cam.id}`, { 
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        window.location.reload();
                     }
                   }}
                   style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, padding: '4px' }}>
                  XÓA
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
           <History size={20} /> Nhật ký vận hành
        </h2>
        <button onClick={() => alert("Đang xuất dữ liệu...")} className="icon-btn" title="Xuất CSV">
           <Download size={20} />
        </button>
      </div>

      <div className="table-wrapper" style={{ borderRadius: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>Mã sự cố</th>
              <th>Thiết bị</th>
              <th>Loại hình</th>
              <th>Tin cậy</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident, idx) => (
              <tr key={idx} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{incident.id}</td>
                <td style={{ fontWeight: 600 }}>{incident.camera}</td>
                <td>
                   <span className={`badge ${incident.type === 'Fall' ? 'badge-alert' : 'badge-offline'}`} style={{ fontSize: '0.7rem' }}>
                      {incident.type.toUpperCase()}
                   </span>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{(incident.conf * 100).toFixed(0)}%</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{incident.createdAt}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: incident.status === 'Active' ? 'var(--warning)' : 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                     {incident.status === 'Active' ? '🔴 Đang xử lý' : '✅ Đã hoàn thành'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
