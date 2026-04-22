"use client"

import { useEffect, useState } from 'react';
import { useHLS } from '@/hooks/useHLS';
import Script from 'next/script';
import { 
  VolumeX, Volume2, Maximize2, X, AlertTriangle, 
  Shield, CheckCircle, Video, Clock, Activity, Wifi
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

function CameraTile({ cam, alertState }: { cam: any, alertState: Record<string, boolean> }) {
  const isAlert = alertState[cam.id];
  const streamUrl = `http://localhost:8080/streams/${cam.id}/stream.m3u8`;
  const videoRef = useHLS(streamUrl);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isFlaskStream = !cam.rtsp_url;

  const tileStyle = isFullscreen ? {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, 
    zIndex: 9999, background: '#000', margin: 0, borderRadius: 0, 
    display: 'flex', flexDirection: 'column' as const
  } : {};

  return (
    <div className="camera-tile" data-alert={isAlert} style={tileStyle}>
      <div className="camera-header" style={isFullscreen ? { background: '#111', padding: '24px', color: 'white' } : { borderBottom: '1px solid #f1f5f9' }}>
        <div className="camera-name">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isFullscreen ? 'white' : 'var(--text-main)' }}>{cam.name}</div>
          <div style={{fontSize:'0.75rem', color: isFullscreen ? '#94a3b8' : 'var(--text-muted)', fontWeight: 500}}>{cam.location}</div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <div className={`badge ${isAlert ? 'badge-alert' : cam.status === 'online' ? 'badge-online' : 'badge-offline'}`} style={{ borderRadius: '12px', padding: '6px 12px' }}>
             {isAlert ? '🚨 QUAN TRỌNG' : cam.status.toUpperCase()}
           </div>
           
           <button onClick={() => setIsFullscreen(!isFullscreen)} className="icon-btn" style={{ borderRadius: '12px' }}>
             {isFullscreen ? <X size={20} /> : <Maximize2 size={20} />}
           </button>
        </div>
      </div>
      <div className="video-container" style={{ position: 'relative', flex: 1, background: '#f8fafc' }} onClick={() => setMuted(!muted)}>
        {isFlaskStream ? (
          <img alt="Cam Laptop" src="http://localhost:5000/video_feed" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        ) : (
          <video 
             ref={videoRef} 
             autoPlay 
             muted={muted} 
             playsInline
             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        
        {!isFlaskStream && !isAlert && (
          <div style={{ position:'absolute', bottom:16, right:16, background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '12px', color:'white', cursor:'pointer', display: 'flex', alignItems: 'center' }}>
            {muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
          </div>
        )}

        {isAlert && (
          <div className="alert-overlay">
            <div style={{ background: 'var(--danger)', padding: '16px', borderRadius: '50%', marginBottom: '16px', boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)', animation: 'pulse 1s infinite' }}>
                <AlertTriangle size={48} color="white" />
            </div>
            <span style={{ fontSize: '1.4rem', letterSpacing: '1px' }}>PHÁT HIỆN SỰ CỐ NGÃ</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.9 }}>Hệ thống đang kích hoạt quy trình cứu giúp...</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [cameras, setCameras] = useState<any[]>([]);
  const [alertState, setAlertState] = useState<Record<string, boolean>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const token = (session.user as any).accessToken;
      const headers = { 'Authorization': `Bearer ${token}` };

      const loadCams = async () => {
        try {
          const res = await fetch('http://localhost:8080/api/v1/cameras', { headers });
          if (!res.ok) {
            setCameras([]);
            return;
          }
          const data = await res.json();
          setCameras(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) { 
          console.error(err); 
          setCameras([]);
        }
      };
      loadCams();

      const ws = new WebSocket('ws://localhost:8080/ws');
      ws.onmessage = (e) => {
          try {
              const data = JSON.parse(e.data);
              if (data.event === 'alert') {
                 setAlertState(prev => ({...prev, [data.camera_id]: true}));
              }
          } catch(err) {}
      };
      return () => ws.close();
    }
  }, [status, session, router]);

  const safeCameras = Array.isArray(cameras) ? cameras : [];
  const activeAlerts = Object.values(alertState).filter(v => v).length;
  const onlineCams = safeCameras.filter((c: any) => c.status === 'online').length;

  return (
    <div className="dashboard-3d-layout">
      {/* Background SVG Lines */}
      <svg className="connecting-lines" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Left Side Lines */}
        <polyline points="280,260 380,330 500,430" fill="none" stroke="#dbeafe" strokeWidth="2" />
        <polyline points="280,530 350,530 480,480" fill="none" stroke="#dbeafe" strokeWidth="2" />
        <polyline points="300,780 400,780 500,630" fill="none" stroke="#dbeafe" strokeWidth="2" />
        
        {/* Right Side Lines */}
        <polyline points="1000,230 900,230 800,330" fill="none" stroke="#dbeafe" strokeWidth="2" />
        <polyline points="1100,400 950,400 850,460" fill="none" stroke="#dbeafe" strokeWidth="2" />
        <polyline points="1000,830 900,830 850,680" fill="none" stroke="#dbeafe" strokeWidth="2" />
      </svg>

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 40px' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>
          Tổng quan trực tiếp,
        </h2>
        <h1 style={{ fontSize: '3rem', color: '#1e293b', fontWeight: 900, letterSpacing: '-1px', margin: 0, textTransform: 'uppercase' }}>
          TRONG NGÀY! <span style={{ color: 'var(--accent)' }}>📡</span>
        </h1>
      </div>

      {/* Center 3D Object Area - SPLINE VIEWER INTEGRATION */}
      <div className="center-3d-container" style={{ width: '450px', height: '450px', zIndex: 5, overflow: 'hidden', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute' }}>
           <Script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.64/build/spline-viewer.js" strategy="afterInteractive" />
           {/* @ts-expect-error Custom Spline Web Component */}
           <spline-viewer style={{ width: '1200px', height: '450px', flexShrink: 0 }} url="https://prod.spline.design/YR58cjeB9dBOiQFK/scene.splinecode"></spline-viewer>
      </div>

      {/* Floating Widgets - LEFT */}
      <div className="widget-group left-widgets">
         <div className="widget metric-card" style={{ top: '160px', left: '60px' }}>
            <div className="metric-header">
               <Video size={16} color="var(--accent)" />
               <span>Tín hiệu Stream</span>
            </div>
            <div className="metric-chart">
               <svg viewBox="0 0 100 30" width="100%">
                 <path d="M0,15 C10,5 20,5 30,15 S50,25 60,15 S80,5 90,15 L100,15" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                 <circle cx="90" cy="15" r="4" fill="currentColor" stroke="white" strokeWidth="2" style={{ color: 'var(--accent)' }} />
               </svg>
            </div>
            <div className="metric-status" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{onlineCams} Live</div>
         </div>

         <div className="widget alert-widget" style={{ top: '360px', left: '40px' }}>
            <div className="flex justify-between items-center w-full">
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="icon-badge danger">
                    <AlertTriangle size={16} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cảnh báo</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Nguy hiểm</div>
                  </div>
               </div>
               <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{activeAlerts}</div>
            </div>
            <svg viewBox="0 0 100 20" width="100%" style={{ marginTop: '16px' }}>
                <path d="M0,10 C15,0 25,0 40,10 S65,20 80,10 S95,0 100,5" fill="none" stroke="var(--danger)" strokeWidth="2" />
            </svg>
         </div>

         <div className="widget mini-widget" style={{ top: '560px', left: '80px' }}>
            <div style={{ background: 'var(--success)', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
               <Activity size={18} color="white" />
            </div>
            <div>
               <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>99.9%</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>System Uptime</div>
            </div>
         </div>
      </div>

      {/* Floating Widgets - RIGHT */}
      <div className="widget-group right-widgets">
         <div className="widget pill-widget" style={{ top: '140px', right: '120px' }}>
            <div className="icon-badge success">
              <Shield size={14} color="white" />
            </div>
            <div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Model Status</div>
               <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Active & Normal</div>
            </div>
         </div>

         <div className="widget graph-widget" style={{ top: '260px', right: '40px' }}>
            <div className="flex justify-between w-full">
               <div className="icon-badge warning">
                 <Clock size={14} color="white" />
               </div>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>60 FPS</div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Processing Speed</div>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px', marginTop: '16px' }}>
               {[40, 60, 80, 50, 70, 90, 60, 80].map((h, i) => (
                  <div key={i} style={{ width: '4px', height: `${h}%`, background: 'var(--accent)', borderRadius: '2px', opacity: h > 70 ? 1 : 0.4 }}></div>
               ))}
            </div>
         </div>

         <div className="widget main-graph-widget" style={{ top: '500px', right: '60px', width: '280px' }}>
            <div className="flex justify-between items-center mb-4">
               <div className="icon-badge success" style={{ background: 'var(--success)' }}>
                  <Wifi size={14} color="white" />
               </div>
               <div style={{ fontWeight: 800, fontSize: '1rem' }}>92ms</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latency</div>
            </div>
            <svg viewBox="0 0 200 60" width="100%">
               <path d="M0,40 L40,40 L60,20 L80,50 L100,10 L120,40 L200,40" fill="none" stroke="var(--danger)" strokeWidth="1.5" />
               <path d="M0,50 L30,50 L50,30 L70,55 L90,20 L110,50 L200,50" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
               <circle cx="100" cy="10" r="4" fill="var(--danger)" />
               <rect x="90" y="0" width="20" height="60" fill="var(--danger)" opacity="0.05" />
            </svg>
         </div>
      </div>


      {/* Project Overview Section */}
      <div style={{ marginTop: '650px', padding: '0 40px 80px', position: 'relative', zIndex: 10 }}>
         <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '24px', color: '#1e293b' }}>Tổng Quan Dự Án AI Fall Guard</h2>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <div className="overview-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '32px', border: '1px solid white', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
               <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <Shield size={28} color="var(--accent)" />
               </div>
               <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>Giám Sát Chủ Động 24/7</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, flex: 1 }}>
                 Hệ thống Camera an ninh liên tục phân tích hành vi theo thời gian thực, chủ động rào trước rủi ro ngã hoặc tai nạn bất ngờ trong môi trường Bệnh viện & Chăm sóc y tế.
               </p>
            </div>
            
            <div className="overview-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '32px', border: '1px solid white', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
               <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <Activity size={28} color="var(--success)" />
               </div>
               <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>AI Phản Hồi Tốc Độ Cao</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, flex: 1 }}>
                 Mô hình nhúng Computer Vision (Pose Detection & Tracking) sở hữu độ trễ dưới 100ms, tự động kích hoạt Còi báo động và Cuộc gọi cấp cứu ngay khoảnh khắc biến cố xảy ra.
               </p>
            </div>
            
            <div className="overview-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', padding: '32px', borderRadius: '32px', border: '1px solid white', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
               <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <CheckCircle size={28} color="var(--warning)" />
               </div>
               <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>Mở Rộng Không Giới Hạn</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, flex: 1 }}>
                 Lõi hệ thống Backend Go Architecture cực kì bền bỉ, hỗ trợ trực tiếp các luồng HLS siêu nhẹ, chấp nhận mọi loại IP Camera RTSP hiện có trên thị trường mà phần cứng không bị phình to.
               </p>
            </div>
         </div>
      </div>

      {/* Feedback Section */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', padding: '40px', background: 'rgba(255,255,255,0.5)', borderRadius: '32px', margin: '40px 40px', backdropFilter: 'blur(20px)', border: '1px solid white', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
         <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>Phản hồi & Góp ý</h2>
         <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Hệ thống AI Fall Guard đang trong giai đoạn liên tục được hoàn thiện. Mọi phát hiện lỗi (bug) hệ thống, nhầm lẫn AI hoặc trải nghiệm chưa tốt, xin vui lòng gửi thư về hòm thư hỗ trợ Kỹ Thuật (support@fallguard.ai) hoặc để lại tin nhắn ngắn gọn tại đây.
         </p>
         
         <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <input type="email" placeholder="Địa chỉ Email (Tùy chọn)..." style={{ flex: '1 1 250px', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.8)', outline: 'none', fontSize: '0.95rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
            <input type="text" placeholder="Góp ý của bạn..." style={{ flex: '3 1 400px', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.8)', outline: 'none', fontSize: '0.95rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
            <button style={{ background: 'var(--text-main)', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)', fontSize: '0.95rem' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
               Gửi Tới Đội Ngũ
            </button>
         </div>
      </div>

      {/* Main Footer under Dashboard */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '40px', marginTop: '40px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={24} color="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Fall Guard <span style={{ fontWeight: 400 }}>| AI Medical Console</span></span>
         </div>
         <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} Fall Guard Deepmind Group. All rights reserved.
         </div>
      </footer>

    </div>
  )
}
