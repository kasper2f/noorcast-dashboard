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

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      backgroundColor: '#0f172a' 
    }}>
      {/* القائمة الجانبية: مخفية أو فوق المحتوى في الجوال */}
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
        <Header />
        
        {/* المحتوى المتغير: تحسين الـ padding للجوال */}
        <main style={{ 
          padding: isMobile ? '15px' : '24px', 
          color: 'white',
          flex: 1
        }}>
          {/* حاوية لتجنب خروج الجداول عن الشاشة في الجوال */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}