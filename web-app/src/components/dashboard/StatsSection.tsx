import React from 'react';
import { FileBarChart, UserCheck, Clock } from 'lucide-react';

const StatsSection: React.FC = () => {
  return (
    <div id="bao-cao" className="dashboard-section">
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px', color: '#1e293b' }}>
        Báo Cáo & Thống Kê
      </h2>
      <p style={{ color: '#64748b', marginBottom: '40px' }}>
        Báo cáo hiệu năng và mức độ an toàn của hệ thống trong 24h qua.
      </p>

      <div className="dashboard-grid-stats">
        <div className="overview-card" style={{ textAlign: 'center' }}>
          <FileBarChart size={36} color="var(--accent)" style={{ marginBottom: '15px' }} />
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e293b' }}>1,248</div>
          <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Sự cố đã ngăn chặn</div>
        </div>

        <div className="overview-card" style={{ textAlign: 'center' }}>
          <UserCheck size={36} color="var(--success)" style={{ marginBottom: '15px' }} />
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e293b' }}>98%</div>
          <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Độ chính xác AI</div>
        </div>

        <div className="overview-card" style={{ textAlign: 'center' }}>
          <Clock size={36} color="var(--warning)" style={{ marginBottom: '15px' }} />
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e293b' }}>0.02s</div>
          <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Tốc độ xử lý TB</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsSection);
