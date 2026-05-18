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
        flex: 1,
        fontFamily: '"Inter", sans-serif'
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
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: '#1e293b' }}>{name}</h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
        <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-1.5px' }}>{price}</span>
        <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 700 }}>/{period}</span>
      </div>

      <button style={{
        width: '100%', padding: '14px', borderRadius: '14px',
        border: isCurrent ? '1.5px solid #f1f5f9' : 'none',
        background: isCurrent ? 'transparent' : (isPopular ? '#3b82f6' : '#1e293b'),
        color: isCurrent ? '#94a3b8' : '#fff',
        fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer',
        marginBottom: '32px', transition: 'all 0.2s ease',
        fontSize: '0.9rem',
        fontFamily: '"Inter", sans-serif'
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
  const [currentPlanInfo, setCurrentPlanInfo] = useState<{ plan: string, status: string, expiresAt: string, paidAt: string } | null>(null);
  const [celebratePlan, setCelebratePlan] = useState<string | undefined>();
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentPlan = async () => {
    const tok = (session?.user as any)?.accessToken;
    if (!tok) return;
    try {
      const res = await fetch(`${apiBase}/health-profiles`, {
        headers: { Authorization: `Bearer ${tok}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentPlanInfo({
          plan: data.subscription_plan || 'free',
          status: data.subscription_status || 'active',
          expiresAt: data.plan_expires_at || '',
          paidAt: data.last_payment_at || ''
        });
      }
    } catch { }
  };

  const loadPaymentHistory = async () => {
    const tok = (session?.user as any)?.accessToken;
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
    if ((session?.user as any)?.accessToken) {
      loadPaymentHistory();
      fetchCurrentPlan();
    }
  }, [session]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap';
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
              'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
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
    switch (planId) {
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
    await fetchCurrentPlan();
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
          'Authorization': `Bearer ${(session?.user as any)?.accessToken}`
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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [cancelOTP, setCancelOTP] = useState('');
  const [cancelStatus, setCancelStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleCancelPlan = () => {
    setShowCancelModal(true);
    setIsOTPSent(false);
    initiateCancelRequest(); // Send OTP immediately when opening modal
  };

  const initiateCancelRequest = async () => {
    setIsProcessing(true);
    try {
      const tok = (session?.user as any)?.accessToken;
      const res = await fetch(`${apiBase}/user/cancel-plan/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (res.ok) {
        setIsOTPSent(true);
      } else {
        const data = await res.json();
        setCancelStatus({ type: 'error', message: data.error || 'Có lỗi xảy ra khi yêu cầu mã xác nhận' });
      }
    } catch (err) {
      setCancelStatus({ type: 'error', message: 'Không thể kết nối tới máy chủ' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCancelPlan = async () => {
    if (!cancelOTP) return;
    setIsProcessing(true);
    try {
      const tok = (session?.user as any)?.accessToken;
      const res = await fetch(`${apiBase}/user/cancel-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tok}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: cancelOTP })
      });
      if (res.ok) {
        setShowCancelModal(false);
        setCancelOTP('');
        setIsOTPSent(false);
        setCancelStatus({ type: 'success', message: 'Đã hủy gói cước thành công. Trạng thái của bạn đã chuyển sang "Canceled".' });
        await update();
        await fetchCurrentPlan();
      } else {
        const data = await res.json();
        setCancelStatus({ type: 'error', message: data.error || 'Mã xác nhận không chính xác hoặc đã hết hạn' });
      }
    } catch (err) {
      setCancelStatus({ type: 'error', message: 'Không thể kết nối tới máy chủ' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="subscription-page" style={{
      padding: '0 40px', background: 'transparent', height: '100%',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', position: 'relative', fontFamily: '"Inter", sans-serif'
    }}>

      {showSuccess && (
        <div className="modal-backdrop-blur" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            background: '#ffffff', 
            padding: '48px 32px', 
            borderRadius: '8px', 
            width: '100%', 
            maxWidth: '520px', 
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            position: 'relative',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            animation: 'antdZoomIn 0.3s cubic-bezier(0.075, 0.82, 0.165, 1)'
          }}>
            <div style={{
              width: '72px', height: '72px', background: '#f6ffed',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 24px',
              border: '1px solid #b7eb8f'
            }}>
              <PartyPopper size={36} color="#52c41a" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)', marginBottom: '8px' }}>Tuyệt vời!</h2>
            <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 4px 0' }}>Hệ thống đã xác nhận thanh toán tự động thành công.</p>
            <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>Gói <span style={{ color: '#1677ff', fontWeight: 600, textTransform: 'capitalize' }}>{celebratePlan || 'mới'}</span> của bạn đã sẵn sàng hoạt động.</p>
            <button
              onClick={() => setShowSuccess(false)}
              style={{
                padding: '6px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#1677ff',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 0 rgba(5, 145, 255, 0.1)'
              }}
            >
              Bắt đầu trải nghiệm
            </button>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-backdrop-blur" style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', 
          backdropFilter: 'blur(8px)', zIndex: 1100, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ 
            background: '#ffffff', 
            padding: '24px', 
            borderRadius: '8px', 
            width: '100%', 
            maxWidth: '416px', 
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            animation: 'antdZoomIn 0.3s cubic-bezier(0.075, 0.82, 0.165, 1)'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ 
                width: '22px', height: '22px', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: '#faad14', marginTop: '2px'
              }}>
                <ShieldCheck size={22} color="#faad14" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)', margin: '0 0 8px 0', lineHeight: '1.5' }}>Xác nhận hủy gói đăng ký</h3>
                <p style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)', margin: 0, lineHeight: 1.5 }}>
                  Chúng tôi đã gửi mã xác nhận 6 số đến email của bạn. Vui lòng nhập mã để hoàn tất việc hủy gói.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px', position: 'relative' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  width: '40px', height: '48px', borderRadius: '6px',
                  border: `1px solid ${cancelOTP[i] ? '#ff4d4f' : '#d9d9d9'}`,
                  background: cancelOTP[i] ? '#fff' : '#fafafa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)',
                  transition: 'all 0.2s ease',
                  boxShadow: cancelOTP[i] ? '0 0 0 2px rgba(255, 77, 79, 0.1)' : 'none'
                }}>
                  {cancelOTP[i] || ''}
                </div>
              ))}
              <input 
                type="text" 
                maxLength={6}
                autoFocus
                value={cancelOTP}
                onChange={(e) => setCancelOTP(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => { setShowCancelModal(false); setCancelOTP(''); }}
                style={{ 
                  padding: '4px 15px', 
                  borderRadius: '6px', 
                  border: '1px solid #d9d9d9', 
                  background: '#ffffff', 
                  color: 'rgba(0, 0, 0, 0.88)',
                  fontSize: '14px',
                  cursor: 'pointer', 
                  transition: 'all 0.2s' 
                }}
              >
                Bỏ qua
              </button>
              <button 
                onClick={confirmCancelPlan}
                disabled={isProcessing || cancelOTP.length < 6}
                style={{ 
                  padding: '4px 15px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: cancelOTP.length === 6 ? '#ff4d4f' : '#f5f5f5', 
                  color: cancelOTP.length === 6 ? '#ffffff' : 'rgba(0, 0, 0, 0.25)', 
                  fontWeight: 400, 
                  fontSize: '14px',
                  cursor: cancelOTP.length === 6 ? 'pointer' : 'not-allowed', 
                  transition: 'all 0.2s',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : 'Xác nhận hủy'}
              </button>
            </div>
            
            {!isOTPSent && isProcessing && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#1677ff', textAlign: 'center' }}>
                Đang gửi mã xác nhận...
              </div>
            )}
          </div>
        </div>
      )}

      {cancelStatus && (
        <div className="modal-backdrop-blur" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff', 
            padding: '24px', 
            borderRadius: '8px', 
            width: '100%', 
            maxWidth: '416px',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            animation: 'antdZoomIn 0.3s cubic-bezier(0.075, 0.82, 0.165, 1)'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{
                width: '22px', height: '22px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                marginTop: '2px'
              }}>
                {cancelStatus.type === 'success' ?
                  <PartyPopper size={22} color="#52c41a" /> :
                  <X size={22} color="#ff4d4f" strokeWidth={3} />
                }
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  {cancelStatus.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)', margin: 0, lineHeight: 1.5 }}>
                  {cancelStatus.message}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setCancelStatus(null);
                  if (cancelStatus.type === 'success') router.push('/');
                }}
                style={{
                  padding: '4px 15px', 
                  borderRadius: '6px', 
                  border: 'none',
                  background: cancelStatus.type === 'success' ? '#52c41a' : '#ff4d4f',
                  color: '#ffffff', 
                  fontWeight: 400, 
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 0 rgba(0,0,0,0.05)'
                }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="modal-backdrop-blur" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff', 
            borderRadius: '8px', 
            width: '100%', 
            maxWidth: '800px',
            padding: '24px', 
            position: 'relative', 
            textAlign: 'left',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            animation: 'antdZoomIn 0.3s cubic-bezier(0.075, 0.82, 0.165, 1)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlan(null)}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '22px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: 'rgba(0, 0, 0, 0.45)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '24px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)', margin: '0 0 4px 0' }}>Xác nhận thanh toán</h3>
                <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.45)', margin: 0 }}>Hệ thống đang tự động kiểm tra giao dịch của bạn...</p>
              </div>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '4px 12px', 
                background: '#e6f4ff', 
                borderRadius: '100px',
                border: '1px solid #91caff'
              }}>
                <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1677ff' }}></div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#1677ff' }}>Đang chờ thanh toán</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1', maxWidth: '340px' }}>
                {/* Ant Design Segmented-style Payment Tab */}
                <div style={{ display: 'flex', gap: '2px', background: '#f5f5f5', padding: '2px', borderRadius: '6px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    style={{
                      flex: 1, padding: '6px', borderRadius: '4px', border: 'none',
                      background: paymentMethod === 'bank' ? '#ffffff' : 'transparent',
                      color: paymentMethod === 'bank' ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.45)',
                      fontWeight: 500, fontSize: '14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: paymentMethod === 'bank' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Building2 size={14} /> Ngân hàng
                  </button>
                  <button
                    onClick={() => setPaymentMethod('momo')}
                    style={{
                      flex: 1, padding: '6px', borderRadius: '4px', border: 'none',
                      background: paymentMethod === 'momo' ? '#ffffff' : 'transparent',
                      color: paymentMethod === 'momo' ? '#a50064' : 'rgba(0,0,0,0.45)',
                      fontWeight: 500, fontSize: '14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: paymentMethod === 'momo' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Smartphone size={14} /> Ví MoMo
                  </button>
                </div>

                <div style={{
                  background: '#ffffff', borderRadius: '8px', padding: '8px',
                  border: '1px solid #d9d9d9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}>
                  {paymentMethod === 'bank' ? (
                    <img
                      src={`https://img.vietqr.io/image/mb-0905304143-compact.png?amount=${getVNDPrice(selectedPlan)}&addInfo=${encodeURIComponent(getPaymentCode())}&accountName=NHU%20HUU%20MAC`}
                      alt="Bank QR"
                      style={{ width: '100%', borderRadius: '4px', display: 'block' }}
                    />
                  ) : (
                    <div style={{ padding: '8px' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://nhantien.momo.vn/0905177808/${getVNDPrice(selectedPlan)}`}
                        alt="MoMo QR"
                        style={{ width: '100%', borderRadius: '4px', display: 'block', border: '2px solid #a50064' }}
                      />
                      <p style={{ marginTop: '8px', color: '#a50064', fontWeight: 600, fontSize: '12px', textAlign: 'center', margin: 0 }}>Quét bằng ứng dụng MoMo</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Số tiền cần thanh toán</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{getVNDPrice(selectedPlan).toLocaleString()}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(0,0,0,0.45)' }}>VND</span>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Nội dung chuyển khoản</p>
                    <div style={{
                      background: '#ffffff', padding: '12px 16px', borderRadius: '6px',
                      border: '1px solid #d9d9d9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#1677ff' }}>{getPaymentCode()}</span>
                      <button
                        onClick={() => copyToClipboard(getPaymentCode())}
                        style={{ 
                          background: '#f5f5f5', border: '1px solid #d9d9d9', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Copy size={12} color={copied ? '#52c41a' : 'rgba(0,0,0,0.45)'} />
                        <span style={{ fontSize: '12px', fontWeight: 400, color: copied ? '#52c41a' : 'rgba(0,0,0,0.65)' }}>{copied ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ant Design styled Info Alert */}
                <div style={{
                  padding: '12px 16px', borderRadius: '6px', background: '#e6f4ff',
                  border: '1px solid #91caff', display: 'flex', gap: '12px'
                }}>
                  <div style={{
                    width: '32px', height: '32px', background: '#1677ff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <Search size={16} color="white" className="ping-animate" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.88)', fontWeight: 600, margin: '0 0 2px 0' }}>Hệ thống đang tự động dò tìm...</p>
                    <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.65)', margin: 0, lineHeight: 1.4 }}>
                      Màn hình này sẽ tự động đóng ngay khi chúng tôi nhận được chuyển khoản của bạn. Vui lòng giữ nguyên màn hình.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    style={{
                      width: '100%', padding: '8px 16px', borderRadius: '6px', border: 'none',
                      background: isProcessing ? '#f5f5f5' : '#1677ff',
                      color: isProcessing ? 'rgba(0,0,0,0.25)' : '#ffffff', 
                      fontWeight: 400, fontSize: '14px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 2px 0 rgba(5, 145, 255, 0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận đã chuyển khoản'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(0,0,0,0.45)', margin: 0 }}>
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
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', letterSpacing: '-2px', lineHeight: 1.1 }}>
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
          buttonText="Gói hiện tại" isCurrent onUpgrade={() => { }}
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
        maxWidth: '99%',
        background: '#fff',
        borderRadius: '8px',
        padding: '24px',
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
          Lưu ý: Khi huỷ gói đăng ký Casos không thể hoàn tiền lại cho bạn, mọi thắc mắc liên hệ vào hotline.
        </p>

        {currentPlanInfo && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
          }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Gói hiện tại của bạn
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'capitalize', lineHeight: 1, fontFamily: '"Inter", sans-serif' }}>
                  {currentPlanInfo.plan === 'free' ? 'Cơ Bản (Free)' : currentPlanInfo.plan}
                </h3>
                {currentPlanInfo.plan !== 'free' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: currentPlanInfo.status === 'canceled' ? '#fee2e2' : '#dcfce7',
                      color: currentPlanInfo.status === 'canceled' ? '#dc2626' : '#15803d',
                      padding: '8px 16px',
                      borderRadius: '100px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      fontFamily: '"Inter", sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: currentPlanInfo.status === 'canceled' ? '#ef4444' : '#22c55e',
                        boxShadow: currentPlanInfo.status === 'canceled' ? 'none' : '0 0 8px #22c55e',
                        animation: currentPlanInfo.status === 'canceled' ? 'none' : 'pulse 2s infinite'
                      }}></div>
                      {currentPlanInfo.status === 'canceled' ? 'ĐÃ HỦY' : 'ĐANG HOẠT ĐỘNG'}
                    </div>
                    {currentPlanInfo.status === 'active' && (
                      <button
                        onClick={handleCancelPlan}
                        style={{
                          background: '#fff',
                          border: '1.5px solid #f1f5f9',
                          color: '#94a3b8',
                          padding: '8px 16px',
                          borderRadius: '100px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          fontFamily: '"Inter", sans-serif',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.borderColor = '#fee2e2';
                          e.currentTarget.style.color = '#dc2626';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.borderColor = '#f1f5f9';
                          e.currentTarget.style.color = '#94a3b8';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                        }}
                      >
                        <X size={12} strokeWidth={3} />
                        Hủy gói
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, margin: '0 0 6px 0' }}>
                Đăng ký lúc: <span style={{ color: '#0f172a', fontWeight: 800 }}>{currentPlanInfo.paidAt ? new Date(currentPlanInfo.paidAt).toLocaleString('vi-VN') : '—'}</span>
              </p>
              <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, margin: 0 }}>
                Hết hạn: <span style={{ color: '#0f172a', fontWeight: 800 }}>{currentPlanInfo.expiresAt ? new Date(currentPlanInfo.expiresAt).toLocaleString('vi-VN') : 'Vô thời hạn'}</span>
              </p>
            </div>
          </div>
        )}

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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#94a3b8', fontWeight: 800 }}>
                  <th style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>Gói</th>
                  <th style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>Thanh toán</th>
                  <th style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>Hết hạn</th>
                  <th style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>Mã GD</th>
                  <th style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.08em' }}>Nguồn</th>
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
                    <td style={{ padding: '12px 8px', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', fontSize: '0.8rem' }}>
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
