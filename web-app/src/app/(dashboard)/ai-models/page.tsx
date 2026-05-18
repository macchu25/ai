"use client"

import { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, ShieldCheck, Terminal, Layers, BarChart, Server, Play, Pause, RefreshCw, Loader2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from '@/app/context/NotificationContext';

export default function AIModelsPage() {
  const { data: session, status } = useSession();
  const { showToast } = useNotification();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchModels();
    }
  }, [status]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const token = (session?.user as any)?.accessToken;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/ai-models`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error("Fetch models error:", err);
      showToast("Không thể kết nối tới máy chủ AI.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = async (id: string) => {
    setTogglingId(id);
    try {
      const token = (session?.user as any)?.accessToken;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/ai-models/${id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Đã chuyển trạng thái sang: ${data.new_status}`, "success");
        fetchModels();
      }
    } catch (err) {
      showToast("Lỗi khi thay đổi trạng thái model.", "error");
    } finally {
      setTogglingId(null);
    }
  };



  if (!mounted) return null;

  return (
    <div style={{ padding: '20px 30px 40px 30px', minHeight: 'calc(100vh - 80px)', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Trung Tâm AI Core</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
          Quản lý và giám sát hiệu năng của các mô hình trí tuệ nhân tạo đang hoạt động.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Models Table */}
          <div className="overview-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <Layers size={22} color="var(--accent)" /> Danh sách Model
               </h2>
               <button 
                  onClick={fetchModels}
                  disabled={loading}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Quét lại
                </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'rgba(241, 245, 249, 0.4)' }}>
                    <th style={{ padding: '16px 32px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>MODEL NAME</th>
                    <th style={{ padding: '16px 32px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '16px 32px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRECISION</th>
                    <th style={{ padding: '16px 32px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>LATENCY</th>
                    <th style={{ padding: '16px 32px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && models.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                        <div>Đang kết nối tới AI Cluster...</div>
                      </td>
                    </tr>
                  ) : models.map((model) => (
                    <tr key={model._id || model.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', opacity: togglingId === (model._id || model.id) ? 0.6 : 1 }}>
                      <td style={{ padding: '24px 32px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>{model.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>v{model.version} • {model.type}</div>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <span style={{ 
                          background: model.status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                          color: model.status === 'Active' ? 'var(--success)' : 'var(--text-muted)',
                          padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700
                        }}>
                          {model.status}
                        </span>
                      </td>
                      <td style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--text-main)' }}>{model.precision}</td>
                      <td style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--text-main)' }}>{model.latency || model.speed}</td>
                      <td style={{ padding: '24px 32px' }}>
                        <button 
                          onClick={() => toggleModel(model._id || model.id)}
                          disabled={togglingId === (model._id || model.id)}
                          style={{ 
                            background: model.status === 'Active' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(37, 99, 235, 0.05)',
                            color: model.status === 'Active' ? 'var(--danger)' : 'var(--accent)',
                            border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                          }}>
                          {togglingId === (model._id || model.id) ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            model.status === 'Active' ? <Pause size={18} /> : <Play size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Activity Log */}
          <div className="overview-card" style={{ padding: '0', background: '#0f172a', border: 'none' }}>
             <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <Terminal size={18} color="#94a3b8" />
               <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Inference Engine Logs</span>
               <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
               </div>
             </div>
             <div style={{ padding: '24px', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', color: '#94a3b8', height: '240px', overflowY: 'auto' }}>
               <div style={{ color: '#27c93f' }}>[INFO] 20:56:42 - Falling Detection Engine v2.1.0 started successfully.</div>
               <div>[DEBUG] 20:56:43 - Loading CUDA dynamic libraries...</div>
               <div>[DEBUG] 20:56:45 - GPU Device 0: NVIDIA GeForce RTX 3080 detected.</div>
               <div style={{ color: '#38bdf8' }}>[PROCESS] 20:56:46 - Warm-up completed. Current Latency: 12ms</div>
               <div>[INFO] 20:56:50 - Monitoring 4 active MJPEG streams...</div>
               <div>[INFO] 20:56:55 - Frame analyzer: No abnormal activity detected in Zone A.</div>
               <div style={{ color: '#fbbf24' }}>[WARN] 20:57:01 - Low light detected in Camera #2. Adjusting contrast.</div>
               <div style={{ borderLeft: '2px solid #334155', paddingLeft: '12px', marginTop: '12px' }}>
                 $ tail -f /var/log/casos/ai-core.log<br />
                 <span style={{ color: '#f1f5f9' }}>Waiting for incoming frame events...</span>
               </div>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Performance Stats */}
          <div className="overview-card">
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart size={20} color="var(--accent)" /> Hardware Stats
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                   <span>GPU Utilization</span>
                   <span style={{ color: 'var(--accent)' }}>64%</span>
                 </div>
                 <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden' }}>
                   <div style={{ width: '64%', height: '100%', background: 'var(--accent)', borderRadius: '10px' }}></div>
                 </div>
               </div>

               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                   <span>VRAM Usage</span>
                   <span style={{ color: 'var(--warning)' }}>4.2 / 8 GB</span>
                 </div>
                 <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden' }}>
                   <div style={{ width: '52%', height: '100%', background: 'var(--warning)', borderRadius: '10px' }}></div>
                 </div>
               </div>

               <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>TEMPERATURE</div>
                   <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>62°C</div>
                 </div>
                 <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>FPS AVG</div>
                   <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>60.2</div>
                 </div>
               </div>
            </div>
          </div>



          {/* Infrastructure Card */}
          <div style={{ background: 'var(--text-main)', color: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Server size={22} color="#38bdf8" /> Cluster Status
             </h3>
             <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
               Hệ thống đang chạy trên cụm Edge Computing phân tán. Tự động chuyển vùng khi node bị lỗi.
             </p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px' }}>
                <ShieldCheck size={20} color="#27c93f" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>End-to-End Encrypted</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
