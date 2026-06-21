"use client"

import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Grid3X3, Monitor, Settings, RefreshCw, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import VideoPlayer from '@/components/dashboard/VideoPlayer';
import { useLanguage } from '@/app/context/LanguageContext';

export default function CamerasGridPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid2' | 'grid3'>('grid2');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [discoveredIps, setDiscoveredIps] = useState<string[]>([]);
  const [streamMode, setStreamMode] = useState<'rtsp' | 'api'>('rtsp');

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
  }, [status, session, router, token]);

  return (
    <div className="cameras-grid-page">
      <header className="page-header-premium">
        <div>
          <h1 className="page-title-premium">{t('cameras.title')}</h1>
          <p className="page-subtitle-premium">{t('cameras.subtitle')}</p>
        </div>

        <div className="header-actions">
          <button 
            onClick={handleScan} 
            className={`btn-scan ${isScanning ? 'scanning' : ''}`}
            disabled={isScanning}
          >
            <Search size={18} className={isScanning ? 'animate-pulse' : ''} />
            <span>{isScanning ? t('cameras.scanning') : t('cameras.scanBtn')}</span>
          </button>
          
          <div className="view-toggle">
            <button
              className={viewMode === 'grid2' ? 'active' : ''}
              onClick={() => setViewMode('grid2')}
              title={t('cameras.viewGrid2')}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={viewMode === 'grid3' ? 'active' : ''}
              onClick={() => setViewMode('grid3')}
              title={t('cameras.viewGrid3')}
            >
              <Grid3X3 size={18} />
            </button>
          </div>
          <button onClick={() => window.location.reload()} className="btn-refresh">
            <RefreshCw size={18} />
            <span>{t('cameras.refresh')}</span>
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
                ? t('cameras.scanningHint') 
                : (discoveredIps?.length || 0) > 0 
                  ? t('cameras.scanFoundText').replace('{count}', String(discoveredIps.length))
                  : t('cameras.scanNotFoundText')}
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
                      alert(t('cameras.copySuccess'));
                    }}
                    className="btn-add-fast"
                  >
                    {t('cameras.copyUrl')}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {hasScanned && (discoveredIps?.length || 0) === 0 && (
            <p className="discovery-hint" style={{ marginTop: '10px', color: '#64748b', fontSize: '0.85rem' }}>
              {t('cameras.deviceWifiHint')}
            </p>
          )}
        </div>
      )}
      {/* Bộ chọn chế độ Stream */}
      <div className="stream-mode-selector-container">
        <span className="selector-label">{t('cameras.streamModeLabel')}</span>
        <div className="stream-mode-tabs">
          <button 
            className={`btn-mode-tab ${streamMode === 'rtsp' ? 'active' : ''}`} 
            onClick={() => setStreamMode('rtsp')}
          >
            <span>{t('cameras.streamRtsp')}</span>
          </button>
          <button 
            className={`btn-mode-tab ${streamMode === 'api' ? 'active' : ''}`} 
            onClick={() => setStreamMode('api')}
          >
            <span>{t('cameras.streamApi')}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-grid">
          <div className="spinner"></div>
          <p>{t('cameras.loadingStreams')}</p>
        </div>
      ) : (
        <div className={`cameras-layout ${viewMode}`}>
          {cameras.length > 0 ? (
            cameras.map((cam: any) => {
              const rtspStreamUrl = `${process.env.NEXT_PUBLIC_STREAM_URL || 'http://localhost:8080/streams'}/token/${token}/${cam.id}/stream.m3u8`;
              const actualRtspUrl = cam.rtsp_url || cam.rtspUrl || '';
              const apiStreamUrl = actualRtspUrl && (actualRtspUrl.startsWith('http') || actualRtspUrl.includes(':5000'))
                ? (actualRtspUrl.startsWith('http') ? actualRtspUrl : `http://${actualRtspUrl}`)
                : `http://localhost:5000/video_feed`;

              const streamUrl = streamMode === 'rtsp' ? rtspStreamUrl : apiStreamUrl;
              const isMJPEG = streamMode === 'api';
              const isOnline = cam.status === 'online';

              return (
                <div key={cam.id} className="camera-grid-item">
                  <div className="camera-video-container">
                    <div className="stream-type-tag">
                      {isMJPEG ? 'API (MJPEG)' : 'RTSP (HLS)'}
                    </div>
                    {isOnline ? (
                      <VideoPlayer url={streamUrl} name={cam.name} isMJPEG={isMJPEG} />
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '240px',
                        background: 'rgba(15, 23, 42, 0.05)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: '16px',
                        color: '#64748b',
                        padding: '20px',
                        textAlign: 'center',
                        gap: '8px'
                      }}>
                        <AlertTriangle size={36} color="#ef4444" />
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>
                          {t('cameras.cameraOffline')}
                        </span>
                        <span style={{ fontSize: '0.85rem' }}>{cam.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <AlertTriangle size={48} color="#94a3b8" />
              <h2>{t('cameras.noCamsTitle')}</h2>
              <p>{t('cameras.noCamsDesc')}</p>
              <button onClick={() => router.push('/incidents')} className="goto-config">
                {t('cameras.goToConfig')} <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="security-footer">
        <div className="security-badge">
          <ShieldCheck size={16} />
          <span>{t('cameras.aesEncryption')}</span>
        </div>
      </div>

      <style jsx>{`
        .cameras-grid-page {
          padding: 20px;
          min-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }

        .stream-mode-selector-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          width: fit-content;
        }

        .selector-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stream-mode-tabs {
          display: flex;
          gap: 6px;
        }

        .stream-mode-tabs .btn-mode-tab {
          background: transparent;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .stream-mode-tabs .btn-mode-tab:hover {
          color: #1e293b;
          background: rgba(255, 255, 255, 0.6);
        }

        .stream-mode-tabs .btn-mode-tab.active {
          background: #2563eb;
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .camera-grid-item {
          position: relative;
        }

        .stream-type-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(15, 23, 42, 0.75);
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          z-index: 10;
          backdrop-filter: blur(4px);
          pointer-events: none;
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
