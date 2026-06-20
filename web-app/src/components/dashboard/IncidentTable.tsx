import React from 'react';
import { Database, Download, Cloud } from 'lucide-react';
import Link from 'next/link';

interface Incident {
  id: string;
  camera: string;
  type: string;
  conf: number;
  createdAt: string;
  status: string;
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

const IncidentTable: React.FC<IncidentTableProps> = ({ incidents, onExport }) => {
  return (
    <section className="history-section">
      <div className="table-header-row">
        <div className="header-main">
          <Database size={20} />
          <h2>Nhật ký vận hành</h2>
        </div>
        <button onClick={onExport} className="btn-export">
          <Download size={18} />
          <span>Xuất CSV</span>
        </button>
      </div>

      <div className="premium-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Mã sự cố</th>
              <th>Thiết bị</th>
              <th>Loại hình</th>
              <th>Độ tin cậy</th>
              <th>Thời gian</th>
              <th>Lưu trữ</th>
              <th>Sơ cứu</th>
              <th>Trạng thái</th>
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
                    {incident.type || 'Không rõ'}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Cloud size={14} /> Synced
                  </div>
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
                    📖 Sơ cứu
                  </Link>
                </td>
                <td>
                  <div className={`status-pill ${(incident.status || 'resolved').toLowerCase()}`}>
                    <div className="pulse-dot"></div>
                    {incident.status === 'Active' ? 'Đang xử lý' : 'Đã hoàn thành'}
                  </div>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                  Chưa có nhật ký sự cố nào được ghi nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default IncidentTable;
