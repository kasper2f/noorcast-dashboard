import { useState } from 'react';

const initialPayroll = [
  { id: 1, name: 'عهود احمد عبدالله', role: 'مديرة تسويق', salary: 15000, projectBonus: 5, netSalary: 15750 }
];

export default function HRPayroll() {
  const [payrollData, setPayrollData] = useState(initialPayroll);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const handleSave = () => {
    if (editingEntry.id) {
      setPayrollData(payrollData.map(p => p.id === editingEntry.id ? editingEntry : p));
    } else {
      setPayrollData([...payrollData, { ...editingEntry, id: Date.now() }]);
    }
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const deleteEntry = (id: number) => {
    setPayrollData(payrollData.filter(p => p.id !== id));
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💰 مسير الرواتب</h1>
        <button onClick={() => { setEditingEntry({ name: '', role: '', salary: 0, projectBonus: 0, netSalary: 0 }); setIsModalOpen(true); }} style={primaryBtn}>+ إضافة جديد</button>
      </div>

      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', background: 'white', color: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['الاسم', 'المسمى الوظيفي', 'الراتب', 'نسبة المشاريع', 'صافي الراتب', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {payrollData.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{p.role}</td>
              <td style={tdStyle}>{p.salary} ر.س</td>
              <td style={tdStyle}>{p.projectBonus}%</td>
              {/* تم دمج الـ style هنا لحل الخطأ */}
              <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669' }}>{p.netSalary} ر.س</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setEditingEntry(p); setIsModalOpen(true); }} style={actionIconBtn}>✏️</button>
                  <button onClick={() => deleteEntry(p.id)} style={actionIconBtn}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalStyle}>
            <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>{editingEntry.id ? '✏️ تعديل السجل' : '➕ إضافة سجل جديد'}</h2>
            <div style={fieldGroup}><label style={labelStyle}>الاسم الوظيفي الكامل *</label><input style={inputStyle} value={editingEntry.name} onChange={e => setEditingEntry({...editingEntry, name: e.target.value})} /></div>
            <div style={fieldGroup}><label style={labelStyle}>الدور / المسمى الوظيفي *</label><input style={inputStyle} value={editingEntry.role} onChange={e => setEditingEntry({...editingEntry, role: e.target.value})} /></div>
            <div style={rowStyle}>
                <div style={fieldGroup}><label style={labelStyle}>الراتب الأساسي</label><input type="number" style={inputStyle} value={editingEntry.salary} onChange={e => setEditingEntry({...editingEntry, salary: Number(e.target.value)})} /></div>
                <div style={fieldGroup}><label style={labelStyle}>نسبة المشاريع (%)</label><input type="number" style={inputStyle} value={editingEntry.projectBonus} onChange={e => setEditingEntry({...editingEntry, projectBonus: Number(e.target.value)})} /></div>
            </div>
            <div style={fieldGroup}><label style={labelStyle}>صافي الراتب</label><input type="number" style={inputStyle} value={editingEntry.netSalary} onChange={e => setEditingEntry({...editingEntry, netSalary: Number(e.target.value)})} /></div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} style={primaryBtn}>{editingEntry.id ? 'حفظ التعديلات' : 'إضافة السجل'}</button>
              <button onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'right' as const };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const actionIconBtn = { border: 'none', background: '#f1f5f9', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', marginTop: '5px' };
const labelStyle = { fontSize: '0.75rem', color: '#64748b' };
const fieldGroup = { display: 'flex', flexDirection: 'column' as const, marginBottom: '15px' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const modalStyle = { background: 'white', color: '#1e293b', padding: '30px', borderRadius: '16px', width: '500px' };
const modalOverlay = { position: 'fixed' as const, top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000 };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const secondaryBtn = { background: 'transparent', color: '#64748b', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' };