"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';

const CPR_STEPS = [
  { 
    title: "CẢNH BÁO SỰ CỐ NGÃ SẼ ĐƯỢC GỬI", 
    text: "Hệ thống phát hiện có người ngã bất động. Nhấn HỦY nếu đây là báo động giả. Hệ thống sẽ tự động gọi 115 và bắt đầu hướng dẫn sơ cứu sau khi đếm ngược.",
    isWarning: true
  },
  { 
    title: "BƯỚC 1: KIỂM TRA PHẢN ỨNG", 
    text: "Tiến lại gần, lay mạnh vai nạn nhân và gọi to: CHÚ ƠI/ANH ƠI, CÓ SAO KHÔNG? Nếu không có phản ứng, chuyển ngay sang bước 2."
  },
  { 
    title: "BƯỚC 2: KIỂM TRA ĐƯỜNG THỞ", 
    text: "Đặt một tay lên trán, đẩy đầu nạn nhân ngửa ra sau. Ngón tay của bàn tay kia nâng nhẹ cằm lên để mở rộng đường thở. Lắng nghe tiếng thở."
  },
  { 
    title: "BƯỚC 3: ÉP TIM KẾT HỢP", 
    text: "Đặt gót bàn tay lên giữa ngực nạn nhân. Ép mạnh (sâu khoảng 5cm), ép nhanh (tốc độ 100-120 lần/phút). Yêu cầu người kế bên hỗ trợ hô hấp nhân tạo nếu biết cách."
  },
];

export default function CPRScreen() {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(30);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(CPR_STEPS[step].text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      synth.speak(utterance);
    }
  }, [step]);

  useEffect(() => {
    if (step >= CPR_STEPS.length - 1 && timer === 0) return;

    const interval = setInterval(() => {
       setTimer(prev => {
          if (prev <= 1) {
             if (step < CPR_STEPS.length - 1) {
                 setStep(s => s + 1);
                 return 30;
             }
             clearInterval(interval);
             return 0;
          }
          return prev - 1;
       })
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const handleCancel = () => {
    window.speechSynthesis?.cancel();
    alert("Đã hủy báo động thành công.");
    router.push('/');
  };

  const currentStep = CPR_STEPS[step];

  return (
    <div className="cpr-fullscreen" style={{ background: currentStep.isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)' }}>
      
      <div className="cpr-step-card" key={step}>
        {currentStep.isWarning && <ShieldAlert size={64} color="var(--danger)" style={{ margin: '0 auto 20px' }} />}
        
        <h2 className={`cpr-title ${!currentStep.isWarning && 'text-accent'}`}>{currentStep.title}</h2>
        <p style={{ fontSize: '1.5rem', lineHeight: 1.6, marginBottom: '40px', color: 'var(--text-main)' }}>
          {currentStep.text}
        </p>

        <div style={{ margin: '30px 0' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 600 }}>
            {currentStep.isWarning ? 'Tự động kích hoạt cứu hộ trong' : 'Chuyển sang bước tiếp theo sau'}
          </div>
          <div className="cpr-timer">
            {timer}s
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
          <button className="btn btn-danger" onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', padding: '16px 32px' }}>
            <LogOut size={24} />
            HỦY BÁO ĐỘNG NGAY
          </button>
          
          {step < CPR_STEPS.length - 1 && (
            <button className="btn btn-primary" onClick={() => { setStep(s => s + 1); setTimer(30); }} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>
              Bỏ Qua & Tiếp Tục Giọng Đọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
