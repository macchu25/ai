"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, X, ShieldAlert, CheckCircle, Flame, AlertCircle, Activity, Loader2 } from 'lucide-react';
import { useNotification } from '@/app/context/NotificationContext';
import { useLanguage } from '@/app/context/LanguageContext';

interface Camera {
  id: string;
  name: string;
  location: string;
  rtsp_url: string;
  status: 'online' | 'offline';
}

interface WebcamTestModalProps {
  camera: Camera;
  onClose: () => void;
  token: string;
}

type AIState = 'normal' | 'fall' | 'hr_high' | 'hr_low' | 'apnea';

const WebcamTestModal: React.FC<WebcamTestModalProps> = ({ camera, onClose, token }) => {
  const { showToast } = useNotification();
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeState, setActiveState] = useState<AIState>('normal');
  const [confidence, setConfidence] = useState<number>(95);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [systemAlertActive, setSystemAlertActive] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: { 
          width: 640, 
          height: 480, 
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }) 
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      const activeTrack = mediaStream.getVideoTracks()[0];
      if (activeTrack) {
        const settings = activeTrack.getSettings();
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
      }
    } catch (err) {
      console.error('Lỗi truy cập webcam:', err);
      setHasPermission(false);
      showToast(t('incidents.toastWebcamAccessError'), 'error');
    }
  }, [showToast, t]);

  // Initialize camera stream
  useEffect(() => {
    startCamera();

    return () => {
      // Clean up camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Lỗi tự động phát video:', err);
      });
    }
  }, [stream, hasPermission]);

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    await startCamera(deviceId);
  };

  const handleSendSignal = async () => {
    setIsSubmitting(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    // Mapping state labels for backend
    const labelMapping: Record<AIState, string> = {
      normal: 'normal',
      fall: 'fall',
      hr_high: 'rPPG: 135.0 BPM | Resp: 16.0 RPM',
      hr_low: 'rPPG: 35.0 BPM | Resp: 16.0 RPM',
      apnea: 'rPPG: 70.0 BPM | Resp: 0.0 RPM'
    };

    try {
      const res = await fetch(`${apiBase}/cameras/${camera.id}/simulate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          label: labelMapping[activeState],
          confidence: confidence / 100
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(t('incidents.toastSignalSuccess').replace('{state}', activeState.toUpperCase()), 'success');
        if (activeState !== 'normal') {
          setSystemAlertActive(true);
        } else {
          setSystemAlertActive(false);
        }
      } else {
        showToast(data.error || t('incidents.toastSignalFailed'), 'error');
      }
    } catch (err) {
      showToast(t('incidents.toastConnError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  // Status visual attributes
  const stateConfig = {
    normal: {
      color: '#10b981',
      text: t('incidents.webcamNormal'),
      borderClass: 'border-emerald',
      bgGlow: 'rgba(16, 185, 129, 0.1)',
      icon: <CheckCircle className="text-emerald-400" size={16} />
    },
    fall: {
      color: '#ef4444',
      text: t('incidents.webcamFall'),
      borderClass: 'border-red-flash',
      bgGlow: 'rgba(239, 68, 68, 0.25)',
      icon: <ShieldAlert className="text-red-400" size={16} />
    },
    hr_high: {
      color: '#ef4444',
      text: t('incidents.webcamHrHigh'),
      borderClass: 'border-red-flash',
      bgGlow: 'rgba(239, 68, 68, 0.25)',
      icon: <Activity className="text-red-400" size={16} />
    },
    hr_low: {
      color: '#ef4444',
      text: t('incidents.webcamHrLow'),
      borderClass: 'border-red-flash',
      bgGlow: 'rgba(239, 68, 68, 0.25)',
      icon: <Activity className="text-red-400" size={16} />
    },
    apnea: {
      color: '#ef4444',
      text: t('incidents.webcamApnea'),
      borderClass: 'border-red-flash',
      bgGlow: 'rgba(239, 68, 68, 0.25)',
      icon: <Activity className="text-red-400" size={16} />
    }
  };

  return (
    <div className="webcam-modal-backdrop">
      <div className="webcam-modal-container glass-card-premium">
        
        {/* Header */}
        <div className="webcam-modal-header">
          <div className="header-title-section">
            <Video size={22} className="text-blue-500 animate-pulse" />
            <div>
              <h3>{t('incidents.webcamTitle')}</h3>
              <p>{t('incidents.webcamSubtitle').replace('{name}', camera.name).replace('{location}', camera.location)}</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="webcam-modal-body">
          
          {/* Left Panel: Video stream preview with animated overlay */}
          <div className="webcam-video-panel">
            <div className={`video-wrapper ${stateConfig[activeState].borderClass}`}>
              {hasPermission === null && (
                <div className="video-placeholder">
                  <Loader2 className="spin text-blue-500" size={36} />
                  <p>{t('incidents.webcamPreparing')}</p>
                </div>
              )}
              {hasPermission === false && (
                <div className="video-placeholder error">
                  <AlertCircle className="text-red-500" size={48} />
                  <h4>{t('incidents.webcamNotFound')}</h4>
                  <p>{t('incidents.webcamNotFoundDesc')}</p>
                </div>
              )}

              {hasPermission === true && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="webcam-element"
                  />
                  
                  {/* Status Indicator Overlays */}
                  <div className="video-status-overlay">
                    <span className="ai-badge" style={{ backgroundColor: stateConfig[activeState].color }}>
                      AI ACTIVE • {stateConfig[activeState].text}
                    </span>
                    <span className="fps-badge">FPS: 30 • LATENCY: 22ms</span>
                  </div>

                  {/* Dynamic Pose SVG Skeleton Overlay */}
                  <svg className="pose-skeleton-overlay" viewBox="0 0 640 480">
                    {(activeState === 'normal' || activeState === 'hr_high' || activeState === 'hr_low' || activeState === 'apnea') && (
                      <g className="skeleton-normal">
                        {/* Head */}
                        <circle cx="320" cy="120" r="22" stroke="#10b981" strokeWidth="3" fill="rgba(16, 185, 129, 0.2)" />
                        {/* Spine */}
                        <line x1="320" y1="142" x2="320" y2="260" stroke="#10b981" strokeWidth="4" />
                        {/* Shoulders */}
                        <line x1="280" y1="160" x2="360" y2="160" stroke="#10b981" strokeWidth="3" />
                        {/* Arms */}
                        <line x1="280" y1="160" x2="260" y2="230" stroke="#10b981" strokeWidth="3" />
                        <line x1="360" y1="160" x2="380" y2="230" stroke="#10b981" strokeWidth="3" />
                        {/* Hips */}
                        <line x1="290" y1="260" x2="350" y2="260" stroke="#10b981" strokeWidth="3" />
                        {/* Legs */}
                        <line x1="290" y1="260" x2="280" y2="380" stroke="#10b981" strokeWidth="3.5" />
                        <line x1="350" y1="260" x2="360" y2="380" stroke="#10b981" strokeWidth="3.5" />
                      </g>
                    )}

                    {activeState === 'fall' && (
                      <g className="skeleton-fall">
                        {/* Head lying down */}
                        <circle cx="160" cy="380" r="22" stroke="#ef4444" strokeWidth="3" fill="rgba(239, 68, 68, 0.2)" />
                        {/* Spine */}
                        <line x1="182" y1="380" x2="320" y2="380" stroke="#ef4444" strokeWidth="4" />
                        {/* Shoulders */}
                        <line x1="200" y1="350" x2="200" y2="410" stroke="#ef4444" strokeWidth="3" />
                        {/* Arms */}
                        <line x1="200" y1="350" x2="160" y2="330" stroke="#ef4444" strokeWidth="3" />
                        <line x1="200" y1="410" x2="250" y2="430" stroke="#ef4444" strokeWidth="3" />
                        {/* Hips */}
                        <line x1="320" y1="350" x2="320" y2="410" stroke="#ef4444" strokeWidth="3" />
                        {/* Legs */}
                        <line x1="320" y1="350" x2="420" y2="340" stroke="#ef4444" strokeWidth="3.5" />
                        <line x1="320" y1="410" x2="440" y2="415" stroke="#ef4444" strokeWidth="3.5" />
                      </g>
                    )}
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* Right Panel: Control Dashboard */}
          <div className="webcam-controls-panel">
            
            {devices.length > 0 && (
              <div className="control-section-card">
                <h4>{t('incidents.webcamSelectDevice')}</h4>
                <div style={{ marginTop: '8px', position: 'relative' }}>
                  <select 
                    value={selectedDeviceId} 
                    onChange={handleDeviceChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: '#1e293b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="control-section-card">
              <h4>{t('incidents.webcamStep1Title')}</h4>
              <div className="state-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['normal', 'fall', 'hr_high', 'hr_low', 'apnea'] as AIState[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveState(st)}
                    className={`btn-state-selector ${st} ${activeState === st ? 'active' : ''}`}
                    type="button"
                    style={st === 'normal' ? { gridColumn: 'span 2' } : {}}
                  >
                    <div className="selector-indicator"></div>
                    <span className="selector-text">
                      {st === 'normal' && t('incidents.webcamNormal')}
                      {st === 'fall' && t('incidents.webcamFall')}
                      {st === 'hr_high' && t('incidents.webcamHrHigh')}
                      {st === 'hr_low' && t('incidents.webcamHrLow')}
                      {st === 'apnea' && t('incidents.webcamApnea')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-section-card">
              <div className="slider-header">
                <h4>{t('incidents.webcamStep2Title')}</h4>
                <span className="slider-value">{confidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="premium-slider"
              />
              <div className="slider-labels">
                <span>{t('incidents.webcamConfidenceLow')}</span>
                <span>{t('incidents.webcamConfidenceHigh')}</span>
              </div>
            </div>

            <div className="control-action-area">
              <button
                onClick={handleSendSignal}
                disabled={isSubmitting || hasPermission !== true}
                className={`btn-send-signal ${activeState}`}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spin" size={18} />
                    <span>{t('incidents.webcamSending')}</span>
                  </>
                ) : (
                  <>
                    <Flame size={18} />
                    <span>{t('incidents.webcamSimulateBtn')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="testing-hint-box">
              <div className="hint-header">
                <Activity size={16} className="text-blue-500" />
                <h5>{t('incidents.webcamGuideTitle')}</h5>
              </div>
              <ul>
                <li>{t('incidents.webcamGuideStep1')}</li>
                <li>{t('incidents.webcamGuideStep2')}</li>
                <li>{t('incidents.webcamGuideStep3')}</li>
                <li>{t('incidents.webcamGuideStep4')}</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamTestModal;
