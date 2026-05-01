"use client"

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Activity, Shield, Zap, AlertCircle, 
  Download, ArrowLeft, PieChart 
} from 'lucide-react';
import Link from 'next/link';

interface IncidentCategory {
  label: string;
  count: number;
  percent: number;
}

interface SummaryData {
  total_incidents: number;
  recent_24h: number;
  active_cameras: number;
  categories: IncidentCategory[];
  system_health: string;
}

interface TimelineItem {
  _id: string;
  count: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [sumRes, timeRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/analytics/summary', { headers }),
          fetch('http://localhost:8080/api/v1/analytics/timeline', { headers })
        ]);

        const sumData = await sumRes.json();
        const timeData = await timeRes.json();

        setSummary(sumData);
        setTimeline(Array.isArray(timeData) ? timeData : []);
      } catch (err) {
        console.error("Lỗi lấy thống kê:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const safeTimeline = timeline;
  const maxCount = Math.max(...safeTimeline.map(t => t.count), 5);

  // Mảng màu cho Pie Chart
  const colors = ['var(--accent)', 'var(--danger)', 'var(--success)', '#f59e0b', '#8b5cf6'];

  return (
    <div className="analytics-page-container" style={{ height: 'calc(100vh - 60px)', background: '#f8fafc', padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER: COMPACT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/dashboard" style={{ background: '#fff', padding: '10px', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-1px', margin: 0 }}>CENTRAL INTELLIGENCE</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Dữ liệu vận hành Casos thời gian thực.</p>
          </div>
        </div>

        <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 15px rgba(59, 130, 246, 0.2)' }}>
          <Download size={18} /> XUẤT BÁO CÁO
        </button>
      </div>

      {/* METRICS ROW: COMPACT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        {[
          { label: 'TỔNG SỰ CỐ', value: summary?.total_incidents || 0, icon: AlertCircle, color: 'var(--danger)' },
          { label: 'TRONG 24H QUA', value: summary?.recent_24h || 0, icon: Activity, color: '#f59e0b' },
          { label: 'SENSORS ACTIVE', value: summary?.active_cameras || 0, icon: Zap, color: 'var(--accent)' },
          { label: 'AI STATUS', value: 'OPTIMIZED', icon: Shield, color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#fff', padding: '15px 20px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.01)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <stat.icon size={18} color={stat.color} />
               <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: stat.color }}></div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 950, color: '#1e293b', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800, marginTop: '5px', letterSpacing: '0.5px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CHARTS GRID: FITS VIEWPORT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* LINE CHART: TRENDS */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '28px', boxShadow: '0 5px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} color="var(--accent)" /> XU HƯỚNG 7 NGÀY
          </h3>
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '10px 0' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
               <defs>
                 <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                   <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                 </linearGradient>
               </defs>
               {safeTimeline.length > 1 && (
                 <>
                   <path 
                     d={`M 0 100% ${safeTimeline.map((item, i) => `L ${(i * (100 / (safeTimeline.length - 1)))}% ${100 - (item.count / maxCount * 80)}%`).join(' ')} L 100% 100% Z`}
                     fill="url(#lineGrad)"
                   />
                   <path 
                     d={`M 0 ${100 - (safeTimeline[0]?.count / maxCount * 80)}% ${safeTimeline.map((item, i) => `L ${(i * (100 / (safeTimeline.length - 1)))}% ${100 - (item.count / maxCount * 80)}%`).join(' ')}`}
                     fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                   />
                 </>
               )}
            </svg>
            
            <div style={{ position: 'absolute', bottom: '-5px', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
               {safeTimeline.map((item, i) => (
                 <div key={i} style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8' }}>{item._id.split('-')[2]}/{item._id.split('-')[1]}</div>
               ))}
            </div>
          </div>
        </div>

        {/* PIE CHART: REAL CATEGORIES */}
        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '28px', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={18} color="var(--success)" /> PHÂN LOẠI THỰC TẾ
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '15px solid var(--accent)', borderRightColor: 'var(--danger)', borderBottomColor: 'var(--success)', transform: 'rotate(45deg)', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '0.7rem', fontWeight: 800 }}>LIVE DATA</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary?.categories && summary.categories.length > 0 ? summary.categories.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i % colors.length] }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{item.label}</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{Math.round(item.percent)}%</span>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>Chưa có dữ liệu phân loại...</div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
