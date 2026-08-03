import { useState, useEffect } from 'react';
import { FiActivity } from 'react-icons/fi';

export interface ToastMessage {
  id: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export function ToastNotification() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // 1. معالجة الحدث المحلي وعرض التنبيه
    const triggerToast = (detail: { action: string; target: string; details: string }) => {
      // تنظيف النص وتأكيد ظهور (بواسطة: فلان) مرة واحدة فقط في النهاية بدون تكرار في البداية
      let cleanDetails = detail.details || 'تم إجراء تحديث';
      
      // إزالة التكرارات المحتملة لاسم الموظف من البداية
      cleanDetails = cleanDetails.replace(/^قام الموظف\s*\([^)]+\)\s*بـ/g, '').trim();

      const newToast: ToastMessage = {
        id: 'toast-' + Date.now() + '-' + Math.random(),
        action: detail.action || 'حركة جديدة',
        target: detail.target || 'النظام',
        details: cleanDetails,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setToasts(prev => [newToast, ...prev.slice(0, 4)]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    // الاستماع للأحداث المحلية (للمستخدم نفسه)
    const handleNewActivity = (event: CustomEvent) => {
      triggerToast(event.detail);
      
      // مزامنة الحدث مع باقي الموظفين المفتوحين للنظام عبر الـ LocalStorage
      try {
        localStorage.setItem('noorcast_live_sync_toast', JSON.stringify({
          ...event.detail,
          randomKey: Date.now()
        }));
      } catch (e) {}
    };

    // 2. الاستماع لتحديثات باقي الموظفين المتواجدين في النظام (Cross-tab / Cross-user Sync)
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'noorcast_live_sync_toast' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          triggerToast(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('dashboard-activity' as any, handleNewActivity as any);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener('dashboard-activity' as any, handleNewActivity as any);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .toast-slide-in {
          animation: slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast-slide-in"
            style={{
              pointerEvents: 'auto',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #334155',
              borderRight: '4px solid #38bdf8',
              borderRadius: '12px',
              padding: '14px 18px',
              color: 'white',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              minWidth: '320px',
              maxWidth: '400px',
              fontFamily: 'Cairo, sans-serif',
              direction: 'rtl',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
              <FiActivity size={18} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{toast.target}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{toast.timestamp}</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#f8fafc', fontWeight: '600', lineHeight: '1.4' }}>
                {toast.details}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}