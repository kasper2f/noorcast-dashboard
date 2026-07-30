import { useState, useEffect } from 'react';
import { getOrders } from '@/services/dbService';

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  // دالة ذكية ومحصنة لاستخراج الأرقام بدقة من أي نص سعر لمنع ظهور NaN
  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();
      
      const records = Array.isArray(orders) ? orders
        .filter((item: any) => {
          if (!item) return false;
          const status = String(item.status || '').trim().toLowerCase();
          return status.includes('تم التنفيذ') || status.includes('مكتمل') || status.includes('تعاقد') || status.includes('مدفوع');
        })
        .map((item: any, index: number) => ({
          id: String(item.id || item.orderId || index),
          clientName: String(item.clientName || item.name || item.customerName || 'عميل نوركاست'),
          amount: cleanPrice(item.amount ?? item.price ?? item.total ?? 0),
          date: String(item.date || item.createdAt || 'غير محدد'),
          status: String(item.status || 'تم التنفيذ').trim(),
          source: String(item.source || 'الموقع الإلكتروني')
        })) : [];

      setInvoices(records);
    } catch (error) {
      console.error("خطأ في جلب بيانات المالية من قوقل شيت: ", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💰 الحوكمة المالية والإيرادات (Google Sheets)</h1>
        <button onClick={loadFinancialData} style={primaryBtn}>تحديث البيانات 🔄</button>
      </div>

      {/* بطاقة إجمالي الإيرادات للطلبات المنفذة */}
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', margin: '20px 0', border: '1px solid #334155' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>إجمالي الإيرادات (للطلبات المنفذة):</span>
        <strong style={{ display: 'block', fontSize: '2rem', marginTop: '5px', color: '#38bdf8' }}>
          {totalAmount.toLocaleString()} ر.س
        </strong>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>جاري تحميل البيانات المالية...</div>
      ) : (
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', background: 'white', color: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={thStyle}>اسم العميل</th>
              <th style={thStyle}>المبلغ (ر.س)</th>
              <th style={thStyle}>التاريخ</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>المصدر</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((inv: any) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>{inv.clientName}</td>
                  <td style={{ ...tdStyle, color: '#166534', fontWeight: 'bold' }}>{inv.amount.toLocaleString()} ر.س</td>
                  <td style={tdStyle}>{inv.date}</td>
                  
                  {/* تنسيق الحالة لتبدو مرتبة وعمودية */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span style={{ padding: '6px 10px', borderRadius: '6px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', textAlign: 'center' }}>
                        {inv.status}
                      </span>
                    </div>
                  </td>

                  <td style={tdStyle}>{inv.source}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  لا توجد طلبات حالتُها "تم التنفيذ" حالياً. قم بتغيير حالة أي طلب في لوحة التحكم إلى "تم التنفيذ" ليظهر هنا تلقائياً!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'right' as const, borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };