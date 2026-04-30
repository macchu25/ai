import React from 'react';
import { Database, Download } from 'lucide-react';

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
                  <span className={`type-badge ${incident.type.toLowerCase()}`}>
                    {incident.type}
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
                  <div className={`status-pill ${incident.status.toLowerCase()}`}>
                    <div className="pulse-dot"></div>
                    {incident.status === 'Active' ? 'Đang xử lý' : 'Đã hoàn thành'}
                  </div>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
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
