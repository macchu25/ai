import React, { useState } from 'react';
import { Database, Download, Cloud, Play, X } from 'lucide-react';
import Link from 'next/link';
import Hls from 'hls.js';
import { useLanguage } from '@/app/context/LanguageContext';

interface Incident {
  id: string;
  camera: string;
  type: string;
  conf: number;
  createdAt: string;
  status: string;
  videoUrl?: string;
  cloudVideoUrl?: string;
}

interface IncidentTableProps {
  incidents: Incident[];
  onExport?: () => void;
}

const getFirstAidType = (typeStr: string): string => {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('tachycardia') || t.includes('nhanh') || t.includes('high hr') || t.includes('tim cao')) return 'hr_high';
  if (t.includes('bradycardia') || t.includes('chậm') || t.includes('low hr') || t.includes('tim thấp')) return 'hr_low';
  if (t.includes('apnea') || t.includes('ngừng thở') || t.includes('suy hô hấp') || t.includes('resp')) return 'apnea';
  if (t.includes('seizure') || t.includes('co giật') || t.includes('động kinh')) return 'seizure';
  if (t.includes('chấn thương đầu') || t.includes('bất tỉnh') || t.includes('head')) return 'head';
  if (t.includes('gãy xương') || t.includes('bone')) return 'bone';
  if (t.includes('chảy máu') || t.includes('blood')) return 'blood';
  if (t.includes('đột quỵ') || t.includes('stroke')) return 'stroke';
  return 'fall'; // default to CPR/fall
};

const getLocalizedType = (typeStr: string, t: any) => {
  const lower = (typeStr || '').toLowerCase();
  if (lower.includes('fall') || lower.includes('ngã')) return t('reports.incidentTypeFall');
  if (lower.includes('heart') || lower.includes('bpm') || lower.includes('nhịp tim') || lower.includes('tachycardia') || lower.includes('bradycardia')) return t('reports.incidentTypeHeart');
  if (lower.includes('apnea') || lower.includes('ngừng thở') || lower.includes('suy hô hấp') || lower.includes('resp')) return t('reports.incidentTypeApnea');
  return typeStr || t('incidents.unknown');
};

const IncidentTable: React.FC<IncidentTableProps> = ({ incidents, onExport }) => {
  const { t, language } = useLanguage();
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  return (
    <section className="history-section">
      <div className="table-header-row">
        <div className="header-main">
          <Database size={20} />
          <h2>{t('incidents.operationalLog')}</h2>
        </div>
        <button onClick={onExport} className="btn-export">
          <Download size={18} />
          <span>{t('incidents.exportCsv')}</span>
        </button>
      </div>

      <div className="premium-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>{t('incidents.id')}</th>
              <th>{t('incidents.device')}</th>
              <th>{t('incidents.type')}</th>
              <th>{t('incidents.confidence')}</th>
              <th>{t('incidents.time')}</th>
              <th>{t('incidents.storage')}</th>
              <th>{t('incidents.firstAid')}</th>
              <th>{t('incidents.status')}</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident, idx) => (
              <tr key={idx}>
                <td><span className="id-pill">#{incident.id?.substring(0, 8)}</span></td>
                <td>
                  <div className="device-cell">
                    <div className="device-dot"></div>
                    {incident.camera}
                  </div>
                </td>
                <td>
                  <span className={`type-badge ${(incident.type || 'unknown').toLowerCase()}`}>
                    {getLocalizedType(incident.type, t)}
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
                  {incident.videoUrl || incident.cloudVideoUrl ? (
                    <button
                      onClick={() => {
                        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
                        const backendBase = base.replace('/api/v1', '');
                        const fullUrl = incident.cloudVideoUrl ? incident.cloudVideoUrl : `${backendBase}${incident.videoUrl}`;
                        const watchTitle = language === 'vi' 
                          ? `Video bằng chứng - Sự cố #${incident.id?.substring(0, 8)} (${incident.camera})` 
                          : `Evidence Video - Incident #${incident.id?.substring(0, 8)} (${incident.camera})`;
                        
                        setActiveVideo({
                          url: fullUrl,
                          title: watchTitle
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        border: 'none',
                        background: 'rgba(16, 185, 129, 0.08)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                    >
                      <Play size={14} fill="currentColor" /> {language === 'vi' ? 'Xem video' : 'Watch Video'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Cloud size={14} /> Synced
                    </div>
                  )}
                </td>
                <td>
                  <Link 
                    href={`/cpr?type=${getFirstAidType(incident.type)}`}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.speechSynthesis?.cancel();
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--danger)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      padding: '4px 8px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      borderRadius: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                  >
                    📖 {t('incidents.firstAid')}
                  </Link>
                </td>
                <td>
                  <div className={`status-pill ${(incident.status || 'resolved').toLowerCase()}`}>
                    <div className="pulse-dot"></div>
                    {incident.status === 'Active' ? t('incidents.processing') : t('incidents.completed')}
                  </div>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  {t('incidents.emptyLogs')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {activeVideo && (
        <VideoPlayerModal 
          videoUrl={activeVideo.url} 
          title={activeVideo.title} 
          onClose={() => setActiveVideo(null)} 
        />
      )}
    </section>
  );
};

interface VideoPlayerModalProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ videoUrl, title, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    let hls: any = null;
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play blocked:", e));
      });
      hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        console.error("HLS error:", data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native support in Safari
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.log("Auto-play blocked:", e));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoUrl]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: '16px',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'var(--bg-primary, #0c0f17)',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-muted, #94a3b8)',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; }}
        >
          <X size={20} />
        </button>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#fff',
          paddingRight: '40px',
        }}>{title}</h3>
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#000',
        }}>
          <video 
            ref={videoRef} 
            controls 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            playsInline
          />
        </div>
      </div>
    </div>
  );
};

export default IncidentTable;
