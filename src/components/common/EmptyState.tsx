import { ar } from '@/i18n/ar';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = ar.common.noData }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}
