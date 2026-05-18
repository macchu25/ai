"use client"

import { useState } from 'react';
import { ShoppingCart, Star, ShieldCheck, Video, Zap, ExternalLink, Info, CheckCircle2, Cctv, Moon } from 'lucide-react';

const recommendedCameras = [
  {
    id: 'tapo-c210',
    brand: 'TP-Link',
    model: 'Tapo C210',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
    image: '/TP200.webp',
    price: 'Khoảng 550.000đ',
    resolution: '3MP (2304x1296)',
    features: ['Hỗ trợ luồng RTSP', 'Xoay 360 độ', 'Hồng ngoại ban đêm', 'Đàm thoại 2 chiều'],
    rating: 4.9,
    reviews: 12450,
    shopeeLink: 'http://shopee.vn/product/97485054/20782324162?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTEbAAAAAy2crLnprwjH1NO5m8MFBkaM55o9KLZ0vxkLrwv3FomK_abbbGqiLjbdH9S6iGr_-81RPWJdvPKGpnkHD3o9NfaGF9aPpio980xc3G8GSvh4jKFwHhwSlGd4rp6baQfgBlTLFmiZsn76A&gad_source=1&gad_campaignid=23023424812&gbraid=0AAAAADPpQE7yxfuQ2vd27s_AKdHkon84F&gclid=CjwKCAjw8arQBhB9EiwAfIKdQj5zJrOSQridaU1aXECkJpHKgd4KYtiRf6SoYE_n2rWgIgCD5xSSeRoC8PQQAvD_BwE',
    bestFor: 'Lựa chọn cân bằng tốt nhất',
    isTopPick: true,
    type: 'indoor'
  },
  {
    id: 'ezviz-c6n',
    brand: 'EZVIZ',
    model: 'C6N 1080p / 2K',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    price: 'Khoảng 450.000đ - 650.000đ',
    resolution: '2MP / 4MP',
    features: ['Chuẩn ONVIF/RTSP', 'Bám theo chuyển động', 'Privacy mode', 'Kết nối ổn định'],
    rating: 4.8,
    reviews: 8930,
    shopeeLink: 'https://shopee.vn/search?keyword=ezviz%20c6n',
    bestFor: 'Dễ dàng cài đặt & Dùng ổn định',
    isTopPick: false,
    type: 'indoor'
  },
  {
    id: 'imou-ranger-2',
    brand: 'IMOU',
    model: 'Ranger 2 / 2C',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    price: 'Khoảng 480.000đ',
    resolution: '1080P / 4MP',
    features: ['Hỗ trợ ONVIF', 'Tích hợp còi hú', 'Phát hiện con người', 'Chống ngược sáng tốt'],
    rating: 4.7,
    reviews: 15200,
    shopeeLink: 'https://shopee.vn/search?keyword=imou%20ranger%202',
    bestFor: 'Tích hợp cảnh báo thông minh',
    isTopPick: false,
    type: 'indoor'
  },
  {
    id: 'xiaomi-c300',
    brand: 'Xiaomi',
    model: 'Smart Camera C300',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    price: 'Khoảng 650.000đ',
    resolution: '2K (3MP)',
    features: ['Chất lượng hình ảnh xuất sắc', 'Khẩu độ F1.4', 'Màu sắc ban đêm', 'Tuy nhiên cần hack RTSP'],
    rating: 4.6,
    reviews: 5400,
    shopeeLink: 'https://shopee.vn/search?keyword=xiaomi%20camera%20c300',
    bestFor: 'Chất lượng hình ảnh cao nhất',
    isTopPick: false,
    type: 'indoor'
  },
  {
    id: 'tapo-c310',
    brand: 'TP-Link',
    model: 'Tapo C310 (Ngoài trời)',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    price: 'Khoảng 750.000đ',
    resolution: '3MP (2304x1296)',
    features: ['Hồng ngoại nhìn đêm siêu rõ (30m)', 'Chống nước bụi IP66', 'Hỗ trợ RTSP', 'Báo động thông minh'],
    rating: 4.9,
    reviews: 9800,
    shopeeLink: 'https://shopee.vn/search?keyword=tapo%20c310',
    bestFor: 'Giám sát ban đêm ngoài trời',
    isTopPick: false,
    type: 'outdoor',
    specialIcon: 'moon'
  }
];

