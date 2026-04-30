"use client"

import { useState } from 'react';
import { Settings, Bell, Shield, Sliders, Save, ChevronRight, Activity, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const [sensitivity, setSensitivity] = useState(75);
  const [thrLow, setThrLow] = useState(0.015);
  const [thrHigh, setThrHigh] = useState(0.040);
  const [audioAlert, setAudioAlert] = useState(true);

  return (
    <div className="dashboard-section" style={{ minHeight: '100vh' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Cấu Hình Toàn Hệ Thống</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
          Tùy chỉnh các tham số AI và phương thức nhận cảnh báo.
        </p>
      </header>

      <div className="settings-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* AI Sensitivity Section */}
          <section className="overview-card">
            <h2 style={{ margin: '0 0 32px 0', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.35rem', color: 'var(--text-main)' }}>
              <div className="icon-badge accent" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
                <Shield size={22} color="var(--accent)" />
              </div>
              Độ nhạy AI (Thresholds)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-end' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>Ngưỡng Bất Động (THR_LOW)</label>
                  <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 800, padding: '4px 12px', borderRadius: '8px', fontSize: '1rem' }}>{thrLow.toFixed(3)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.005" 
                  max="0.030" 
                  step="0.001" 
                  value={thrLow} 
                  onChange={(e) => setThrLow(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: '6px' }}
                />
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.5', fontWeight: 500 }}>
                  Dưới mức này AI sẽ coi là đối tượng đang nằm bất động (Unconscious).
                </p>
              </div>

              <div style={{ height: '1px', background: 'var(--border)', width: '100%' }}></div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-end' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem' }}>Ngưỡng Co Giật (THR_HIGH)</label>
                  <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontWeight: 800, padding: '4px 12px', borderRadius: '8px', fontSize: '1rem' }}>{thrHigh.toFixed(3)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.030" 
                  max="0.100" 
                  step="0.005" 
                  value={thrHigh} 
                  onChange={(e) => setThrHigh(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--warning)', cursor: 'pointer', height: '6px' }}
                />
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.5', fontWeight: 500 }}>
                  Trên mức này AI sẽ kích hoạt cảnh báo co giật (Seizure).
                </p>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="overview-card">
            <h2 style={{ margin: '0 0 32px 0', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.35rem', color: 'var(--text-main)' }}>
              <div className="icon-badge warning" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
                <Bell size={22} color="var(--warning)" />
              </div>
              Thông báo & Cảnh báo
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '6px' }}>Cảnh báo âm thanh tại Dashboard</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>Phát âm thanh còi hú khi phát hiện ngã.</div>
                </div>
                
                {/* Custom Toggle Switch */}
                <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={audioAlert} onChange={() => setAudioAlert(!audioAlert)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: audioAlert ? 'var(--accent)' : 'var(--border)',
                    transition: '0.4s var(--ease-out-quint)', borderRadius: '34px',
                    boxShadow: audioAlert ? '0 2px 8px rgba(59, 130, 246, 0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <span style={{
                      position: 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px',
                      backgroundColor: 'white', transition: '0.4s var(--ease-out-quint)', borderRadius: '50%',
                      transform: audioAlert ? 'translateX(24px)' : 'translateX(0)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '6px' }}>Gửi Telegram / SMS</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>Gửi tin nhắn tức thời cho người thân.</div>
                </div>
                <button style={{ 
                  background: 'var(--bg-primary)', border: '1px dashed var(--text-muted)', color: 'var(--text-muted)',
                  padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'not-allowed'
                }}>
                  Chưa cấu hình
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Action Card */}
          <div style={{ 
            background: 'var(--accent-light)', padding: '32px', borderRadius: '24px', 
            border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.05)' 
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Sliders size={22} /> Mẹo cấu hình
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', fontWeight: 500, marginBottom: '24px' }}>
              Sử dụng <strong>Webcam Local</strong> để calibrate ngưỡng Variance trước khi áp dụng cho camera giám sát treo tường để đảm bảo tính chính xác tuyệt đối.
            </p>
            <button style={{ 
              width: '100%', background: 'var(--accent)', color: 'var(--bg-secondary)', 
              border: 'none', padding: '16px', borderRadius: '16px', fontSize: '1.05rem', 
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: 'pointer', transition: 'transform 0.2s var(--ease-out-quint), box-shadow 0.2s var(--ease-out-quint)'
            }}>
              <Save size={20} /> LƯU CẤU HÌNH
            </button>
          </div>

          {/* Status Card */}
          <div className="overview-card" style={{ padding: '32px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Cpu size={20} color="var(--text-muted)" /> Thiết bị liên kết
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'AI Service (Py)', status: 'Kết nối tốt', color: 'var(--success)', bg: 'var(--success-light)' },
                { name: 'Core Backend (Go)', status: 'Kết nối tốt', color: 'var(--success)', bg: 'var(--success-light)' },
                { name: 'Database (Cloud)', status: 'Kết nối tốt', color: 'var(--success)', bg: 'var(--success-light)' }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</span>
                  <span style={{ 
                    color: item.color, background: item.bg, padding: '4px 12px', borderRadius: '8px', 
                    fontSize: '0.85rem', fontWeight: 700 
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
