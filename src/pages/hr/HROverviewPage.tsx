import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchAllHR } from '@/services/firestore/hr';
import { DataTable } from '@/components/common/DataTable';
import { formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';
import type { HRRecord } from '@/types/hr';

const LEAVE_LABELS: Record<HRRecord['leaveType'], string> = {
  annual: ar.hr.leaveTypes.annual,
  sick: ar.hr.leaveTypes.sick,
  unpaid: ar.hr.leaveTypes.unpaid,
};

export function HROverviewPage() {
  const { employee } = useAuth();
  const { data, loading, error } = useAsyncData(
    () => fetchAllHR(),
    [employee?.email]
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>{ar.pages.hr.title}</h2>
        <p>{ar.pages.hr.overview}</p>
      </div>

      <DataTable<HRRecord>
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
            key: 'leaveType',
            header: ar.hr.leaveType,
            render: (row) => LEAVE_LABELS[row.leaveType],
          },
          {
            key: 'leaveBalance',
            header: ar.hr.leaveBalance,
            render: (row) => `${row.leaveBalance} ${ar.hr.days}`,
          },
          {
            key: 'contractType',
            header: ar.hr.contractType,
            render: (row) => row.contractType,
          },
          {
            key: 'startDate',
            header: ar.hr.startDate,
            render: (row) => formatDate(row.startDate),
          },
        ]}
      />
    </div>
  );
}
