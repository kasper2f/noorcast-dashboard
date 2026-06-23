import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/format';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(() => JSON.parse(localStorage.getItem('invoices-data') || '[]'));
  const [formData, setFormData] = useState({ number: '', client: '', amount: '', status: 'تم السداد والإيداع', dueDate: '' });

  useEffect(() => { localStorage.setItem('invoices-data', JSON.stringify(invoices)); }, [invoices]);

  const addInvoice = () => {
    if (!formData.number || !formData.amount) return;
    setInvoices([...invoices, { ...formData, id: Date.now().toString(), amount: Number(formData.amount) }]);
    setFormData({ number: '', client: '', amount: '', status: 'تم السداد والإيداع', dueDate: '' });
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter((i: any) => i.id !== id));
  };

  return (
    <div style={{ padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      <h1>الفواتير والمطالبات</h1>
      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
        <input placeholder="رقم الفاتورة المعتمد" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} style={inputStyle} />
        <input placeholder="العميل المقترن والمؤسسة" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} style={inputStyle} />
        <input type="number" placeholder="المجموع المالي الإجمالي" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={inputStyle} />
        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={inputStyle}>
          <option>تم السداد والإيداع</option>
          <option>بانتظار التحويل السريع</option>
          <option>مستحقة متأخرة الدفع</option>
        </select>
        <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} style={inputStyle} />
        <button onClick={addInvoice} style={btnStyle}>إضافة الفاتورة</button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {invoices.map((inv: any) => (
          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #334155', alignItems: 'center' }}>
            <span>{inv.number} - {inv.client}</span>
            <span>{formatCurrency(inv.amount)}</span>
            <span style={{ color: '#94a3b8' }}>{inv.status}</span>
            <span>{inv.dueDate}</span>
            <button onClick={() => deleteInvoice(inv.id)} style={deleteBtnStyle}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: 'white' };
const btnStyle = { padding: '10px', background: '#3b82f6', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' };
const deleteBtnStyle = { background: '#7f1d1d', border: 'none', color: '#f87171', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' };