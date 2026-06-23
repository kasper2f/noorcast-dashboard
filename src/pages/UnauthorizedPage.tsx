import { Link } from 'react-router-dom';
import { ar } from '@/i18n/ar';

export function UnauthorizedPage() {
  return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <h1>{ar.auth.unauthorized}</h1>
        <p>{ar.auth.unauthorizedDesc}</p>
        <Link to="/login" className="btn btn-primary">
          {ar.auth.login}
        </Link>
      </div>
    </div>
  );
}
