"use client"

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Activity, Shield, Zap, AlertCircle, 
  Download, ArrowLeft, PieChart, Clock, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useDashboardSocket } from '@/hooks/useDashboardSocket';

interface IncidentCategory {
  label: string;
  count: number;
  percent: number;
}

interface SummaryData {
  total_incidents: number;
  recent_24h: number;
  today_incidents?: number;
  week_incidents?: number;
  month_incidents?: number;
  active_cameras: number;
  categories: IncidentCategory[];
  system_health: string;
}

interface TimelineItem {
  _id: string;
  count: number;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = session?.user ? (session.user as any).accessToken : '';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  const fetchData = async () => {
    if (!session?.user) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [sumRes, timeRes] = await Promise.all([
        fetch(`${apiBase}/analytics/summary`, { headers }),
        fetch(`${apiBase}/analytics/timeline`, { headers })
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

  useDashboardSocket(apiBase, token, undefined, () => {
    fetchData();
  });

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const safeTimeline = timeline;
  const maxCount = Math.max(...safeTimeline.map(t => t.count), 5);

  // Mảng màu cho Pie Chart
  const colors = ['var(--accent)', 'var(--danger)', 'var(--success)', '#f59e0b', '#8b5cf6'];

  return (
    <div className="analytics-page-container" style={{ height: 'calc(100vh - 60px)', background: 'transparent', padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER: COMPACT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="page-header-premium" style={{ marginBottom: '0' }}>
            <div>
              <h1 className="page-title-premium">CENTRAL INTELLIGENCE</h1>
              <p className="page-subtitle-premium" style={{ fontSize: '0.85rem' }}>Dữ liệu vận hành Casos thời gian thực.</p>
            </div>
          </div>
        </div>

        <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 15px rgba(59, 130, 246, 0.2)' }}>
          <Download size={18} /> XUẤT BÁO CÁO
        </button>
      </div>

      {/* METRICS ROW: COMPACT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {[
          { label: 'TỔNG SỰ CỐ', value: summary?.total_incidents || 0, icon: AlertCircle, color: 'var(--danger)' },
          { label: 'TRONG NGÀY', value: summary?.today_incidents ?? summary?.recent_24h ?? 0, icon: Clock, color: '#f59e0b' },
          { label: 'TRONG TUẦN', value: summary?.week_incidents ?? 0, icon: TrendingUp, color: 'var(--accent)' },
          { label: 'TRONG THÁNG', value: summary?.month_incidents ?? 0, icon: Calendar, color: '#8b5cf6' },
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
      <div className="responsive-grid-analytics" style={{ flex: 1, minHeight: 0 }}>
        
        {/* LINE CHART: TRENDS */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '28px', boxShadow: '0 5px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} color="var(--accent)" /> XU HƯỚNG 7 NGÀY
          </h3>
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '20px 0 10px' }}>
            {(() => {
              const points = safeTimeline.map((item, i) => {
                const x = safeTimeline.length > 1 ? (i * (500 / (safeTimeline.length - 1))) : 250;
                const y = 200 - (item.count / maxCount * 130) - 30; // y scales from 40 to 170
                return { x, y, count: item.count, date: item._id };
              });

              const pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
              const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z` : '';

              const gridLines = [
                { y: 40, label: `${Math.round(maxCount)}` },
                { y: 105, label: `${Math.round(maxCount / 2)}` },
                { y: 170, label: '0' }
              ];

              const formatDate = (dateStr: string) => {
                if (!dateStr) return '';
                const parts = dateStr.split('-');
                if (parts.length >= 3) {
                  return `${parts[2]}/${parts[1]}`;
                }
                return dateStr;
              };

              return (
                <>
                  <svg viewBox="0 0 500 200" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Horizontal Gridlines */}
                    {gridLines.map((line, i) => (
                      <g key={i}>
                        <line x1="0" y1={line.y} x2="500" y2={line.y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="6 6" />
                        <text x="5" y={line.y - 6} style={{ fill: '#cbd5e1', fontSize: '0.6rem', fontWeight: 900 }}>{line.label}</text>
                      </g>
                    ))}

                    {/* Chart Paths */}
                    {points.length > 0 && (
                      <>
                        <path d={areaD} fill="url(#lineGrad)" />
                        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Data Points and Tooltips */}
                        {points.map((pt, i) => (
                          <g key={i} className="chart-dot-group" style={{ cursor: 'pointer' }}>
                            {/* Outer Glow */}
                            <circle cx={pt.x} cy={pt.y} r="8" fill="var(--accent)" opacity="0.15" />
                            {/* Inner Circle */}
                            <circle cx={pt.x} cy={pt.y} r="4.5" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
                            {/* Value Tooltip Label */}
                            <text x={pt.x} y={pt.y - 12} textAnchor="middle" style={{ fill: 'var(--accent)', fontSize: '0.7rem', fontWeight: 950 }}>
                              {pt.count}
                            </text>
                          </g>
                        ))}
                      </>
                    )}
                  </svg>

                  <div style={{ position: 'absolute', bottom: '-5px', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    {safeTimeline.map((item, i) => (
                      <div key={i} style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8' }}>
                        {formatDate(item._id)}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* PIE CHART: REAL CATEGORIES */}
        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '28px', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={18} color="var(--success)" /> PHÂN LOẠI THỰC TẾ
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(() => {
              const categories = summary?.categories || [];
              if (categories.length === 0) {
                return (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '15px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>NO DATA</div>
                  </div>
                );
              }

              const radius = 35;
              const strokeWidth = 10;
              const circumference = 2 * Math.PI * radius;
              let accumulatedPercent = 0;

              return (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
                  <svg width="120" height="120" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                    {/* Background track circle */}
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#334155" strokeWidth={strokeWidth} />
                    {/* Segment loops */}
                    {categories.map((item, i) => {
                      const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = `${-(accumulatedPercent / 100) * circumference}`;
                      accumulatedPercent += item.percent;

                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke={colors[i % colors.length]}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      );
                    })}
                    <text x="50" y="53" textAnchor="middle" style={{ fill: '#fff', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                      LIVE DATA
                    </text>
                  </svg>
                </div>
              );
            })()}

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
