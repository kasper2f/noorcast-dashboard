import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchTasksByEmail } from '@/services/firestore/operations';
import { DataTable } from '@/components/common/DataTable';
import { formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';
import type { OperationTask } from '@/types/operations';

const STATUS_LABELS: Record<OperationTask['status'], string> = {
  pending: ar.operations.status.pending,
  in_progress: ar.operations.status.inProgress,
  done: ar.operations.status.done,
};

export function MyTasksPage() {
  const { employee } = useAuth();
  const { data, loading, error } = useAsyncData(
    () => fetchTasksByEmail(employee!.email),
    [employee?.email]
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>{ar.pages.operations.myTasks}</h2>
        <p>{ar.pages.operations.myTasksDesc}</p>
      </div>

      <DataTable<OperationTask>
        loading={loading}
        error={error}
        data={data ?? []}
        columns={[
          {
            key: 'title',
            header: ar.operations.taskTitle,
            render: (row) => row.title,
          },
          {
            key: 'description',
            header: ar.operations.description,
            render: (row) => row.description,
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
