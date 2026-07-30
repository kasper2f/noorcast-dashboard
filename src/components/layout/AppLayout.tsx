import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import { Header } from './Header';

export function AppLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // التقاط يوزر أو إيميل المستخدم الحالي من التخزين المحلي لضمان ظهوره بدقة
  const currentIdentifier = localStorage.getItem('userEmail') || localStorage.getItem('username') || 'abdullatif';

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      backgroundColor: '#0f172a' 
    }}>
      {/* القائمة الجانبية */}
      <div style={{ 
        width: isMobile ? '0px' : '250px', 
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 1000,
        height: '100%',
        transition: 'width 0.3s ease'
      }}>
        <Sidebar />
      </div>

      {/* منطقة المحتوى الرئيسية */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflowY: 'auto',
        width: '100%'
      }}>
        {/* تمرير المعرف للهيدر */}
        <Header userIdentifier={currentIdentifier} />
        
        <main style={{ 
          padding: isMobile ? '15px' : '24px', 
          color: 'white',
          flex: 1
        }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}