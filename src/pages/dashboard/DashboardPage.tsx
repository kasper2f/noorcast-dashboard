import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

export function DashboardPage() {
  const [stats, setStats] = useState<any>({ leads: 0, activeClients: 0, revenue: 0, expenses: 0 });
  const [taskData, setTaskData] = useState<any[]>([]);

  useEffect(() => {
    updateDashboard();
  }, []);

  const updateDashboard = () => {
    const clients = JSON.parse(localStorage.getItem('crm_clients') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks-list') || '[]');
    const expensesList = JSON.parse(localStorage.getItem('expenses-list') || '[]'); // مفترض وجود هذا السجل
    
    const revenue = clients
      .filter((c: any) => c.status === 'تم التعاقد')
      .reduce((acc: number, c: any) => acc + (Number(c.value) || 0), 0);

    const expenses = expensesList.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

    setTaskData([
      { name: 'مكتمل', value: tasks.filter((t: any) => t.status === 'مكتمل').length },
      { name: 'معلق', value: tasks.filter((t: any) => t.status !== 'مكتمل').length }
    ]);

    setStats({
      leads: clients.filter((c: any) => c.status !== 'تم التعاقد').length,
      activeClients: clients.filter((c: any) => c.status === 'تم التعاقد').length,
      revenue,
      expenses
    });
  };

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>لوحة التحكم المالية والتشغيلية 📈</h1>
      
      <div style={gridStyle}>
        <StatCard title="العملاء المحتملون" value={stats.leads} color="#3b82f6" />
        <StatCard title="العملاء الفعليون" value={stats.activeClients} color="#10b981" />
        <StatCard title="الإيرادات" value={`${stats.revenue.toLocaleString()} ر.س`} color="#ec4899" />
        <StatCard title="المصروفات" value={`${stats.expenses.toLocaleString()} ر.س`} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '30px' }}>
        {/* الرسم البياني الدائري للمهام */}
        <div style={chartContainerStyle}>
          <h3>توزيع المهام</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={taskData} dataKey="value" outerRadius={60} label>
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* الرسم البياني المالي (مقارنة) */}
        <div style={chartContainerStyle}>
          <h3>المقارنة المالية</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'المالية', الإيرادات: stats.revenue, المصروفات: stats.expenses }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="الإيرادات" fill="#ec4899" />
              <Bar dataKey="المصروفات" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* مؤشر النمو */}
        <div style={chartContainerStyle}>
          <h3>اتجاه الإيرادات</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[{name: 'السابق', val: 0}, {name: 'الحالي', val: stats.revenue}]}>
              <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#3b82f6" />
              <Tooltip />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: any, color: string }) {
  return (
    <div style={{...cardStyle, borderTop: `4px solid ${color}`}}>
      <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>{title}</h4>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' };
const cardStyle = { background: '#1e293b', padding: '15px', borderRadius: '12px', textAlign: 'center' as const };
const chartContainerStyle = { background: '#1e293b', padding: '15px', borderRadius: '16px' };