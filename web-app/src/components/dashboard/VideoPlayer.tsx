"use client"

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Maximize2, RefreshCw, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  name: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, name }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const initPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (videoRef.current) {
      const video = videoRef.current;
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log("Auto-play blocked", e));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("fatal network error encountered, try to recover");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("fatal media error encountered, try to recover");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      }
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          video.play();
        });
      }
    }
  };

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  return (
    <div className="video-player-card">
      <div className="player-header">
        <div className="status-indicator">
          <div className="dot pulse"></div>
          <span>LIVE - {name}</span>
        </div>
        <div className="player-actions">
           <button onClick={initPlayer} title="Reload stream"><RefreshCw size={14} /></button>
           <button title="Fullscreen"><Maximize2 size={14} /></button>
        </div>
      </div>
      
      <div className="video-container">
        <video 
          ref={videoRef} 
          muted 
          playsInline
          poster="https://images.unsplash.com/photo-1544391496-1ca0f074479e?q=80&w=2000&auto=format&fit=crop"
        />
        <div className="video-overlay">
           <div className="stream-info">
              <span className="bandwidth">1080p • 60 FPS</span>
           </div>
        </div>
      </div>

      <style jsx>{`
        .video-player-card {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .video-player-card:hover {
          transform: translateY(-5px);
          border-color: var(--accent);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.1);
        }

        .player-header {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.6);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
        }

        .dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
        .dot.pulse { animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

        .player-actions { display: flex; gap: 8px; }
        .player-actions button {
          background: white;
          border: 1px solid #e2e8f0;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .player-actions button:hover { background: #f8fafc; color: var(--accent); }

        .video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 40%);
          pointer-events: none;
          padding: 16px;
          display: flex;
          align-items: flex-end;
        }

        .stream-info {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.8);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
