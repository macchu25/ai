"use client"

import { useState } from 'react';
import { Settings, Bell, Shield, Sliders, Save, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const [sensitivity, setSensitivity] = useState(75);
  const [thrLow, setThrLow] = useState(0.015);
  const [thrHigh, setThrHigh] = useState(0.040);
  const [audioAlert, setAudioAlert] = useState(true);

  return (
    <div className="settings-page">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="page-title">Cấu Hình Toàn Hệ Thống</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '-16px' }}>
          Tùy chỉnh các tham số AI và phương thức nhận cảnh báo.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Sensitivity Section */}
          <section className="settings-card" style={{ 
            background: 'var(--bg-secondary)', 
            padding: '32px', 
            borderRadius: '20px', 
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent)' }}>
                <Shield size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Độ nhạy AI (Thresholds)</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontWeight: 500 }}>Ngưỡng Bất Động (THR_LOW)</label>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{thrLow.toFixed(3)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.005" 
                  max="0.030" 
                  step="0.001" 
                  value={thrLow} 
                  onChange={(e) => setThrLow(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Dưới mức này AI sẽ coi là đối tượng đang nằm bất động (Unconscious).
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontWeight: 500 }}>Ngưỡng Co Giật (THR_HIGH)</label>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{thrHigh.toFixed(3)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.030" 
                  max="0.100" 
                  step="0.005" 
                  value={thrHigh} 
                  onChange={(e) => setThrHigh(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Trên mức này AI sẽ kích hoạt cảnh báo co giật (Seizure).
                </p>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="settings-card" style={{ 
            background: 'var(--bg-secondary)', 
            padding: '32px', 
            borderRadius: '20px', 
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--warning)' }}>
                <Bell size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Thông báo & Cảnh báo</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Cảnh báo âm thanh tại Dashboard</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phát âm thanh còi hú khi phát hiện ngã.</div>
                </div>
                <input type="checkbox" checked={audioAlert} onChange={() => setAudioAlert(!audioAlert)} style={{ width: '20px', height: '20px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Gửi Telegram / SMS</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gửi tin nhắn tức thời cho người thân.</div>
                </div>
                <button className="btn" style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'var(--border)' }}>Chưa cấu hình</button>
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--accent)10', padding: '24px', borderRadius: '20px', border: '1px solid var(--accent)30' }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} /> Mẹo cấu hình
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              Sử dụng Webcam Local để calibrate ngưỡng Variance trước khi áp dụng cho camera giám sát treo tường.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              <Save size={18} /> LƯU CẤU HÌNH
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Thiết bị liên kết</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {['AI Service (Py)', 'Core Backend (Go)', 'Database (Cloud)'].map((item) => (
                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                  <span style={{ color: 'var(--success)' }}>Kết nối tốt</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
