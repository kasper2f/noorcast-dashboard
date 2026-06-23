import { Link } from 'react-router-dom';
import { ar } from '@/i18n/ar';

export function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <h1>{ar.pages.notFound.title}</h1>
        <Link to="/" className="btn btn-primary">
          {ar.pages.notFound.back}
        </Link>
      </div>
    </div>
  );
}
