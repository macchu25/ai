"use client"

import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Grid3X3, Monitor, Settings, RefreshCw, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import VideoPlayer from '@/components/dashboard/VideoPlayer';

export default function CamerasGridPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid2' | 'grid3'>('grid2');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [discoveredIps, setDiscoveredIps] = useState<string[]>([]);

  const handleScan = async () => {
    setIsScanning(true);
    setHasScanned(false);
    setDiscoveredIps([]);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/cameras/discovery`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredIps(data.ips || []);
        setHasScanned(true);
      }
    } catch (err) {
      console.error("Scan error", err);
    } finally {
      setIsScanning(false);
    }
  };

  const token = session?.user ? (session.user as any).accessToken : '';

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && token) {
      const fetchCams = async () => {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
          const res = await fetch(`${apiBase}/cameras`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.status === 401) {
            signOut({ callbackUrl: '/login' });
            return;
          }
          const data = await res.json();
          setCameras(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Fetch error", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCams();
    }
  }, [status, session, router]);

  return (
    <div className="cameras-grid-page">
      <header className="grid-header">
        <div className="header-left">
          <h1 className="title-premium">Phòng Điều Phối Cam</h1>
          <p className="subtitle">Hệ thống giám sát đa luồng thời gian thực</p>
        </div>

        <div className="header-actions">
          <button 
            onClick={handleScan} 
            className={`btn-scan ${isScanning ? 'scanning' : ''}`}
            disabled={isScanning}
          >
            <Search size={18} className={isScanning ? 'animate-pulse' : ''} />
            <span>{isScanning ? 'Đang quét...' : 'Quét Camera'}</span>
          </button>
          
          <div className="view-toggle">
            <button
              className={viewMode === 'grid2' ? 'active' : ''}
              onClick={() => setViewMode('grid2')}
              title="Bố cục 2 cột"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={viewMode === 'grid3' ? 'active' : ''}
              onClick={() => setViewMode('grid3')}
              title="Bố cục 3 cột"
            >
              <Grid3X3 size={18} />
            </button>
          </div>
          <button onClick={() => window.location.reload()} className="btn-refresh">
            <RefreshCw size={18} />
            <span>Làm mới</span>
          </button>
        </div>
      </header>
      
      {/* Hiển thị kết quả quét */}
      {(isScanning || hasScanned) && (
        <div className={`discovery-results ${hasScanned && discoveredIps.length === 0 ? 'no-results' : ''}`}>
          <div className="discovery-header">
            {isScanning ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (discoveredIps?.length || 0) > 0 ? (
              <ShieldCheck size={20} color="#22c55e" />
            ) : (
              <AlertTriangle size={20} color="#f59e0b" />
            )}
            
            <span>
              {isScanning 
                ? 'Đang dò tìm thiết bị trong mạng Wifi của bạn...' 
                : (discoveredIps?.length || 0) > 0 
                  ? `Đã tìm thấy ${discoveredIps.length} Camera RTSP mới!` 
                  : 'Không tìm thấy Camera nào đang mở cổng RTSP (554).'}
            </span>
            <button onClick={() => { setHasScanned(false); setDiscoveredIps([]); }} className="close-discovery">×</button>
          </div>
          
          {(discoveredIps?.length || 0) > 0 && (
            <div className="ip-list">
              {discoveredIps.map(ip => (
                <div key={ip} className="ip-card">
                  <span className="ip-text">rtsp://{ip}:554/stream1</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`rtsp://${ip}:554/stream1`);
                      alert("Đã sao chép link RTSP!");
                    }}
                    className="btn-add-fast"
                  >
                    Sao chép URL
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {hasScanned && (discoveredIps?.length || 0) === 0 && (
            <p className="discovery-hint" style={{ marginTop: '10px', color: '#64748b', fontSize: '0.85rem' }}>
              Hãy đảm bảo Camera X-IoT đã bật nguồn và kết nối cùng mạng Wifi với máy tính.
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="loading-grid">
          <div className="spinner"></div>
          <p>Đang khởi tạo các luồng stream...</p>
        </div>
      ) : (
        <div className={`cameras-layout ${viewMode}`}>
          {cameras.length > 0 ? (
            cameras.map((cam: any) => {
              // Xác định luồng là MJPEG hay HLS
              const isMJPEG = cam.rtspUrl && (cam.rtspUrl.startsWith('http') || cam.rtspUrl.includes(':5000'));
              const streamUrl = isMJPEG 
                ? (cam.rtspUrl.startsWith('http') ? cam.rtspUrl : `http://${cam.rtspUrl}`)
                : `${process.env.NEXT_PUBLIC_STREAM_URL || 'http://localhost:8080/streams'}/${cam.id}/stream.m3u8?token=${token}&t=${Date.now()}`;

              return (
                <div key={cam.id} className="camera-grid-item">
                  <div className="camera-video-container">
                    <VideoPlayer url={streamUrl} name={cam.name} isMJPEG={isMJPEG} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <AlertTriangle size={48} color="#94a3b8" />
              <h2>Chưa có Camera nào được cấu hình</h2>
              <p>Vui lòng vào phần Quản Trị để thiết lập thiết bị mới.</p>
              <button onClick={() => router.push('/incidents')} className="goto-config">
                Đi tới Cấu hình <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="security-footer">
        <div className="security-badge">
          <ShieldCheck size={16} />
          <span>Mã hóa AES-256 nội bộ • Zero Latency Engine</span>
        </div>
      </div>

      <style jsx>{`
        .cameras-grid-page {
          padding: 20px;
          min-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }

        .grid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .title-premium {
          font-size: 2.2rem;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -1px;
          margin: 0;
        }

        .subtitle {
          color: #64748b;
          margin-top: 4px;
        }

        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .view-toggle {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          display: flex;
          gap: 4px;
        }

        .view-toggle button {
          background: transparent;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-toggle button.active {
          background: white;
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-refresh:hover { background: #f8fafc; border-color: #cbd5e1; }

        .btn-scan {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--accent);
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .btn-scan:hover { background: #2563eb; transform: translateY(-2px); }
        .btn-scan:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }
        
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

        .discovery-results {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 30px;
          animation: slideDown 0.4s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .discovery-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          font-weight: 800;
          color: #166534;
        }

        .close-discovery {
          margin-left: auto;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #94a3b8;
          cursor: pointer;
        }

        .ip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ip-card {
          background: white;
          border: 1px solid #dcfce7;
          padding: 8px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .ip-text {
          font-family: monospace;
          color: #166534;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .btn-add-fast {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-fast:hover { background: #dcfce7; }

        .cameras-layout {
          display: grid;
          gap: 24px;
          flex: 1;
        }

        .cameras-layout.grid2 { grid-template-columns: repeat(2, 1fr); }
        .cameras-layout.grid3 { grid-template-columns: repeat(3, 1fr); }

        .loading-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: #64748b;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-state {
          grid-column: 1 / -1;
          background: rgba(255, 255, 255, 0.3);
          border: 2px dashed rgba(0, 0, 0, 0.05);
          border-radius: 32px;
          padding: 80px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-state h2 { margin: 0; color: #1e293b; }
        .empty-state p { color: #64748b; max-width: 300px; }

        .goto-config {
          margin-top: 20px;
          background: var(--accent);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .goto-config:hover { background: #2563eb; transform: translateY(-2px); }

        .security-footer {
          margin-top: 40px;
          display: flex;
          justify-content: center;
        }

        .security-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 100px;
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 700;
        }

        @media (max-width: 1200px) {
          .cameras-layout.grid3 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 800px) {
          .cameras-layout.grid2, .cameras-layout.grid3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
