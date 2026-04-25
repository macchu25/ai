import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      position: 'relative',
      zIndex: 1,
      backgroundColor: 'transparent',
      width: '100%',
      marginTop: '-300px',
      color: '#1e293b'
    }}>
      {/* Ultra-Smooth Transition Gradient from Grey Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '600px',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #f8fafc 20%, rgba(248,250,252,0.8) 40%, rgba(248,250,252,0.4) 70%, transparent 100%)',
        zIndex: 3,
        pointerEvents: 'none'
      }}></div>

      {/* Forest Background Footer Image */}
      <div style={{ position: 'relative', width: '100%', height: '800px', overflow: 'hidden' }}>
        <img
          src="/footer_forest_custom.png"
          alt="Forest"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />

        {/* Content overlay with high-contrast outlined white typography */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingBottom: '80px'
        }}>
          <div className="footer-main-container">
            {/* Left Group */}
            <div className="footer-left-group">
              {/* Column 1 */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 5px rgba(0,0,0,0.8)' }}>Quick Links</h4>
                <div className="footer-underline" style={{ width: '220px', height: '4px', background: '#ffffff', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Contact us</a></li>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Support Forum</a></li>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Free Trial</a></li>
                </ul>
              </div>

              {/* Column 2 */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 5px rgba(0,0,0,0.8)' }}>Resources</h4>
                <div className="footer-underline" style={{ width: '220px', height: '4px', background: '#ffffff', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Medical Blog</a></li>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>AI Research</a></li>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>API Documentation</a></li>
                </ul>
              </div>

              {/* Column 3 */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 5px rgba(0,0,0,0.8)' }}>Legal Info</h4>
                <div className="footer-underline" style={{ width: '220px', height: '4px', background: '#ffffff', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Privacy Policy</a></li>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Terms of Service</a></li>
                  <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Security Compliance</a></li>
                </ul>
              </div>
            </div>

            {/* Center - Social Media Icons */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              <h4 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 5px rgba(0,0,0,0.8)' }}>Follow Us</h4>
              <div className="footer-underline" style={{ width: '200px', height: '4px', background: '#ffffff', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px' }}></div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                </a>
              </div>
            </div>

            {/* Right Column */}
            <div className="footer-right-col">
              <div style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '10px', color: '#ffffff', letterSpacing: '-1.5px', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 8px rgba(0,0,0,0.8)' }}>
                CASOS<span style={{ color: '#3b82f6' }}>.ai</span>
              </div>
              <div style={{ color: '#ffffff', fontSize: '1rem', lineHeight: 1.6, fontWeight: 800, textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                <p>Mạc Như Hữu Street, AI District</p>
                <p>Đà Nẵng City, VN</p>
                <p>tel: +84 905 304 143</p>
                <p>email: daylahuu@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Black Bar */}
      <div style={{ background: 'rgba(0,0,0,0.9)', padding: '25px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', position: 'relative', zIndex: 10 }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>
          CASOS<span style={{ color: 'var(--accent)' }}>BOT</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', opacity: 0.8 }}>
          {/* Mastercard Inline SVG */}
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#EB001B"/>
            <circle cx="22" cy="10" r="10" fill="#F79E1B"/>
            <path d="M16 3.4C14.3 5.3 13.3 7.5 13.3 10C13.3 12.5 14.3 14.7 16 16.6C17.7 14.7 18.7 12.5 18.7 10C18.7 7.5 17.7 5.3 16 3.4Z" fill="#FF5F00"/>
          </svg>
          
          {/* Visa Inline SVG */}
          <svg width="40" height="13" viewBox="0 0 40 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.2 0.3L13.1 12.7H10.1L12.2 0.3H15.2ZM27.4 0.3H24.3C23.6 0.3 22.9 0.8 22.7 1.5L18.1 12.7H21.2L21.8 11.1H25.6L25.9 12.7H28.9L27.4 0.3ZM22.7 8.8L24.1 4.9L24.8 8.8H22.7ZM39.6 0.3H36.7L34.1 6.8L32.8 0.3H29.7L32.2 12.7H35.3L39.6 0.3ZM7.3 0.3L4.4 8.7L3.7 1.6C3.6 0.8 3.1 0.3 2.3 0.3H0.1L0 0.5C1.5 1.1 2.8 2 3.6 3.1L6.1 12.7H9.2L12.8 0.3H7.3Z" fill="#1A1F71"/>
          </svg>
        </div>
        <div>
          Coded and designed by Macchu. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
