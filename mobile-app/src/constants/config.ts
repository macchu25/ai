// ==========================================
// Cấu hình kết nối tới Go Backend
// ==========================================
export const API_BASE = 'http://192.168.1.4:8080'; // Thay bằng IP máy tính chạy Go backend
export const WS_BASE  = 'ws://192.168.1.4:8080';

export const ENDPOINTS = {
  socialLogin:     `${API_BASE}/api/v1/auth/social-login`,
  cameras:         `${API_BASE}/api/v1/cameras`,
  incidents:       `${API_BASE}/api/v1/incidents`,
  healthProfile:   `${API_BASE}/api/v1/health-profiles`,
  contacts:        `${API_BASE}/api/v1/health-profiles/contacts`,
  websocket:       `${WS_BASE}/ws`,
};

export const COLORS = {
  primary:    '#2563eb',
  primaryDark:'#1d4ed8',
  danger:     '#ef4444',
  warning:    '#f59e0b',
  success:    '#10b981',
  bg:         '#f8fafc',
  bgCard:     '#ffffff',
  bgCardHover:'#f1f5f9',
  border:     '#e2e8f0',
  text:       '#0f172a',
  textMuted:  '#64748b',
  textDim:    '#94a3b8',
  accent:     '#2563eb',
  gradient1:  '#2563eb',
  gradient2:  '#3b82f6',
};
