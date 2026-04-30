"use client"

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Camera, Activity, HeartPulse, Settings, UserCircle, ShieldCheck, LogIn, Monitor, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';
import ScrollToTop from '@/components/ScrollToTop';
import { NotificationProvider } from '@/app/context/NotificationContext';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { status } = useSession();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

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
      <div className="dashboard-layout">
            <aside className="sidebar-slim">
              <div className="logo-icon">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, white, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  <ShieldCheck color="var(--accent)" size={24} />
                </div>
              </div>
              
              <nav className="nav-menu">
                <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`} title="Tổng Quan Dashboard">
                  <Monitor size={22} />
                </Link>

                <Link href="/cameras" className={`nav-link ${pathname === '/cameras' ? 'active' : ''}`} title="Phòng Camera Live">
                  <LayoutGrid size={22} />
                </Link>
                
                <Link href="/incidents" className={`nav-link ${pathname === '/incidents' ? 'active' : ''}`} title="Nhật Ký Sự Cố">
                  <Activity size={22} />
                </Link>
                
                <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`} title="Hồ Sơ Y Tế">
                  <UserCircle size={22} />
                </Link>

                <div className="nav-divider"></div>

                <Link href="/cpr" className={`nav-link ${pathname === '/cpr' ? 'active' : ''}`} title="Sơ Cứu Khẩn Cấp">
                  <HeartPulse size={22} />
                </Link>

                <Link href="/settings" className={`nav-link ${pathname === '/settings' ? 'active' : ''}`} title="Cấu Hình AI">
                  <Settings size={22} />
                </Link>
              </nav>

              <div className="sidebar-footer">
                <button 
                  onClick={() => signOut()}
                  className="nav-link logout-btn" 
                  title="Đăng xuất"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <LogIn size={22} color="var(--danger)" />
                </button>
              </div>
            </aside>
            
            <main className="main-content-medical">
              <header className="top-header">
                <div className="header-left">
                   <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                     Trung Tâm Điều Hành <span style={{ color: 'var(--accent)' }}>AI</span>
                   </div>
                   {mounted && (
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                       {time.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}, {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                     </div>
                   )}
                </div>

                 <div className="header-center">
                    <div className="search-pill">
                      <Settings size={18} color="var(--text-muted)" />
                    </div>
                    <nav className="header-tabs">
                      <a href="/#tong-quan" className={`tab ${pathname === '/' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Tổng Quan</a>
                      <a href="/#muc-y-te" className="tab" style={{ textDecoration: 'none' }}>Mục Y Tế</a>
                      <a href="/#huong-dan" className="tab" style={{ textDecoration: 'none' }}>Hướng Dẫn</a>
                      <a href="/#bao-cao" className="tab" style={{ textDecoration: 'none' }}>Báo Cáo</a>
                      <a href="/#feedback-section" className="tab" style={{ textDecoration: 'none' }}>Góp Ý</a>
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

              <div className="workspace-area" style={{ scrollBehavior: 'smooth' }}>
                 {children}
              </div>
            </main>
        <ScrollToTop />
      </div>
    </NotificationProvider>
  );
}
