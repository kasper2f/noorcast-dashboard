import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config'; 
import { useAuthContext } from '@/context/AuthContext';

const sectionTitleStyle = { 
  fontSize: '0.85rem', 
  color: '#f8fafc', 
  margin: '20px 10px 10px 10px', 
  textTransform: 'uppercase' as const, 
  cursor: 'pointer', 
  display: 'flex', 
  justifyContent: 'space-between', 
  fontWeight: '800' 
};
const sectionStyle = { marginBottom: '20px' };

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const { adminData } = useAuthContext();
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isMarketingOpen, setIsMarketingOpen] = useState(true);
  const [isOpsOpen, setIsOpsOpen] = useState(true);
  const [isHROpen, setIsHROpen] = useState(true);
  const [isCRMOpen, setIsCRMOpen] = useState(true);
  const [isSalesOpen, setIsSalesOpen] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // الاستماع لحدث فتح/إغلاق القائمة القادم من زر الهيدر
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "employees", auth.currentUser.uid));
          if (userDoc.exists()) setRole(userDoc.data().role);
        } catch (error) {
          console.error("خطأ في جلب بيانات الموظف:", error);
        }
      }
    };
    fetchUserRole();
  }, []);

  const isAdminOrGoogleAdmin = role === 'admin' || adminData !== null;

  return (
    <>
      {/* طبقة خلفية مظلمة تتلاشى بسلاسة وبشكل تفاعلي */}
      <div 
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 998,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isOpen && window.innerWidth <= 768 ? 1 : 0,
          visibility: isOpen && window.innerWidth <= 768 ? 'visible' : 'hidden',
          transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      <aside style={{ 
        width: '260px', 
        background: '#0f172a', 
        height: '100vh', 
        padding: '20px', 
        borderLeft: '1px solid #334155', 
        position: window.innerWidth <= 768 ? 'fixed' : 'relative', 
        right: window.innerWidth <= 768 ? (isOpen ? '0px' : '-260px') : '0', 
        top: 0, 
        // موشن وسلاسة عالية جداً في الحركة والإنزلاق
        transition: window.innerWidth <= 768 ? 'right 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none', 
        zIndex: 999, 
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: window.innerWidth <= 768 && isOpen ? '-10px 0 25px rgba(0,0,0,0.5)' : 'none'
      }}>
        <nav style={{ marginTop: window.innerWidth <= 768 ? '10px' : '10px' }}>
          
          {/* زر إغلاق يدوي (✕) داخل السايد بار للجوال */}
          {window.innerWidth <= 768 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#1e293b',
                  color: '#ef4444',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  transition: 'transform 0.2s ease'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label="إغلاق القائمة"
              >
                ✕
              </button>
            </div>
          )}

          <div style={sectionStyle}><NavItem to="/" label="لوحة التحكم" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} /></div>

          {/* 1. إدارة العملاء والشراكات */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle} onClick={() => setIsCRMOpen(!isCRMOpen)}>
              العملاء والشراكات {isCRMOpen ? '▼' : '▲'}
            </p>
            {isCRMOpen && (
              <div>
                <NavItem to="/crm/leads" label="العملاء المحتملون (Leads)" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/crm/active" label="العملاء الفعليون" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/crm/clients" label="قائمة العملاء (CRM)" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
              </div>
            )}
          </div>

          {/* 2. إدارة التشغيل */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle} onClick={() => setIsOpsOpen(!isOpsOpen)}>
              إدارة التشغيل {isOpsOpen ? '▼' : '▲'}
            </p>
            {isOpsOpen && (
              <div>
                <NavItem to="/projects" label="إدارة المشاريع" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/tasks" label="إدارة المهام" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/calendar" label="جدول التقويم" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/projects/freelancer-archive" label="المستقلون والمزودون" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
              </div>
            )}
          </div>

          {/* 3. الحوكمة المالية */}
          {isAdminOrGoogleAdmin && (
            <div style={sectionStyle}>
              <p style={sectionTitleStyle} onClick={() => setIsFinanceOpen(!isFinanceOpen)}>
                الحوكمة المالية {isFinanceOpen ? '▼' : '▲'}
              </p>
              {isFinanceOpen && (
                <div>
                  <NavItem to="/finance/invoices" label="المطالبات" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                  <NavItem to="/finance/expenses" label="الايرادات المصروفات" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                  <NavItem to="/finance/fixed-expenses" label="المصروفات الثابتة والاشتراكات" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                  <NavItem to="/finance/freelance" label="إدارة الفريلانسرز" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                  <NavItem to="/finance/investors" label="مستحقات وحصص المستثمرين" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                  <NavItem to="/finance/cash-flow" label="التدفقات النقدية" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                  <NavItem to="/finance/pl" label="الأرباح والخسائر" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                </div>
              )}
            </div>
          )}

          {/* 4. إدارة التسويق والنمو الذاتي */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle} onClick={() => setIsMarketingOpen(!isMarketingOpen)}>
              إدارة التسويق {isMarketingOpen ? '▼' : '▲'}
            </p>
            {isMarketingOpen && (
              <div>
                <NavItem to="/marketing" label="غرفة عمليات التسويق 🚀" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
              </div>
            )}
          </div>

          {/* 5. الموارد البشرية */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle} onClick={() => setIsHROpen(!isHROpen)}>
              الموارد البشرية {isHROpen ? '▼' : '▲'}
            </p>
            {isHROpen && (
              <div>
                <NavItem to="/hr" label="نظرة عامة" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/hr/payroll" label="مسير الرواتب" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/hr/performance" label="تقييم الأداء والتميز" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/hr/admin-control" label="التحكم الإداري والحوكمة" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
              </div>
            )}
          </div>

          {/* 6. الفواتير والعقود والأرشيف المنظم */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle} onClick={() => setIsSalesOpen(!isSalesOpen)}>
              الفواتير والعقود {isSalesOpen ? '▼' : '▲'}
            </p>
            {isSalesOpen && (
              <div>
                <NavItem to="/sales/contracts" label="الفواتير وعروض الأسعار" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
                <NavItem to="/sales/archive" label="العقود والأرشيف القانوني" onClose={() => window.innerWidth <= 768 && setIsOpen(false)} />
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}

function NavItem({ to, label, onClose }: { to: string; label: string; onClose?: () => void }) {
  const active = useLocation().pathname === to;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={to} 
      onClick={onClose} 
      style={{ 
        display: 'block', 
        padding: '10px 15px', 
        textDecoration: 'none', 
        color: active ? '#3b82f6' : (isHovered ? '#ffffff' : '#94a3b8'), 
        fontSize: '0.9rem', 
        fontWeight: active ? 'bold' : 'normal',
        backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateX(5px)' : 'translateX(0px)'
      }}
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {label}
    </Link>
  );
}