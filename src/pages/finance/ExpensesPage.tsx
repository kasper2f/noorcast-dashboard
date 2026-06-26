import { useState, useEffect } from 'react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses-data') || '[]'));
  const [formData, setFormData] = useState({ id: '', description: '', category: 'تشغيل', amount: '', responsible: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('expenses-data', JSON.stringify(expenses)); }, [expenses]);

  const handleSaveExpense = () => {
    if (!formData.description || !formData.amount) return;
    
    if (editingId) {
      // تعديل مصروف قائم
      setExpenses(expenses.map(exp => exp.id === editingId ? { ...formData, id: editingId, amount: Number(formData.amount) } : exp));
    } else {
      // إضافة مصروف جديد
      setExpenses([...expenses, { ...formData, id: Date.now().toString(), amount: Number(formData.amount) }]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ id: '', description: '', category: 'تشغيل', amount: '', responsible: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const startEdit = (exp: any) => {
    setEditingId(exp.id);
    setFormData(exp);
    setIsModalOpen(true);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e: any) => e.id !== id));
  };

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>مسجل المصروفات</h1>
      
      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>+ إضافة مصروف جديد</button>

      {/* مودال الإضافة والتعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editingId ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h3>
            <input placeholder="الوصف" style={inputStyle} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>تشغيل</option><option>رواتب</option><option>تسويق</option><option>أخرى</option>
            </select>
            <input type="number" placeholder="المبلغ (ر.س)" style={inputStyle} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            <input placeholder="المسؤول" style={inputStyle} value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSaveExpense} style={primaryBtn}>حفظ</button>
              <button onClick={resetForm} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول الأبيض */}
      <table style={{ width: '100%', marginTop: '20px', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#1e293b' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {['الوصف', 'التصنيف', 'المبلغ', 'المسؤول', 'إجراء'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp: any) => (
            <tr key={exp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{exp.description}</td>
              <td style={tdStyle}>{exp.category}</td>
              <td style={{...tdStyle, fontWeight: 'bold'}}>{Number(exp.amount).toLocaleString()} ر.س</td>
              <td style={tdStyle}>{exp.responsible}</td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(exp)} style={{border:'none', background:'none', cursor:'pointer', marginRight: '10px'}}>✏️</button>
                <button onClick={() => deleteExpense(exp.id)} style={{border:'none', background:'none', cursor:'pointer'}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// التنسيقات الموحدة
const thStyle = { padding: '12px', textAlign: 'right' as const, color: '#64748b' };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' as const };
const primaryBtn = { padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const secondaryBtn = { padding: '10px 20px', background: '#64748b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '12px', width: '400px', color: '#1e293b' };