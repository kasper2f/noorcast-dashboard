import { useState } from 'react';

const initialPerformance = [
  { id: 1, name: 'عهود احمد عبدالله', role: 'مديرة تسويق', department: 'التسويق', completedProjects: 8, totalProjects: 10, feedback: 'أداء متميز في تسليم المشاريع' }
];

export default function Performance() {
  const [data, setData] = useState(initialPerformance);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', role: '', department: '', completedProjects: 0, totalProjects: 0, feedback: '' });

  const handleSave = () => {
    setData([...data, { ...newEntry, id: Date.now() }]);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>⭐ تقييم الأداء والتميز</h1>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {data.map(p => {
          const percentage = (p.completedProjects / (p.totalProjects || 1)) * 100;
          return (
            <div key={p.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>{p.name}</h3>
                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{percentage.toFixed(0)}% إنجاز</span>
              </div>
              {/* إضافة الدور الوظيفي هنا */}
              <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>{p.role}</p>
              
              <div style={progressBg}>
                <div style={{...progressBar, width: `${percentage}%`}} />
              </div>
              
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
                المشاريع المكتملة: {p.completedProjects} من {p.totalProjects}
              </p>
              <p style={{ fontStyle: 'italic', color: '#475569', marginTop: '10px', fontSize: '0.9rem' }}>"{p.feedback}"</p>
            </div>
          );
        })}
      </div>
      
      {/* نافذة الإضافة المحدثة */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalStyle}>
            <h2>إضافة تقييم جديد</h2>
            <input placeholder="اسم الموظف" style={inputStyle} onChange={e => setNewEntry({...newEntry, name: e.target.value})} />
            <input placeholder="الدور الوظيفي (مثال: تسويق)" style={inputStyle} onChange={e => setNewEntry({...newEntry, role: e.target.value})} />
            <input placeholder="القسم" style={inputStyle} onChange={e => setNewEntry({...newEntry, department: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="number" placeholder="المشاريع المكتملة" style={inputStyle} onChange={e => setNewEntry({...newEntry, completedProjects: Number(e.target.value)})} />
                <input type="number" placeholder="إجمالي المشاريع" style={inputStyle} onChange={e => setNewEntry({...newEntry, totalProjects: Number(e.target.value)})} />
            </div>
            <textarea placeholder="ملاحظات الأداء..." style={{...inputStyle, height: '80px'}} onChange={e => setNewEntry({...newEntry, feedback: e.target.value})} />
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} style={primaryBtn}>حفظ التقييم</button>
              <button onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const progressBg = { background: '#e2e8f0', height: '12px', borderRadius: '6px', overflow: 'hidden' };
const progressBar = { background: '#2563eb', height: '100%', transition: 'width 0.5s ease-in-out' };
const cardStyle = { background: 'white', color: '#1e293b', padding: '20px', borderRadius: '12px' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', marginBottom: '10px' };
const modalStyle = { background: 'white', color: '#1e293b', padding: '30px', borderRadius: '16px', width: '400px' };
const modalOverlay = { position: 'fixed' as const, top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000 };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const secondaryBtn = { background: 'transparent', color: '#64748b', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' };