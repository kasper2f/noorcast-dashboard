import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PLPage() {
  const [data, setData] = useState({ sales: 0, expenses: 0 });

  useEffect(() => {
    const invoices = JSON.parse(localStorage.getItem('invoices-data') || '[]');
    const expenses = JSON.parse(localStorage.getItem('expenses-data') || '[]');
    const sales = invoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const exp = expenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
    setData({ sales, expenses: exp });
  }, []);

  const profit = data.sales - data.expenses;
  const chartData = [
    { name: 'الإيرادات', value: data.sales, color: '#10b981' },
    { name: 'المصروفات', value: data.expenses, color: '#ef4444' },
    { name: 'صافي الربح', value: profit, color: '#3b82f6' },
  ];

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>تقرير الأرباح والخسائر 📈</h1>

      {/* البطاقات الملونة الحيوية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="إجمالي الإيرادات" value={`${data.sales.toLocaleString()} ر.س`} color="#10b981" />
        <StatCard title="إجمالي المصروفات" value={`${data.expenses.toLocaleString()} ر.س`} color="#ef4444" />
        <StatCard title="صافي الربح" value={`${profit.toLocaleString()} ر.س`} color="#3b82f6" />
      </div>

      {/* منطقة الرسم البياني */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', color: '#1e293b' }}>
        <h3>تحليل الأداء المالي</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderBottom: `4px solid ${color}`, textAlign: 'center' }}>
      <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>{title}</h4>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}