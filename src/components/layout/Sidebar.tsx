import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
const sectionTitleStyle = { fontSize: '0.75rem', color: '#64748b', margin: '20px 10px 10px 10px', textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' };
const sectionStyle = { marginBottom: '20px' };

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isOpsOpen, setIsOpsOpen] = useState(true);
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

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

  return (
    <>
      {/* زر القائمة للموبايل */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 1000, background: '#1e293b', color: 'white', border: 'none', padding: '10px', borderRadius: '5px' }}
      >
        {isOpen ? '✕' : '≡ القائمة'}
      </button>

      {/* الـ Sidebar */}
      <aside style={{ 
        width: isOpen ? '240px' : '0px', 
        background: '#0f172a', 
        height: '100vh', 
        padding: isOpen ? '20px' : '0px',
        borderLeft: '1px solid #334155',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: '0.3s',
        zIndex: 999,
        overflowY: 'auto'
      }}>
        {isOpen && (
          <nav style={{ marginTop: '50px' }}>
            <div style={sectionStyle}><NavItem to="/" label="لوحة التحكم" /></div>

            {/* قسم المالية - يظهر للمدير فقط */}
            {(role === 'admin') && (
              <div style={sectionStyle}>
                <p style={sectionTitleStyle} onClick={() => setIsFinanceOpen(!isFinanceOpen)}>
                  المالية {isFinanceOpen ? '▼' : '▲'}
                </p>
                {isFinanceOpen && (
                  <div>
                    <NavItem to="/finance/invoices" label="الفواتير والمطالبات" />
                    <NavItem to="/finance/expenses" label="مسجل المصروفات" />
                    <NavItem to="/finance/cash-flow" label="التدفقات النقدية" />
                    <NavItem to="/finance/pl" label="الأرباح والخسائر" />
                  </div>
                )}
              </div>
            )}

            {/* قسم التشغيل */}
            <div style={sectionStyle}>
              <p style={sectionTitleStyle} onClick={() => setIsOpsOpen(!isOpsOpen)}>
                التشغيل {isOpsOpen ? '▼' : '▲'}
              </p>
              {isOpsOpen && (
                <div>
                  <NavItem to="/projects" label="إدارة المشاريع" />
                  <NavItem to="/tasks" label="إدارة المهام" />
                  <NavItem to="/calendar" label="جدول التقويم" />
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <p style={sectionTitleStyle}>الموارد البشرية</p>
              <NavItem to="/hr" label="نظرة عامة" />
              <NavItem to="/hr/my-profile" label="سجل الموظفين" />
            </div>
          </nav>
        )}
      </aside>
    </>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  const active = useLocation().pathname === to;
  return (
    <Link to={to} style={{ display: 'block', padding: '8px 10px', textDecoration: 'none', color: active ? '#3b82f6' : '#94a3b8', fontSize: '0.9rem' }}>
      {label}
    </Link>
  );
}