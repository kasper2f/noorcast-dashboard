import { useState, useEffect } from 'react';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({ title: '', project: '', advisor: '', priority: '', status: '' });

  // تحميل المهام المحفوظة عند فتح الصفحة
  useEffect(() => {
    const saved = localStorage.getItem('tasks-list');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  // دالة إضافة المهمة
  const addTask = () => {
    if (!task.title) return; // منع إضافة مهام فارغة
    const updated = [...tasks, task];
    setTasks(updated);
    localStorage.setItem('tasks-list', JSON.stringify(updated));
    setTask({ title: '', project: '', advisor: '', priority: '', status: '' }); // تصفير الحقول
  };

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '800px' }}>
      <h1>المهام والتكليفات</h1>
      
      {/* التحديث الجديد: وصف الصفحة */}
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
        هنا يمكنك إدارة ومتابعة جميع مهام فريق العمل اليومية.
      </p>

      <div style={panelStyle}>
        <h3>إضافة مهمة جديدة</h3>
        <input placeholder="عنوان وموضوع التكليف" style={inputStyle} value={task.title} onChange={e => setTask({...task, title: e.target.value})} />
        <input placeholder="المشروع المقترن بالتنفيذ" style={inputStyle} value={task.project} onChange={e => setTask({...task, project: e.target.value})} />
        
        <select style={inputStyle} value={task.advisor} onChange={e => setTask({...task, advisor: e.target.value})}>
          <option value="">-- المستشار المسؤول --</option>
          <option>المهندس كاسبر</option>
          <option>أحمد القحطاني</option>
        </select>

        <select style={inputStyle} value={task.priority} onChange={e => setTask({...task, priority: e.target.value})}>
          <option value="">-- مستوى الأولوية --</option>
          <option>قصوى</option>
          <option>عالية</option>
        </select>

        <select style={inputStyle} value={task.status} onChange={e => setTask({...task, status: e.target.value})}>
          <option value="">-- حالة الاكتمال --</option>
          <option>قيد التنفيذ</option>
          <option>مكتمل ومنتهي</option>
        </select>
        
        <button onClick={addTask} style={addBtnStyle}>إضافة هذا السجل الجديد</button>
      </div>

      {/* قائمة المهام المضافة */}
      <div style={{ marginTop: '30px' }}>
        <h2>المهام الحالية</h2>
        {tasks.map((t: any, index) => (
          <div key={index} style={taskCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{t.title}</strong>
              <span>{t.priority}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>المشروع: {t.project} | المسؤول: {t.advisor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const panelStyle = { background: '#1e293b', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #334155' };
const inputStyle = { padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', width: '100%' };
const addBtnStyle = { padding: '14px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const taskCardStyle = { background: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #334155' };