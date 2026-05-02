"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Zap, Shield, Globe, 
  BarChart3, Settings, ChevronRight,
  Sparkles, CreditCard, Users, HelpCircle,
  ArrowRight, HeartPulse, ShieldCheck, Lock, Loader2, PartyPopper, X, QrCode,
  Smartphone, Building2, Copy, Info, Search
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PlanProps {
  name: string;
  id: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  onUpgrade: (planId: string) => void;
}

const PlanCard = ({ name, id, price, period, description, features, buttonText, isPopular, isCurrent, onUpgrade }: PlanProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: '#fff', 
        borderRadius: '24px', 
        padding: '40px 32px', 
        border: isPopular ? '2px solid #3b82f6' : '1px solid #f1f5f9',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0, 0, 0, 0.04)' 
          : '0 4px 12px rgba(0, 0, 0, 0.02)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        cursor: isCurrent ? 'default' : 'pointer',
        zIndex: isHovered ? 10 : 1,
        flex: 1
      }}
      onClick={() => !isCurrent && onUpgrade(id)}
    >
      {isPopular && (
        <div style={{ 
          position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
          background: '#3b82f6', color: '#fff', 
          padding: '6px 16px', borderRadius: '20px', 
          fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px',
          whiteSpace: 'nowrap',
          zIndex: 20
        }}>
          ✨ PHỔ BIẾN NHẤT
        </div>
      )}
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px', color: '#1e293b' }}>{name}</h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
        <span style={{ fontSize: '2.8rem', fontWeight: 1000, color: '#1e293b', letterSpacing: '-1.5px' }}>{price}</span>
        <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 700 }}>/{period}</span>
      </div>
      
      <button style={{ 
        width: '100%', padding: '14px', borderRadius: '14px', 
        border: isCurrent ? '1.5px solid #f1f5f9' : 'none',
        background: isCurrent ? 'transparent' : (isPopular ? '#3b82f6' : '#1e293b'),
        color: isCurrent ? '#94a3b8' : '#fff',
        fontWeight: 850, cursor: isCurrent ? 'default' : 'pointer',
        marginBottom: '32px', transition: 'all 0.2s ease',
        fontSize: '0.9rem'
      }}>
        {isCurrent ? 'Gói hiện tại' : buttonText}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>Tính năng</p>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Check size={14} strokeWidth={3} color={isPopular ? '#3b82f6' : '#1e293b'} />
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

type PaymentRow = {
  id: string;
  plan: string;
  reference_code?: string;
  paid_at: string;
  plan_expires_at: string;
  source: string;
};

function billingSourceLabelVi(s: string): string {
  switch (s) {
    case 'sepay_webhook':
      return 'Chuyển khoản / SePay';
    case 'simulate_payment':
      return 'Mô phỏng thanh toán';
    case 'manual_upgrade':
      return 'Xác nhận trong ứng dụng';
    default:
      return s || 'Khác';
  }
}

