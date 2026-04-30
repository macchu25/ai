import React from 'react';
import { LayoutGrid, Video, MapPin, Crosshair, Loader2, Link as LinkIcon, X, Power, Pencil, Trash2 } from 'lucide-react';

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
}

const CameraManager: React.FC<CameraManagerProps> = ({
  cameras, camName, setCamName, camLocation, setCamLocation, rtspUrl, setRtspUrl,
  isTesting, isLocating, editingCamId, setEditingCamId,
  handleGetLocation, handleSaveCamera, toggleCamStatus, handleDeleteCamera
}) => {
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
          <div className="input-field wide">
            <LinkIcon size={18} className="field-icon" />
            <input 
              placeholder="RTSP Stream URL (Rỗng nếu dùng WebCam)" 
              value={rtspUrl} onChange={e => setRtspUrl(e.target.value)}
            />
          </div>
          <button type="submit" className={`btn-save-config ${editingCamId ? 'editing' : ''}`} disabled={isTesting}>
            {isTesting ? 'Đang xử lý...' : (editingCamId ? 'Cập nhật ngay' : 'Thêm Camera Mới')}
          </button>
        </form>

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
