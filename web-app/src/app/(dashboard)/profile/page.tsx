"use client"

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Heart, AlertCircle, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { useNotification } from '@/app/context/NotificationContext';

export default function ProfilePage() {
  const { showToast, confirm } = useNotification();
  const { data: session } = useSession();
  const [patient, setPatient] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({ id: '', name: '', phone: '', relation: '' });

  useEffect(() => {
    if (session?.user) fetchData();
  }, [session]);

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
          <h1 className="page-title-premium">Hồ Sơ Giám Sát Sức Khỏe</h1>
          <p className="page-subtitle-premium">
            Thông tin chi tiết và danh bạ hỗ trợ khẩn cấp cho đối tượng được giám sát.
          </p>
        </div>
      </header>

      <div className="profile-grid">
        
        {/* Basic Info Card */}
        <section className="overview-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '4px solid var(--accent-light)' }}>
            <User size={64} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{patient.name}</h2>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '40px', fontWeight: 600, fontSize: '1.1rem' }}>
            <Calendar size={20} /> {patient.age || 'Chưa cập nhật'} Tuổi
          </div>
          
          <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-primary)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="icon-badge accent" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <MapPin size={24} color="var(--accent)" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>{patient.location || 'Chưa xác định'}</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="icon-badge danger" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--danger-light)' }}>
                <Heart size={24} color="var(--danger)" />
              </div>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Nhóm máu: <strong style={{ color: 'var(--danger)', fontSize: '1.2rem', fontWeight: 800 }}>{patient.bloodType || 'Chưa rõ'}</strong></span>
            </div>
          </div>
        </section>

        {/* Medical & Contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section className="overview-card">
            <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', color: 'var(--text-main)' }}>
              <div className="icon-badge warning" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                <AlertCircle size={20} color="var(--warning)" />
              </div>
              Tình trạng sức khỏe
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
              {patient.conditions?.length ? patient.conditions.map((c: string) => (
                <span key={c} style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '10px 20px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 600 }}>
                  {c}
                </span>
              )) : <span style={{ color: 'var(--text-muted)', fontSize: '1rem', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', width: '100%', border: '1px solid var(--border)' }}>Chưa có ghi nhận y tế.</span>}
            </div>
            <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Sự cố gần nhất:</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--danger)' }}>{patient.lastIncident || 'Chưa có dữ liệu'}</div>
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
               <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Mối quan hệ</label>
                  <input 
                    type="text" 
                    value={formData.relation} 
                    onChange={e => setFormData({...formData, relation: e.target.value})} 
                    placeholder="VD: Con trai trưởng"
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
 
      <style jsx>{`
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
