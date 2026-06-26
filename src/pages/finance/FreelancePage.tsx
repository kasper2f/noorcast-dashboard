import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { FiPlus, FiSave } from 'react-icons/fi';

export default function FreelancePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [task, setTask] = useState({ 
    desc: '', category: '', estimatedCost: 0, actualCost: 0, sellPrice: 0, notes: '' 
  });

  const fetchTasks = async () => {
    const snapshot = await getDocs(collection(db, 'freelancers'));
    setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchTasks(); }, []);

  const saveTask = async () => {
    await addDoc(collection(db, 'freelancers'), task);
    // ترحيل تلقائي للمصروفات (ربط مع صفحة المصروفات)
    await addDoc(collection(db, 'expenses'), {
      description: `تكلفة فريلانسر: ${task.desc}`,
      amount: task.actualCost,
      date: new Date().toISOString()
    });
    fetchTasks();
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>إدارة الفريلانسرز 👨‍💻</h1>
      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}><FiPlus /> مهمة جديدة</button>

      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f8fafc', color: '#1e293b' }}>
            <th>الوصف</th><th>الفئة</th><th>التكلفة الفعلية</th><th>سعر البيع</th><th>الربح</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.id}>
              <td style={tdStyle}>{t.desc}</td>
              <td style={tdStyle}>{t.category}</td>
              <td style={tdStyle}>{t.actualCost} ر.س</td>
              <td style={tdStyle}>{t.sellPrice} ر.س</td>
              <td style={tdStyle}>{t.sellPrice - t.actualCost} ر.س</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>إضافة مهمة فريلانسر</h3>
            <input placeholder="وصف الخدمة" style={inputStyle} onChange={e => setTask({...task, desc: e.target.value})} />
            <input placeholder="الفئة" style={inputStyle} onChange={e => setTask({...task, category: e.target.value})} />
            <input type="number" placeholder="التكلفة الفعلية" style={inputStyle} onChange={e => setTask({...task, actualCost: Number(e.target.value)})} />
            <input type="number" placeholder="سعر البيع" style={inputStyle} onChange={e => setTask({...task, sellPrice: Number(e.target.value)})} />
            <button onClick={saveTask} style={primaryBtn}><FiSave /> حفظ وترحيل للمصروفات</button>
          </div>
        </div>
      )}
    </div>
  );
}

// التنسيقات
const tableStyle = { width: '100%', background: 'white', color: '#1e293b', borderCollapse: 'collapse', marginTop: '20px' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #e2e8f0' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0', boxSizing: 'border-box' as const };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContent = { background: 'white', padding: '20px', borderRadius: '8px', width: '400px', color: '#1e293b' };