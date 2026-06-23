import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchHRByEmail } from '@/services/firestore/hr';
import { formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';

const LEAVE_LABELS = ar.hr.leaveTypes;

export function MyProfilePage() {
  const { employee } = useAuth();
  const { data: hrRecords, loading } = useAsyncData(
    () => fetchHRByEmail(employee!.email),
    [employee?.email]
  );

  const hr = hrRecords?.[0];

  return (
    <div className="page">
      <div className="page-header">
        <h2>{ar.pages.hr.myProfile}</h2>
        <p>{ar.pages.hr.myProfileDesc}</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>الاسم</h3>
          <p>{employee?.fullName}</p>
        </div>
        <div className="card">
          <h3>{ar.common.email}</h3>
          <p dir="ltr">{employee?.email}</p>
        </div>
        <div className="card">
          <h3>{ar.common.department}</h3>
          <p>{employee ? ar.departments[employee.department] : '—'}</p>
        </div>
        <div className="card">
          <h3>{ar.common.role}</h3>
          <p>{employee ? ar.roles[employee.role] : '—'}</p>
        </div>
      </div>

      {!loading && hr && (
        <div className="card-grid" style={{ marginTop: '1rem' }}>
          <div className="card">
            <h3>{ar.hr.leaveType}</h3>
            <p>{LEAVE_LABELS[hr.leaveType]}</p>
          </div>
          <div className="card">
            <h3>{ar.hr.leaveBalance}</h3>
            <p>{hr.leaveBalance} {ar.hr.days}</p>
          </div>
          <div className="card">
            <h3>{ar.hr.contractType}</h3>
            <p>{hr.contractType}</p>
          </div>
          <div className="card">
            <h3>{ar.hr.startDate}</h3>
            <p>{formatDate(hr.startDate)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
