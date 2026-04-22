"use client"

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Heart, AlertCircle, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [patient, setPatient] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  
  const [formData, setFormData] = useState({ id: '', name: '', phone: '', relation: '' });

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    const token = (session?.user as any)?.accessToken;
    const res = await fetch('http://localhost:8080/api/v1/health-profiles', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setPatient(await res.json());
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert("Vui lòng nhập tên và SĐT");
    
    const token = (session?.user as any)?.accessToken;
    let newContacts = [...(patient.contacts || [])];
    
    if (editingContact) {
      newContacts = newContacts.map(c => c.id === editingContact.id ? formData : c);
    } else {
      newContacts.push(formData);
    }

    const res = await fetch('http://localhost:8080/api/v1/health-profiles/contacts', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newContacts)
    });

    if (res.ok) {
      const data = await res.json();
      setPatient({ ...patient, contacts: data.contacts });
      closeModal();
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa liên hệ khẩn cấp này?")) return;
    const token = (session?.user as any)?.accessToken;
    const newContacts = patient.contacts.filter((c: any) => c.id !== id);
    
    const res = await fetch('http://localhost:8080/api/v1/health-profiles/contacts', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newContacts)
    });

    if (res.ok) {
      const data = await res.json();
      setPatient({ ...patient, contacts: data.contacts });
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

  if (!patient) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Đang tải tải hồ sơ y tế từ Server...</div>;

  return (
    <div className="profile-page">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Hồ Sơ Giám Sát Sức Khỏe</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Thông tin chi tiết và danh bạ hỗ trợ khẩn cấp cho đối tượng được giám sát.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        
        {/* Basic Info Card */}
        <section style={{ 
          background: 'white', 
          padding: '40px 32px', 
          borderRadius: '32px', 
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: '#f8fafc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px',
            border: '4px solid var(--accent)'
          }}>
            <User size={64} color="var(--accent)" />
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 800 }}>{patient.name}</h2>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '32px', fontWeight: 500 }}>
            <Calendar size={18} /> {patient.age || 'Chưa cập nhật'} Tuổi
          </div>
          
          <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px', background: '#f8fafc', padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                <MapPin size={20} color="var(--accent)" />
              </div>
              <span style={{ fontWeight: 500 }}>{patient.location}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                <Heart size={20} color="var(--danger)" />
              </div>
              <span>Nhóm máu: <strong style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>{patient.bloodType}</strong></span>
            </div>
          </div>
        </section>

        {/* Medical Conditions & Incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '32px', 
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.02)' 
          }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem' }}>
              <AlertCircle size={24} color="var(--warning)" /> Tình trạng sức khỏe
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              {patient.conditions?.length ? patient.conditions.map((c: string) => (
                <span key={c} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                  {c}
                </span>
              )) : <span style={{ color: 'var(--text-muted)' }}>Chưa có ghi nhận y tế.</span>}
            </div>
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Sự cố gần nhất:</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--danger)' }}>{patient.lastIncident}</div>
            </div>
          </section>

          <section style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '32px', 
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
            flex: 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem' }}>
                 <Phone size={24} color="var(--success)" /> Danh bạ Khẩn cấp
               </h3>
               <button 
                 onClick={() => openModal()}
                 style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}
               >
                 <Plus size={18} /> Thêm
               </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(!patient.contacts || patient.contacts.length === 0) && (
                 <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', color: 'var(--text-muted)' }}>
                    Chưa có liên hệ khẩn cấp nào. Hãy thêm ngay!
                 </div>
              )}
              {patient.contacts?.map((contact: any) => (
                <div key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>{contact.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{contact.relation}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <a href={`tel:${contact.phone}`} style={{ color: 'var(--success)', fontWeight: 800, textDecoration: 'none', fontSize: '1.1rem' }}>
                      {contact.phone}
                    </a>
                    <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>
                    <button onClick={() => openModal(contact)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Sửa">
                       <Edit2 size={18} color="var(--accent)" />
                    </button>
                    <button onClick={() => handleDeleteContact(contact.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }} title="Xóa">
                       <Trash2 size={18} color="var(--danger)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* CRUD Modal Xịn xò */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '40px', borderRadius: '32px',
            width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                 {editingContact ? 'Sửa liên hệ' : 'Thêm liên hệ mới'}
               </h3>
               <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <X size={20} color="var(--text-muted)" />
               </button>
            </div>

            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Nguyễn Văn B"
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '1rem', outline: 'none' }}
                  />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Số điện thoại (Nhập thoải mái)</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="VD: 0901 234 567"
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '1rem', outline: 'none' }}
                  />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Mối quan hệ</label>
                  <input 
                    type="text" 
                    value={formData.relation} 
                    onChange={e => setFormData({...formData, relation: e.target.value})}
                    placeholder="VD: Con trai trưởng"
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '1rem', outline: 'none' }}
                  />
               </div>
               
               <button type="submit" style={{ 
                 background: 'var(--success)', color: 'white', border: 'none', 
                 padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, 
                 cursor: 'pointer', marginTop: '16px', boxShadow: '0 8px 20px rgba(16,185,129,0.2)' 
               }}>
                  Lưu liên hệ
               </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
