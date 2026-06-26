import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; // تأكد من مطابقة مسار ملف الإعدادات لديك

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب الفواتير من قاعدة البيانات
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'invoices'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(data);
    } catch (error) {
      console.error("خطأ في جلب الفواتير: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💰 سجل الفواتير (المالية)</h1>
        <button onClick={loadInvoices} style={primaryBtn}>تحديث البيانات 🔄</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>جاري تحميل البيانات...</div>
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
                  <td style={tdStyle}>{inv.clientName}</td>
                  <td style={tdStyle}>{inv.amount}</td>
                  <td style={tdStyle}>{inv.date}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{inv.source}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>لا توجد فواتير حالياً. قم بتحويل عميل لـ "تم التعاقد" في الـ CRM لتظهر هنا!</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// التنسيقات المتناسقة مع الـ CRM
const thStyle = { padding: '12px', textAlign: 'right' as const, borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };