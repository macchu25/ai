import Link from 'next/link';
import { Camera, Activity, HeartPulse, Settings, UserCircle, ShieldCheck, LogIn } from 'lucide-react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-layout">
            <aside className="sidebar-slim">
              <div className="logo-icon">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, white, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  <ShieldCheck color="var(--accent)" size={24} />
                </div>
              </div>
              
              <nav className="nav-menu">
                <Link href="/" className="nav-link" title="Giám Sát Live">
                  <Camera size={22} />
                </Link>
                
                <Link href="/incidents" className="nav-link" title="Nhật Ký Sự Cố">
                  <Activity size={22} />
                </Link>
                
                <Link href="/profile" className="nav-link" title="Hồ Sơ Y Tế">
                  <UserCircle size={22} />
                </Link>

                <div className="nav-divider"></div>

                <Link href="/cpr" className="nav-link" title="Sơ Cứu Khẩn Cấp">
                  <HeartPulse size={22} />
                </Link>

                <Link href="/settings" className="nav-link" title="Cấu Hình AI">
                  <Settings size={22} />
                </Link>
              </nav>

              <div className="sidebar-footer">
                <Link href="/login" className="nav-link logout-btn" title="Đăng nhập">
                  <LogIn size={22} color="var(--danger)" />
                </Link>
              </div>
            </aside>
            
            <main className="main-content-medical">
              <header className="top-header">
                <div className="header-left">
                   <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                     Trung Tâm Điều Hành <span style={{ color: 'var(--accent)' }}>AI</span>
                   </div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>14 Thg 10, 10:54 AM</div>
                </div>

                <div className="header-center">
                   <div className="search-pill">
                     <Settings size={18} color="var(--text-muted)" />
                   </div>
                   <nav className="header-tabs">
                     <span className="tab active">Tổng Quan</span>
                     <span className="tab">Mục Y Tế</span>
                     <span className="tab">Báo Cáo</span>
                   </nav>
                </div>

                <div className="header-right">
                   <div className="notification-bell">
                     <Activity size={20} />
                     <span className="badge-dot"></span>
                   </div>
                   <div className="user-avatar">
                     <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="User" />
                   </div>
                </div>
              </header>

              <div className="workspace-area">
                 {children}
              </div>
            </main>
    </div>
  );
}
