"use client"

import { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Sliders, Save, ChevronRight, Activity, Cpu, X } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useNotification } from '@/app/context/NotificationContext';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { showToast } = useNotification();
  
  const [thrLow, setThrLow] = useState(0.015);
  const [thrHigh, setThrHigh] = useState(0.040);
  const [audioAlert, setAudioAlert] = useState(true);
  const [showTeleModal, setShowTeleModal] = useState(false);
  const [teleId, setTeleId] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const fetchProfile = async () => {
        const token = (session?.user as any)?.accessToken;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        try {
          const res = await fetch(`${apiBase}/health-profiles`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.telegram_chat_id) {
              setTeleId(data.telegram_chat_id);
            }
            if (data.thrLow !== undefined) setThrLow(data.thrLow);
            if (data.thrHigh !== undefined) setThrHigh(data.thrHigh);
            if (data.audioAlert !== undefined) setAudioAlert(data.audioAlert);
          }
          setIsLoaded(true);
        } catch (err) {
          console.error("Lỗi lấy hồ sơ:", err);
        }
      };
      fetchProfile();
    }
  }, [status, session]);

  const handleSaveSettings = async () => {
    const token = (session?.user as any)?.accessToken;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    try {
      const res = await fetch(`${apiBase}/health-profiles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          thrLow,
          thrHigh,
          audioAlert
        })
      });

      if (res.ok) {
        showToast("Đã lưu cấu hình thành công!", "success");
      } else {
        showToast("Không thể lưu cấu hình.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối server.", "error");
    }
  };

  const handleSaveTele = async () => {
    if (!teleId) {
      showToast("Vui lòng nhập Chat ID.", "error");
      return;
    }

    const token = (session?.user as any)?.accessToken;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    try {
      const res = await fetch(`${apiBase}/health-profiles/telegram`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ telegram_chat_id: teleId })
      });
      
      if (res.ok) {
        showToast("Đã liên kết Telegram thành công!", "success");
        setShowTeleModal(false);
      } else {
        showToast("Lỗi khi lưu Telegram ID.", "error");
      }
    } catch (err) {
      showToast("Không thể kết nối tới Backend.", "error");
    }
  };

  return (
    <div className="dashboard-section" style={{ minHeight: '100vh' }}>
      <header className="page-header-premium">
        <div>
          <h1 className="page-title-premium">Cấu Hình Toàn Hệ Thống</h1>
          <p className="page-subtitle-premium">
            Tùy chỉnh các tham số AI và phương thức nhận cảnh báo.
          </p>
        </div>
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
                <button 
                  onClick={() => setShowTeleModal(true)}
                  style={{ 
                    background: teleId ? '#10b981' : 'var(--accent)', 
                    color: 'white', 
                    border: 'none',
                    padding: '12px 24px', 
                    borderRadius: '14px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontSize: '0.9rem', 
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: teleId ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  {teleId ? `ID: ${teleId}` : 'Cấu hình ngay'}
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
            <button 
              onClick={handleSaveSettings}
              style={{ 
                width: '100%', background: 'var(--accent)', color: 'var(--bg-secondary)', 
                border: 'none', padding: '16px', borderRadius: '16px', fontSize: '1.05rem', 
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                cursor: 'pointer', transition: 'transform 0.2s var(--ease-out-quint), box-shadow 0.2s var(--ease-out-quint)'
              }}
            >
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

      {/* Telegram Modal */}
      {showTeleModal && (
        <div className="modal-backdrop-blur" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(15, 23, 42, 0.3)', 
          backdropFilter: 'blur(12px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10000 
        }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            padding: '36px 32px', 
            borderRadius: '28px', 
            width: '100%', 
            maxWidth: '520px', 
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.12), 0 20px 40px -20px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            fontFamily: '"Inter", sans-serif',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowTeleModal(false)} 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '24px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
                Cấu hình nhận tin cảnh báo Telegram
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Tự động nhận thông báo hình ảnh sự cố và trạng thái trực tiếp qua tài khoản cá nhân.
              </p>
            </div>
            
            {/* Instructions box */}
            <div style={{ 
              background: '#eff6ff', 
              padding: '16px 20px', 
              borderRadius: '16px', 
              marginBottom: '24px', 
              fontSize: '0.88rem', 
              color: '#1e293b', 
              lineHeight: '1.6', 
              border: '1px solid rgba(59, 130, 246, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <strong style={{ color: '#1e293b', fontSize: '0.92rem' }}>Hướng dẫn lấy Chat ID:</strong>
              <div>1. Tìm kiếm và nhắn tin cho Bot <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>@userinfobot</a></div>
              <div>2. Nó sẽ phản hồi tức thì với một dãy số (chính là <strong>ID</strong> của bạn).</div>
              <div>3. Nhập ID đó xuống ô bên dưới để liên kết với hệ thống <strong>@Casos_autoBot</strong>.</div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Telegram Chat ID</label>
              <input 
                type="text" 
                placeholder="Ví dụ: 123456789"
                value={teleId}
                onChange={(e) => setTeleId(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '11px 15px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '0.95rem',
                  outline: 'none',
                  color: '#1e293b',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  background: '#ffffff'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setShowTeleModal(false)} 
                style={{ 
                  padding: '11px 20px', 
                  borderRadius: '14px', 
                  border: '1px solid #e2e8f0', 
                  background: '#ffffff', 
                  color: '#64748b',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveTele} 
                style={{ 
                  padding: '11px 24px', 
                  borderRadius: '14px', 
                  border: 'none', 
                  background: '#3b82f6', 
                  color: 'white', 
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.15)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

