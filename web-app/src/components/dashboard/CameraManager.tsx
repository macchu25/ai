import React from 'react';
import { LayoutGrid, Video, MapPin, Crosshair, Loader2, Link as LinkIcon, X, Power, Pencil, Trash2 } from 'lucide-react';
import { useNotification } from '@/app/context/NotificationContext';

interface Camera {
  id: string;
  name: string;
  location: string;
  rtsp_url: string;
  status: 'online' | 'offline';
}

interface CameraManagerProps {
  cameras: Camera[];
  camName: string;
  setCamName: (v: string) => void;
  camLocation: string;
  setCamLocation: (v: string) => void;
  rtspUrl: string;
  setRtspUrl: (v: string) => void;
  isTesting: boolean;
  isLocating: boolean;
  editingCamId: string | null;
  setEditingCamId: (id: string | null) => void;
  handleGetLocation: () => void;
  handleSaveCamera: (e: React.FormEvent) => void;
  toggleCamStatus: (cam: Camera) => void;
  handleDeleteCamera: (cam: Camera) => void;
  onOpenWebcamTest?: (cam: Camera) => void;
  token?: string;
  onRefreshData?: () => void;
}

const CameraManager: React.FC<CameraManagerProps> = ({
  cameras, camName, setCamName, camLocation, setCamLocation, rtspUrl, setRtspUrl,
  isTesting, isLocating, editingCamId, setEditingCamId,
  handleGetLocation, handleSaveCamera, toggleCamStatus, handleDeleteCamera,
  onOpenWebcamTest, token, onRefreshData
}) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = React.useState<'manual' | 'imou'>('manual');
  const [imouAppId, setImouAppId] = React.useState('');
  const [imouAppSecret, setImouAppSecret] = React.useState('');
  const [imouDevices, setImouDevices] = React.useState<any[]>([]);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [imouLocations, setImouLocations] = React.useState<{[key: string]: string}>({});
  const [importingId, setImportingId] = React.useState<string | null>(null);

  const handleConnectImou = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imouAppId || !imouAppSecret) {
      showToast("Vui lòng điền đầy đủ App ID và App Secret.", "error");
      return;
    }
    
    setIsConnecting(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    try {
      const res = await fetch(`${apiBase}/cameras/imou/devices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          app_id: imouAppId,
          app_secret: imouAppSecret,
          region: 'global'
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setImouDevices(data.devices || []);
        showToast(`Tìm thấy ${data.devices?.length || 0} thiết bị camera IMOU.`, "success");
      } else {
        showToast(data.error || "Không thể lấy danh sách camera IMOU.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối tới Go Backend.", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImportDevice = async (device: any) => {
    if (!device.stream_url) {
      showToast(
        device.stream_error || "Không có link live stream. Kiểm tra quyền Live Stream trên IMOU Open Platform hoặc camera offline.",
        "error"
      );
      return;
    }

    const location = imouLocations[device.id] || 'IMOU Cloud';
    setImportingId(device.id);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    try {
      // Check health profile first
      const profileRes = await fetch(`${apiBase}/health-profiles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (!profileData.contacts || profileData.contacts.length === 0) {
        showToast("Bạn cần thêm ít nhất 1 liên hệ người thân trong mục Hồ Sơ Y Tế trước.", "error");
        setImportingId(null);
        return;
      }

      const res = await fetch(`${apiBase}/cameras`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: device.name,
          location: location,
          rtsp_url: device.stream_url,
          status: "online"
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(`Đã import thành công camera "${device.name}"!`, "success");
        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.message || data.error || "Lỗi khi import camera.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối khi import camera.", "error");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <section className="infrastructure-section">
      <div className="glass-card-premium config-panel">
        <div className="card-header-row">
          <div className="header-main">
            <LayoutGrid size={20} color="var(--accent)" />
            <h3>{editingCamId ? 'Cập nhật Camera' : 'Thiết lập Camera Mới'}</h3>
          </div>
          {editingCamId && (
            <button className="btn-cancel-edit" onClick={() => {
              setEditingCamId(null);
              setCamName('');
              setCamLocation('');
              setRtspUrl('');
            }}>
              <X size={16} /> Hủy chỉnh sửa
            </button>
          )}
        </div>
        
        {/* TABS SELECTOR */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('manual')}
            style={{
              background: activeTab === 'manual' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === 'manual' ? '#3b82f6' : '#64748b',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Thêm Thủ Công (RTSP/Webcam)
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('imou')}
            style={{
              background: activeTab === 'imou' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === 'imou' ? '#3b82f6' : '#64748b',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Nhập từ IMOU Cloud (API)
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleSaveCamera} className="premium-form-grid">
            <div className="input-field">
              <Video size={18} className="field-icon" />
              <input 
                placeholder="Tên Camera" 
                value={camName} onChange={e => setCamName(e.target.value)}
              />
            </div>
            <div className="input-field">
              <MapPin size={18} className="field-icon" />
              <input 
                placeholder="Vị trí lắp đặt" 
                value={camLocation} onChange={e => setCamLocation(e.target.value)}
              />
              <button 
                type="button" 
                onClick={handleGetLocation} 
                className="btn-locate"
                title="Tự động lấy vị trí hiện tại"
              >
                {isLocating ? <Loader2 size={16} className="spin" /> : <Crosshair size={16} />}
              </button>
            </div>
            <div className="input-field wide" style={{ marginBottom: '8px' }}>
              <LinkIcon size={18} className="field-icon" />
              <input 
                placeholder="RTSP Stream URL hoặc API Stream URL (Rỗng nếu dùng WebCam)" 
                value={rtspUrl} onChange={e => setRtspUrl(e.target.value)}
              />
            </div>
            <div className="field-help-text" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '-12px', marginBottom: '16px', gridColumn: 'span 2', paddingLeft: '8px' }}>
              💡 Hỗ trợ cả luồng <strong>RTSP</strong> (ví dụ: <code>rtsp://192.168.1.100:554/stream1</code>) và luồng <strong>API/MJPEG</strong> (ví dụ: <code>http://localhost:5000/video_feed</code>).
            </div>
            <button type="submit" className={`btn-save-config ${editingCamId ? 'editing' : ''}`} disabled={isTesting}>
              {isTesting ? 'Đang xử lý...' : (editingCamId ? 'Cập nhật ngay' : 'Thêm Camera Mới')}
            </button>
          </form>
        ) : (
          <div>
            <form onSubmit={handleConnectImou} className="premium-form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '16px', marginBottom: '16px' }}>
              <div className="input-field" style={{ minWidth: '200px' }}>
                <LayoutGrid size={18} className="field-icon" />
                <input 
                  placeholder="IMOU App ID" 
                  value={imouAppId} onChange={e => setImouAppId(e.target.value)}
                />
              </div>
              <div className="input-field" style={{ minWidth: '200px' }}>
                <LinkIcon size={18} className="field-icon" />
                <input 
                  type="password"
                  placeholder="IMOU App Secret" 
                  value={imouAppSecret} onChange={e => setImouAppSecret(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-save-config" disabled={isConnecting} style={{ height: '50px' }}>
                {isConnecting ? 'Đang kết nối...' : 'Kết nối & Lấy thiết bị'}
              </button>
            </form>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '24px', paddingLeft: '4px' }}>
              Dùng nền tảng <strong>Bản Quốc tế (easy4ip)</strong> — camera IMOU tại Việt Nam không dùng bản Nội địa Trung Quốc.
            </div>
            
            {imouDevices.length > 0 && (
              <div style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px', color: '#1e293b' }}>
                  Danh sách thiết bị quét được:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {imouDevices.map(device => (
                    <div 
                      key={device.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        background: 'rgba(255, 255, 255, 0.6)', 
                        padding: '12px 20px', 
                        borderRadius: '14px',
                        border: '1px solid rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: device.status === 'online' ? '#10b981' : '#94a3b8',
                          boxShadow: device.status === 'online' ? '0 0 8px #10b981' : 'none'
                        }}></div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{device.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {device.id}</div>
                          {device.stream_url ? (
                            <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '2px' }}>✓ Đã có link live stream</div>
                          ) : device.stream_error ? (
                            <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '4px', maxWidth: '280px' }}>{device.stream_error}</div>
                          ) : null}
                        </div>
                      </div>
                      
                      {device.status === 'online' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="input-field" style={{ padding: '0 10px', height: '36px', width: '150px' }}>
                            <MapPin size={14} className="field-icon" style={{ marginRight: '6px' }} />
                            <input 
                              placeholder="Vị trí lắp đặt" 
                              value={imouLocations[device.id] || ''} 
                              onChange={e => setImouLocations({
                                ...imouLocations,
                                [device.id]: e.target.value
                              })}
                              style={{ padding: '4px 0', fontSize: '0.8rem' }}
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleImportDevice(device)}
                            className="btn-save-config"
                            style={{ padding: '0 16px', height: '36px', fontSize: '0.8rem', borderRadius: '10px', opacity: device.stream_url ? 1 : 0.5 }}
                            disabled={importingId === device.id || !device.stream_url}
                          >
                            {importingId === device.id ? 'Đang nhập...' : 'Import'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Thiết bị đang Offline</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="active-devices-list">
          <div className="list-title">Danh sách Device đang online:</div>
          <div className="device-chips">
            {cameras.map((cam) => (
              <div key={cam.id} className={`device-chip ${cam.status}`}>
                <div className={`indicator ${cam.status === 'online' ? 'pulse' : ''}`}></div>
                <div className="chip-content">
                  <span className="name">{cam.name}</span>
                  <span className="loc">{cam.location}</span>
                </div>
                <div className="chip-actions">
                  {(!cam.rtsp_url || cam.rtsp_url === 'webcam') && onOpenWebcamTest && (
                    <button 
                      onClick={() => onOpenWebcamTest(cam)} 
                      className="action-btn webcam-test" 
                      title="Mở WebCam Test AI"
                      style={{ color: '#10b981', background: '#ecfdf5' }}
                      type="button"
                    >
                      <Video size={14} />
                    </button>
                  )}
                  <button onClick={() => toggleCamStatus(cam)} className={`action-btn power ${cam.status}`} title="Bật/Tắt Camera">
                    <Power size={14} />
                  </button>
                  <button onClick={() => {
                      setEditingCamId(cam.id);
                      setCamName(cam.name);
                      setCamLocation(cam.location);
                      setRtspUrl(cam.rtsp_url);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="action-btn edit" title="Sửa tên/địa chỉ">
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCamera(cam)}
                    className="action-btn delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CameraManager;
