import React from 'react';
import { Shield, Bell, Heart, BookOpen, Settings, Video, PhoneCall } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

const MedicalSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div id="muc-y-te" className="dashboard-section">
      <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '40px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
        {t('medical.title')}
      </h2>

      <div className="dashboard-grid-3" style={{ marginBottom: '64px' }}>
        <div className="overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-icon-box" style={{ background: 'var(--accent-light)' }}>
            <Shield size={26} color="var(--accent)" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            {t('medical.securityTitle')}
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
            {t('medical.securityDesc')}
          </p>
        </div>

        <div className="overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-icon-box" style={{ background: 'var(--danger-light)' }}>
            <Bell size={26} color="var(--danger)" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            {t('medical.alertsTitle')}
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
            {t('medical.alertsDesc')}
          </p>
        </div>

        <div className="overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-icon-box" style={{ background: 'var(--success-light)' }}>
            <Heart size={26} color="var(--success)" strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
            {t('medical.heartTitle')}
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
            {t('medical.heartDesc')}
          </p>
        </div>
      </div>

      {/* Hướng Dẫn Sử Dụng */}
      <div id="huong-dan" style={{ background: 'var(--bg-secondary)', borderRadius: '32px', border: '1px solid var(--border)', padding: '48px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={28} color="var(--accent)" /> {t('medical.guideTitle')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '40px', fontWeight: 500 }}>
          {t('medical.guideSubtitle')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          
          <div style={{ background: 'var(--bg-primary)', padding: '32px 24px 24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '24px', background: 'var(--accent)', color: 'var(--bg-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '4px solid var(--bg-secondary)' }}>1</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-badge success" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <PhoneCall size={18} color="var(--success)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('medical.step1Title')}</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              {t('medical.step1Desc')}
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '32px 24px 24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '24px', background: 'var(--accent)', color: 'var(--bg-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '4px solid var(--bg-secondary)' }}>2</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-badge accent" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Video size={18} color="var(--accent)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('medical.step2Title')}</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              {t('medical.step2Desc')}
            </p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '32px 24px 24px', borderRadius: '24px', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '24px', background: 'var(--accent)', color: 'var(--bg-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '4px solid var(--bg-secondary)' }}>3</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-badge danger" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Bell size={18} color="var(--danger)" />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('medical.step3Title')}</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              {t('medical.step3Desc')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicalSection);
