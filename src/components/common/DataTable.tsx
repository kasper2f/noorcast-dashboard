import type { ReactNode } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ar } from '@/i18n/ar';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  error,
  emptyMessage = ar.common.noData,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="table-loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="table-error">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
