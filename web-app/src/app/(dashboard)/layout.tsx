"use client"

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { 
  Home, Video, Activity, HeartPulse, Settings, UserCircle, 
  ShieldCheck, LogIn, Monitor, LayoutGrid, BarChart3, 
  AlertTriangle, Cpu, FileText, Send, Terminal, Zap, LogOut, ChevronDown, Bell
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ScrollToTop from '@/components/ScrollToTop';
import { NotificationProvider } from '@/app/context/NotificationContext';
import { usePathname, useRouter } from 'next/navigation';
import Loading from './loading';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Hiệu ứng loading khi chuyển trang
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 600); // Hiển thị loading trong 600ms để tạo cảm giác mượt mà
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const smoothScroll = (targetTop: number, container: HTMLElement) => {
      const start = container.scrollTop;
      const change = targetTop - start;
      const duration = 800; // ms
      let startTime = 0;

      const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
      };

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = currentTime - startTime;
        const val = easeInOutQuad(progress, start, change, duration);
        container.scrollTop = val;
        if (progress < duration) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      const href = anchor?.getAttribute('href');
      
      if (anchor && href && href.includes('#')) {
        const targetId = href.split('#')[1];
        const targetElement = document.getElementById(targetId || '');
        const scrollContainer = document.querySelector('.workspace-area') as HTMLElement;
        
        if (targetElement && scrollContainer) {
          e.preventDefault();
          const containerTop = scrollContainer.getBoundingClientRect().top;
          const elementTop = targetElement.getBoundingClientRect().top;
          const targetPos = elementTop - containerTop + scrollContainer.scrollTop;
          smoothScroll(targetPos, scrollContainer);
          
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          anchor.classList.add('active');
        }
      }
    };

    window.addEventListener('click', handleLinkClick, { capture: true });
    return () => window.removeEventListener('click', handleLinkClick, { capture: true });
  }, []);

  return (
    <NotificationProvider>
      <div className="dashboard-layout" style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            <aside className="sidebar-slim">
              <div className="logo-section">
                <span className="logo-text">IICasos</span>
              </div>

              <div className="project-selector">
                <div className="project-icon"></div>
                <span className="project-name">CasosCreative</span>
                <ChevronDown size={16} color="#94a3b8" />
              </div>
              
              <nav className="nav-menu">
                <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                 <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>
                   <UserCircle size={20} />
                   <span>Hồ Sơ</span>
                 </Link>
                 <Link href="/cameras" className={`nav-link ${pathname === '/cameras' ? 'active' : ''}`}>
                   <Video size={20} />
                   <span>Cameras</span>
                 </Link>
                <Link href="/analytics" className={`nav-link ${pathname === '/analytics' ? 'active' : ''}`}>
                  <Activity size={20} />
                  <span>Analytics</span>
                </Link>
                <Link href="/incidents" className={`nav-link ${pathname === '/incidents' ? 'active' : ''}`}>
                  <AlertTriangle size={20} />
                  <span>Incidents</span>
                </Link>
                
                <div className="nav-group-label">Pinned</div>
                <Link href="/ai-models" className="nav-link">
                  <Cpu size={20} />
                  <span>AI Models</span>
                </Link>
                <Link href="/reports" className="nav-link">
                  <FileText size={20} />
                  <span>Reports</span>
                </Link>
                <Link href="/settings" className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}>
                  <Settings size={20} />
                  <span>Settings</span>
                </Link>
              </nav>

              <div className="sidebar-footer">
                <div className="invite-card">
                  <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Send size={16} color="#64748b" />
                  </div>
                  <span className="invite-title">Invite team members</span>
                  <p className="invite-desc">Bring your team in to collaborate.</p>
                </div>
                
                <button className="upgrade-btn">
                  <Zap size={18} fill="#1e293b" />
                  <span>Upgrade</span>
                </button>
                
                <button onClick={() => setShowLogoutModal(true)} className="nav-link logout-btn" style={{ marginTop: '8px', color: '#ef4444', width: '100%', justifyContent: 'flex-start', background: 'none', border: 'none', cursor: 'pointer' }}>
                   <LogOut size={20} />
                   <span>Logout</span>
                 </button>
              </div>
            </aside>
            
            <main className="main-content-medical">
              <header className="top-header">
                <div className="header-content-wrapper">
                  <div className="header-left">
                     <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                       Trung Tâm Điều Hành <span style={{ color: 'var(--accent)' }}>AI</span>
                     </div>
                     {mounted && (
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                         {time.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}, {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     )}
                  </div>

                   <div className="header-center">
                      <nav className="header-tabs">
                        <Link href="/" className={`tab ${pathname === '/' ? 'active' : ''}`}>Tổng Quan</Link>
                        <a href="/#muc-y-te" className="tab">Mục Y Tế</a>
                        <a href="/#huong-dan" className="tab">Hướng Dẫn</a>
                        <a href="/#feedback-section" className="tab">Góp Ý</a>
                      </nav>
                   </div>

                  <div className="header-right">
                     <div 
                       className="notification-bell" 
                       onClick={() => setShowNotifications(!showNotifications)}
                       style={{ cursor: 'pointer', position: 'relative' }}
                     >
                       <Bell size={18} strokeWidth={2.5} />
                       <span className="badge-dot"></span>

                       {showNotifications && (
                         <div className="notification-dropdown">
                           <div className="notification-header">
                             <h3>Trung Tâm Cảnh Báo</h3>
                             <span className="mark-read">Đánh dấu đã đọc</span>
                           </div>
                           <div className="notification-list">
                             <div className="notification-item critical">
                               <div className="notif-icon">🚨</div>
                               <div className="notif-content">
                                 <div className="notif-title">CẢNH BÁO: Người bị ngã!</div>
                                 <div className="notif-desc">Phát hiện sự cố tại Khu vực Hành lang 1.</div>
                                 <div className="notif-time">2 phút trước</div>
                               </div>
                             </div>
                             <div className="notification-item">
                               <div className="notif-icon">📡</div>
                               <div className="notif-content">
                                 <div className="notif-title">Hệ thống AI Active</div>
                                 <div className="notif-desc">Bắt đầu giám sát 12 camera thành công.</div>
                                 <div className="notif-time">1 giờ trước</div>
                               </div>
                             </div>
                           </div>
                           <div className="notification-footer">
                             Xem tất cả vụ việc
                           </div>
                         </div>
                       )}
                     </div>
                     <div className="user-avatar">
                       <img 
                         src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name || 'User'}&background=3b82f6&color=fff`} 
                         alt="User Profile" 
                       />
                     </div>
                  </div>
                </div>
              </header>

              <div className="workspace-area">
                <div className="workspace-content-wrapper">
                   {isNavigating ? <Loading /> : children}
                </div>
              </div>
            </main>
        <ScrollToTop />

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 
          }}>
            <div style={{ 
              background: 'white', padding: '40px', borderRadius: '32px', 
              width: '100%', maxWidth: '400px', textAlign: 'center',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              animation: 'modalFadeUp 0.3s ease'
            }}>
              <div style={{ 
                width: '64px', height: '64px', background: '#fee2e2', 
                borderRadius: '20px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', margin: '0 auto 24px', color: '#ef4444'
              }}>
                <LogOut size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>Xác nhận đăng xuất?</h3>
              <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
                Bạn có chắc chắn muốn rời khỏi hệ thống điều hành Casos? Các phiên giám sát vẫn sẽ tiếp tục chạy ngầm.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  style={{ 
                    flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0',
                    background: 'white', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Quay lại
                </button>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    flex: 1, padding: '16px', borderRadius: '16px', border: 'none',
                    background: '#ef4444', color: 'white', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}
