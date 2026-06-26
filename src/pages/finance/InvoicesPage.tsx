import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/format';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(() => JSON.parse(localStorage.getItem('invoices-data') || '[]'));
  const [formData, setFormData] = useState({ id: '', number: '', client: '', amount: '', status: 'تم السداد والإيداع', dueDate: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('invoices-data', JSON.stringify(invoices)); }, [invoices]);

  const handleSaveInvoice = () => {
    if (!formData.number || !formData.amount) return;
    
    if (editingId) {
      // تعديل فاتورة قائمة
      setInvoices(invoices.map(inv => inv.id === editingId ? { ...formData, id: editingId, amount: Number(formData.amount) } : inv));
    } else {
      // إضافة فاتورة جديدة
      setInvoices([...invoices, { ...formData, id: Date.now().toString(), amount: Number(formData.amount) }]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ id: '', number: '', client: '', amount: '', status: 'تم السداد والإيداع', dueDate: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setFormData(inv);
    setIsModalOpen(true);
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter((i: any) => i.id !== id));
  };

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>الفواتير والمطالبات</h1>
      
      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>+ إضافة فاتورة جديدة</button>

      {/* مودال الإضافة والتعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editingId ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}</h3>
            <input placeholder="رقم الفاتورة" style={inputStyle} value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
            <input placeholder="العميل" style={inputStyle} value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
            <input type="number" placeholder="المبلغ" style={inputStyle} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option>تم السداد والإيداع</option>
              <option>بانتظار التحويل السريع</option>
              <option>مستحقة متأخرة الدفع</option>
            </select>
            <input type="date" style={inputStyle} value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSaveInvoice} style={primaryBtn}>حفظ</button>
              <button onClick={resetForm} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول الأبيض */}
      <table style={{ width: '100%', marginTop: '20px', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#1e293b' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {['الفاتورة', 'العميل', 'المبلغ', 'الحالة', 'تاريخ الاستحقاق', 'إجراء'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv: any) => (
            <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{inv.number}</td>
              <td style={tdStyle}>{inv.client}</td>
              <td style={tdStyle}>{formatCurrency(inv.amount)}</td>
              <td style={tdStyle}>{inv.status}</td>
              <td style={tdStyle}>{inv.dueDate}</td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(inv)} style={{border:'none', background:'none', cursor:'pointer', marginRight: '10px'}}>✏️</button>
                <button onClick={() => deleteInvoice(inv.id)} style={{border:'none', background:'none', cursor:'pointer'}}>🗑️</button>
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
const primaryBtn = { padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const secondaryBtn = { padding: '10px 20px', background: '#64748b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '12px', width: '400px', color: '#1e293b' };