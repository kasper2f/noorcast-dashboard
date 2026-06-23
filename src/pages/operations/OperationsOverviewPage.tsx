import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchAllOperations } from '@/services/firestore/operations';
import { DataTable } from '@/components/common/DataTable';
import { formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';
import type { OperationTask } from '@/types/operations';

const STATUS_LABELS: Record<OperationTask['status'], string> = {
  pending: ar.operations.status.pending,
  in_progress: ar.operations.status.inProgress,
  done: ar.operations.status.done,
};

export function OperationsOverviewPage() {
  const { employee } = useAuth();
  const { data, loading, error } = useAsyncData(
    () => fetchAllOperations(),
    [employee?.email]
  );

  const pending = data?.filter((t) => t.status !== 'done').length ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h2>{ar.pages.operations.title}</h2>
        <p>{ar.pages.operations.overview}</p>
      </div>

      {data && data.length > 0 && (
        <div className="stat-card">
          <span>{ar.operations.activeTasks}</span>
          <strong>{pending}</strong>
        </div>
      )}

      <DataTable<OperationTask>
        loading={loading}
        error={error}
        data={data ?? []}
        columns={[
          {
            key: 'employeeEmail',
            header: ar.common.email,
            render: (row) => <span dir="ltr">{row.employeeEmail}</span>,
          },
          {
            key: 'title',
            header: ar.operations.taskTitle,
            render: (row) => row.title,
          },
          {
            key: 'status',
            header: ar.operations.statusLabel,
            render: (row) => (
              <span className={`badge badge-${row.status}`}>
                {STATUS_LABELS[row.status]}
              </span>
            ),
          },
          {
            key: 'dueDate',
            header: ar.operations.dueDate,
            render: (row) => formatDate(row.dueDate),
          },
        ]}
      />
    </div>
  );
}
