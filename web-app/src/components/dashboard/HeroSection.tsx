import React from 'react';
import { Camera, Shield, Bell, Activity, Clock, AlertTriangle, Video, Wifi } from 'lucide-react';

interface HeroSectionProps {
  onlineCams: number;
  activeAlerts: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onlineCams, activeAlerts }) => {
  return (
    <div className="hero-viewport">
      {/* Background SVG Lines */}
      <svg className="connecting-lines" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} preserveAspectRatio="none">
        <polyline points="280,260 380,330 500,430" fill="none" />
        <polyline points="280,530 350,530 480,480" fill="none" />
        <polyline points="300,780 400,780 500,630" fill="none" />
        <polyline points="1000,230 900,230 800,330" fill="none" />
        <polyline points="1100,400 950,400 850,460" fill="none" />
        <polyline points="1000,830 900,830 850,680" fill="none" />
      </svg>

      {/* CASOS UNDER ROBOT */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, pointerEvents: 'none', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(8rem, 22vw, 24rem)', fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase', userSelect: 'none' }}>
          {['C', 'A', 'S', 'O', 'S'].map((letter, index) => (
            <span key={index} className="casos-letter">{letter}</span>
          ))}
        </h1>
      </div>

      {/* SPLINE ROBOT */}
      <div className="hero-spline-container">
        <iframe src="https://my.spline.design/welcomerobotwhite-lbipvDTZMV4hoCZvcTj1cSl5/" frameBorder="0" style={{ width: '100%', height: '100%', border: 'none' }}></iframe>
      </div>

      {/* UI HUD OVERLAY */}
      <div className="hero-hud-overlay">
        <div className="hero-title-wrap" style={{ padding: '30px 50px', pointerEvents: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>Tổng quan trực tiếp,</h2>
          <h1 className="hero-main-title" style={{ fontSize: '3.4rem', color: '#1e293b', fontWeight: 950, letterSpacing: '-1.8px', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
            TRONG NGÀY! <span style={{ color: 'var(--accent)', fontSize: '2.2rem', display: 'inline-block', transform: 'translateY(-4px)' }}>📡</span>
          </h1>
        </div>

        <div className="widget-grid-container">
          {/* LEFT WIDGETS */}
          <div className="widget widget-stream" style={{ top: '160px', left: '70px', width: '300px', flexDirection: 'column', alignItems: 'flex-start', pointerEvents: 'auto', animationDelay: '0s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Video size={16} color="var(--accent)" />
              <span className="metric-label">Tín hiệu Stream</span>
            </div>
            <div style={{ width: '100%', height: '80px' }}>
              <svg viewBox="0 0 100 40" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M0,20 C15,0 25,0 40,20 S65,40 80,20 S95,0 100,15" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="80" cy="20" r="5" fill="var(--accent)" stroke="white" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="metric-value" style={{ fontSize: '0.9rem' }}>{onlineCams} Live</div>
          </div>

          <div className="widget widget-alerts" style={{ top: '380px', left: '50px', width: '300px', minHeight: '140px', padding: '28px', flexDirection: 'column', alignItems: 'stretch', pointerEvents: 'auto', animationDelay: '-1s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="icon-badge danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle size={20} color="var(--danger)" />
                </div>
                <div>
                  <div className="metric-label" style={{ lineHeight: 1.2 }}>Cảnh báo</div>
                  <div className="metric-value" style={{ fontSize: '1rem', fontWeight: 800 }}>Nguy hiểm</div>
                </div>
              </div>
              <div className="metric-value" style={{ fontSize: '2.6rem' }}>{activeAlerts}</div>
            </div>
            <div style={{ width: '100%', height: '30px' }}>
              <svg viewBox="0 0 100 25" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M0,12.5 C20,-2.5 40,-2.5 60,12.5 S80,27.5 100,12.5" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="widget mini-widget widget-uptime" style={{ top: '600px', left: '100px', gap: '14px', pointerEvents: 'auto', animationDelay: '-2.5s' }}>
            <div style={{ background: 'var(--success)', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <div className="metric-value" style={{ fontSize: '1.2rem' }}>99.9%</div>
              <div className="metric-label">System Uptime</div>
            </div>
          </div>

          {/* RIGHT WIDGETS */}
          <div className="widget pill-widget widget-ai" style={{ top: '150px', right: '110px', gap: '14px', pointerEvents: 'auto', animationDelay: '-0.5s' }}>
            <div className="icon-badge success" style={{ background: '#f0fdf4', width: '32px', height: '32px' }}>
              <Shield size={16} color="var(--success)" />
            </div>
            <div>
              <div className="metric-label" style={{ fontSize: '0.65rem' }}>AI Model Status</div>
              <div className="metric-value" style={{ fontSize: '0.9rem' }}>Active & Normal</div>
            </div>
          </div>

          <div className="widget widget-fps" style={{ top: '280px', right: '50px', width: '240px', flexDirection: 'column', alignItems: 'stretch', pointerEvents: 'auto', animationDelay: '-1.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '18px' }}>
              <div className="icon-badge warning">
                <Clock size={20} color="var(--warning)" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="metric-value" style={{ fontSize: '1.1rem' }}>60 FPS</div>
                <div className="metric-label">Processing Speed</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '40px', width: '100%' }}>
              {[30, 50, 70, 45, 65, 85, 40, 75, 55, 80].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent)', borderRadius: '3px', opacity: h > 60 ? 1 : 0.3 }}></div>
              ))}
            </div>
          </div>

          <div className="widget widget-latency" style={{ top: '530px', right: '100px', width: '310px', flexDirection: 'column', alignItems: 'stretch', pointerEvents: 'auto', animationDelay: '-2s' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
              <div className="icon-badge success" style={{ background: '#ecfdf5', width: '40px', height: '40px', flexShrink: 0 }}>
                <Wifi size={22} color="var(--success)" />
              </div>
              <div>
                <div className="metric-value" style={{ fontSize: '1.5rem' }}>92ms</div>
                <div className="metric-label">Latency</div>
              </div>
            </div>
            <div style={{ width: '100%', height: '100px' }}>
              <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M0,45 L40,45 L60,25 L80,55 L100,15 L120,40 L160,40 L200,45" fill="none" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" />
                <path d="M0,55 L30,55 L50,35 L70,55 L90,20 L110,50 L150,55 L200,50" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
                <circle cx="100" cy="15" r="5" fill="var(--danger)" stroke="white" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);
