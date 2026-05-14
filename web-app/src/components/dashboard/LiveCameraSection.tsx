"use client"

import React from 'react';
import VideoPlayer from './VideoPlayer';
import { Camera, LayoutGrid, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LiveCameraSectionProps {
  cameras: any[];
  token: string;
}

const LiveCameraSection: React.FC<LiveCameraSectionProps> = ({ cameras, token }) => {
  const onlineCameras = cameras.filter(c => c.status === 'online');
  const displayCams = onlineCameras.slice(0, 2);

  return (
    <div className="dashboard-section" id="live-monitoring">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px', color: '#1e293b' }}>
            Giám Sát Trực Tiếp
          </h2>
          <p style={{ color: '#64748b' }}>
            Luồng stream thời gian thực từ các vị trí trọng yếu.
          </p>
        </div>
        <Link href="/incidents" className="view-all-link">
          Xem tất cả camera <ArrowRight size={16} />
        </Link>
      </div>

      <div className="cameras-preview-grid">
        {displayCams.length > 0 ? (
          displayCams.map(cam => {
            // Kiểm tra xem đây có phải luồng từ AI (MJPEG) không
            const isMJPEG = cam.rtspUrl && (cam.rtspUrl.startsWith('http') || cam.rtspUrl.includes(':5000'));
            
            // Nếu là MJPEG, dùng URL trực tiếp. Nếu không, qua Proxy HLS của Backend
            const streamUrl = isMJPEG 
              ? (cam.rtspUrl.startsWith('http') ? cam.rtspUrl : `http://${cam.rtspUrl}`)
              : `${process.env.NEXT_PUBLIC_STREAM_URL || 'http://localhost:8080/streams'}/${cam.id}/stream.m3u8?token=${token}&t=${Date.now()}`;
            
            return (
              <div key={cam.id} className="camera-card-wrapper">
                <VideoPlayer url={streamUrl} name={cam.name} isMJPEG={isMJPEG} />
              </div>
            );
          })
        ) : (
          <div className="empty-cameras-box">
             <Camera size={48} color="#cbd5e1" />
             <p>Chưa có camera nào đang Online</p>
             <Link href="/incidents" className="setup-btn">Thiết lập ngay</Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .cameras-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
        }

        .view-all-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          font-weight: 700;
          text-decoration: none;
          padding: 10px 20px;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .view-all-link:hover {
          background: rgba(59, 130, 246, 0.1);
          transform: translateX(5px);
        }

        .empty-cameras-box {
          grid-column: 1 / -1;
          background: rgba(255, 255, 255, 0.3);
          border: 2px dashed rgba(0, 0, 0, 0.05);
          border-radius: 32px;
          padding: 60px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .setup-btn {
          margin-top: 10px;
          background: var(--accent);
          color: white;
          padding: 10px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
        }

        .camera-card-wrapper {
          position: relative;
          border-radius: 32px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .camera-label-tag {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e293b;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 900px) {
          .cameras-preview-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(LiveCameraSection);
