import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('.workspace-area');
    if (!scrollContainer) return;

    const toggleVisible = () => {
      if (scrollContainer.scrollTop > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    scrollContainer.addEventListener('scroll', toggleVisible);
    return () => scrollContainer.removeEventListener('scroll', toggleVisible);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('.workspace-area');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="scroll-to-top"
      aria-label="Scroll to top"
    >
      <ChevronUp size={24} />
      <style jsx>{`
        .scroll-to-top {
          position: fixed;
          bottom: 40px;
          right: 40px;
          width: 54px;
          height: 54px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 
                      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: slideIn 0.5s ease-out forwards;
        }

        .scroll-to-top:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15),
                      0 0 20px rgba(59, 130, 246, 0.3);
          border-color: var(--accent);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </button>
  );
};

export default ScrollToTop;
