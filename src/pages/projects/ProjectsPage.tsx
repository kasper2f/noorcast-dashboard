import { useState, useEffect } from 'react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', stage: '', startDate: '', progress: '', status: '' });

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    const saved = localStorage.getItem('projects-list');
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const addProject = () => {
    const updated = [...projects, newProject];
    setProjects(updated);
    localStorage.setItem('projects-list', JSON.stringify(updated));
    setNewProject({ name: '', stage: '', startDate: '', progress: '', status: '' }); // إعادة تعيين الحقول
  };

  return (
    <div style={{ padding: '24px', color: 'white' }}>
      <h1>إدارة المشاريع</h1>
      
      {/* لوحة الإضافة */}
      <div style={panelStyle}>
        <h3>لوحة المشاريع الجارية</h3>
        <input placeholder="اسم المشروع التنفيذي" style={inputStyle} value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
        <input placeholder="مجمع ومرحلة الهيكلة" style={inputStyle} value={newProject.stage} onChange={e => setNewProject({...newProject, stage: e.target.value})} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input type="date" style={inputStyle} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
            <input type="number" placeholder="الأعمال المنجزة (%)" style={inputStyle} value={newProject.progress} onChange={e => setNewProject({...newProject, progress: e.target.value})} />
        </div>
        <select style={inputStyle} value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
          <option value="">-- حالة المشروع --</option>
          <option>شغال بنجاح</option>
          <option>مكتمل ومعزز</option>
          <option>قيد التخطيط والتأسيس</option>
        </select>
        <button onClick={addProject} style={addBtnStyle}>إضافة هذا السجل الجديد</button>
      </div>

      {/* قائمة المشاريع الجارية */}
      <div style={{ marginTop: '30px' }}>
        <h2>المشاريع الحالية</h2>
        {projects.map((p: any, index) => (
          <div key={index} style={projectCardStyle}>
            <h4>{p.name}</h4>
            <p>المرحلة: {p.stage} | الحالة: {p.status}</p>
            <div style={{ background: '#334155', height: '8px', borderRadius: '4px' }}>
                <div style={{ width: `${p.progress}%`, background: '#10b981', height: '100%', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// التنسيقات (مضافة في الأسفل)
const panelStyle = { background: '#1e293b', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #334155' };
const inputStyle = { padding: '12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' };
const addBtnStyle = { padding: '14px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const projectCardStyle = { background: '#0f172a', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #334155' };