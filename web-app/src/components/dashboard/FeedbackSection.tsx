import React, { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';

const FeedbackSection: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent('Góp ý cho hệ thống Cardiac Alert');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:daylahuu@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="dashboard-section feedback-section-container" id="feedback-section" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', position: 'relative' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px', color: '#1e293b' }}>
        Góp Ý & Phản Hồi
      </h2>
      <p style={{ color: '#64748b', marginBottom: '40px' }}>
        Ý kiến của bạn giúp chúng tôi hoàn thiện hệ thống bảo vệ sức khỏe tốt hơn.
      </p>

      <div className="feedback-glass-card" style={{ position: 'relative', zIndex: 10 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="feedback-inputs-grid">
             <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  placeholder="Email của bạn (không bắt buộc)" 
                  className="feedback-input" 
                />
             </div>
             <div style={{ position: 'relative' }}>
                <MessageSquare size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Chủ đề góp ý" 
                  className="feedback-input" 
                />
             </div>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea 
              rows={4} 
              placeholder="Nhập ý kiến của bạn tại đây..." 
              className="feedback-input textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="feedback-submit-btn">
            <Send size={18} />
            Gửi Góp Ý
          </button>
        </form>
      </div>

      {/* Bottom Transition to Footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '300px',
        background: 'linear-gradient(to bottom, #f8fafc 0%, transparent 100%)',
        zIndex: 5,
        pointerEvents: 'none'
      }}></div>

      <style jsx>{`
        .feedback-glass-card, .feedback-glass-card * {
          box-sizing: border-box;
        }

        .feedback-glass-card {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 32px;
          padding: 40px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .feedback-inputs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          width: 100%;
        }

        .feedback-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          font-family: inherit;
          font-size: 0.95rem;
          color: #1e293b;
          transition: all 0.3s ease;
          outline: none;
          display: block;
        }

        .feedback-input.textarea {
          padding: 20px;
          resize: none;
          margin-top: 5px;
        }

        .feedback-input:focus {
          background: white;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .feedback-submit-btn {
          align-self: flex-start;
          padding: 16px 40px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
          margin-top: 10px;
        }

        .feedback-submit-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(59, 130, 246, 0.3);
          background: #2563eb;
        }

        .feedback-submit-btn:active {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default FeedbackSection;
