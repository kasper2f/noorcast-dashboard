import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // تم تصحيح الاستيراد بإزالة الأقواس
import { Header } from './Header';

export function AppLayout() {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%', 
      overflow: 'hidden',
      backgroundColor: '#0f172a' // خلفية داكنة موحدة
    }}>
      {/* القائمة الجانبية ثابتة */}
      <div style={{ width: '250px', flexShrink: 0 }}>
        <Sidebar isFinanceOpen={true} />
      </div>

      {/* منطقة المحتوى الرئيسية */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflowY: 'auto' 
      }}>
        <Header />
        
        {/* المحتوى المتغير */}
        <main style={{ 
          padding: '24px', 
          color: 'white' 
        }}>
          {/* هنا يظهر المحتوى بناءً على الرابط المختار */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}