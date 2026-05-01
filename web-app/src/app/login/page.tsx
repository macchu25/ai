"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, Mail, Globe, UserCircle, ShieldCheck, ArrowRight, LogOut, Eye, HelpCircle, GitBranch } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const featureImage = "/feature_collage.png";

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <style jsx>{`
        .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff; }
        .spinner { width: 30px; height: 30px; border: 2px solid #f3f4f6; border-top-color: #0052d9; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="login-container">
      {/* Left Panel: The Decorative Side */}
      <div className="left-panel" style={{ 
        backgroundImage: `url('/hospital_ai_background_1776913436381.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="overlay-left"></div>
        <div className="branding" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '60px' }}>
          <img src="/logo.png" alt="Casos Logo" style={{ width: '120px', height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))' }} />
          <span className="brand-name" style={{ color: '#fff', fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px' }}>CASOS<span style={{ color: '#60a5fa' }}>.ai</span></span>
        </div>
        
        <div className="hero-text" style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ color: '#fff' }}>Bảo vệ tối đa bằng <br/>các <span style={{ background: 'linear-gradient(90deg, #60a5fa, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>mô hình AI</span> <br/>với CASOS ngay.</h1>
        </div>

        <div className="camera-marquee-container">
          <div className="marquee-track">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="marquee-slide" style={{ backgroundImage: "url('/security_camera_film_strip_collage_1777637681962.png')" }}>
                <div className="scan-line"></div>
                <div className="digital-overlay">
                  <span>REC • CAM_0{i}</span>
                  <span>LIVE // 24.0 FPS</span>
                </div>
              </div>
            ))}
            {[1, 2, 3, 4].map((i) => (
              <div key={`dup-${i}`} className="marquee-slide" style={{ backgroundImage: "url('/security_camera_film_strip_collage_1777637681962.png')" }}>
                <div className="scan-line"></div>
                <div className="digital-overlay">
                  <span>REC • CAM_0{i}</span>
                  <span>LIVE // 24.0 FPS</span>
                </div>
              </div>
            ))}
          </div>
          <div className="marquee-fade left"></div>
          <div className="marquee-fade right"></div>
        </div>
      </div>

      {/* Right Panel: The Login Form */}
      <div className="right-panel">
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2>Đăng nhập</h2>
          </div>

          <div className="input-group">
            <label>Tên đăng nhập / Email</label>
            <input type="text" placeholder="Nhập email của bạn" className="form-input" />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Nhập mật khẩu" 
                className="form-input" 
              />
              <button onClick={() => setShowPassword(!showPassword)} className="toggle-btn">
                <Eye size={18} color="#94a3b8" />
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ghi nhớ tôi</span>
            </label>
            <a href="#" className="forgot-link">Quên mật khẩu?</a>
          </div>

          <button className="submit-btn" style={{ marginBottom: '12px' }}>Đăng nhập</button>

          <div className="signup-prompt" style={{ marginBottom: '30px' }}>
            Bạn chưa có tài khoản? <a href="#">Đăng ký ngay</a>
          </div>

          <div className="method-divider">
            <span>HOẶC</span>
          </div>

          <div className="social-logins" style={{ marginBottom: '40px' }}>
            <button onClick={() => signIn('google')} className="social-btn">
              <Mail size={18} color="#ea4335" />
              <span>Tiếp tục với Google</span>
            </button>
            <button onClick={() => signIn('facebook')} className="social-btn" style={{ marginTop: '12px' }}>
              <Globe size={18} color="#1877F2" />
              <span>Tiếp tục với Facebook</span>
            </button>
            <button onClick={() => signIn('github')} className="social-btn" style={{ marginTop: '12px' }}>
              <GitBranch size={18} color="#000" />
              <span>Tiếp tục với Github</span>
            </button>
          </div>

          {/* Logged in state inside the form if session exists */}
          {session && (
             <div className="already-logged-in-overlay">
                <div className="session-card">
                   <div className="session-user">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="User" />
                      ) : (
                        <UserCircle size={48} />
                      )}
                      <div>
                        <p className="welcome">Chào mừng trở lại,</p>
                        <p className="username">{session.user?.name}</p>
                      </div>
                   </div>
                   <div className="session-actions">
                      <Link href="/" className="go-btn">
                         Vào Trung Tâm Điều Hành <ArrowRight size={16} />
                      </Link>
                      <button onClick={() => signOut()} className="out-btn">
                         <LogOut size={16} /> Đăng xuất
                      </button>
                   </div>
                </div>
             </div>
          )}
        </div>

        <div className="form-footer">
          <div className="footer-links">
             <span>©CASOS.ai</span>
             <a href="#">Điều khoản</a>
             <a href="#">Bảo mật</a>
          </div>
          <div className="language-selector">
             <Globe size={16} />
             <span>Tiếng Việt</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container, .login-container * {
          box-sizing: border-box;
        }

        .login-container {
          display: flex;
          height: 100vh;
          background: #fff;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .left-panel {
          flex: 4;
          padding: 60px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .overlay-left {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.1) 100%);
          z-index: 1;
        }

        .branding {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 80px;
        }

        .brand-name {
          font-weight: 900;
          font-size: 1.5rem;
          color: #1e293b;
          letter-spacing: -1px;
        }

        .hero-text h1 {
          font-size: 3rem;
          font-weight: 900;
          line-height: 1.1;
          color: #1e293b;
          letter-spacing: -2px;
        }

        .hero-text h1 span {
          background: linear-gradient(90deg, #ec4899, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }


        /* Right Panel Styles */
        .right-panel {
          flex: 6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
          position: relative;
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 440px;
          position: relative;
          padding-bottom: 50px;
        }

        .form-header h2 {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
          margin-bottom: 60px;
          letter-spacing: -0.5px;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          background: #eff6ff;
          border: 1px solid transparent;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          color: #1e293b;
        }

        .form-input:focus {
          outline: none;
          background: #e6f0ff;
          border-color: rgba(0, 82, 217, 0.2);
        }

        .password-input-wrapper {
          position: relative;
        }

        .toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          cursor: pointer;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #94a3b8;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 0.85rem;
          color: #0052d9;
          text-decoration: none;
          font-weight: 600;
        }

        .submit-btn {
          width: 100%;
          height: 52px;
          background: #0052d9;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }

        .submit-btn:hover { background: #0045b8; }

        .iam-links {
          text-align: center;
          font-size: 0.8rem;
          color: #cbd5e1;
          margin-bottom: 30px;
        }

        .iam-links a { color: #64748b; text-decoration: none; margin: 0 5px; }

        .method-divider {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
        }

        .method-divider::before, .method-divider::after { content: ''; flex: 1; height: 1px; background: #f1f5f9; }
        .method-divider span { font-size: 0.7rem; font-weight: 800; color: #cbd5e1; }

        .social-btn {
          width: 100%;
          height: 52px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #1e293b;
          padding: 0;
        }

        .social-btn:hover { background: #f8fafc; }

        .signup-prompt {
          text-align: center;
          color: #64748b;
          font-size: 0.9rem;
        }

        .signup-prompt a { color: #0052d9; text-decoration: none; font-weight: 700; }

        .form-footer {
          position: absolute;
          bottom: 30px;
          width: 100%;
          padding: 0 60px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .footer-links { display: flex; gap: 20px; }
        .footer-links a { color: inherit; text-decoration: none; }
        .language-selector { display: flex; align-items: center; gap: 8px; }

        /* Camera Marquee Styles */
        .camera-marquee-container {
          position: absolute;
          bottom: 80px;
          left: -5%;
          width: 110%;
          height: 180px;
          background: rgba(0,0,0,0.4);
          overflow: hidden;
          border-top: 2px solid rgba(255,255,255,0.1);
          border-bottom: 2px solid rgba(255,255,255,0.1);
          z-index: 5;
          backdrop-filter: blur(5px);
          /* Perfectly Symmetrical 3D Curve */
          transform: perspective(1000px) rotateX(8deg);
          border-radius: 100px / 20px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }

        .marquee-track {
          display: flex;
          flex-direction: row;
          width: max-content;
          animation: marquee 30s linear infinite;
        }

        .marquee-slide {
          width: 450px;
          height: 180px;
          flex-shrink: 0;
          background-size: cover;
          background-position: center;
          position: relative;
          border-right: 2px solid #000;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .marquee-slide:hover {
          opacity: 1;
        }

        .scan-line {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%);
          background-size: 100% 4px;
          pointer-events: none;
        }

        .digital-overlay {
          position: absolute;
          inset: 0;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-family: 'Courier New', monospace;
          font-size: 0.6rem;
          color: #10b981;
          text-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
          pointer-events: none;
        }

        .marquee-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 150px;
          z-index: 10;
          pointer-events: none;
        }

        .marquee-fade.left {
          left: 0;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, transparent 100%);
        }

        .marquee-fade.right {
          right: 0;
          background: linear-gradient(to left, rgba(15, 23, 42, 0.3) 0%, transparent 100%);
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-450px * 4)); }
        }

        @media (max-width: 1024px) {
          .left-panel { display: none; }
          .right-panel { flex: 1; }
          .marquee-fade.left, .marquee-fade.right { display: none; }
        }
      `}</style>
    </div>
  );
}
