"use client"

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Heart, AlertCircle, Calendar, Plus, Edit2, Trash2, X, ChevronDown, Shield, Activity, Cpu, Volume2, BellRing, Video, Sliders, VolumeX } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useNotification } from '@/app/context/NotificationContext';

export default function ProfilePage() {
  const { showToast, confirm } = useNotification();
  const { data: session, status } = useSession();
  const [patient, setPatient] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({ id: '', name: '', phone: '', relation: '' });
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Camera AI Profile Settings States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    age: 0,
    location: '',
    bloodType: '',
    conditions: [] as string[],
    thrLow: 0.015,
    thrHigh: 0.040,
    audioAlert: true
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchData();
    } else if (status === 'unauthenticated') {
      // Load gorgeous demo data so the page is alive instantly!
      setPatient({
        name: "Nguyễn Văn Hùng (Demo)",
        age: 82,
        location: "Tầng 1 - Phòng khách",
        bloodType: "Telegram + AI Call",
        conditions: ["Camera Phòng Khách - Tapo C210", "Camera Hành Lang - C6N"],
        thrLow: 0.015,
        thrHigh: 0.040,
        audioAlert: true,
        lastIncident: "Ngã nhẹ lúc 10:14 sáng nay (Đã xử lý)",
        contacts: [
          { id: 'demo-1', name: 'Nguyễn Anh Tuấn', relation: 'Con trai', phone: '0941363152' },
          { id: 'demo-2', name: 'Trần Thị Mai', relation: 'Vợ', phone: '0905177808' }
        ]
      });
    }
  }, [status, session]);

  const fetchData = async () => {
    const token = (session?.user as any)?.accessToken;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const res = await fetch(`${apiBase}/health-profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) {
      signOut({ callbackUrl: '/login' });
      return;
    }
    if (res.ok) setPatient(await res.json());
  };

  const openProfileModal = () => {
    if (patient) {
      setProfileFormData({
        name: patient.name || '',
        age: patient.age || 0,
        location: patient.location || '',
        bloodType: patient.bloodType || '',
        conditions: patient.conditions || [],
        thrLow: patient.thrLow || 0.015,
        thrHigh: patient.thrHigh || 0.040,
        audioAlert: patient.audioAlert !== undefined ? patient.audioAlert : true
      });
      setShowProfileModal(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormData.name) {
      showToast("Vui lòng nhập tên đối tượng giám sát.", "error");
      return;
    }

    if (status === 'unauthenticated') {
      setPatient({
        ...patient,
        name: profileFormData.name,
        age: Number(profileFormData.age),
        location: profileFormData.location,
        bloodType: profileFormData.bloodType,
        conditions: profileFormData.conditions,
        thrLow: Number(profileFormData.thrLow),
        thrHigh: Number(profileFormData.thrHigh),
        audioAlert: profileFormData.audioAlert
      });
      showToast("Đã cập nhật cấu hình giám sát AI (Chế độ Demo)!", "success");
      setShowProfileModal(false);
      return;
    }

    const token = (session?.user as any)?.accessToken;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    try {
      const res = await fetch(`${apiBase}/health-profiles`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileFormData.name,
          age: Number(profileFormData.age),
          location: profileFormData.location,
          bloodType: profileFormData.bloodType,
          conditions: profileFormData.conditions,
          thrLow: Number(profileFormData.thrLow),
          thrHigh: Number(profileFormData.thrHigh),
          audioAlert: profileFormData.audioAlert
        })
      });

      if (res.ok) {
        showToast("Đã cập nhật cấu hình giám sát AI thành công!", "success");
        setShowProfileModal(false);
        fetchData();
      } else {
        showToast("Lỗi khi cập nhật cấu hình.", "error");
      }
    } catch (err) {
      showToast("Không thể kết nối tới server.", "error");
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast("Vui lòng nhập tên và SĐT.", "error");
      return;
    }

    const token = (session?.user as any)?.accessToken;
    let newContacts = [...(patient?.contacts || [])];

    if (editingContact) {
      newContacts = newContacts.map(c => c.id === editingContact.id ? formData : c);
    } else {
      newContacts.push({ ...formData, id: Date.now().toString() });
    }

    if (status === 'unauthenticated') {
      setPatient({ ...patient, contacts: newContacts });
      showToast("Đã lưu liên hệ thành công (Demo)!", "success");
      closeModal();
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const res = await fetch(`${apiBase}/health-profiles/contacts`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newContacts)
    });

    if (res.ok) {
      const data = await res.json();
      setPatient({ ...patient, contacts: data.contacts });
      showToast("Đã lưu liên hệ thành công!", "success");
      closeModal();
    }
  };

  const handleDeleteContact = async (id: string) => {
    const confirmed = await confirm("Xác nhận xóa?", "Bạn có chắc muốn xóa liên hệ khẩn cấp này?");
    if (!confirmed) return;

    const token = (session?.user as any)?.accessToken;
    const newContacts = patient.contacts.filter((c: any) => c.id !== id);

    if (status === 'unauthenticated') {
      setPatient({ ...patient, contacts: newContacts });
      showToast("Đã xóa liên hệ (Demo).", "success");
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const res = await fetch(`${apiBase}/health-profiles/contacts`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newContacts)
    });

    if (res.ok) {
      const data = await res.json();
      setPatient({ ...patient, contacts: data.contacts });
      showToast("Đã xóa liên hệ.", "success");
    }
  };

  const handleTestCall = async (phone: string) => {
    const token = (session?.user as any)?.accessToken;
    showToast(`Đang chuẩn bị cuộc gọi thử nghiệm tới số ${phone}...`, "info");
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const res = await fetch(`${apiBase}/test-call`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone })
      });
      if (res.ok) {
        showToast("Cuộc gọi đã được kích hoạt! Hãy kiểm tra điện thoại.", "success");
      } else {
        showToast("Lỗi khi kích hoạt cuộc gọi.", "error");
      }
    } catch (err) {
      showToast("Không thể kết nối tới Backend.", "error");
    }
  };

  const openModal = (contact: any = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData(contact);
    } else {
      setEditingContact(null);
      setFormData({ id: '', name: '', phone: '', relation: 'Người thân' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setShowDropdown(false);
  };

  if (!patient) return (
    <div className="dashboard-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Đang tải hồ sơ y tế từ Server...
    </div>
  );

  return (
    <div className="dashboard-section" style={{ minHeight: '100vh' }}>
      <header className="page-header-premium">
        <div>
          <h1 className="page-title-premium">Hồ Sơ Giám Sát AI & Thiết Bị</h1>
          <p className="page-subtitle-premium">
            Thông tin chi tiết, cấu hình camera giám sát AI, và danh bạ hỗ trợ khẩn cấp.
          </p>
        </div>
      </header>

      <div className="profile-grid">
        {/* Basic Info Card */}
        <section className="overview-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          {/* AI Active Badge */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#e0f2fe',
            color: '#0284c7',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid #bae6fd'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
            AI Active
          </div>

          <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '4px solid var(--accent-light)', position: 'relative' }}>
            <User size={64} color="var(--accent)" strokeWidth={1.5} />
            <div style={{ position: 'absolute', bottom: '0', right: '4px', background: '#22c55e', width: '28px', height: '28px', borderRadius: '50%', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <Video size={12} color="#fff" />
            </div>
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{patient.name}</h2>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '40px', fontWeight: 600, fontSize: '1.1rem' }}>
            <Calendar size={20} /> {patient.age || 'Chưa cập nhật'} Tuổi (Đối tượng giám sát)
          </div>
          
          <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-primary)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="icon-badge accent" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <MapPin size={24} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Vị trí lắp đặt:</div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{patient.location || 'Chưa xác định'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="icon-badge danger" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--danger-light)' }}>
                <BellRing size={24} color="var(--danger)" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Kênh báo động khẩn:</div>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>{patient.bloodType || 'Chưa rõ'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => openProfileModal()} 
            style={{ 
              width: '100%', 
              padding: '13px', 
              borderRadius: '16px', 
              border: '1px solid var(--border)', 
              background: '#f8fafc', 
              color: 'var(--accent)', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              marginTop: '20px' 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Sliders size={18} /> Cấu hình Giám sát AI
          </button>
        </section>

        {/* Camera AI Surveillance Config Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section className="overview-card">
            <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', color: 'var(--text-main)' }}>
              <div className="icon-badge warning" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7' }}>
                <Cpu size={20} color="#d97706" />
              </div>
              Thông số Camera & Thiết bị AI
            </h3>

            {/* AI Thresholds Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  <Activity size={14} color="#3b82f6" />
                  Ngưỡng ngã nhạy thấp (thrLow)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  {patient.thrLow || 0.015} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>G-force</span>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  <Shield size={14} color="#ef4444" />
                  Ngưỡng va đập mạnh (thrHigh)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  {patient.thrHigh || 0.040} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>G-force</span>
                </div>
              </div>
            </div>

            {/* Siren and Status */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {patient.audioAlert ? (
                  <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>
                    <Volume2 size={20} color="#22c55e" />
                  </div>
                ) : (
                  <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '12px' }}>
                    <VolumeX size={20} color="#ef4444" />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Còi báo động tại chỗ</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Hú còi qua loa Camera khi phát hiện ngã</div>
                </div>
              </div>
              <span style={{
                background: patient.audioAlert ? '#dcfce7' : '#fee2e2',
                color: patient.audioAlert ? '#15803d' : '#991b1b',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                {patient.audioAlert ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </span>
            </div>

            {/* Connected Cameras */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Video size={16} color="#475569" />
                Hệ thống Camera giám sát liên kết:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {patient.conditions?.length ? patient.conditions.map((c: string) => (
                  <span key={c} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
                    {c}
                  </span>
                )) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', width: '100%', border: '1px dashed var(--border-hover)', textAlign: 'center' }}>
                    Chưa liên kết camera nào. Nhấp "Cấu hình Giám sát AI" để thêm!
                  </span>
                )}
              </div>
            </div>
            {/* Last Incident Detected */}
            <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sự cố phát hiện gần nhất qua AI:</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--danger)', marginTop: '4px' }}>{patient.lastIncident || 'Chưa phát hiện sự cố'}</div>
              </div>
              {patient.lastIncident && patient.lastIncident !== 'Chưa có dữ liệu' && (
                <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, animation: 'pulse 2s infinite' }}>
                  CẢNH BÁO
                </span>
              )}
            </div>
          </section>

          <section className="overview-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
               <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', color: 'var(--text-main)' }}>
                 <div className="icon-badge success" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                   <Phone size={20} color="var(--success)" />
                 </div>
                 Danh bạ Khẩn cấp
               </h3>
               <button onClick={() => openModal()} style={{ background: 'var(--accent)', color: 'var(--bg-secondary)', border: 'none', borderRadius: '12px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                 <Plus size={18} /> Thêm
               </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {(!patient.contacts || patient.contacts.length === 0) && (
                 <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '20px', border: '1px dashed var(--border-hover)', color: 'var(--text-muted)' }}>
                    Chưa có liên hệ khẩn cấp nào. Hãy thêm ngay!
                 </div>
              )}
              {patient.contacts?.map((contact: any) => (
                <div key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{contact.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>{contact.relation}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <a href={`tel:${contact.phone}`} style={{ color: 'var(--success)', fontWeight: 800, textDecoration: 'none', fontSize: '1.15rem' }}>
                      {contact.phone}
                    </a>
                    <a href={`https://t.me/+84${contact.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: '#0088cc', color: 'white', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                      Gọi Tele
                    </a>
                    <button onClick={() => handleTestCall(contact.phone)} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> Test Gọi AI
                    </button>
                    <div style={{ height: '32px', width: '1px', background: 'var(--border)', margin: '0 8px' }}></div>
                    <button onClick={() => openModal(contact)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sửa">
                       <Edit2 size={18} color="var(--accent)" />
                    </button>
                    <button onClick={() => handleDeleteContact(contact.id)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa">
                       <Trash2 size={18} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Thêm/Sửa liên hệ */}
      {showModal && (
        <div className="modal-backdrop-blur" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            padding: '36px 32px', borderRadius: '28px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.12), 0 20px 40px -20px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            fontFamily: '"Inter", sans-serif',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            
            {/* Close Button */}
            <button 
              onClick={closeModal} 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '24px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
                {editingContact ? 'Sửa thông tin liên hệ' : 'Thêm liên hệ khẩn cấp'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Thông tin này dùng để gửi cảnh báo cuộc gọi/tin nhắn tự động khi phát hiện sự cố.
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="VD: Nguyễn Văn B"
                    style={{ 
                      width: '100%', 
                      padding: '11px 15px', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      background: '#ffffff', 
                      fontSize: '0.95rem', 
                      outline: 'none', 
                      color: '#1e293b', 
                      boxSizing: 'border-box',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="VD: 0901 234 567"
                    style={{ 
                      width: '100%', 
                      padding: '11px 15px', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      background: '#ffffff', 
                      fontSize: '0.95rem', 
                      outline: 'none', 
                      color: '#1e293b', 
                      boxSizing: 'border-box',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
               </div>
                <div style={{ position: 'relative' }}>
                   <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Mối quan hệ</label>
                   
                   {/* Custom Select Box Trigger */}
                   <div 
                     onClick={() => setShowDropdown(!showDropdown)}
                     style={{ 
                       width: '100%', 
                       padding: '11px 15px', 
                       borderRadius: '12px', 
                       border: `1px solid ${showDropdown ? '#3b82f6' : '#e2e8f0'}`, 
                       background: '#ffffff', 
                       fontSize: '0.95rem', 
                       color: '#1e293b', 
                       boxSizing: 'border-box',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       transition: 'all 0.2s',
                       boxShadow: showDropdown ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                       userSelect: 'none'
                     }}
                   >
                     <span>{formData.relation || 'Người thân'}</span>
                     <ChevronDown 
                       size={18} 
                       style={{ 
                         color: '#64748b', 
                         transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                         transition: 'transform 0.2s ease'
                       }} 
                     />
                   </div>

                   {/* Custom Dropdown List */}
                   {showDropdown && (
                     <div style={{
                       position: 'absolute',
                       top: '100%',
                       left: 0,
                       right: 0,
                       background: 'rgba(255, 255, 255, 0.98)',
                       backdropFilter: 'blur(20px) saturate(180%)',
                       border: '1px solid #e2e8f0',
                       borderRadius: '16px',
                       marginTop: '6px',
                       maxHeight: '220px',
                       overflowY: 'auto',
                       zIndex: 1000,
                       boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.12), 0 4px 12px -5px rgba(0, 0, 0, 0.05)',
                       padding: '6px',
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '2px',
                       animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                     }}>
                       {[
                         "Cha / Bố", "Mẹ", "Vợ", "Chồng", "Con trai", "Con gái", 
                         "Anh / Em trai", "Chị / Em gái", "Ông / Bà", "Hàng xóm", 
                         "Bác sĩ riêng", "Người thân khác"
                       ].map((item) => (
                         <div
                           key={item}
                           onClick={() => {
                             setFormData({ ...formData, relation: item });
                             setShowDropdown(false);
                           }}
                           style={{
                             padding: '10px 14px',
                             borderRadius: '10px',
                             cursor: 'pointer',
                             fontSize: '0.92rem',
                             color: formData.relation === item ? '#3b82f6' : '#334155',
                             background: formData.relation === item ? '#eff6ff' : 'transparent',
                             fontWeight: formData.relation === item ? 700 : 500,
                             transition: 'all 0.15s',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between'
                           }}
                           onMouseEnter={(e) => {
                             if (formData.relation !== item) {
                               e.currentTarget.style.background = '#f1f5f9';
                               e.currentTarget.style.color = '#1e293b';
                             }
                           }}
                           onMouseLeave={(e) => {
                             if (formData.relation !== item) {
                               e.currentTarget.style.background = 'transparent';
                               e.currentTarget.style.color = '#334155';
                             } else {
                               e.currentTarget.style.background = '#eff6ff';
                               e.currentTarget.style.color = '#3b82f6';
                             }
                           }}
                         >
                           <span>{item}</span>
                           {formData.relation === item && (
                             <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 800 }}>✓</span>
                           )}
                         </div>
                       ))}

                       {/* Fallback Custom relation if currently selected but not in standard options */}
                       {formData.relation && ![
                         "Cha / Bố", "Mẹ", "Vợ", "Chồng", "Con trai", "Con gái", 
                         "Anh / Em trai", "Chị / Em gái", "Ông / Bà", "Hàng xóm", 
                         "Bác sĩ riêng", "Người thân khác"
                       ].includes(formData.relation) && (
                         <div
                           onClick={() => {
                             setShowDropdown(false);
                           }}
                           style={{
                             padding: '10px 14px',
                             borderRadius: '10px',
                             cursor: 'pointer',
                             fontSize: '0.92rem',
                             color: '#3b82f6',
                             background: '#eff6ff',
                             fontWeight: 700,
                             transition: 'all 0.15s',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between'
                           }}
                         >
                           <span>{formData.relation}</span>
                           <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 800 }}>✓</span>
                         </div>
                       )}
                     </div>
                   )}
                </div>
 
               {/* Footer Buttons */}
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button 
                    type="button"
                    onClick={closeModal}
                    style={{ 
                      padding: '11px 20px', 
                      borderRadius: '14px', 
                      border: '1px solid #e2e8f0', 
                      background: '#ffffff', 
                      color: '#64748b', 
                      fontSize: '0.92rem', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    style={{ 
                      padding: '11px 24px', 
                      borderRadius: '14px', 
                      border: 'none', 
                      background: '#3b82f6', 
                      color: '#ffffff', 
                      fontSize: '0.92rem', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 8px 16px rgba(59, 130, 246, 0.15)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Lưu cấu hình
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
 
      {/* Modal Cập nhật Cấu hình Giám sát AI */}
      {showProfileModal && (
        <div className="modal-backdrop-blur" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            padding: '36px 32px', borderRadius: '28px',
            width: '100%', maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.12), 0 20px 40px -20px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            fontFamily: '"Inter", sans-serif',
            animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowProfileModal(false)} 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '24px', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="var(--accent)" />
                Cấu hình Giám sát AI & Thiết bị
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                Thiết lập thông số thiết bị phát hiện ngã AI cho đối tượng giám sát.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
               
               {/* Grid Họ tên & Tuổi */}
               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Tên đối tượng giám sát</label>
                    <input 
                      type="text" 
                      value={profileFormData.name} 
                      onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} 
                      placeholder="VD: Nguyễn Văn A"
                      style={{ 
                        width: '100%', 
                        padding: '11px 15px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#ffffff', 
                        fontSize: '0.95rem', 
                        outline: 'none', 
                        color: '#1e293b', 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Tuổi</label>
                    <input 
                      type="number" 
                      value={profileFormData.age || ''} 
                      onChange={e => setProfileFormData({...profileFormData, age: parseInt(e.target.value) || 0})} 
                      placeholder="VD: 75"
                      style={{ 
                        width: '100%', 
                        padding: '11px 15px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#ffffff', 
                        fontSize: '0.95rem', 
                        outline: 'none', 
                        color: '#1e293b', 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                 </div>
               </div>

               {/* Grid Vị trí & Cảnh báo */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Khu vực lắp đặt Cam</label>
                    <input 
                      type="text" 
                      value={profileFormData.location} 
                      onChange={e => setProfileFormData({...profileFormData, location: e.target.value})} 
                      placeholder="VD: Phòng khách Tầng 1"
                      style={{ 
                        width: '100%', 
                        padding: '11px 15px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#ffffff', 
                        fontSize: '0.95rem', 
                        outline: 'none', 
                        color: '#1e293b', 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Kênh báo động khẩn</label>
                    <input 
                      type="text" 
                      value={profileFormData.bloodType} 
                      onChange={e => setProfileFormData({...profileFormData, bloodType: e.target.value})} 
                      placeholder="VD: Telegram + AI Call"
                      style={{ 
                        width: '100%', 
                        padding: '11px 15px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#ffffff', 
                        fontSize: '0.95rem', 
                        outline: 'none', 
                        color: '#1e293b', 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                 </div>
               </div>

               {/* Cameras conditions */}
               <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Danh sách Camera giám sát (ngăn cách bởi dấu phẩy)</label>
                  <input 
                    type="text" 
                    value={profileFormData.conditions.join(', ')} 
                    onChange={e => setProfileFormData({...profileFormData, conditions: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})} 
                    placeholder="VD: Phòng khách - Tapo C210, Hành lang - C6N"
                    style={{ 
                      width: '100%', 
                      padding: '11px 15px', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      background: '#ffffff', 
                      fontSize: '0.95rem', 
                      outline: 'none', 
                      color: '#1e293b', 
                      boxSizing: 'border-box',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
               </div>

               {/* Grid thrLow & thrHigh */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Ngưỡng ngã nhạy thấp (thrLow)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={profileFormData.thrLow} 
                      onChange={e => setProfileFormData({...profileFormData, thrLow: parseFloat(e.target.value) || 0})} 
                      style={{ 
                        width: '100%', 
                        padding: '11px 15px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#ffffff', 
                        fontSize: '0.95rem', 
                        outline: 'none', 
                        color: '#1e293b', 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Ngưỡng va đập mạnh (thrHigh)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={profileFormData.thrHigh} 
                      onChange={e => setProfileFormData({...profileFormData, thrHigh: parseFloat(e.target.value) || 0})} 
                      style={{ 
                        width: '100%', 
                        padding: '11px 15px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        background: '#ffffff', 
                        fontSize: '0.95rem', 
                        outline: 'none', 
                        color: '#1e293b', 
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                 </div>
               </div>

               {/* Local Siren Alert toggle switch */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', color: '#1e293b', fontWeight: 700 }}>Còi hú tại chỗ (Camera Siren)</label>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>Phát còi báo động trực tiếp qua loa camera khi phát hiện ngã</span>
                  </div>
                  <div 
                    onClick={() => setProfileFormData({...profileFormData, audioAlert: !profileFormData.audioAlert})}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '15px',
                      background: profileFormData.audioAlert ? '#22c55e' : '#cbd5e1',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      left: profileFormData.audioAlert ? '24px' : '2px',
                      transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }} />
                  </div>
               </div>

               {/* Footer Buttons */}
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                   <button 
                     type="button"
                     onClick={() => setShowProfileModal(false)}
                     style={{ 
                       padding: '11px 20px', 
                       borderRadius: '14px', 
                       border: '1px solid #e2e8f0', 
                       background: '#ffffff', 
                       color: '#64748b', 
                       fontSize: '0.92rem', 
                       fontWeight: 700, 
                       cursor: 'pointer',
                       transition: 'all 0.2s'
                     }}
                     onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                   >
                     Hủy bỏ
                   </button>
                   <button 
                     type="submit" 
                     style={{ 
                       padding: '11px 24px', 
                       borderRadius: '14px', 
                       border: 'none', 
                       background: '#3b82f6', 
                       color: '#ffffff', 
                       fontSize: '0.92rem', 
                       fontWeight: 700, 
                       cursor: 'pointer',
                       transition: 'all 0.2s',
                       boxShadow: '0 8px 16px rgba(59, 130, 246, 0.15)'
                     }}
                     onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
                   >
                     Lưu cấu hình
                   </button>
               </div>
            </form>
          </div>
        </div>
      )}
 
      <style jsx>{`
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes dropdownFadeIn {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
