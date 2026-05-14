"use client"

import Link from 'next/link';
import { useDashboardSocket } from '@/hooks/useDashboardSocket';
import { signOut, useSession } from 'next-auth/react';
import {
  Home, Video, Activity, HeartPulse, Settings, UserCircle,
  ShieldCheck, LogIn, Monitor, LayoutGrid, BarChart3,
  AlertTriangle, Cpu, FileText, Send, Terminal, Zap, LogOut, ChevronDown, Bell, Sparkles, BookOpen, Search
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ScrollToTop from '@/components/ScrollToTop';
import { NotificationProvider } from '@/app/context/NotificationContext';
import { usePathname, useRouter } from 'next/navigation';
import Loading from './loading';

function formatRelativeVi(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  const [realtimePlan, setRealtimePlan] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [expiryFromApiHydrated, setExpiryFromApiHydrated] = useState(false);

  const fetchPlan = async () => {
    const token = (session?.user as any)?.accessToken;
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/health-profiles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        signOut({ callbackUrl: '/login' });
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setExpiryFromApiHydrated(true);
      if (data.subscription_plan) {
        setRealtimePlan(data.subscription_plan);
      }
      if (Object.prototype.hasOwnProperty.call(data, 'plan_expires_at')) {
        const v = data.plan_expires_at;
        setExpiryDate(v ? String(v) : '');
      }
    } catch (e) { }
  };

  type InboxRow = { id: string; kind: string; title: string; body: string; read: boolean; created_at: string };
  const [inboxItems, setInboxItems] = useState<InboxRow[]>([]);

  const fetchNotifications = async () => {
    const token = (session?.user as any)?.accessToken;
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.status === 401) {
        signOut({ callbackUrl: '/login' });
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setInboxItems(data.notifications);
      }
    } catch (e) { }
  };

  const markAllNotificationsRead = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const token = (session?.user as any)?.accessToken;
    if (!token) return;
    try {
      await fetch(`${apiBase}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      await fetchNotifications();
    } catch (err) { }
  };

  const [toastMessage, setToastMessage] = useState('');

  useDashboardSocket(apiBase, (session?.user as any)?.accessToken || '', async (payload) => {
    if (payload?.status === 'canceled') {
      setToastMessage('Bạn đã hủy gói cước thành công. ℹ️');
    } else {
      setToastMessage('Chúc mừng! Tài khoản của bạn đã được nâng cấp thành công. 🎉');
    }
    await update();
    fetchPlan();
    fetchNotifications();
    setTimeout(() => setToastMessage(''), 5000);
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlan();
      fetchNotifications();
    }
  }, [status, session]);

  const currentPlan = (realtimePlan || (session?.user as any)?.subscription_plan || 'free').toLowerCase();
  const rawExpiry =
    expiryFromApiHydrated
      ? expiryDate
      : (expiryDate || ((session?.user as any)?.plan_expires_at as string | undefined) || '');
  const currentExpiry =
    typeof rawExpiry === 'string' && rawExpiry !== '' ? rawExpiry : '';
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Inject Inter font globally
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const smoothScroll = (targetTop: number, container: HTMLElement) => {
      const start = container.scrollTop;
      const change = targetTop - start;
      const duration = 800; // ms
      let startTime = 0;

      const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
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
      <div className="dashboard-layout" style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: '"Inter", sans-serif' }}>
        <aside className="sidebar-slim">
          <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', width: '100%', borderBottom: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
            <img src="/logo.png" alt="Casos Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <span className="logo-text" style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-1.2px', color: '#1e293b', whiteSpace: 'nowrap' }}>
              Casos<span style={{ color: 'var(--accent)' }}>.ai</span>
            </span>
          </div>

          <nav className="nav-menu">
            <div className="project-selector" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: '#fff',
              borderRadius: '16px',
              marginBottom: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9',
              transition: 'all 0.2s ease',
              margin: '0 8px 24px 8px'
            }}>
              <img src="/image.png" alt="Studio Icon" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />
              <span className="project-name" style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', flex: 1 }}>MacchuStudio</span>
              <ChevronDown size={16} color="#94a3b8" />
            </div>
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>
              <UserCircle size={20} />
              <span>Profile</span>
            </Link>
            <Link href="/cameras" className={`nav-link ${pathname === '/cameras' ? 'active' : ''}`}>
              <Video size={20} />
              <span>Cameras</span>
            </Link>
            <Link href="/recommendations" className={`nav-link ${pathname === '/recommendations' ? 'active' : ''}`}>
              <Monitor size={20} />
              <span>Store</span>
            </Link>
            <Link href="/analytics" className={`nav-link ${pathname === '/analytics' ? 'active' : ''}`}>
              <Activity size={20} />
              <span>Analytics</span>
            </Link>
            <Link href="/incidents" className={`nav-link ${pathname === '/incidents' ? 'active' : ''}`}>
              <AlertTriangle size={20} />
              <span>Incidents</span>
            </Link>
            <Link href="/docs" className={`nav-link ${pathname === '/docs' ? 'active' : ''}`}>
              <BookOpen size={20} />
              <span>Documents</span>
            </Link>

            <div className="nav-group-label">Pinned</div>
            <Link href="/ai-models" className="nav-link">
              <Cpu size={20} />
              <span>AI Models</span>
            </Link>
            <Link href="/reports" className={`nav-link ${pathname === '/reports' ? 'active' : ''}`}>
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

            <Link href="/subscription" className="upgrade-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Zap size={18} fill="#1e293b" />
              <span>Upgrade</span>
            </Link>

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

              <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Thanh tìm kiếm */}
                <div 
                  className="search-shortcut"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '240px',
                    height: '36px',
                    padding: '0 12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'text',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    transition: 'border-color 0.2s ease',
                  }}
                  onClick={() => {
                    const input = document.getElementById('global-search-input');
                    if (input) input.focus();
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Search size={14} color="#94a3b8" />
                    <input 
                      id="global-search-input"
                      type="text" 
                      placeholder="Search documentation..." 
                      style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        color: '#0f172a',
                        width: '100%',
                        fontSize: '0.85rem'
                      }}
                    />
                  </span>
                  <span style={{ 
                    background: '#ffffff', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    fontWeight: 600,
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    marginLeft: '8px'
                  }}>
                    CtrlK
                  </span>
                </div>

                <div
                  className="notification-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <Bell size={18} strokeWidth={2.5} />
                  {inboxItems.some(i => !i.read) ? <span className="badge-dot"></span> : null}

                  {showNotifications && (
                    <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="notification-header">
                        <h3>Thông báo</h3>
                        <span
                          className="mark-read"
                          role="button"
                          tabIndex={0}
                          onClick={markAllNotificationsRead}
                          onKeyDown={(ev) => { if (ev.key === 'Enter') void markAllNotificationsRead(ev); }}
                        >
                          Đánh dấu đã đọc
                        </span>
                      </div>
                      <div className="notification-list">
                        {inboxItems.length === 0 ? (
                          <div className="notification-item" style={{ cursor: 'default' }}>
                            <div className="notif-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Bell size={18} color="#64748b" />
                            </div>
                            <div className="notif-content">
                              <div className="notif-title">Chưa có thông báo</div>
                              <div className="notif-desc">Khi bạn đăng ký gói hoặc có thanh toán, tin nhắn sẽ xuất hiện tại đây.</div>
                            </div>
                          </div>
                        ) : (
                          inboxItems.map((n) => (
                            <div
                              key={n.id}
                              className={`notification-item${n.read ? '' : ' subscription-unread'}`}
                              style={{ cursor: 'default' }}
                            >
                              <div className="notif-icon">
                                {n.kind === 'subscription_activated'
                                  ? <Sparkles size={18} style={{ color: '#3b82f6' }} />
                                  : '📬'}
                              </div>
                              <div className="notif-content">
                                <div className="notif-title">{n.title}</div>
                                <div className="notif-desc">{n.body}</div>
                                {n.created_at ? (
                                  <div className="notif-time">{formatRelativeVi(n.created_at)}</div>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Link href="/subscription" className="notification-footer" style={{ textDecoration: 'none', display: 'block' }}>
                        Lịch sử thanh toán trong Gói đăng ký
                      </Link>
                    </div>
                  )}
                </div>
                <div className="user-profile-container" style={{ position: 'relative' }}>
                  <div className="user-avatar" style={{
                    position: 'relative',
                    padding: '3px',
                    borderRadius: '50%',
                    background: currentPlan === 'pro' || currentPlan === 'scale'
                      ? 'linear-gradient(45deg, #f59e0b, #fbbf24)' // Gold
                      : currentPlan === 'starter' || currentPlan === 'creator'
                        ? 'linear-gradient(45deg, #3b82f6, #60a5fa)' // Blue
                        : 'linear-gradient(45deg, #cbd5e1, #94a3b8)', // Gray/Silver
                    cursor: 'pointer'
                  }}>
                    <img
                      src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name || 'User'}&background=3b82f6&color=fff`}
                      alt="User Profile"
                      style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        border: '2px solid white', objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Hover Info Tooltip (ElevenLabs Style) */}
                  <div className="avatar-tooltip">
                    <div className="tooltip-header">
                      <div className="user-name">{(session?.user as any)?.name || 'Thành viên'}</div>
                      <div className="user-email-sub" style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{session?.user?.email}</div>
                    </div>

                    <div className="tooltip-divider"></div>

                    <div className="tooltip-section">
                      <div className="plan-status-row">
                        <div className="plan-badge-v2" style={{
                          background: currentPlan === 'pro' || currentPlan === 'scale' ? '#fef3c7' : '#e0e7ff',
                          color: currentPlan === 'pro' || currentPlan === 'scale' ? '#92400e' : '#4338ca'
                        }}>
                          {currentPlan.toUpperCase()}
                        </div>
                        <span className="plan-expiry-v2">
                          {(() => {
                            const paidPlans = ['starter', 'creator', 'pro', 'scale'];
                            const isPaid = paidPlans.includes(currentPlan);
                            if (!currentExpiry) {
                              return isPaid ? 'Đang đồng bộ…' : 'Vô thời hạn';
                            }
                            const d = new Date(currentExpiry);
                            if (Number.isNaN(d.getTime())) {
                              return isPaid ? 'Đang đồng bộ…' : 'Vô thời hạn';
                            }
                            return d.toLocaleDateString('vi-VN');
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="tooltip-divider"></div>

                    <div className="tooltip-links">
                      <Link href="/profile" className="tooltip-link">
                        <UserCircle size={16} /> <span>Tài khoản của tôi</span>
                      </Link>
                      <Link href="/subscription" className="tooltip-link">
                        <Zap size={16} /> <span>Gói đăng ký</span>
                      </Link>
                      <div className="tooltip-link" style={{ color: '#ef4444' }} onClick={() => setShowLogoutModal(true)}>
                        <LogOut size={16} /> <span>Đăng xuất</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Premium Toast Notification */}
          {toastMessage && (
            <div style={{
              position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
              background: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '100px',
              fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
              display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
              animation: 'slideDownToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <Sparkles size={18} />
              {toastMessage}
            </div>
          )}

          <div className="workspace-area">
            <div className="workspace-content-wrapper">
              {children}
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
      <style jsx global>{`
        @keyframes slideDownToast {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </NotificationProvider>
  );
}
