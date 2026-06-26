import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={navStyle}>
      <h2 style={{ margin: 0, fontSize: '18px' }}>نظام Noorcast 🎬</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link style={linkStyle} to="/">الرئيسية</Link>
        <Link style={linkStyle} to="/crm/clients">العملاء</Link>
        <Link style={linkStyle} to="/finance/invoices">الفواتير</Link>
        <Link style={linkStyle} to="/marketing/campaigns">الحملات</Link>
        <Link style={linkStyle} to="/marketing/content">المحتوى</Link>
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
  alignItems: 'center' 
};
const linkStyle = { color: '#cbd5e1', textDecoration: 'none', fontWeight: 'bold' };