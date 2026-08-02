import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { requestNotificationPermission } from '@/services/dbService';

export default function Navbar() {
  const handleEnablePushNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        alert("تم تفعيل إشعارات الجوال بنجاح! 🔔🚀\nستصلك التنبيهات الفورية للطلبات والمهام الجديدة.");
      } else {
        alert("يرجى السماح للإشعارات من إعدادات المتصفح أو التأكد من دعم المتصفح.");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء محاولة تفعيل الإشعارات.");
    }
  };

  return (
    <nav style={navStyle}>
      <h2 style={{ margin: 0, fontSize: '18px' }}>نظام Noorcast 🎬</h2>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link style={linkStyle} to="/">الرئيسية</Link>
          <Link style={linkStyle} to="/crm/clients">العملاء</Link>
          <Link style={linkStyle} to="/finance/invoices">الفواتير</Link>
          <Link style={linkStyle} to="/marketing/campaigns">الحملات</Link>
          <Link style={linkStyle} to="/marketing/content">المحتوى</Link>
        </div>

        {/* زر تفعيل إشعارات الجوال */}
        <button onClick={handleEnablePushNotifications} style={notificationBtnStyle} title="تفعيل تنبيهات الجوال والداشبورد">
          <FiBell size={16} /> تفعيل الإشعارات 🔔
        </button>
      </div>
    </nav>
  );
}

const navStyle = { 
  padding: '15px 30px', 
  background: '#1e293b', 
  color: 'white', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  gap: '10px'
};

const linkStyle = { color: '#cbd5e1', textDecoration: 'none', fontWeight: 'bold' };

const notificationBtnStyle = {
  background: '#2563eb',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.85rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap' as const
};