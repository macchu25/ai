"use client"

import { useState, useEffect } from 'react';
import { HeartPulse, Activity, AlertCircle, Shield, Info, CheckCircle, RefreshCw, AlertTriangle, ExternalLink, Sun, Moon, Sliders, Sparkles, Wind } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from '@/app/context/NotificationContext';

interface LightingStats {
  mean_brightness: number;
  std_contrast: number;
  warning: string | null;
  status: 'excellent' | 'low_light' | 'too_bright' | 'uneven_light' | 'no_face' | 'warming_up';
  has_face: boolean;
  fps: number;
  rppg_enabled?: boolean;
  pain_enabled?: boolean;
  pain_score?: number;
  heart_rate?: number;
  respiration_rate?: number;
}

export default function RPPGPage() {
  const { data: session, status } = useSession();
  const { showToast } = useNotification();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastBpm, setLastBpm] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [streamUrl, setStreamUrl] = useState("http://localhost:5001/video_feed");
  const [lightingStats, setLightingStats] = useState<LightingStats | null>(null);
  const [rppgEnabled, setRppgEnabled] = useState(true);
  const [painEnabled, setPainEnabled] = useState(true);
  const [respirationRate, setRespirationRate] = useState<number | null>(null);
  
  const [activeModal, setActiveModal] = useState<'heart' | 'respiration' | null>(null);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [respirationRateHistory, setRespirationRateHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!rppgEnabled || !isConnected) {
      setHeartRateHistory([]);
      setRespirationRateHistory([]);
    }
  }, [rppgEnabled, isConnected]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      checkConnection();
    }
  }, [status]);

  // Periodically check if the rPPG streaming service is online
  const checkConnection = async () => {
    setChecking(true);
    try {
      // Try to fetch image metadata or just do a ping to port 5001 (or direct image check)
      const res = await fetch("http://localhost:5001/video_feed", { method: 'HEAD', mode: 'no-cors' });
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Periodically fetch lighting stats from the Python stream server
  useEffect(() => {
    if (!isConnected) {
      setLightingStats(null);
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5001/lighting_stats");
        if (res.ok) {
          const data = await res.json();
          setLightingStats(data);
          if (data.rppg_enabled !== undefined) setRppgEnabled(data.rppg_enabled);
          if (data.pain_enabled !== undefined) setPainEnabled(data.pain_enabled);
          
          if (data.respiration_rate !== undefined) {
            setRespirationRate(data.respiration_rate);
            if (data.rppg_enabled && data.respiration_rate !== null) {
              setRespirationRateHistory(prev => {
                const next = [...prev, data.respiration_rate];
                return next.slice(-40); // Keep last 40 entries
              });
            }
          }
          
          if (data.heart_rate !== undefined) {
            if (data.rppg_enabled && data.heart_rate > 0) {
              setHeartRateHistory(prev => {
                const next = [...prev, data.heart_rate];
                return next.slice(-40); // Keep last 40 entries
              });
            }
          }
        }
      } catch (err) {
        // Silently handle errors since checkConnection handles connection states
      }
    };

    // Initial fetch
    fetchStats();
    
    // Poll every 500ms
    const interval = setInterval(fetchStats, 500);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Fetch last recorded heart rate from backend incidents/events
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const fetchLastHeartRate = async () => {
      try {
        const token = (session?.user as any)?.accessToken;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        
        // Fetch camera events to find the latest rPPG push
        const res = await fetch(`${apiBase}/incidents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const events = await res.json();
          // Filter for rPPG labels
          const rppgEvents = events.filter((e: any) => e.label && e.label.includes("rPPG:"));
          if (rppgEvents.length > 0) {
            // Sort by time descending
            rppgEvents.sort((a: any, b: any) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
            const latestLabel = rppgEvents[0].label; // e.g. "rPPG: 72.5 BPM"
            const bpmMatch = latestLabel.match(/rPPG:\s*([\d.]+)/);
            if (bpmMatch && bpmMatch[1]) {
              setLastBpm(parseFloat(bpmMatch[1]));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest BVP event:", err);
      }
    };
    
    fetchLastHeartRate();
    const interval = setInterval(fetchLastHeartRate, 4000);
    return () => clearInterval(interval);
  }, [status, session]);

  if (!mounted) return null;

  // Renders a custom premium SVG line chart for vital signs history in medical monitor style
  const renderMiniChart = (history: number[], isHeart: boolean) => {
    if (history.length < 2) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Activity size={18} className="animate-pulse" style={{ marginRight: '8px' }} />
          Đang tích lũy chuỗi dữ liệu... (Cần tối thiểu 2 kết quả)
        </div>
      );
    }

    const minVal = Math.max(0, Math.min(...history) - 3);
    const maxVal = Math.max(minVal + 10, Math.max(...history) + 3);
    const width = 500;
    const height = 220;
    const padding = 20;

    const points = history.map((val, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
      return { x, y, val };
    });

    const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const strokeColor = isHeart ? '#00ff66' : '#00d2ff';
    const glowFilterId = isHeart ? 'heartMedicalGlow' : 'respMedicalGlow';

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Medical Oscilloscope/ECG Grid Paper Background */}
        <g opacity="0.08">
          {/* Horizontal lines */}
          {Array.from({ length: 11 }).map((_, i) => {
            const y = padding + (i / 10) * (height - 2 * padding);
            return <line key={`h-${i}`} x1={padding} y1={y} x2={width - padding} y2={y} stroke={strokeColor} strokeWidth="1" />;
          })}
          {/* Vertical lines */}
          {Array.from({ length: 21 }).map((_, i) => {
            const x = padding + (i / 20) * (width - 2 * padding);
            return <line key={`v-${i}`} x1={x} y1={padding} x2={x} y2={height - padding} stroke={strokeColor} strokeWidth="1" />;
          })}
        </g>

        {/* Y Axis text labels */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - 2 * padding);
          const val = maxVal - ratio * (maxVal - minVal);
          return (
            <text key={idx} x={padding - 6} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="monospace" opacity="0.5">
              {val.toFixed(0)}
            </text>
          );
        })}

        {/* Glow Line stroke (Backing blur) */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowFilterId})`} style={{ opacity: 0.4 }} />

        {/* Clear sharp Line stroke (Foreground) */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Glowing bedside monitor sweep active point */}
        {points.length > 0 && (
          <g>
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill={strokeColor} filter={`url(#${glowFilterId})`} />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="10" fill="none" stroke={strokeColor} strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${points[points.length - 1].x}px ${points[points.length - 1].y}px` }} />
          </g>
        )}
      </svg>
    );
  };


  // Vitals & Pain Detector values
  const currentBpm = (isConnected && lightingStats && lightingStats.heart_rate && lightingStats.heart_rate > 0)
    ? lightingStats.heart_rate
    : lastBpm;

  const painScore = (isConnected && lightingStats && lightingStats.pain_score !== undefined)
    ? lightingStats.pain_score
    : 0;

  const painPercent = Math.min(100, Math.max(0, (painScore / 6) * 100));

  let painColor = 'var(--text-muted)';
  let painStatusText = 'Không hoạt động';
  let painDesc = 'Vui lòng bật mô hình AI nhận diện đau đớn để phân tích.';

  if (isConnected && lightingStats && painEnabled) {
    if (painScore < 1.5) {
      painColor = '#10b981'; // Green
      painStatusText = 'Bình thường';
      painDesc = 'Không phát hiện biểu cảm đau đớn trên khuôn mặt.';
    } else if (painScore < 3.5) {
      painColor = '#f59e0b'; // Amber
      painStatusText = 'Đau nhẹ / Khó chịu';
      painDesc = 'Phát hiện biểu cảm nhíu mày hoặc căng thẳng nhẹ.';
    } else {
      painColor = '#ef4444'; // Red
      painStatusText = 'Đau dữ dội';
      painDesc = 'CẢNH BÁO: Phát hiện biểu cảm đau đớn rõ rệt. Đã gửi cảnh báo về hệ thống.';
    }
  }

  // Lighting calibration helper values
  const mean = lightingStats ? lightingStats.mean_brightness : 0;
  const meanPercent = Math.min(100, Math.max(0, (mean / 255) * 100));
  let brightnessColor = 'var(--text-muted)';
  let brightnessStatusText = 'Offline';

  if (lightingStats) {
    if (mean < 55) {
      brightnessColor = '#f59e0b'; // Amber
      brightnessStatusText = 'Quá tối';
    } else if (mean > 220) {
      brightnessColor = '#ef4444'; // Red
      brightnessStatusText = 'Quá chói';
    } else {
      brightnessColor = '#10b981'; // Green
      brightnessStatusText = 'Tối ưu';
    }
  }

  const std = lightingStats ? lightingStats.std_contrast : 0;
  const stdPercent = Math.min(100, Math.max(0, (std / 100) * 100));
  let contrastColor = 'var(--text-muted)';
  let contrastStatusText = 'Offline';

  if (lightingStats) {
    if (std > 55) {
      contrastColor = '#f59e0b'; // Amber
      contrastStatusText = 'Lệch sáng';
    } else {
      contrastColor = '#10b981'; // Green
      contrastStatusText = 'Đều sáng';
    }
  }

  let statusBannerBg = 'rgba(255,255,255,0.03)';
  let statusBannerBorder = 'rgba(255,255,255,0.08)';
  let statusTitle = 'Đang chờ kết nối';
  let statusDesc = 'Vui lòng khởi chạy script rppg_inference.py trên máy tính giám sát của bạn để đồng bộ dữ liệu.';
  let StatusIcon = Activity;
  let statusColor = 'var(--text-muted)';

  if (isConnected) {
    if (!lightingStats) {
      statusBannerBg = 'rgba(59, 130, 246, 0.08)';
      statusBannerBorder = 'rgba(59, 130, 246, 0.2)';
      statusTitle = 'Đang kết nối API...';
      statusDesc = 'Đang đồng bộ luồng thông số phân tích ánh sáng.';
      StatusIcon = RefreshCw;
      statusColor = 'var(--accent)';
    } else {
      switch (lightingStats.status) {
        case 'warming_up':
          statusBannerBg = 'rgba(245, 158, 11, 0.08)';
          statusBannerBorder = 'rgba(245, 158, 11, 0.2)';
          statusTitle = 'Đang Khởi Động Cảm Biến';
          statusDesc = 'Camera đang tự động điều chỉnh phơi sáng và cân bằng trắng (khoảng 2 giây).';
          StatusIcon = RefreshCw;
          statusColor = '#f59e0b';
          break;
        case 'no_face':
          statusBannerBg = 'rgba(239, 68, 68, 0.08)';
          statusBannerBorder = 'rgba(239, 68, 68, 0.2)';
          statusTitle = 'Không Tìm Thấy Mặt';
          statusDesc = 'Vui lòng di chuyển khuôn mặt vào giữa khung hình camera và ngồi thẳng.';
          StatusIcon = AlertCircle;
          statusColor = '#ef4444';
          break;
        case 'low_light':
          statusBannerBg = 'rgba(245, 158, 11, 0.08)';
          statusBannerBorder = 'rgba(245, 158, 11, 0.2)';
          statusTitle = 'Ánh Sáng Quá Tối';
          statusDesc = 'Độ sáng mặt quá thấp (< 55). Hãy bật thêm đèn phòng hoặc hướng mặt về nguồn sáng chính.';
          StatusIcon = Moon;
          statusColor = '#f59e0b';
          break;
        case 'too_bright':
          statusBannerBg = 'rgba(239, 68, 68, 0.08)';
          statusBannerBorder = 'rgba(239, 68, 68, 0.2)';
          statusTitle = 'Ánh Sáng Quá Chói';
          statusDesc = 'Mặt bị lóa sáng (> 220). Hãy giảm độ sáng đèn hoặc khép rèm cửa nếu bị ngược nắng.';
          StatusIcon = Sun;
          statusColor = '#ef4444';
          break;
        case 'uneven_light':
          statusBannerBg = 'rgba(245, 158, 11, 0.08)';
          statusBannerBorder = 'rgba(245, 158, 11, 0.2)';
          statusTitle = 'Ánh Sáng Không Đều';
          statusDesc = 'Mặt bị đổ bóng hoặc bị đèn chiếu lệch một bên. Hãy điều chỉnh nguồn sáng trực diện khuôn mặt.';
          StatusIcon = Sliders;
          statusColor = '#f59e0b';
          break;
        case 'excellent':
          statusBannerBg = 'rgba(16, 185, 129, 0.08)';
          statusBannerBorder = 'rgba(16, 185, 129, 0.2)';
          statusTitle = 'Ánh Sáng Hoàn Hảo';
          statusDesc = 'Độ sáng và tương phản đạt chuẩn tối ưu. Kết quả nhịp tim sẽ chính xác nhất.';
          StatusIcon = CheckCircle;
          statusColor = '#10b981';
          break;
      }
    }
  }

  return (
    <div style={{ padding: '20px 30px 40px 30px', minHeight: 'calc(100vh - 80px)', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HeartPulse size={36} className="heart-icon animate-pulse-custom" /> Đo Nhịp Tim Không Tiếp Xúc (rPPG)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
          Theo dõi nhịp tim và hoạt động tim mạch thông qua phân tích biến đổi tuần hoàn máu trên khuôn mặt bằng camera.
        </p>
      </header>

      <div className="responsive-grid-2col-sidebar">
        
        {/* Left Column: Live Feed & Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Stream Player */}
          <div className="overview-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="var(--accent)" /> Live Stream Phân Tích
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`status-badge ${isConnected ? 'active' : 'inactive'}`}>
                  {isConnected ? '● Connected' : '○ Disconnected'}
                </span>
                <button 
                  onClick={checkConnection} 
                  disabled={checking}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Kiểm tra lại
                </button>
              </div>
            </div>

            {/* Video Container */}
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              background: '#090d16',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: '1px solid var(--border)'
            }}>
              {isConnected ? (
                <img 
                  src={streamUrl} 
                  alt="rPPG Live Feed" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setIsConnected(false)}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: '16px', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Chưa kết nối với dịch vụ rPPG</h3>
                  <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                    Vui lòng khởi chạy script <code>rppg_inference.py</code> trên thiết bị giám sát của bạn để bắt đầu phân tích nhịp tim.
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.8rem', display: 'inline-block', border: '1px solid rgba(255,255,255,0.05)' }}>
                    python rppg_inference.py --source 0
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historical BPM Event Log */}
          <div className="overview-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} color="var(--accent)" /> Lưu ý bảo mật & quy trình đo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Không tiếp xúc cơ thể:</strong> Thuật toán sử dụng camera thu nhận biến đổi hấp thụ quang học (RGB) trên mao mạch dưới da, hoàn toàn bảo vệ làn da của người dùng.</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Xử lý cục bộ bảo mật:</strong> Dữ liệu video camera được phân tích trực tiếp trên hệ thống AI của bạn và không tải lên máy chủ cloud công cộng để bảo vệ hình ảnh riêng tư.</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span><strong>Chu kỳ 10 giây:</strong> Hệ thống cần tối thiểu 10 giây ghi nhận nhịp đập liên tục ổn định để tính toán chính xác tần số xung nhịp tim.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Statistics & Setup Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Pulse Widget */}
          <div 
            className="overview-card hover-glow" 
            onClick={() => isConnected && lightingStats && rppgEnabled && setActiveModal('heart')}
            style={{ 
              padding: '32px', 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)', 
              border: '1px solid rgba(16, 185, 129, 0.15)',
              cursor: isConnected && lightingStats && rppgEnabled ? 'pointer' : 'default',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
              NHỊP TIM HIỆN TẠI (AVG)
              {isConnected && lightingStats && rppgEnabled && <ExternalLink size={12} style={{ opacity: 0.6 }} />}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-2px', lineHeight: 1 }}>
                {isConnected && lightingStats && !rppgEnabled 
                  ? 'OFF' 
                  : (currentBpm ? currentBpm.toFixed(1) : '--')}
              </span>
              {!(isConnected && lightingStats && !rppgEnabled) && (
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'flex-end', marginBottom: '12px' }}>
                  BPM
                </span>
              )}
            </div>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <HeartPulse size={14} className={isConnected && lightingStats && !rppgEnabled ? '' : (currentBpm ? 'animate-heartbeat' : '')} style={{ color: isConnected && lightingStats && !rppgEnabled ? 'var(--text-muted)' : 'var(--danger)' }} />
              {isConnected && lightingStats && !rppgEnabled 
                ? 'Mô hình đo nhịp tim đang tắt' 
                : (currentBpm ? 'Tín hiệu tim mạch tốt' : 'Đang chờ luồng dữ liệu...')}
            </div>
          </div>

          {/* Respiration Widget */}
          <div 
            className="overview-card hover-glow" 
            onClick={() => isConnected && lightingStats && rppgEnabled && setActiveModal('respiration')}
            style={{ 
              padding: '32px', 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)', 
              border: '1px solid rgba(59, 130, 246, 0.15)',
              cursor: isConnected && lightingStats && rppgEnabled ? 'pointer' : 'default',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
              NHỊP THỞ HIỆN TẠI (RESP)
              {isConnected && lightingStats && rppgEnabled && <ExternalLink size={12} style={{ opacity: 0.6 }} />}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-2px', lineHeight: 1 }}>
                {isConnected && lightingStats && !rppgEnabled 
                  ? 'OFF' 
                  : (respirationRate !== null && respirationRate !== undefined 
                      ? (respirationRate === 0 ? '0.0' : respirationRate.toFixed(1)) 
                      : '--')}
              </span>
              {!(isConnected && lightingStats && !rppgEnabled) && (
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'flex-end', marginBottom: '12px' }}>
                  RPM
                </span>
              )}
            </div>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Wind size={14} className={isConnected && lightingStats && !rppgEnabled ? '' : (respirationRate ? 'animate-pulse' : '')} style={{ color: isConnected && lightingStats && !rppgEnabled ? 'var(--text-muted)' : 'var(--accent)' }} />
              {isConnected && lightingStats && !rppgEnabled 
                ? 'Mô hình đo nhịp tim đang tắt' 
                : (respirationRate !== null && respirationRate !== undefined 
                    ? (respirationRate === 0 ? 'Đang nín thở / Đứng yên' : 'Tín hiệu hô hấp tốt')
                    : 'Đang phân tích chuyển động ngực...')}
            </div>
          </div>

          {/* Pain Expression Widget */}
          <div className="overview-card" style={{
            padding: '24px',
            background: isConnected && lightingStats && painEnabled && painScore >= 3.5
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)'
              : 'var(--bg-primary)',
            border: isConnected && lightingStats && painEnabled && painScore >= 3.5
              ? '1px solid rgba(239, 68, 68, 0.2)'
              : '1px solid var(--border)',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: painColor, display: 'block', marginBottom: '12px' }}>
              NHẬN DIỆN BIỂU CẢM ĐAU (PAIN)
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1px' }}>
                  {isConnected && lightingStats && painEnabled ? painScore.toFixed(1) : '--'}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  / 6
                </span>
              </div>
              <span style={{
                background: isConnected && lightingStats && painEnabled ? `${painColor}20` : 'rgba(255,255,255,0.06)',
                color: painColor,
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                {painStatusText}
              </span>
            </div>

            {/* Pain Meter Progress Bar */}
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                width: `${isConnected && lightingStats && painEnabled ? painPercent : 0}%`,
                height: '100%',
                background: painColor,
                borderRadius: '3px',
                transition: 'width 0.3s ease, background-color 0.3s ease'
              }} />
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {painDesc}
            </p>
          </div>

          {/* Lighting Calibration Widget */}
          <div className="overview-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={18} color="var(--accent)" /> Cân chỉnh ánh sáng
            </h3>

            {/* Status Alert Banner */}
            <div style={{
              background: statusBannerBg,
              border: `1px solid ${statusBannerBorder}`,
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
              transition: 'all 0.3s ease'
            }}>
              <StatusIcon size={24} style={{ color: statusColor, flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {statusTitle}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {statusDesc}
                </p>
              </div>
            </div>

            {/* Brightness Gauge */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Độ sáng khuôn mặt</span>
                <span style={{ color: brightnessColor, fontWeight: 700 }}>
                  {lightingStats ? `${mean.toFixed(1)} / 255 (${brightnessStatusText})` : '--'}
                </span>
              </div>
              
              {/* Progress Bar with Optimal Zone Marker */}
              <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Optimal zone background overlay */}
                <div style={{
                  position: 'absolute',
                  left: '21.5%', // 55 / 255 = 21.5%
                  width: '64.7%', // (220 - 55) / 255 = 64.7%
                  height: '100%',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderLeft: '1px dashed rgba(16, 185, 129, 0.3)',
                  borderRight: '1px dashed rgba(16, 185, 129, 0.3)',
                }} />
                {/* Real-time fill */}
                <div style={{
                  width: `${meanPercent}%`,
                  height: '100%',
                  background: brightnessColor,
                  borderRadius: '4px',
                  transition: 'width 0.2s ease, background-color 0.3s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>0 (Tối)</span>
                <span style={{ color: 'rgba(16, 185, 129, 0.7)' }}>Ngưỡng: 55 - 220</span>
                <span>255 (Chói)</span>
              </div>
            </div>

            {/* Contrast/Uniformity Gauge */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Độ lệch sáng (Bóng mặt)</span>
                <span style={{ color: contrastColor, fontWeight: 700 }}>
                  {lightingStats ? `${std.toFixed(1)} (${contrastStatusText})` : '--'}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Fill */}
                <div style={{
                  width: `${stdPercent}%`,
                  height: '100%',
                  background: contrastColor,
                  borderRadius: '4px',
                  transition: 'width 0.2s ease, background-color 0.3s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Đều sáng</span>
                <span style={{ color: 'rgba(16, 185, 129, 0.7)' }}>Yêu cầu: &lt; 55</span>
                <span>Bóng mặt lớn</span>
              </div>
            </div>

            {lightingStats && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <span>Tốc độ: <strong>{lightingStats.fps} FPS</strong></span>
                <span>Trạng thái: <strong>{lightingStats.has_face ? 'Đã nhận diện mặt' : 'Chưa nhận diện'}</strong></span>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="overview-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={18} color="var(--accent)" /> Hướng dẫn lấy dữ liệu
            </h3>
            <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.5' }}>
              <li>
                <strong>Căn chỉnh khuôn mặt:</strong> Giữ mặt ở trung tâm của khung hình camera. Đảm bảo hộp màu xanh lá cây định vị bao quanh khuôn mặt của bạn.
              </li>
              <li>
                <strong>Điều kiện ánh sáng:</strong> Tránh các luồng ánh sáng ngược quá mạnh hoặc bóng tối loang lổ trên mặt. Ánh sáng đều sẽ tối ưu hóa độ nhạy màu da.
              </li>
              <li>
                <strong>Ngăn chặn rung động:</strong> Ngồi thẳng và giữ đầu tương đối yên lặng trong vòng 10 giây đầu tiên để bộ đệm tích lũy đầy đủ dữ liệu.
              </li>
              <li>
                <strong>Chế độ nền:</strong> Script <code>rppg_inference.py</code> sẽ tự động cập nhật nhịp tim định kỳ lên dashboard mỗi 2 giây.
              </li>
            </ol>
          </div>

          {/* Developer Quick-Start */}
          <div className="overview-card" style={{ padding: '24px', background: '#0c0f17', border: 'none' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#eab308" /> Vận hành Edge Node
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Chạy lệnh này từ máy tính có camera liên kết để truyền kết quả nhịp tim trực tiếp lên màn hình:
            </p>
            <div style={{
              background: '#1e293b',
              padding: '12px',
              borderRadius: '8px',
              fontFamily: '"Fira Code", monospace',
              fontSize: '0.75rem',
              color: '#38bdf8',
              overflowX: 'auto',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '12px'
            }}>
              python rppg_inference.py --source 0 --camera_id {(session?.user as any)?.id || "YOUR_CAMERA_ID"}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Overlay for Detailed Charts */}
      {activeModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.25s ease-out'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div 
            style={{
              background: '#0d1321',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '640px',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.1)',
              position: 'relative',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              {activeModal === 'heart' ? (
                <>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                    <HeartPulse size={24} style={{ color: '#10b981' }} className="animate-heartbeat" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Biểu đồ Nhịp tim Chi tiết</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thời gian thực (40 điểm đo gần nhất)</p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                    <Wind size={24} style={{ color: '#3b82f6' }} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Biểu đồ Nhịp thở Chi tiết</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thời gian thực (40 điểm đo gần nhất)</p>
                  </div>
                </>
              )}
            </div>

            {/* Stats Cards */}
            <div className="responsive-grid-3col" style={{ marginBottom: '32px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Trung bình</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeModal === 'heart' 
                    ? (heartRateHistory.length > 0 ? (heartRateHistory.reduce((a, b) => a + b, 0) / heartRateHistory.length).toFixed(1) : '--')
                    : (respirationRateHistory.length > 0 ? (respirationRateHistory.reduce((a, b) => a + b, 0) / respirationRateHistory.length).toFixed(1) : '--')
                  }
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  {activeModal === 'heart' ? 'BPM' : 'RPM'}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cao nhất</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: activeModal === 'heart' ? '#10b981' : '#3b82f6' }}>
                  {activeModal === 'heart' 
                    ? (heartRateHistory.length > 0 ? Math.max(...heartRateHistory).toFixed(1) : '--')
                    : (respirationRateHistory.length > 0 ? Math.max(...respirationRateHistory).toFixed(1) : '--')
                  }
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  {activeModal === 'heart' ? 'BPM' : 'RPM'}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Thấp nhất</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: activeModal === 'heart' ? '#10b981' : '#3b82f6' }}>
                  {activeModal === 'heart' 
                    ? (heartRateHistory.length > 0 ? Math.min(...heartRateHistory).toFixed(1) : '--')
                    : (respirationRateHistory.length > 0 ? Math.min(...respirationRateHistory).toFixed(1) : '--')
                  }
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  {activeModal === 'heart' ? 'BPM' : 'RPM'}
                </span>
              </div>
            </div>

            {/* SVG Graph Container */}
            <div style={{ 
              background: '#090d16', 
              borderRadius: '20px', 
              padding: '24px 16px 16px 24px', 
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '24px',
              position: 'relative'
            }}>
              {renderMiniChart(activeModal === 'heart' ? heartRateHistory : respirationRateHistory, activeModal === 'heart')}
            </div>

            {/* Special Warnings / Status Footnote */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {activeModal === 'heart' ? (
                <>
                  <Activity size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>
                    <strong>Nhận xét:</strong> Nhịp tim được đo liên tục bằng công nghệ rPPG. Nếu nồng độ dao động quá mạnh, vui lòng điều chỉnh tư thế ngồi yên và kiểm tra lại ánh sáng.
                  </span>
                </>
              ) : (
                <>
                  <Wind size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
                  <span>
                    <strong>Nhận xét:</strong> Nhịp thở dựa trên biến thiên biên độ chuyển động của ngực. Nếu nín thở hoặc không có cử động thở, thông số sẽ tự động trả về <strong>0.0 RPM</strong>.
                  </span>
                </>
              )}
            </div>

            {/* Dynamic First-Aid instructions inside modals */}
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>
                <AlertCircle size={18} color="var(--danger)" />
                Hướng dẫn sơ cứu khẩn cấp chuyên khoa
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Khi gặp sự cố nhịp sinh tồn vượt ngưỡng hoặc có biểu hiện suy hô hấp, co giật, hãy kích hoạt ngay chế độ hướng dẫn giọng nói để hỗ trợ sơ cứu kịp thời.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                {activeModal === 'heart' ? (
                  <>
                    <button 
                      onClick={() => {
                        window.speechSynthesis?.cancel();
                        router.push('/cpr?type=hr_high');
                      }}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Nhịp Tim Nhanh (Tachycardia) 🩺
                    </button>
                    <button 
                      onClick={() => {
                        window.speechSynthesis?.cancel();
                        router.push('/cpr?type=hr_low');
                      }}
                      style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Nhịp Tim Chậm (Bradycardia) 🩺
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      window.speechSynthesis?.cancel();
                      router.push('/cpr?type=apnea');
                    }}
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    Ngừng Thở / Suy Hô Hấp (Apnea) 🩺
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        .status-badge {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 100px;
        }
        .status-badge.active {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
        }
        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        
        @keyframes pulse-custom {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.2); }
          28% { transform: scale(1); }
          42% { transform: scale(1.2); }
          70% { transform: scale(1); }
        }
        :global(.animate-pulse-custom) {
          animation: pulse-custom 2s infinite ease-in-out;
        }
        :global(.animate-heartbeat) {
          animation: heartbeat 1.2s infinite ease-in-out;
        }
        
        .hover-glow {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-glow:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.15);
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
