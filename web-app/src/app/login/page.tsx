"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, Mail, Globe, UserCircle, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="flex items-center justify-center h-screen bg-slate-50">Loading...</div>;

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div style={{ background: 'white', padding: '48px', borderRadius: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
          <div className="flex justify-center mb-8">
            <div style={{ position: 'relative' }}>
              {session.user?.image ? (
                <img src={session.user.image} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #f1f5f9' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircle size={60} color="var(--accent)" />
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--success)', width: '24px', height: '24px', borderRadius: '50%', border: '4px solid white' }}></div>
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Xin chào y bác sĩ,</h1>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '24px' }}>{session.user?.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '0.9rem' }}>Bạn đã đăng nhập an toàn vào trung tâm điều hành.</p>
          
          <button 
            onClick={() => signOut()}
            className="btn btn-danger"
            style={{ width: '100%', borderRadius: '16px', padding: '16px' }}
          >
            Đăng xuất khỏi hệ thống
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
      <div style={{ background: 'white', padding: '56px', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)', textAlign: 'center', width: '100%', maxWidth: '480px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '6px', background: 'linear-gradient(90deg, var(--accent), #60a5fa)' }}></div>
        
        <div style={{ marginBottom: '40px' }}>
            <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ShieldCheck color="var(--accent)" size={32} />
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-1px' }}>FALL<span style={{ color: 'var(--accent)' }}>GUARD</span></h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '80%', margin: '0 auto' }}>Hệ thống giám sát và bảo vệ y tế thông minh tích hợp AI.</p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => signIn('google')}
            className="btn"
            style={{ background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb', height: '56px', borderRadius: '16px', fontSize: '0.95rem' }}
          >
            <Mail size={20} color="#ea4335" /> Tiếp tục với Google
          </button>
          
          <button 
            onClick={() => signIn('facebook')}
            className="btn"
            style={{ background: '#1877F2', color: 'white', border: 'none', height: '56px', borderRadius: '16px', fontSize: '0.95rem' }}
          >
            <Globe size={20} /> Tiếp tục với Facebook
          </button>
          
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }}></div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>ỦY QUYỀN Y TẾ</span>
            <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }}></div>
          </div>

          <button 
            className="btn"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text-main)', height: '56px', borderRadius: '16px', fontSize: '0.95rem' }}
            onClick={() => alert("Tính năng dành cho nhân viên y tế đang được kiểm duyệt.")}
          >
            Mã định danh nhân viên
          </button>
        </div>

        <div style={{ marginTop: '40px', padding: '16px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <div style={{ minWidth: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Kết nối bảo mật chuẩn y tế (HIPAA Complaint Implementation).
            </p>
        </div>
      </div>
    </div>
  );
}
