import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchInvoices = async () => {
    // سنقوم لاحقاً بربطها بـ collection 'invoices'
    const querySnapshot = await getDocs(collection(db, 'invoices'));
    setInvoices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchInvoices(); }, []);

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>الفواتير والمالية 💰</h1>
      <table style={{ width: '100%', background: 'white', color: '#1e293b', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', color: '#475569' }}>
            <th style={thStyle}>العميل</th><th style={thStyle}>المبلغ</th><th style={thStyle}>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{inv.clientName}</td>
              <td style={tdStyle}>{inv.amount} ر.س</td>
              <td style={tdStyle}>مدفوع</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'right' as const };
const tdStyle = { padding: '12px', textAlign: 'right' as const };