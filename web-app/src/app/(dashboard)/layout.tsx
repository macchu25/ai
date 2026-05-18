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
import ChatBot from '@/components/ChatBot';

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
      <div className="flex w-full h-screen overflow-hidden" style={{ 
        fontFamily: '"Inter", sans-serif', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f9 100%)' 
      }}>

        {/* ─── SIDEBAR ─── */}
        <aside className="sidebar-slim flex flex-col w-[240px] min-w-[200px] max-w-[260px] shrink-0 border-r border-white/20 z-[100]" style={{ 
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(25px) saturate(180%)',
          WebkitBackdropFilter: 'blur(25px) saturate(180%)'
        }}>

          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 overflow-hidden">
            <img src="/logo.png" alt="Casos Logo" className="w-12 h-12 object-contain shrink-0" style={{ animation: 'logoLoopSpin 9s ease-in-out infinite' }} />
            <span className="text-[1.55rem] font-black tracking-tight text-slate-900 whitespace-nowrap overflow-hidden" style={{ animation: 'logoTextLoop 9s ease-in-out infinite' }}>
              Casos<span className="text-blue-500">.ai</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

            {/* Project selector */}
            <div className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all shadow-sm">
              <img src="/image.png" alt="Studio Icon" className="w-7 h-7 rounded-lg object-cover" />
              <span className="flex-1 text-sm font-bold text-slate-800">MacchuStudio</span>
              <ChevronDown size={15} className="text-slate-400" />
            </div>

            {/* Main links */}
            {[
              { href: '/', icon: <Home size={18} />, label: 'Home' },
              { href: '/profile', icon: <UserCircle size={18} />, label: 'Profile' },
              { href: '/cameras', icon: <Video size={18} />, label: 'Cameras' },
              { href: '/recommendations', icon: <Monitor size={18} />, label: 'Store' },
              { href: '/analytics', icon: <Activity size={18} />, label: 'Analytics' },
              { href: '/incidents', icon: <AlertTriangle size={18} />, label: 'Incidents' },
              { href: '/docs', icon: <BookOpen size={18} />, label: 'Documents' },
            ].map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  pathname === href
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={pathname === href ? 'text-slate-700' : 'text-slate-400'}>{icon}</span>
                {label}
              </Link>
            ))}

            {/* Pinned section */}
            <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">Pinned</p>

            {[
              { href: '/ai-models', icon: <Cpu size={18} />, label: 'AI Models' },
              { href: '/reports', icon: <FileText size={18} />, label: 'Reports' },
              { href: '/settings', icon: <Settings size={18} />, label: 'Settings' },
            ].map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  pathname === href
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={pathname === href ? 'text-slate-700' : 'text-slate-400'}>{icon}</span>
                {label}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-100 px-3 py-4 space-y-3">

            {/* Invite card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Send size={14} className="text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-0.5">Invite team members</p>
              <p className="text-xs text-slate-400 leading-relaxed">Bring your team in to collaborate.</p>
            </div>

            {/* Upgrade button — Galaxy rotating border */}
            <div className="upgrade-border">
              <Link href="/subscription">
                <Zap size={16} fill="currentColor" />
                Upgrade
              </Link>
            </div>


          </div>
        </aside>

        <main className="main-content-medical">
          <header className="top-header">
            <div className="header-content-wrapper">
              <div className="header-left">
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', letterSpacing: '-0.5px' }}>
                  Trung Tâm Điều Hành <span style={{ color: '#2563eb' }}>AI</span>
                </div>
                {mounted && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
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
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: (() => {
                      switch (currentPlan) {
                        case 'scale':
                          return 'linear-gradient(135deg, #ffe259 0%, #ffa751 100%)'; // Luxury Gold
                        case 'pro':
                          return 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'; // Vibrant Rose Pink
                        case 'creator':
                          return 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)'; // Indigo/Purple
                        case 'starter':
                          return 'linear-gradient(135deg, #34d399 0%, #059669 100%)'; // Emerald Green
                        default:
                          return 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'; // Silver/Gray for Free
                      }
                    })(),
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
        <ChatBot />

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
        @keyframes galaxy-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Logo spin + text reveal loop */
        @keyframes logoLoopSpin {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(360deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes logoTextLoop {
          0%, 18%  { opacity: 0; transform: translateX(-12px); max-width: 0; }
          30%, 70% { opacity: 1; transform: translateX(0);    max-width: 160px; }
          85%, 100% { opacity: 0; transform: translateX(-12px); max-width: 0; }
        }

        @keyframes slideDownToast {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @keyframes modalFadeUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </NotificationProvider>
  );
}