export default function CameraRecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'indoor' | 'outdoor'>('all');

  return (
    <div className="recommendations-page">
      <header className="page-header-premium">
        <div>
          <h1 className="page-title-premium">Gợi Ý Thiết Bị Camera</h1>
          <p className="page-subtitle-premium">
            Danh sách các dòng camera IP hỗ trợ chuẩn ONVIF/RTSP tương thích tốt nhất với hệ thống AI của Casos.
          </p>
        </div>
        <div className="header-badges">
          <div className="badge-info">
            <ShieldCheck size={18} className="icon-blue" />
            <span>Đã kiểm tra tương thích</span>
          </div>
          <div className="badge-info">
            <Zap size={18} className="icon-yellow" />
            <span>Kết nối độ trễ thấp</span>
          </div>
        </div>
      </header>

      <div className="tech-requirements-card">
        <div className="req-icon">
          <Info size={24} />
        </div>
        <div className="req-content">
          <h3>Yêu cầu kỹ thuật bắt buộc</h3>
          <p>
            Để hệ thống AI phân tích và cảnh báo té ngã hoạt động chính xác, camera cần hỗ trợ giao thức <strong>RTSP</strong> hoặc <strong>ONVIF</strong> để có thể kéo luồng trực tiếp. Độ phân giải khuyến nghị từ <strong>1080p (2MP)</strong> trở lên.
          </p>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả
        </button>
        <button 
          className={`tab-btn ${activeTab === 'indoor' ? 'active' : ''}`}
          onClick={() => setActiveTab('indoor')}
        >
          Camera Trong nhà
        </button>
        <button 
          className={`tab-btn ${activeTab === 'outdoor' ? 'active' : ''}`}
          onClick={() => setActiveTab('outdoor')}
        >
          Camera Ngoài trời
        </button>
      </div>

      <div className="cameras-grid">
        {recommendedCameras
          .filter(cam => activeTab === 'all' || cam.type === activeTab)
          .map((cam) => (
          <div className={`camera-card ${cam.isTopPick ? 'top-pick' : ''}`} key={cam.id}>
            {cam.isTopPick && (
              <div className="top-pick-badge">
                <Star fill="white" size={14} />
                Lựa chọn hàng đầu
              </div>
            )}
            
            <div className="card-image-wrapper" style={{ background: cam.image ? '#ffffff' : cam.gradient }}>
              {cam.image ? (
                <img 
                  src={cam.image} 
                  alt={cam.model} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className="cam-img"
                />
              ) : (
                <div className="cam-icon-overlay">
                  {cam.specialIcon === 'moon' ? (
                    <Moon size={64} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                  ) : (
                    <Cctv size={64} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                  )}
                </div>
              )}
              <div className="brand-tag">{cam.brand}</div>
            </div>
            
            <div className="card-content">
              <div className="card-header">
                <h3 className="cam-model">{cam.model}</h3>
                <div className="cam-price">{cam.price}</div>
              </div>
              
              <div className="cam-best-for">{cam.bestFor}</div>
              
              <div className="cam-specs">
                <div className="spec-item">
                  <Video size={16} />
                  <span>{cam.resolution}</span>
                </div>
                <div className="spec-item rating">
                  <Star fill="#f59e0b" color="#f59e0b" size={16} />
                  <span>{cam.rating} ({cam.reviews.toLocaleString()} đánh giá)</span>
                </div>
              </div>
              
              <ul className="cam-features">
                {cam.features.map((feat, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="check-icon" />
                    {feat}
                  </li>
                ))}
              </ul>
              
              <a 
                href={cam.shopeeLink} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-shopee"
              >
                <ShoppingCart size={18} />
                <span>Mua trên Shopee</span>
                <ExternalLink size={16} className="ext-icon" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .recommendations-page {
          padding: 20px;
          min-height: calc(100vh - 120px);
        }

        /* Unified styles applied via globals.css */

        .header-badges {
          display: flex;
          gap: 12px;
        }

        .badge-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #334155;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

        .icon-blue { color: #3b82f6; }
        .icon-yellow { color: #f59e0b; }

        .tech-requirements-card {
          background: linear-gradient(to right, #eff6ff, #e0e7ff);
          border: 1px solid #bfdbfe;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          align-items: flex-start;
        }

        .req-icon {
          background: #3b82f6;
          color: white;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .req-content h3 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .req-content p {
          margin: 0;
          color: #1e3a8a;
          line-height: 1.6;
        }

        .filter-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
        }

        .tab-btn {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 100px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .tab-btn.active {
          background: #1e293b;
          color: white;
          border-color: #1e293b;
        }

        .cameras-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .camera-card {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }

        .camera-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .camera-card.top-pick {
          border: 2px solid #3b82f6;
        }

        .top-pick-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #3b82f6;
          color: white;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .card-image-wrapper {
          position: relative;
          height: 200px;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cam-icon-overlay {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .camera-card:hover .cam-icon-overlay {
          transform: scale(1.15);
        }

        .camera-card:hover .cam-img {
          transform: scale(1.08);
        }

        .brand-tag {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.8rem;
          color: #1e293b;
        }

        .card-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .cam-model {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
        }

        .cam-price {
          font-weight: 800;
          color: #ef4444;
          font-size: 1.1rem;
        }

        .cam-best-for {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .cam-specs {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .spec-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .cam-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
          flex: 1;
        }

        .cam-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: #334155;
          margin-bottom: 10px;
        }

        .check-icon {
          color: #10b981;
          flex-shrink: 0;
        }

        .btn-shopee {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #ee4d2d;
          color: white;
          padding: 14px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.2s;
          margin-top: auto;
        }

        .btn-shopee:hover {
          background: #d73d20;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(238, 77, 45, 0.2);
        }

        .ext-icon {
          margin-left: auto;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          .header-badges {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
