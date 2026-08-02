import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { ar } from '@/i18n/ar';
import { getHRPayrollSheet, requestNotificationPermission } from '@/services/dbService';
import { FiBell } from 'react-icons/fi';

export function Header({ userIdentifier }: { userIdentifier?: string; onToggleSidebar?: () => void }) {
  const { employee } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('abdullatif');
  const [displayMeta, setDisplayMeta] = useState('');

  useEffect(() => {
    async function resolveIdentity() {
      if (employee && employee.fullName) {
        setDisplayName(employee.fullName);
        const dept = ar.departments?.[employee.department] || employee.department || '';
        const role = ar.roles?.[employee.role] || employee.role || '';
        if (dept || role) setDisplayMeta(`${dept} · ${role}`.trim());
        return;
      }

      try {
        const hrData = await getHRPayrollSheet();
        if (Array.isArray(hrData) && hrData.length > 0) {
          const targetKey = (userIdentifier || localStorage.getItem('userEmail') || localStorage.getItem('username') || 'abdullatif').toLowerCase().trim();
          
          const matched = hrData.find((emp: any) => {
            const empUser = String(emp.username || '').toLowerCase().trim();
            const empEmail = String(emp.email || '').toLowerCase().trim();
            const empName = String(emp.name || '').toLowerCase().trim();
            
            return empUser === targetKey || 
                   empUser === `@${targetKey}` || 
                   empEmail === targetKey || 
                   empName.includes(targetKey);
          });

          if (matched && matched.name) {
            setDisplayName(matched.name);
            setDisplayMeta(matched.position || matched.role || '');
            return;
          }
        }
      } catch (err) {
        console.error("خطأ في جلب بيانات الموظف للهيدر:", err);
      }

      if (userIdentifier) {
        setDisplayName(userIdentifier.includes('@') ? userIdentifier.split('@')[0] : userIdentifier);
      }
    }

    resolveIdentity();
  }, [employee, userIdentifier]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // تفعيل إشعارات الجوال
  const handleEnablePushNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        alert("تم تفعيل إشعارات الجوال والداشبورد بنجاح! 🔔🚀\nستصلك التنبيهات الفورية للطلبات والمهام الجديدة.");
      } else {
        alert("يرجى السماح للإشعارات من إعدادات المتصفح.");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء محاولة تفعيل الإشعارات.");
    }
  };

  // دالة إطلاق حدث فتح السايد بار
  const handleMenuClick = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .header-container {
            padding: 0 12px !important;
            height: 64px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .header-right-group {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }
          .header-logo-text {
            display: none !important;
          }
          .header-name {
            font-size: 0.85rem !important;
            max-width: 120px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .header-logout-btn, .header-notif-btn {
            padding: 5px 8px !important;
            font-size: 0.72rem !important;
          }
        }
      `}</style>

      <header className="header header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 24px', background: '#1e293b', borderBottom: '1px solid #334155', height: '70px', boxSizing: 'border-box' }}>
        
        {/* القسم الأيمن: زر القائمة (الخطوط الثلاثة) + اللوغو */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={handleMenuClick}
            style={{ 
              background: 'transparent', 
              color: '#38bdf8', 
              border: 'none', 
              fontSize: '1.3rem', 
              cursor: 'pointer',
              display: window.innerWidth > 768 ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            aria-label="القائمة"
          >
            ☰
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="https://res.cloudinary.com/dfwfh4xzb/image/upload/v1782727817/WhatsApp_Image_2026-06-21_at_12.56.07_AM_dhzswc.png" 
              alt="Noorcast Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain', borderRadius: '6px' }} 
            />
            <span className="header-logo-text" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
              إدارة نوركاست
            </span>
          </div>
        </div>

        {/* القسم الأوسط: اسم الموظف */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          {displayName && (
            <span className="header-name" style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{displayName}</span>
          )}
        </div>

        {/* القسم الأيسر: زر تفعيل الإشعارات + زر تسجيل الخروج */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            className="header-notif-btn" 
            onClick={handleEnablePushNotifications} 
            title="تفعيل تنبيهات الجوال والداشبورد"
            style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <FiBell size={15} /> تنبيهات الجوال
          </button>

          <button 
            type="button" 
            className="btn btn-ghost header-logout-btn" 
            onClick={handleLogout} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {ar.auth?.logout || 'تسجيل الخروج'}
          </button>
        </div>
      </header>
    </>
  );
}