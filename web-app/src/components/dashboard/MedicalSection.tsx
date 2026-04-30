import React from 'react';
import { Shield, Bell, Heart, BookOpen, Settings, Video, PhoneCall } from 'lucide-react';

const MedicalSection: React.FC = () => {
  return (
    <div id="muc-y-te" className="dashboard-section">
      <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '40px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
        Mục Y Tế & Giám Sát
      </h2>

      <div className="dashboard-grid-3" style={{ marginBottom: '64px' }}>
        <div className="overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-icon-box" style={{ background: 'var(--accent-light)' }}>
            <Shield size={26} color="var(--accent)" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            Bảo Mật & Riêng Tư
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
            Dữ liệu y tế được mã hóa AES-256 đầu cuối, đảm bảo tuyệt đối quyền riêng tư và tuân thủ các tiêu chuẩn an toàn dữ liệu bệnh viện.
          </p>
        </div>

        <div className="overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-icon-box" style={{ background: 'var(--danger-light)' }}>
            <Bell size={26} color="var(--danger)" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            Cảnh Báo Tức Thì
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
            Hệ thống nhận diện té ngã hoặc dấu hiệu bất thường và gửi thông báo khẩn cấp đến đội ngũ y tế hoặc người nhà ngay trong vòng 0.5 giây.
          </p>
        </div>

        <div className="overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-icon-box" style={{ background: 'var(--success-light)' }}>
            <Heart size={26} color="var(--success)" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            Nhịp Tim & Pose
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
            Phân tích tư thế cơ thể (Human Pose Estimation) để phân biệt chính xác giữa hành động cúi nhặt đồ và tình huống gục ngã thực tế.
          </p>
        </div>
      </div>

      {/* Phần Hướng Dẫn Sử Dụng (Mới Thêm) */}
      <div id="huong-dan" style={{ background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px solid var(--border)', padding: '48px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={28} color="var(--accent)" /> Hướng dẫn sử dụng hệ thống
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '40px', fontWeight: 500 }}>
          Chỉ với 3 bước đơn giản dưới đây, hệ thống sẽ tự động giám sát và bảo vệ người thân của bạn.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          
          <div style={{ background: 'var(--bg-primary)', padding: '32px 24px 24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '24px', background: 'var(--accent)', color: 'var(--bg-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '4px solid var(--bg-secondary)' }}>1</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-badge success" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <PhoneCall size={18} color="var(--success)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Khai báo Y Tế</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Vào <strong>Hồ Sơ Sức Khỏe</strong> để thêm thông tin bệnh án và đặc biệt là <em>Số điện thoại người thân</em> để hệ thống tự động gọi khi có sự cố.
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '32px 24px 24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '24px', background: 'var(--accent)', color: 'var(--bg-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '4px solid var(--bg-secondary)' }}>2</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-badge accent" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Video size={18} color="var(--accent)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Thêm Camera</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Sử dụng <strong>Webcam Local</strong> hoặc luồng <strong>Camera IP (RTSP)</strong> treo tường để bắt đầu truyền hình ảnh phân tích về AI Server.
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '32px 24px 24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '24px', background: 'var(--accent)', color: 'var(--bg-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '4px solid var(--bg-secondary)' }}>3</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-badge danger" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Bell size={18} color="var(--danger)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Bắt đầu Giám sát</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Thu nhỏ cửa sổ và hệ thống sẽ chạy ngầm. AI sẽ tự động hú còi và gọi Telegram ngay lập tức khi phát hiện có người ngã.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicalSection);
