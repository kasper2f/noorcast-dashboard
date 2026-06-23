import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const sectionTitleStyle = { fontSize: '0.75rem', color: '#64748b', margin: '20px 10px 10px 10px', textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' };
const sectionStyle = { marginBottom: '20px' };

export default function Sidebar() {
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isOpsOpen, setIsOpsOpen] = useState(true);

  return (
    <aside style={{ width: '240px', background: '#0f172a', height: '100vh', padding: '20px', borderLeft: '1px solid #334155' }}>
      <nav>
        {/* لوحة التحكم */}
        <div style={sectionStyle}>
            <NavItem to="/" label="لوحة التحكم" />
        </div>

        {/* قسم المالية */}
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

        {/* الموارد البشرية والأدوات */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>الموارد البشرية</p>
          <NavItem to="/hr" label="نظرة عامة" />
          <NavItem to="/hr/my-profile" label="سجل الموظفين" />
        </div>

        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>أدوات</p>
          <NavItem to="/assistant" label="مساعد الذكاء الاصطناعي" />
        </div>
      </nav>
    </aside>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  const active = useLocation().pathname === to;
  return (
    <Link to={to} style={{ 
      display: 'block', 
      padding: '8px 10px', 
      textDecoration: 'none', 
      color: active ? '#3b82f6' : '#94a3b8', 
      fontSize: '0.9rem' 
    }}>
      {label}
    </Link>
  );
}