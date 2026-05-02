"use client"

import React, { useEffect, useState } from 'react';
import { 
  FileText, Download, User, Activity, 
  Clock, Calendar, Heart, ShieldAlert,
  ChevronRight, BrainCircuit, Printer, Share2
} from 'lucide-react';
import Link from 'next/link';

import { useSession } from "next-auth/react";

interface PatientInfo {
  name: string;
  age: number;
  bloodType: string;
  conditions: string[];
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      const token = (session?.user as any)?.accessToken;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/health-profiles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPatient({
        name: data.name || "Bệnh nhân mẫu",
        age: data.age || 72,
        bloodType: data.bloodType || "O+",
        conditions: data.conditions || ["Cao huyết áp", "Tiểu đường Type 2"]
      });
    } catch (err) {
      console.error("Lỗi lấy thông tin:", err);
    } finally {
      setLoading(false);
    }
  };

  const activityData = [45, 52, 38, 65, 48, 70, 55]; // Chỉ số vận động ảo
  const maxActivity = 100;

  return (
    <div className="reports-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100%' }}>
      
      {/* HEADER: MEDICAL STYLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-1px', marginBottom: '8px' }}>
            BÁO CÁO SỨC KHỎE TỔNG QUAN
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
              DỮ LIỆU ĐÃ XÁC THỰC
            </span>
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
              Cập nhật lần cuối: Hôm nay, 08:30 AM
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: '#fff', border: '1.5px solid #e2e8f0', padding: '10px 18px', borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', cursor: 'pointer' }}>
            <Share2 size={18} /> CHIA SẺ
          </button>
          <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '14px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)', cursor: 'pointer' }}>
            <Printer size={18} /> IN BÁO CÁO (PDF)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        
        {/* LEFT COLUMN: CHARTS & LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* MOBILITY CHART */}
          <div style={{ background: '#fff', padding: '28px', borderRadius: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={20} color="var(--accent)" /> CHỈ SỐ VẬN ĐỘNG (7 NGÀY)
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>So sánh mức độ di chuyển trung bình hàng ngày.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--accent)' }}>+12%</span>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>SO VỚI TUẦN TRƯỚC</p>
              </div>
            </div>

            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '0 10px' }}>
              {activityData.map((val, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${(val / maxActivity) * 100}%`, 
                    background: i === 5 ? 'var(--accent)' : '#eff6ff', 
                    borderRadius: '12px',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}>
                    {i === 5 && (
                      <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                        {val}%
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>T{i+2}</span>
                </div>
              ))}
            </div>
          </div>

          {/* INCIDENT LOG TABLE */}
          <div style={{ background: '#fff', borderRadius: '32px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--danger)" /> NHẬT KÝ SỰ CỐ CHI TIẾT
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { time: '14:20 - Hôm qua', type: 'Té ngã', severity: 'High', action: 'Đã xử lý (gọi 115)' },
                { time: '02:15 - 28/04', type: 'Dấu hiệu bất thường', severity: 'Medium', action: 'Bệnh nhân tự đứng dậy' },
                { time: '09:40 - 25/04', type: 'Té ngã', severity: 'High', action: 'Đã báo người thân' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px 150px', alignItems: 'center', padding: '16px 20px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{item.time}</span>
                  <span style={{ fontWeight: 850, color: '#1e293b' }}>{item.type}</span>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', textAlign: 'center',
                    background: item.severity === 'High' ? '#fee2e2' : '#fef3c7',
                    color: item.severity === 'High' ? '#ef4444' : '#f59e0b'
                  }}>
                    {item.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROFILE & AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* PATIENT CARD */}
          <div style={{ background: 'var(--accent)', color: '#fff', padding: '30px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={30} color="#fff" />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{patient?.name}</h4>
                <p style={{ opacity: 0.8, fontSize: '0.85rem', fontWeight: 600 }}>{patient?.age} Tuổi • Hồ sơ #8821</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.7, marginBottom: '4px' }}>NHÓM MÁU</p>
                <span style={{ fontSize: '1.1rem', fontWeight: 950 }}>{patient?.bloodType}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.7, marginBottom: '4px' }}>SỨC KHỎE</p>
                <span style={{ fontSize: '1.1rem', fontWeight: 950 }}>ỔN ĐỊNH</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.7, marginBottom: '8px' }}>TIỀN SỬ BỆNH LÝ</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {patient?.conditions.map((c, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* AI ADVISOR CARD */}
          <div style={{ background: '#1e293b', color: '#fff', padding: '30px', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--accent)', filter: 'blur(60px)', opacity: 0.3 }}></div>
            
            <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BrainCircuit size={20} color="var(--accent)" /> NHẬN ĐỊNH AI
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ minWidth: '4px', height: 'auto', background: 'var(--accent)', borderRadius: '2px' }}></div>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <b>Rủi ro té ngã:</b> Tần suất sự cố tăng nhẹ trong khoảng từ <b>02:00 - 04:00 AM</b>. Cần kiểm tra lại độ sáng đèn ngủ khu vực nhà vệ sinh.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ minWidth: '4px', height: 'auto', background: 'var(--success)', borderRadius: '2px' }}></div>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <b>Vận động:</b> Mức độ hoạt động ban ngày đã cải thiện <b>12%</b> so với tuần trước, cho thấy tiến triển tốt sau đợt điều trị.
                </p>
              </div>
            </div>

            <button style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              XEM CHI TIẾT DỰ BÁO
            </button>
          </div>

          {/* DOCTOR CONTACT */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
             <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', marginBottom: '12px' }}>BÁC SĨ PHỤ TRÁCH</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Heart size={20} color="var(--danger)" />
                </div>
                <div>
                   <p style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b' }}>BS. Nguyễn Văn A</p>
                   <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Khoa Tim Mạch - BV Chợ Rẫy</p>
                </div>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
