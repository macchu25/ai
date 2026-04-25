import React from 'react';
import { Shield, Bell, Heart } from 'lucide-react';

const MedicalSection: React.FC = () => {
  return (
    <div id="muc-y-te" className="dashboard-section">
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '40px', color: '#1e293b' }}>
        Mục Y Tế & Giám Sát
      </h2>

      <div className="dashboard-grid-3">
        <div className="overview-card">
          <div className="card-icon-box" style={{ background: '#eff6ff' }}>
            <Shield size={28} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 850, marginBottom: '14px', color: '#1e293b' }}>
            Bảo Mật & Riêng Tư
          </h3>
          <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Dữ liệu y tế được mã hóa AES-256 đầu cuối, đảm bảo tuyệt đối quyền riêng tư và tuân thủ các tiêu chuẩn an toàn dữ liệu bệnh viện.
          </p>
        </div>

        <div className="overview-card">
          <div className="card-icon-box" style={{ background: '#fef2f2' }}>
            <Bell size={28} color="var(--danger)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 850, marginBottom: '14px', color: '#1e293b' }}>
            Cảnh Báo Tức Thì
          </h3>
          <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Hệ thống nhận diện té ngã hoặc dấu hiệu bất thường và gửi thông báo khẩn cấp đến đội ngũ y tế ngay trong vòng 0.5 giây.
          </p>
        </div>

        <div className="overview-card">
          <div className="card-icon-box" style={{ background: '#fdf2f8' }}>
            <Heart size={28} color="#ec4899" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 850, marginBottom: '14px', color: '#1e293b' }}>
            Nhịp Tim & Pose
          </h3>
          <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Phân tích tư thế cơ thể (Human Pose Estimation) để phân biệt giữa hành động cúi đầu và tình huống gục ngã thực tế.
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicalSection);
