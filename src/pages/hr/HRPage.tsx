import { useState } from 'react';

const initialEmployees = [{
  id: 1, name: 'عهود احمد عبدالله', role: 'مديرة تسويق', email: 'tollystore.sa@gmail.com',
  phone: '0501234567', status: 'نشط ومتواجد بالخدمة', initial: 'ع', color: '#f59e0b',
  kpi: { financialTarget: 100000, financialAchieved: 85000, callsTarget: 200, callsDone: 180, dealsClosed: 35, rating: 4.7 }
}];

export default function HRPage() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [filter, setFilter] = useState('الكل');

  const saveChanges = () => {
    if (editingEmp.id) {
      setEmployees(employees.map(e => e.id === editingEmp.id ? editingEmp : e));
    } else {
      setEmployees([...employees, { ...editingEmp, id: Date.now(), initial: editingEmp.name[0] || '?', color: '#3b82f6' }]);
    }
    setEditingEmp(null);
  };

  const filteredEmployees = filter === 'الكل' 
    ? employees 
    : employees.filter(e => e.status === filter);

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>لوحة إدارة شؤون الموظفين والكفاءات</h1>
        <button onClick={() => setEditingEmp({ name: '', role: '', email: '', phone: '', status: 'نشط ومتواجد بالخدمة', kpi: { financialTarget: 0, financialAchieved: 0, callsTarget: 0, callsDone: 0, dealsClosed: 0, rating: 0 } })} 
                style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة موظف</button>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        {['الكل', 'نشط ومتواجد بالخدمة', 'في إجازة رسمية', 'غير نشط / معلّق'].map((item) => (
            <button key={item} onClick={() => setFilter(item)} style={{...filterBtn, background: filter === item ? '#3b82f6' : '#1e293b'}}>
                {item} ({employees.filter(e => item === 'الكل' || e.status === item).length})
            </button>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {filteredEmployees.map((emp) => (
          <div key={emp.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '10px' }}>
              <button onClick={() => setEditingEmp({...emp, kpi: {...emp.kpi}})} style={actionIconBtn}>✏️</button>
              <button onClick={() => setEmployees(employees.filter(e => e.id !== emp.id))} style={actionIconBtn}>🗑️</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{...circleStyle, background: emp.color}}>{emp.initial}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{emp.name}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{emp.role}</p>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '15px' }}>
              <p>📧 {emp.email}</p>
              <p>📱 {emp.phone}</p>
            </div>
            <div style={{ marginTop: '15px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>⭐ {emp.kpi.rating} قياسات الأداء (KPIs)</p>
              <p style={{fontSize: '0.7rem', color: '#64748b', margin: '0 0 5px 0'}}>المكالمات: {emp.kpi.callsDone} / {emp.kpi.callsTarget}</p>
              <div style={progressBg}><div style={{...progressBar, width: `${(emp.kpi.callsDone / (emp.kpi.callsTarget || 1)) * 100}%`}} /></div>
              <p style={{fontSize: '0.7rem', color: '#64748b', margin: '10px 0 5px 0'}}>الإيرادات: {emp.kpi.financialAchieved} / {emp.kpi.financialTarget} ر.س</p>
              <div style={{...progressBg, background: '#d1fae5'}}><div style={{...progressBar, width: `${(emp.kpi.financialAchieved / (emp.kpi.financialTarget || 1)) * 100}%`, background: '#10b981'}} /></div>
            </div>
            <div style={{ marginTop: '15px', background: '#f1f5f9', padding: '8px', textAlign: 'center', borderRadius: '8px', fontSize: '0.8rem', color: '#1e293b' }}>
              {emp.kpi.dealsClosed} صفقات مبرمة بنجاح
            </div>
          </div>
        ))}
      </div>

      {editingEmp && (
        <div style={modalOverlay}>
          <div style={modalStyle}>
            <h2 style={{ color: '#1e293b', fontSize: '1.2rem', marginBottom: '20px' }}>{editingEmp.id ? '👤 تعديل بيانات الموظف' : '➕ إضافة موظف جديد'}</h2>
            <div style={rowStyle}>
              <div style={fieldGroup}><label style={labelStyle}>الاسم الوظيفي الكامل *</label><input style={inputStyle} value={editingEmp.name} onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} /></div>
              <div style={fieldGroup}><label style={labelStyle}>الدور / المسمى الوظيفي *</label><input style={inputStyle} value={editingEmp.role} onChange={e => setEditingEmp({...editingEmp, role: e.target.value})} /></div>
            </div>
            <div style={rowStyle}>
              <div style={fieldGroup}><label style={labelStyle}>رقم هاتف التواصل</label><input style={inputStyle} value={editingEmp.phone} onChange={e => setEditingEmp({...editingEmp, phone: e.target.value})} /></div>
              <div style={fieldGroup}><label style={labelStyle}>البريد الإلكتروني للعمل *</label><input style={inputStyle} value={editingEmp.email} onChange={e => setEditingEmp({...editingEmp, email: e.target.value})} /></div>
            </div>
            <label style={labelStyle}>حالة الموظف الحالية</label>
            <select style={{...inputStyle, width: '100%', marginBottom: '15px'}} value={editingEmp.status} onChange={e => setEditingEmp({...editingEmp, status: e.target.value})}>
              <option>نشط ومتواجد بالخدمة</option><option>في إجازة رسمية</option><option>غير نشط / معلّق</option>
            </select>
            <div style={kpiBox}>
              <p style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '15px' }}>⭐ تعيين مؤشرات الأداء (KPI CONFIGURATION)</p>
              <div style={gridStyle}>
                <div><label style={labelStyle}>المستهدف المالي</label><input style={inputStyle} type="number" placeholder="مثال: 100000" value={editingEmp.kpi.financialTarget} onChange={e => setEditingEmp({...editingEmp, kpi: {...editingEmp.kpi, financialTarget: Number(e.target.value)}})} /></div>
                <div><label style={labelStyle}>المبيعات المحققة</label><input style={inputStyle} type="number" placeholder="مثال: 85000" value={editingEmp.kpi.financialAchieved} onChange={e => setEditingEmp({...editingEmp, kpi: {...editingEmp.kpi, financialAchieved: Number(e.target.value)}})} /></div>
                <div><label style={labelStyle}>عدد المكالمات المستهدف</label><input style={inputStyle} type="number" placeholder="مثال: 200" value={editingEmp.kpi.callsTarget} onChange={e => setEditingEmp({...editingEmp, kpi: {...editingEmp.kpi, callsTarget: Number(e.target.value)}})} /></div>
                <div><label style={labelStyle}>الاتصالات المنجزة</label><input style={inputStyle} type="number" placeholder="مثال: 180" value={editingEmp.kpi.callsDone} onChange={e => setEditingEmp({...editingEmp, kpi: {...editingEmp.kpi, callsDone: Number(e.target.value)}})} /></div>
                <div><label style={labelStyle}>الصفقات المبرمة</label><input style={inputStyle} type="number" placeholder="مثال: 35" value={editingEmp.kpi.dealsClosed} onChange={e => setEditingEmp({...editingEmp, kpi: {...editingEmp.kpi, dealsClosed: Number(e.target.value)}})} /></div>
                <div><label style={labelStyle}>تقييم العملاء (0-5)</label><input style={inputStyle} type="number" step="0.1" placeholder="مثال: 4.7" value={editingEmp.kpi.rating} onChange={e => setEditingEmp({...editingEmp, kpi: {...editingEmp.kpi, rating: Number(e.target.value)}})} /></div>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={saveChanges} style={primaryBtn}>حفظ البيانات</button>
              <button onClick={() => setEditingEmp(null)} style={secondaryBtn}>إلغاء الأمر</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const filterBtn = { border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', color: '#1e293b' };
const circleStyle = { width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' };
const progressBg = { background: '#e2e8f0', height: '6px', borderRadius: '3px', marginBottom: '10px' };
const progressBar = { background: '#3b82f6', height: '100%', borderRadius: '3px' };
const actionIconBtn = { border: 'none', background: '#f1f5f9', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' };
const modalStyle = { background: 'white', color: '#1e293b', padding: '30px', borderRadius: '16px', width: '700px' };
const modalOverlay = { position: 'fixed' as const, top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000 };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', marginTop: '5px' };
const labelStyle = { fontSize: '0.75rem', color: '#64748b' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const fieldGroup = { display: 'flex', flexDirection: 'column' as const };
const kpiBox = { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginTop: '20px' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const secondaryBtn = { background: 'transparent', color: '#64748b', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' };