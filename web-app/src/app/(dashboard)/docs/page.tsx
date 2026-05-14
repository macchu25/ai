"use client"

import React, { useEffect, useState } from 'react';

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h2, h3');
      let currentId = '';
      for (const heading of Array.from(headings)) {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = heading.id;
        }
      }
      if (currentId) setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="nextjs-docs-layout">
      <main className="docs-main-content">
        <h1>Tài liệu hướng dẫn (RTSP)</h1>
        <p className="lead-text">
          Chào mừng bạn đến với tài liệu hướng dẫn cấu hình hệ thống AI Camera!
        </p>

        <hr />

        <h2 id="what-is-rtsp">RTSP là gì?</h2>
        <p>
          RTSP (Real-Time Streaming Protocol) là giao thức dùng để điều khiển và truyền tải luồng video trực tiếp từ các Camera IP trên mạng nội bộ đến máy chủ AI trung tâm.
        </p>
        <p>
          Hệ thống yêu cầu bạn cung cấp đường dẫn này thay vì hình ảnh tĩnh, để Engine có thể phân tích chuyển động liên tục và phát hiện hành vi (như té ngã).
        </p>
        <p>
          Cú pháp chuẩn của một đường dẫn RTSP thường có dạng:
        </p>
        <div className="code-block">
          <code>rtsp://[username]:[password]@[IP_Camera]:[Port]/[đường_dẫn]</code>
        </div>

        <hr />

        <h2 id="camera-xiot">Camera X-IoT (Khuyên dùng)</h2>
        <p>
          Với các dòng Camera X-IoT được phân phối kèm theo hệ thống Cardiac Alert, luồng RTSP đã được mở khóa tự động để kết nối tối ưu nhất.
        </p>
        <ul>
          <li><strong>Username & Password:</strong> Không yêu cầu (Bỏ trống) hoặc theo mặc định là <code>admin</code> / <code>123456</code>.</li>
          <li><strong>Port:</strong> <code>554</code></li>
        </ul>
        <div className="code-block">
          <span className="comment">// Cấu trúc URL mặc định</span><br/>
          <code>rtsp://[IP_Camera]:554/stream1</code>
          <br /><br />
          <span className="comment">// Ví dụ thực tế:</span><br />
          <code>rtsp://192.168.1.100:554/stream1</code>
        </div>

        <hr />

        <h2 id="camera-ezviz">Camera EZVIZ</h2>
        <p>
          EZVIZ là một trong những dòng Camera phổ biến nhất. Hãng này mặc định kích hoạt sẵn RTSP.
        </p>
        <ul>
          <li><strong>Username:</strong> Mặc định là <code>admin</code></li>
          <li><strong>Password:</strong> Mã xác thực (Verification Code) gồm 6 chữ cái in hoa in ở dưới đáy hoặc mặt sau Camera.</li>
          <li><strong>Port:</strong> 554</li>
        </ul>
        <div className="code-block">
          <code>rtsp://admin:[Mã_Verification]@[IP_Camera]:554/h264_stream</code>
        </div>

        <hr />

        <h2 id="camera-imou">Camera IMOU</h2>
        <p>
          Tương tự EZVIZ, IMOU cung cấp luồng RTSP thông qua Safety Code.
        </p>
        <ul>
          <li><strong>Username:</strong> Mặc định là <code>admin</code></li>
          <li><strong>Password:</strong> Mã Safety Code (thường là 8 ký tự in hoa) in trên tem đáy Camera.</li>
          <li><strong>Port:</strong> 554</li>
        </ul>
        <div className="code-block">
          <code>rtsp://admin:[Safety_Code]@[IP_Camera]:554/cam/realmonitor?channel=1&subtype=0</code>
        </div>

        <hr />

        <h2 id="camera-tapo">Camera Tapo (TP-Link)</h2>
        <p>
          Với camera Tapo, hãng yêu cầu bạn phải tự tạo một tài khoản xem luồng riêng trên ứng dụng điện thoại thay vì dùng thông tin mặc định.
        </p>
        <ol>
          <li>Mở app Tapo, chọn Camera của bạn.</li>
          <li>Nhấn biểu tượng Bánh răng (Cài đặt) ở góc trên cùng.</li>
          <li>Vào <strong>Cài đặt thiết bị nâng cao</strong> {'>'} <strong>Tài khoản Camera</strong>.</li>
          <li>Tạo một <strong>Username</strong> và <strong>Password</strong> của riêng bạn.</li>
        </ol>
        <p>Sau khi tạo xong, bạn có thể xem luồng độ nét cao (HD):</p>
        <div className="code-block">
          <code>rtsp://[Username]:[Password]@[IP_Camera]:554/stream1</code>
        </div>

        <hr />

        <h2 id="hikvision-dahua">Hikvision / Dahua</h2>
        <p>
          Đây là hệ thống Camera chuyên nghiệp. Bạn phải sử dụng tài khoản và mật khẩu đã thiết lập lúc thợ lắp đặt khởi tạo thiết bị hoặc trên đầu ghi NVR.
        </p>
        <div className="code-block">
          <span className="comment">// Dành cho Hikvision</span><br/>
          <code>rtsp://[user]:[pass]@[IP_Camera]:554/Streaming/Channels/101</code><br/><br/>
          <span className="comment">// Dành cho Dahua / KBVision</span><br/>
          <code>rtsp://[user]:[pass]@[IP_Camera]:554/cam/realmonitor?channel=1&subtype=0</code>
        </div>

        <hr />

        <h2 id="find-ip">Cách lấy IP Camera</h2>

        <h3>1. Nếu Camera phát ra mạng Wifi riêng (AP Mode / Wifi Direct)</h3>
        <p>
          Với các dòng Camera IoT, khi chưa cài đặt mạng, Camera thường tự phát ra một sóng Wifi (ví dụ: <code>X-IoT_Cam_123</code>, <code>IPC-XXXXX</code>). Nếu máy tính/điện thoại của bạn kết nối trực tiếp vào Wifi này, địa chỉ IP của Camera luôn nằm ở mục <strong>Default Gateway</strong>.
        </p>
        <ul>
          <li><strong>Mặc định thường thấy:</strong> <code>192.168.4.1</code> (rất phổ biến trên hệ X-IoT/ESP32) hoặc <code>192.168.1.1</code>.</li>
          <li><strong>Cách xem trên Windows:</strong> Nhấn nút Win, gõ <code>cmd</code>, nhập lệnh <code>ipconfig</code>. Nhìn vào dòng <em>Default Gateway</em>, đó chính là IP của Camera.</li>
          <li><strong>Cách xem trên Điện thoại:</strong> Bấm vào chữ (i) hoặc biểu tượng bánh răng bên cạnh tên Wifi đang kết nối, nhìn vào mục <em>Bộ định tuyến (Router)</em>, đó chính là IP Camera.</li>
        </ul>
        <div className="code-block">
          <span className="comment">// Link RTSP khi kết nối Wifi do Camera phát ra thường là:</span><br/>
          <code>rtsp://192.168.4.1:554/stream1</code>
        </div>

        <h3>2. Nếu Camera dùng chung mạng Wifi của nhà mạng</h3>
        <p>
          Bạn có thể tải phần mềm <strong>Fing</strong> trên điện thoại (kết nối cùng Wifi với Camera) hoặc đăng nhập vào trang quản trị của Modem Wifi nhà bạn (thường là <code>192.168.1.1</code>) để xem danh sách thiết bị.
        </p>
      </main>

      <aside className="docs-right-sidebar">
        <div className="toc-container">
          <h4 className="toc-title">On this page</h4>
          <ul className="toc-list">
            <li><button onClick={() => scrollTo('what-is-rtsp')} className={activeId === 'what-is-rtsp' ? 'active' : ''}>RTSP là gì?</button></li>
            <li><button onClick={() => scrollTo('camera-xiot')} className={activeId === 'camera-xiot' ? 'active' : ''}>Camera X-IoT</button></li>
            <li><button onClick={() => scrollTo('camera-ezviz')} className={activeId === 'camera-ezviz' ? 'active' : ''}>Camera EZVIZ</button></li>
            <li><button onClick={() => scrollTo('camera-imou')} className={activeId === 'camera-imou' ? 'active' : ''}>Camera IMOU</button></li>
            <li><button onClick={() => scrollTo('camera-tapo')} className={activeId === 'camera-tapo' ? 'active' : ''}>Camera Tapo (TP-Link)</button></li>
            <li><button onClick={() => scrollTo('hikvision-dahua')} className={activeId === 'hikvision-dahua' ? 'active' : ''}>Hikvision / Dahua</button></li>
            <li><button onClick={() => scrollTo('find-ip')} className={activeId === 'find-ip' ? 'active' : ''}>Cách lấy IP Camera</button></li>
          </ul>
          
          <div className="toc-footer">
            <a href="https://github.com/macchu-studio" target="_blank" rel="noreferrer">Edit this page on GitHub ↗</a>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .nextjs-docs-layout {
          display: flex;
          background-color: #ffffff;
          color: #1e293b;
          min-height: calc(100vh - 60px);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .docs-main-content {
          flex: 1;
          max-width: 800px;
          padding: 40px 60px 80px;
          line-height: 1.7;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 24px;
          letter-spacing: -0.03em;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 48px;
          margin-bottom: 16px;
          scroll-margin-top: 80px;
          letter-spacing: -0.02em;
        }

        .lead-text {
          font-size: 1.15rem;
          color: #475569;
          margin-bottom: 32px;
        }

        p {
          color: #334155;
          margin-bottom: 24px;
          font-size: 1rem;
        }

        ul, ol {
          color: #334155;
          margin-bottom: 24px;
          padding-left: 24px;
        }

        li {
          margin-bottom: 12px;
        }

        strong {
          color: #0f172a;
          font-weight: 600;
        }

        hr {
          border: 0;
          height: 1px;
          background: #e2e8f0;
          margin: 48px 0;
        }

        .code-block {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          overflow-x: auto;
        }

        code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
          color: #db2777;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .code-block code {
          background: transparent;
          padding: 0;
          color: #2563eb;
        }

        .comment {
          color: #94a3b8;
          font-size: 0.85em;
        }

        /* Right Sidebar TOC */
        .docs-right-sidebar {
          width: 250px;
          padding: 40px 20px 40px 40px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .toc-container {
          display: flex;
          flex-direction: column;
        }

        .toc-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
          border-left: 1px solid #e2e8f0;
        }

        .toc-list li {
          margin-bottom: 0;
        }

        .toc-list button {
          background: none;
          border: none;
          border-left: 2px solid transparent;
          padding: 8px 0 8px 16px;
          margin-left: -1px;
          color: #64748b;
          font-size: 0.85rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-family: inherit;
          width: 100%;
        }

        .toc-list button:hover {
          color: #1e293b;
        }

        .toc-list button.active {
          color: #2563eb;
          font-weight: 600;
          border-left-color: #2563eb;
        }

        .toc-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .toc-footer a {
          color: #64748b;
          font-size: 0.85rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .toc-footer a:hover {
          color: #0f172a;
        }

        @media (max-width: 1024px) {
          .docs-right-sidebar {
            display: none;
          }
          .docs-main-content {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
