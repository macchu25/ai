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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '48px', borderRadius: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 48px rgba(0,0,0,0.1)', animation: 'slideUp 0.4s var(--ease-out-quint)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
               <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                 {editingContact ? 'Sửa liên hệ' : 'Thêm liên hệ mới'}
               </h3>
               <button onClick={closeModal} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <X size={20} color="var(--text-main)" />
               </button>
            </div>

            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>Họ và tên</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Nguyễn Văn B"
                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-primary)', fontSize: '1rem', outline: 'none', color: 'var(--text-main)', boxSizing: 'border-box' }} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>Số điện thoại</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="VD: 0901 234 567"
                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-primary)', fontSize: '1rem', outline: 'none', color: 'var(--text-main)', boxSizing: 'border-box' }} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>Mối quan hệ</label>
                  <input type="text" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} placeholder="VD: Con trai trưởng"
                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-primary)', fontSize: '1rem', outline: 'none', color: 'var(--text-main)', boxSizing: 'border-box' }} />
               </div>
               <button type="submit" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}>
                  Lưu liên hệ
               </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