export default function SubscriptionPage() {
  const { data: session, update } = useSession();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'momo'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRow[]>([]);
  const [celebratePlan, setCelebratePlan] = useState<string | undefined>();
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadPaymentHistory = async () => {
    const tok = (session as any)?.accessToken;
    if (!tok) return;
    try {
      const res = await fetch(`${apiBase}/billing/payments`, {
        headers: { Authorization: `Bearer ${tok}` },
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.payments)) setPaymentHistory(data.payments);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if ((session as any)?.accessToken) {
      loadPaymentHistory();
    }
  }, [session]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, []);

  // POLLING LOGIC
  useEffect(() => {
    if (selectedPlan && !showSuccess) {
      // Start polling every 4 seconds
      pollingRef.current = setInterval(async () => {
        setPollCount(prev => prev + 1);
        try {
          const response = await fetch(`${apiBase}/user/check-payment?code=${getPaymentCode()}`, {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken}`
            }
          });
          const data = await response.json();
          
          if (data.status === 'confirmed') {
            handleSuccess();
          }
        } catch (e) {
          // Silently fail polling
        }
      }, 4000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [selectedPlan, showSuccess]);

  const getVNDPrice = (planId: string) => {
    switch(planId) {
      case 'starter': return 5000;
      case 'creator': return 10000;
      case 'pro': return 20000;
      case 'scale': return 50000;
      default: return 0;
    }
  }

  const getPaymentCode = () => {
    const userId = (session?.user as any)?.id || 'GUEST';
    const shortId = userId.substring(userId.length - 6).toUpperCase();
    return `CASOS ${shortId} ${selectedPlan?.toUpperCase()}`;
  }

  const handleSuccess = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCelebratePlan(selectedPlan || undefined);
    setShowSuccess(true);
    setSelectedPlan(null);
    await update();
    await loadPaymentHistory();
    setTimeout(() => {
      setShowSuccess(false);
      setCelebratePlan(undefined);
      router.push('/');
    }, 3500);
  }

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    
    try {
      // Manual trigger for testing
      const response = await fetch(`${apiBase}/user/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ plan: selectedPlan })
      });

      if (response.ok) {
        handleSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="subscription-page" style={{ 
      padding: '0 40px', background: 'transparent', height: '100%', 
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', position: 'relative', fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      
      {showSuccess && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(20px)', zIndex: 2000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ textAlign: 'center', animation: 'scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <div style={{ 
              width: '100px', height: '100px', background: '#22c55e', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 30px',
              boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)'
            }}>
              <PartyPopper size={50} color="white" />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 1000, color: '#1e293b', marginBottom: '10px' }}>Tuyệt vời!</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>Hệ thống đã xác nhận thanh toán tự động.</p>
            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>Gói <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{celebratePlan || 'mới'}</span> của bạn đã sẵn sàng.</p>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(8px)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '820px', 
            padding: '48px', position: 'relative', textAlign: 'left',
            boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
          }}>
            <button 
              onClick={() => setSelectedPlan(null)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
            >
              <X size={20} color="#64748b" />
            </button>

            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Xác nhận thanh toán</h3>
                <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>Hệ thống đang tự động kiểm tra giao dịch của bạn...</p>
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', background: '#eff6ff', borderRadius: '100px' 
              }}>
                 <div className="pulse-dot"></div>
                 <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>Đang chờ thanh toán</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
               <div style={{ flex: '1', maxWidth: '340px' }}>
                  <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setPaymentMethod('bank')}
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                          background: paymentMethod === 'bank' ? '#fff' : 'transparent',
                          color: paymentMethod === 'bank' ? '#1e293b' : '#64748b',
                          fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: paymentMethod === 'bank' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        <Building2 size={16} /> Ngân hàng
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('momo')}
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                          background: paymentMethod === 'momo' ? '#fff' : 'transparent',
                          color: paymentMethod === 'momo' ? '#a50064' : '#64748b',
                          fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: paymentMethod === 'momo' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        <Smartphone size={16} /> Ví MoMo
                    </button>
                  </div>

                  <div style={{ 
                    background: '#fff', borderRadius: '24px', padding: '12px', 
                    border: '1.5px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}>
                    {paymentMethod === 'bank' ? (
                      <img 
                        src={`https://img.vietqr.io/image/mb-0905304143-compact.png?amount=${getVNDPrice(selectedPlan)}&addInfo=${encodeURIComponent(getPaymentCode())}&accountName=NHU%20HUU%20MAC`}
                        alt="Bank QR"
                        style={{ width: '100%', borderRadius: '12px', display: 'block' }}
                      />
                    ) : (
                      <div style={{ padding: '10px' }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://nhantien.momo.vn/0905177808/${getVNDPrice(selectedPlan)}`}
                          alt="MoMo QR"
                          style={{ width: '100%', borderRadius: '12px', display: 'block', border: '4px solid #a50064' }}
                        />
                        <p style={{ marginTop: '12px', color: '#a50064', fontWeight: 900, fontSize: '0.85rem', textAlign: 'center' }}>Quét bằng ứng dụng MoMo</p>
                      </div>
                    )}
                  </div>
               </div>

               <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                     <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Số tiền cần thanh toán</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                           <span style={{ fontSize: '2.2rem', fontWeight: 1000, color: '#1e293b' }}>{getVNDPrice(selectedPlan).toLocaleString()}</span>
                           <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748b' }}>VND</span>
                        </div>
                     </div>

                     <div>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Nội dung chuyển khoản</p>
                        <div style={{ 
                           background: '#fff', padding: '16px', borderRadius: '16px', 
                           border: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                           <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>{getPaymentCode()}</span>
                           <button 
                              onClick={() => copyToClipboard(getPaymentCode())}
                              style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                           >
                              <Copy size={14} color={copied ? '#22c55e' : '#3b82f6'} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 850, color: copied ? '#22c55e' : '#3b82f6' }}>{copied ? 'Đã chép' : 'Sao chép'}</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  <div style={{ 
                    padding: '20px', borderRadius: '20px', background: '#f0f9ff', 
                    border: '1px solid #e0f2fe', display: 'flex', gap: '16px' 
                  }}>
                     <div style={{ 
                       width: '40px', height: '40px', background: '#3b82f6', 
                       borderRadius: '12px', display: 'flex', alignItems: 'center', 
                       justifyContent: 'center', flexShrink: 0 
                     }}>
                        <Search size={20} color="white" className="ping-animate" />
                     </div>
                     <div>
                        <p style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 800, marginBottom: '4px' }}>Hệ thống đang tự động dò tìm...</p>
                        <p style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600, lineHeight: 1.4 }}>
                           Màn hình này sẽ tự động đóng ngay khi chúng tôi nhận được chuyển khoản của bạn. Vui lòng giữ nguyên màn hình.
                        </p>
                     </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={handleConfirmPayment}
                      disabled={isProcessing}
                      style={{ 
                        width: '100%', padding: '18px', borderRadius: '18px', border: 'none',
                        background: isProcessing ? '#94a3b8' : '#1e293b', 
                        color: '#fff', fontWeight: 850, fontSize: '1.05rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 10px 20px rgba(30, 41, 59, 0.1)'
                      }}
                    >
                      {isProcessing ? <Loader2 size={22} className="animate-spin" /> : 'Xác nhận đã chuyển khoản'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                      Không muốn chờ? Bạn có thể nhấn nút xác nhận thủ công.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {/* HEADER SECTION */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px', 
          background: 'rgba(255,255,255,0.8)', padding: '6px 14px', 
          borderRadius: '100px', border: '1px solid #f1f5f9', 
          marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}>
          <Sparkles size={14} color="#3b82f6" />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>PRICING PLANS</span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 1000, color: '#1e293b', marginBottom: '8px', letterSpacing: '-2px', lineHeight: 1.1 }}>
          Đầu tư cho sự <span style={{ color: '#3b82f6' }}>an tâm</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>
          Bảo vệ người thân 24/7 với công nghệ AI tiên tiến.
        </p>
      </div>

      {/* PRICING GRID */}
      <div style={{ 
        display: 'flex', gap: '20px', width: '100%', maxWidth: '1440px', position: 'relative', 
        zIndex: 1, transform: 'scale(0.9)', transformOrigin: 'center center'
      }}>
        <PlanCard 
          id="free" name="Free" price="$0" period="mo" description="Giám sát cơ bản tại 1 khu vực." 
          buttonText="Gói hiện tại" isCurrent onUpgrade={() => {}}
          features={['1 Camera AI', 'Cảnh báo Telegram', 'Lưu trữ 24h']} 
        />
        <PlanCard 
          id="starter" name="Starter" price="$6" period="mo" description="Dành cho gia đình nhỏ." 
          buttonText="Nâng cấp" onUpgrade={(id) => setSelectedPlan(id)}
          features={['3 Cameras AI', 'Nhận diện té ngã', 'Cảnh báo cuộc gọi']} 
        />
        <PlanCard 
          id="creator" name="Creator" price="$11" period="mo" description="Bảo vệ toàn diện ngôi nhà." 
          buttonText="Nâng cấp ngay" isPopular onUpgrade={(id) => setSelectedPlan(id)}
          features={['10 Cameras AI', 'Phân tích hành vi', 'Gọi khẩn cấp 5 số']} 
        />
        <PlanCard 
          id="pro" name="Pro" price="$99" period="mo" description="Dành cho các cơ sở chăm sóc." 
          buttonText="Nâng cấp" onUpgrade={(id) => setSelectedPlan(id)}
          features={['25 Cameras AI', 'API tích hợp', 'Hỗ trợ ưu tiên']} 
        />
        <PlanCard 
          id="scale" name="Scale" price="$299" period="mo" description="Doanh nghiệp quy mô lớn." 
          buttonText="Liên hệ Sales" onUpgrade={(id) => setSelectedPlan(id)}
          features={['Không giới hạn Camera', 'Hệ thống AI riêng', 'Bảo mật Enterprise']} 
        />
      </div>

      <section style={{
        marginTop: '48px',
        width: '100%',
        maxWidth: '980px',
        background: '#fff',
        borderRadius: '24px',
        padding: '28px 32px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 12px 32px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <CreditCard size={22} color="#3b82f6" strokeWidth={2.5} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
            Lịch sử thanh toán &amp; đăng ký
          </h2>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>
          Mỗi lần gói được kích hoạt hoặc gia hạn từ lần thanh toán được ghi lại đây. Thông báo trong chuông cũng trùng với các sự kiện đã đồng bộ.
        </p>
        {paymentHistory.length === 0 ? (
          <div style={{
            padding: '28px',
            borderRadius: '16px',
            background: '#f8fafc',
            border: '1px dashed #e2e8f0',
            textAlign: 'center',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Chưa có giao dịch nào được lưu. Sau thanh toán hoặc nâng cấp trong ứng dụng, bảng này sẽ được cập nhật.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#94a3b8', fontWeight: 800 }}>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.08em' }}>Gói</th>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.08em' }}>Thanh toán</th>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.08em' }}>Hết hạn</th>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.08em' }}>Mã GD</th>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.08em' }}>Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155', fontWeight: 600 }}>
                    <td style={{ padding: '12px 8px', textTransform: 'capitalize', fontWeight: 800 }}>{row.plan}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {row.paid_at ? new Date(row.paid_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {row.plan_expires_at ? new Date(row.plan_expires_at).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '12px 8px', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {row.reference_code || '—'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{billingSourceLabelVi(row.source)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes modalSlideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .ping-animate {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.2); opacity: 0.5; }
        }
      `}</style>

    </div>
  );
}
