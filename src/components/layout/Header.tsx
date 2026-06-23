import { useNavigate } from 'react-router-dom';
import { logout } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { ar } from '@/i18n/ar';

export function Header() {
  const { employee } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="header">
      <div className="header-info">
        {employee && (
          <>
            <span className="header-name">{employee.fullName}</span>
            <span className="header-meta">
              {ar.departments[employee.department]} · {ar.roles[employee.role]}
            </span>
          </>
        )}
      </div>
      <button type="button" className="btn btn-ghost" onClick={handleLogout}>
        {ar.auth.logout}
      </button>
    </header>
  );
}
