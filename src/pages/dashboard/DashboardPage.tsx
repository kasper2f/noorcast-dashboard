import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const [data, setData] = useState({ invoices: [], expenses: [] });

  useEffect(() => {
    setData({
      invoices: JSON.parse(localStorage.getItem('invoices-data') || '[]'),
      expenses: JSON.parse(localStorage.getItem('expenses-data') || '[]')
    });
  }, []);

  // تجهيز البيانات للرسم البياني
  const chartData = [
    { name: 'الإيرادات', value: data.invoices.reduce((s: number, i: any) => s + Number(i.amount), 0) },
    { name: 'المصروفات', value: data.expenses.reduce((s: number, e: any) => s + Number(e.amount), 0) },
    { name: 'صافي الربح', value: data.invoices.reduce((s: number, i: any) => s + Number(i.amount), 0) - data.expenses.reduce((s: number, e: any) => s + Number(e.amount), 0) }
  ];

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>لوحة التحكم: نظرة عامة</h1>

      {/* الرسم البياني */}
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', height: '300px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* الكروت الإحصائية كما كانت */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
         {/* يمكنك إضافة الكروت هنا كما فعلنا سابقاً */}
      </div>
    </div>
  );
}