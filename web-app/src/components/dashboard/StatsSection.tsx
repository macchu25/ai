import React, { useEffect, useState } from 'react';
import { FileBarChart, UserCheck, Clock, TrendingUp, Download, Shield, Activity, Zap } from 'lucide-react';

interface SummaryData {
  total_incidents: number;
  recent_24h: number;
  active_cameras: number;
  total_users: number;
  system_health: string;
}

interface TimelineItem {
  _id: string; // Date string
  count: number;
}

const StatsSection: React.FC = () => {
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const maxCount = Math.max(...safeTimeline.map(t => t.count), 5);

  return (
    <div id="bao-cao" className="dashboard-section" style={{ background: 'transparent', padding: '100px 50px', border: 'none' }}>
      
      {/* HEADER HUD STYLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', padding: '0 20px' }}>
        <div className="hero-title-wrap" style={{ padding: 0 }}>
          <h2 style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Analytics Engine //
          </h2>
          <h1 style={{ fontSize: '2.8rem', color: '#1e293b', fontWeight: 950, letterSpacing: '-1.5px', margin: 0, textTransform: 'uppercase' }}>
            DỮ LIỆU <span style={{ color: 'var(--accent)' }}>HỆ THỐNG</span>
          </h1>
        </div>
        
        <button 
          className="btn-export-premium" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--accent)',
            padding: '14px 28px',
            borderRadius: '100px',
            border: '2px solid var(--accent)',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.boxShadow = '0 0 20px var(--accent)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Download size={18} /> Export Intel (PDF)
        </button>
      </div>

      {/* METRIC GRID HUD STYLE */}
      <div className="widget-grid-container" style={{ position: 'relative', height: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '20px' }}>
        
        <div className="widget" style={{ position: 'relative', width: '100%', padding: '30px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <div className="metric-label">Total Incidents</div>
              <div className="metric-value" style={{ fontSize: '2.5rem', color: 'var(--danger)' }}>{summary?.total_incidents || 0}</div>
            </div>
            <div className="icon-badge danger">
              <Activity size={20} color="var(--danger)" />
            </div>
          </div>
          <div style={{ marginTop: '20px', height: '40px', width: '100%', opacity: 0.5 }}>
             <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                <path d="M0,10 L20,10 L30,2 L40,18 L50,10 L100,10" fill="none" stroke="var(--danger)" strokeWidth="2" />
             </svg>
          </div>
        </div>

        <div className="widget" style={{ position: 'relative', width: '100%', padding: '30px', animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <div className="metric-label">Active Sensors</div>
              <div className="metric-value" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>{summary?.active_cameras || 0}</div>
            </div>
            <div className="icon-badge primary">
              <Zap size={20} color="var(--accent)" />
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '4px' }}>
            {[1,1,1,1,1,1,1,1,0,0].map((v, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '2px', background: v ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}></div>
            ))}
          </div>
        </div>

        <div className="widget" style={{ position: 'relative', width: '100%', padding: '30px', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <div className="metric-label">AI Accuracy</div>
              <div className="metric-value" style={{ fontSize: '2.5rem', color: 'var(--success)' }}>98.2<span style={{ fontSize: '1rem' }}>%</span></div>
            </div>
            <div className="icon-badge success">
              <Shield size={20} color="var(--success)" />
            </div>
          </div>
          <div className="metric-label" style={{ marginTop: '10px', fontSize: '0.7rem' }}>Neural Engine: Optimized</div>
        </div>

      </div>

      {/* TIMELINE CHART HUD STYLE */}
      <div className="widget" style={{ margin: '20px', width: 'calc(100% - 40px)', padding: '40px', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <TrendingUp size={20} color="var(--accent)" />
            <span className="metric-label" style={{ letterSpacing: '3px' }}>Incident Timeline (7D)</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Real-time Sync: Active</div>
        </div>

        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {safeTimeline.length > 0 ? safeTimeline.map((item, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', height: '100%', justifyContent: 'flex-end' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${(item.count / maxCount) * 100}%`, 
                  minHeight: '4px',
                  background: item.count > 0 ? 'var(--danger)' : 'var(--accent)', 
                  borderRadius: '4px',
                  boxShadow: item.count > 0 ? '0 0 15px var(--danger)' : '0 0 10px var(--accent)',
                  opacity: 0.8,
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative'
                }}
              >
                {item.count > 0 && (
                  <div style={{ position: 'absolute', top: '-30px', width: '100%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 900, color: 'var(--danger)' }}>
                    {item.count}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                {item._id.split('-').slice(2).join('/')}.{item._id.split('-')[1]}
              </div>
            </div>
          )) : (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.9rem', letterSpacing: '2px' }}>
                SYSTEM_SCANNING_DATA...
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsSection);
