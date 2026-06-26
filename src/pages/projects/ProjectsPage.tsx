import { useState, useEffect } from 'react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ name: '', stage: '', startDate: '', progress: '', status: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('projects-list');
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const saveToStorage = (updatedProjects: any[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('projects-list', JSON.stringify(updatedProjects));
  };

  const handleAction = () => {
    if (!newProject.name) return;
    if (editingIndex !== null) {
      const updated = [...projects];
      updated[editingIndex] = newProject;
      saveToStorage(updated);
      setEditingIndex(null);
    } else {
      saveToStorage([...projects, newProject]);
    }
    setNewProject({ name: '', stage: '', startDate: '', progress: '', status: '' });
    setIsModalOpen(false);
  };

  const updateStatus = (index: number, newStatus: string) => {
    const updated = [...projects];
    updated[index].status = newStatus;
    saveToStorage(updated);
  };

  const deleteProject = (index: number) => {
    saveToStorage(projects.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setNewProject(projects[index]);
    setIsModalOpen(true);
  };

  const filteredProjects = filterStatus ? projects.filter(p => p.status === filterStatus) : projects;

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>إدارة المشاريع</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => { setEditingIndex(null); setIsModalOpen(true); }} style={primaryBtn}>+ إضافة مشروع جديد</button>
        <select style={selectStyle} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option>شغال بنجاح</option>
          <option>مكتمل ومعزز</option>
          <option>قيد التخطيط والتأسيس</option>
        </select>
      </div>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{color: '#1e293b'}}>{editingIndex !== null ? 'تعديل مشروع' : 'إضافة مشروع جديد'}</h3>
            <input placeholder="اسم المشروع" style={inputStyle} value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
            <input placeholder="المرحلة" style={inputStyle} value={newProject.stage} onChange={e => setNewProject({...newProject, stage: e.target.value})} />
            <input type="date" style={inputStyle} value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
            <input type="number" placeholder="النسبة (%)" style={inputStyle} value={newProject.progress} onChange={e => setNewProject({...newProject, progress: e.target.value})} />
            <select style={inputStyle} value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
              <option value="">-- اختر الحالة --</option>
              <option>شغال بنجاح</option>
              <option>مكتمل ومعزز</option>
              <option>قيد التخطيط والتأسيس</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={handleAction} style={primaryBtn}>حفظ</button>
              <button onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <table style={{ width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#1e293b' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {['اسم المشروع', 'المرحلة', 'تاريخ البدء', 'النسبة', 'الحالة', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((p, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{p.stage}</td>
              <td style={tdStyle}>{p.startDate}</td>
              <td style={tdStyle}>{p.progress}%</td>
              <td style={tdStyle}>
                <select value={p.status} onChange={(e) => updateStatus(index, e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option>شغال بنجاح</option>
                  <option>مكتمل ومعزز</option>
                  <option>قيد التخطيط والتأسيس</option>
                </select>
              </td>
              <td style={tdStyle}>
                <button onClick={() => startEdit(index)} style={actionBtn}>✏️</button>
                <button onClick={() => deleteProject(index)} style={{...actionBtn, background: '#ef4444'}}>🗑️</button>
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
const actionBtn = { border: 'none', borderRadius: '4px', padding: '5px 10px', color: '#fff', background: '#64748b', cursor: 'pointer', marginLeft: '5px' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '12px', width: '400px' };