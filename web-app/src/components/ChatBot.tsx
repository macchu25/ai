"use client"

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';

const ChatBot: React.FC = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Chào bạn! Tôi là trợ lý AI của Casos. Tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // AI logic thực tế qua API
    try {
      const token = (session?.user as any)?.accessToken || '';
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'bot', text: data.answer || data.context || "Tôi đã tìm thấy thông tin bạn cần." }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: "Kết nối tới bộ não AI thất bại. Đang chạy ở chế độ offline." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Có lỗi xảy ra khi kết nối tới AI." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-toggle"
        aria-label="Toggle chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        
        <style jsx>{`
          .chatbot-toggle {
            position: fixed;
            bottom: 40px;
            right: 40px;
            width: 54px;
            height: 54px;
            background: #2563eb;
            border: none;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .chatbot-toggle:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 15px 40px rgba(37, 99, 235, 0.6);
          }

          @media (max-width: 768px) {
            .chatbot-toggle {
              bottom: 90px;
              right: 20px;
              width: 48px;
              height: 48px;
            }
          }
        `}</style>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#2563eb" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>Casos AI Assistant</h4>
                <p style={{ margin: 0, fontSize: '10px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {isTyping && <div className="message bot typing">...</div>}
          </div>

          <div className="chat-footer">
            <input 
              type="text" 
              placeholder="Nhập câu hỏi của bạn..." 
              className="chat-input" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send" onClick={handleSend}>
              <Send size={16} />
            </button>
          </div>

          <style jsx>{`
            .chat-window {
              position: fixed;
              bottom: 110px;
              right: 40px;
              width: 350px;
              height: 450px;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.5);
              border-radius: 24px;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
              z-index: 10000;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            @keyframes slideUp {
              from { opacity: 0; transform: translateY(40px) scale(0.9); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .chat-header {
              padding: 16px 20px;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: rgba(255, 255, 255, 0.5);
            }

            .chat-body {
              flex: 1;
              padding: 20px;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .message {
              padding: 12px 16px;
              border-radius: 16px;
              font-size: 0.85rem;
              max-width: 85%;
              line-height: 1.5;
            }

            .message.bot {
              background: #f1f5f9;
              color: #1e293b;
              align-self: flex-start;
              border-bottom-left-radius: 4px;
            }

            .message.user {
              background: #2563eb;
              color: white;
              align-self: flex-end;
              border-bottom-right-radius: 4px;
            }

            .message.typing {
              padding: 8px 16px;
              font-style: italic;
              color: #94a3b8;
            }

            .chat-footer {
              padding: 16px;
              display: flex;
              gap: 10px;
              border-top: 1px solid rgba(0, 0, 0, 0.05);
            }

            .chat-input {
              flex: 1;
              background: #f1f5f9;
              border: none;
              padding: 10px 16px;
              border-radius: 12px;
              font-size: 0.85rem;
              outline: none;
              transition: all 0.2s;
            }

            .chat-input:focus {
              background: #fff;
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
            }

            .chat-send {
              width: 40px;
              height: 40px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .chat-send:hover {
              transform: scale(1.05);
            }

            @media (max-width: 768px) {
              .chat-window {
                bottom: 150px;
                right: 20px;
                width: calc(100vw - 40px);
                height: 400px;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ChatBot;
