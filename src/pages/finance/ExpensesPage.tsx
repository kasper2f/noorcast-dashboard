import { useState, useEffect } from 'react';

// تعريف التنسيقات محلياً داخل الملف لتجنب خطأ الـ ReferenceError
const inputStyle = { padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: 'white', width: '100%' };
const btnStyle = { padding: '10px', background: '#3b82f6', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' };
const deleteBtnStyle = { background: '#7f1d1d', border: 'none', color: '#f87171', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses-data') || '[]'));
  const [formData, setFormData] = useState({ description: '', category: 'تشغيل', amount: '', responsible: '' });

  useEffect(() => { localStorage.setItem('expenses-data', JSON.stringify(expenses)); }, [expenses]);

  const addExpense = () => {
    if (!formData.description || !formData.amount) return;
    setExpenses([...expenses, { ...formData, id: Date.now().toString(), amount: Number(formData.amount) }]);
    setFormData({ description: '', category: 'تشغيل', amount: '', responsible: '' });
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e: any) => e.id !== id));
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>مسجل المصروفات</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', background: '#0f172a', padding: '20px', borderRadius: '12px' }}>
        <input placeholder="الوصف" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle}>
          <option>تشغيل</option><option>رواتب</option><option>تسويق</option>
        </select>
        <input type="number" placeholder="المبلغ (ر.س)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={inputStyle} />
        <input placeholder="المسؤول" value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} style={inputStyle} />
        <button onClick={addExpense} style={{...btnStyle, background: '#ef4444', gridColumn: 'span 2'}}>تسجيل المصروف</button>
      </div>
      <div style={{ marginTop: '20px', background: '#1e293b', borderRadius: '12px' }}>
        {expenses.map((exp: any) => (
          <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #334155' }}>
            <span>{exp.description} ({exp.category})</span>
            <span>{exp.amount} ر.س</span>
            <button onClick={() => deleteExpense(exp.id)} style={deleteBtnStyle}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}