import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config'; 

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
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isMarketingOpen, setIsMarketingOpen] = useState(true);
  const [isOpsOpen, setIsOpsOpen] = useState(true);
  const [isHROpen, setIsHROpen] = useState(true);
  const [isCRMOpen, setIsCRMOpen] = useState(true);
  const [isSalesOpen, setIsSalesOpen] = useState(true);
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
      {/* زر التحكم بالقائمة الجانبية يظهر فقط في الشاشات الصغيرة */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          zIndex: 1000, 
          background: '#1e293b', 
          color: 'white', 
          border: 'none', 
          padding: '10px', 
          borderRadius: '5px', 
          cursor: 'pointer',
          display: window.innerWidth > 768 ? 'none' : 'block' 
        }}
      >
        {isOpen ? '✕' : '≡ القائمة'}
      </button>

      <aside style={{ 
        width: isOpen ? '240px' : '0px', 
        background: '#0f172a', 
        height: '100vh', 
        padding: isOpen ? '20px' : '0px', 
        borderLeft: '1px solid #334155', 
        position: window.innerWidth <= 768 ? 'fixed' : 'relative', 
        right: 0, 
        top: 0, 
        transition: '0.3s', 
        zIndex: 999, 
        overflowY: 'auto' 
      }}>
        {isOpen && (
          <nav style={{ marginTop: '50px' }}>
            <div style={sectionStyle}><NavItem to="/" label="لوحة التحكم" /></div>

            {/* 1. إدارة العملاء والشراكات */}
            <div style={sectionStyle}>
              <p style={sectionTitleStyle} onClick={() => setIsCRMOpen(!isCRMOpen)}>
                العملاء والشراكات {isCRMOpen ? '▼' : '▲'}
              </p>
              {isCRMOpen && (
                <div>
                  <NavItem to="/crm/leads" label="العملاء المحتملون (Leads)" />
                  <NavItem to="/crm/active" label="العملاء الفعليون" />
                  <NavItem to="/crm/clients" label="قائمة العملاء (CRM)" />
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
                  <NavItem to="/projects" label="إدارة المشاريع" />
                  <NavItem to="/tasks" label="إدارة المهام" />
                  <NavItem to="/calendar" label="جدول التقويم" />
                </div>
              )}
            </div>

            {/* 3. الحوكمة المالية */}
            {(role === 'admin') && (
              <div style={sectionStyle}>
                <p style={sectionTitleStyle} onClick={() => setIsFinanceOpen(!isFinanceOpen)}>
                  الحوكمة المالية {isFinanceOpen ? '▼' : '▲'}
                </p>
                {isFinanceOpen && (
                  <div>
                    <NavItem to="/finance/invoices" label="الفواتير والمطالبات" />
                    <NavItem to="/finance/expenses" label="مسجل المصروفات" />
                    <NavItem to="/finance/freelance" label="إدارة الفريلانسرز" />
                    <NavItem to="/finance/cash-flow" label="التدفقات النقدية" />
                    <NavItem to="/finance/pl" label="الأرباح والخسائر" />
                  </div>
                )}
              </div>
            )}

            {/* 4. إدارة التسويق */}
            <div style={sectionStyle}>
              <p style={sectionTitleStyle} onClick={() => setIsMarketingOpen(!isMarketingOpen)}>
                إدارة التسويق {isMarketingOpen ? '▼' : '▲'}
              </p>
              {isMarketingOpen && (
                <div>
                  <NavItem to="/marketing/campaigns" label="إدارة الحملات" />
                  <NavItem to="/marketing/content" label="إدارة المحتوى" />
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
                  <NavItem to="/hr" label="نظرة عامة" />
                  <NavItem to="/hr/payroll" label="مسير الرواتب" />
                  <NavItem to="/hr/performance" label="تقييم الأداء والتميز" />
                </div>
              )}
            </div>

            {/* 6. المبيعات والعقود */}
            <div style={sectionStyle}>
              <p style={sectionTitleStyle} onClick={() => setIsSalesOpen(!isSalesOpen)}>
                المبيعات والعقود {isSalesOpen ? '▼' : '▲'}
              </p>
              {isSalesOpen && (
                <div>
                  <NavItem to="/sales/quotes" label="عروض الأسعار" />
                  <NavItem to="/sales/contracts" label="العقود والاتفاقيات" />
                </div>
              )}
            </div>
          </nav>
        )}
      </aside>
    </>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  const active = useLocation().pathname === to;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={to} 
      style={{ 
        display: 'block', 
        padding: '8px 15px', 
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