import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEffect, useState } from 'react';

export default function GanttChartPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks-list') || '[]');
    // تحويل التواريخ إلى أرقام (أيام منذ البداية) ليعمل المخطط
    const formatted = savedTasks
      .filter((t: any) => t.startDate && t.endDate)
      .map((t: any) => ({
        name: t.title,
        start: new Date(t.startDate).getTime(),
        end: new Date(t.endDate).getTime(),
        duration: (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24)
      }));
    setTasks(formatted);
  }, []);

  return (
    <div style={{ padding: '24px', color: 'white' }}>
      <h1>الجدول الزمني للمهام (مخطط غانت)</h1>
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', marginTop: '20px', height: '400px' }}>
        {tasks.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tasks} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" domain={['auto', 'auto']} hide />
              <YAxis dataKey="name" type="category" stroke="#fff" />
              <Tooltip labelStyle={{ color: '#000' }} />
              <Bar dataKey="duration" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center' }}>لا توجد مهام ببيانات زمنية صالحة.</p>
        )}
      </div>
    </div>
  );
}