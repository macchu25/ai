"use client"

export default function Loading() {
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      gap: '24px'
    }}>
      <div className="loader-container">
        <div className="loader-ring"></div>
        <div className="loader-pulse"></div>
        <div className="loader-core">AI</div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          color: 'var(--text-main)', 
          margin: '0 0 8px 0',
          letterSpacing: '-0.01em'
        }}>
          Đang khởi tạo hệ thống
        </h2>
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-muted)', 
          margin: 0,
          fontWeight: 500
        }}>
          Vui lòng đợi trong giây lát...
        </p>
      </div>

      <style jsx>{`
        .loader-container {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid rgba(37, 99, 235, 0.1);
          border-top: 3px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loader-pulse {
          position: absolute;
          width: 60px;
          height: 60px;
          background: rgba(37, 99, 235, 0.1);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .loader-core {
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 1px;
          z-index: 2;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
