import { useState, useEffect } from 'react';

export default function TaskManager() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [task, setTask] = useState({ title: '', project: '', priority: '', status: 'قيد التنفيذ', notes: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('tasks-list');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  const saveTasks = (newTasks: any[]) => {
    setTasks(newTasks);
    localStorage.setItem('tasks-list', JSON.stringify(newTasks));
  };

  const handleSaveTask = () => {
    if (!task.title) return;
    if (editingId !== null) {
      saveTasks(tasks.map(t => t.id === editingId ? { ...task, id: editingId } : t));
      setEditingId(null);
    } else {
      saveTasks([...tasks, { ...task, id: Date.now() }]);
    }
    setTask({ title: '', project: '', priority: '', status: 'قيد التنفيذ', notes: '' });
    setIsModalOpen(false);
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setTask(t);
    setIsModalOpen(true);
  };

  const deleteTask = (id: number) => saveTasks(tasks.filter(t => t.id !== id));

  const toggleStatus = (id: number) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'مكتمل' ? 'قيد التنفيذ' : 'مكتمل' } : t));
  };

  const filteredTasks = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>إدارة المهام والتكليفات</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => { setEditingId(null); setTask({ title: '', project: '', priority: '', status: 'قيد التنفيذ', notes: '' }); setIsModalOpen(true); }} style={primaryBtn}>+ إضافة مهمة جديدة</button>
        <select style={selectStyle} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مكتمل">مكتمل</option>
        </select>
      </div>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editingId ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
            <input placeholder="عنوان المهمة" style={inputStyle} value={task.title} onChange={e => setTask({...task, title: e.target.value})} />
            <input placeholder="اسم المشروع" style={inputStyle} value={task.project} onChange={e => setTask({...task, project: e.target.value})} />
            <select style={inputStyle} value={task.priority} onChange={e => setTask({...task, priority: e.target.value})}>
              <option value="">-- الأولوية --</option>
              <option>عالية</option>
              <option>متوسطة</option>
              <option>منخفضة</option>
            </select>
            <textarea placeholder="اكتب ملاحظاتك هنا..." style={{...inputStyle, height: '80px'}} value={task.notes} onChange={e => setTask({...task, notes: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSaveTask} style={primaryBtn}>حفظ</button>
              <button onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <table style={{ width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#1e293b' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {['العنوان', 'المشروع', 'الأولوية', 'الملاحظات', 'الحالة', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{t.title}</td>
              <td style={tdStyle}>{t.project}</td>
              <td style={tdStyle}>{t.priority}</td>
              <td style={tdStyle}>{t.notes}</td>
              <td style={tdStyle}>
                <button onClick={() => toggleStatus(t.id)} style={{...statusBtn, background: t.status === 'مكتمل' ? '#10b981' : '#64748b'}}>
                  {t.status}
                </button>
              </td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(t)} style={{border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px'}}>✏️</button>
                <button onClick={() => deleteTask(t.id)} style={{border: 'none', background: 'none', cursor: 'pointer'}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'right' as const, color: '#64748b' };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' as const };
const selectStyle = { padding: '8px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' };
const primaryBtn = { padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const secondaryBtn = { padding: '10px 20px', background: '#64748b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const statusBtn = { border: 'none', borderRadius: '4px', padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '12px', width: '400px', color: '#1e293b' };