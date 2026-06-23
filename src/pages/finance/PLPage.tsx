import { useState, useEffect } from 'react';

export default function PLPage() {
  const [data, setData] = useState({ sales: 0, expenses: 0 });

  useEffect(() => {
    const invoices = JSON.parse(localStorage.getItem('invoices-data') || '[]');
    const expenses = JSON.parse(localStorage.getItem('expenses-data') || '[]');
    const sales = invoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const exp = expenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
    setData({ sales, expenses: exp });
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>تقرير الأرباح والخسائر</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px' }}>إجمالي الإيرادات: {data.sales} ر.س</div>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px' }}>إجمالي المصروفات: {data.expenses} ر.س</div>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px' }}>صافي الربح: {data.sales - data.expenses} ر.س</div>
      </div>
    </div>
  );
}