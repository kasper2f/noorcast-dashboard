import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchAllFinance } from '@/services/firestore/finance';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';
import type { FinanceRecord } from '@/types/finance';

const TYPE_LABELS: Record<FinanceRecord['type'], string> = {
  salary: ar.finance.types.salary,
  bonus: ar.finance.types.bonus,
  expense: ar.finance.types.expense,
  invoice: ar.finance.types.invoice,
};

export function FinanceOverviewPage() {
  const { employee } = useAuth();
  const { data, loading, error } = useAsyncData(
    () => fetchAllFinance(),
    [employee?.email]
  );

  const total = data?.reduce((sum, r) => sum + r.amount, 0) ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h2>{ar.pages.finance.title}</h2>
        <p>{ar.pages.finance.overview}</p>
      </div>

      {data && data.length > 0 && (
        <div className="stat-card">
          <span>{ar.finance.totalAmount}</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      )}

      <DataTable<FinanceRecord>
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
            key: 'type',
            header: ar.finance.type,
            render: (row) => TYPE_LABELS[row.type],
          },
          {
            key: 'amount',
            header: ar.finance.amount,
            render: (row) => formatCurrency(row.amount),
          },
          {
            key: 'description',
            header: ar.finance.description,
            render: (row) => row.description,
          },
          {
            key: 'date',
            header: ar.finance.date,
            render: (row) => formatDate(row.date),
          },
        ]}
      />
    </div>
  );
}
