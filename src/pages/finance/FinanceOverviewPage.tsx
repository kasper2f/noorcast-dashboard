import { useState, useEffect } from 'react';
import { getOrders } from '@/services/dbService';
import { DataTable } from '@/components/common/DataTable';
import { formatCurrency, formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';

export function FinanceOverviewPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      console.log("جاري جلب الطلبات من Google Sheets...");
      const orders = await getOrders();
      console.log("البيانات المستلمة من الشيت:", orders);
      
      const records = Array.isArray(orders) ? orders : [];

      const financialRecords = records
        .filter((item: any) => {
          const status = (item.status || '').trim().toLowerCase();
          console.log(`حالة الطلب للعميل ${item.clientName || item.name}:`, status);
          return status.includes('تم التنفيذ') || status.includes('مكتمل') || status.includes('تعاقد') || status.includes('مدفوع');
        })
        .map((item: any, index: number) => ({
          id: item.id || item.orderId || index,
          employeeEmail: item.clientEmail || item.email || item.clientName || 'عميل نوركاست',
          type: 'invoice',
          amount: parseFloat(item.amount || item.price || item.total || '0'),
          description: item.service || item.description || 'خدمة تسويقية أو برمجية',
          date: item.date || item.createdAt || new Date().toISOString(),
          status: item.status || 'تم التنفيذ'
        }));

      console.log("البيانات المالية بعد التصفية:", financialRecords);
      setData(financialRecords);
    } catch (err: any) {
      console.error("Error loading financial overview:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const total = data.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{ar.pages.finance.title}</h2>
          <p>{ar.pages.finance.overview}</p>
        </div>
        <button onClick={loadFinancialData} className="btn btn-primary" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          تحديث البيانات 🔄
        </button>
      </div>

      {data.length > 0 && (
        <div className="stat-card" style={{ background: '#1e293b', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <span style={{ color: '#94a3b8' }}>{ar.finance.totalAmount}</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '5px' }}>{formatCurrency(total)}</strong>
        </div>
      )}

      <DataTable<any>
        loading={loading}
        error={error}
        data={data}
        columns={[
          {
            key: 'employeeEmail',
            header: 'البريد / العميل',
            render: (row) => <span dir="ltr">{row.employeeEmail}</span>,
          },
          {
            key: 'type',
            header: ar.finance.type,
            render: () => 'إيراد / فاتورة',
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