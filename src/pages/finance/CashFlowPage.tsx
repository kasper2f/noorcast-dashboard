export default function CashFlowPage() {
  const invoices = JSON.parse(localStorage.getItem('invoices-data') || '[]');
  const expenses = JSON.parse(localStorage.getItem('expenses-data') || '[]');

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>التدفقات النقدية</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, background: '#16a34a', padding: '20px', borderRadius: '12px' }}>
          <h3>التدفق الداخل (Cash In)</h3>
          <p style={{ fontSize: '1.5rem' }}>{invoices.reduce((sum: number, i: any) => sum + i.amount, 0)} ر.س</p>
        </div>
        <div style={{ flex: 1, background: '#dc2626', padding: '20px', borderRadius: '12px' }}>
          <h3>التدفق الخارج (Cash Out)</h3>
          <p style={{ fontSize: '1.5rem' }}>{expenses.reduce((sum: number, e: any) => sum + e.amount, 0)} ر.س</p>
        </div>
      </div>
    </div>
  );
}