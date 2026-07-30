import { useState, useEffect } from 'react';
import { getProjects, saveProjectToSheet, deleteProjectFromSheet, getTasks, saveTaskToSheet } from '@/services/dbService';
import { FiPlus, FiEdit2, FiTrash2, FiFolder, FiRefreshCw, FiLoader, FiMessageSquare, FiX } from 'react-icons/fi';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [project, setProject] = useState({ 
    id: '', 
    name: '', 
    clientName: '', 
    stage: 'مرحلة البدء', 
    startDate: '', 
    progress: '0', 
    status: 'قيد التخطيط والتأسيس', 
    notes: '' 
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [activeProjectForNotes, setActiveProjectForNotes] = useState<any>(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchProjectsAndSync();
  }, []);

  const fetchProjectsAndSync = async () => {
    setLoading(true);
    try {
      const data = await getProjects().catch(() => []);
      let projectsList = Array.isArray(data) ? data : [];

      projectsList.sort((a: any, b: any) => {
        const idA = Number(String(a.id).replace(/\D/g, '')) || 0;
        const idB = Number(String(b.id).replace(/\D/g, '')) || 0;
        return idB - idA;
      });

      setProjects(projectsList);

      const tasksData = await getTasks().catch(() => []);
      const tasksList = Array.isArray(tasksData) ? tasksData : [];

      for (const p of projectsList) {
        if (p.stage === 'تحت التأسيس') {
          const existingTask = tasksList.find((t: any) => String(t.project || '').trim() === String(p.name).trim() || String(t.title || '').includes(p.name));
          if (!existingTask) {
            await saveTaskToSheet({
              id: 'TSK-PRJ-' + Date.now() + Math.floor(Math.random() * 100),
              title: `تنفيذ مشروع: ${p.name}`,
              project: p.name,
              department: 'قسم الإدارة',
              assignedTo: 'فريق العمل',
              priority: 'عالية',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: p.status === 'مكتمل ومعزز' ? 'مكتمل' : 'قيد التنفيذ',
              notes: p.notes 
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const cleanDate = dateStr.toString().split('T')[0].split(' ')[0];
      const d = new Date(cleanDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return cleanDate;
    } catch (e) {
      return dateStr;
    }
  };

  const handleSaveProject = async () => {
    if (!project.name.trim()) {
      alert("الرجاء إدخال اسم المشروع على الأقل.");
      return;
    }

    setIsSubmitting(true);

    const projectDataToSave = {
      ...project,
      id: project.id || String(Date.now()),
      progress: project.status === 'مكتمل ومعزز' ? '100' : (project.progress || '0')
    };

    try {
      await saveProjectToSheet(projectDataToSave);
      await fetchProjectsAndSync();
      setProject({ id: '', name: '', clientName: '', stage: 'مرحلة البدء', startDate: '', progress: '0', status: 'قيد التخطيط والتأسيس', notes: '' });
      setIsModalOpen(false);
      alert("تم حفظ المشروع بنجاح! 🚀");
    } catch (error) {
      console.error("Error saving project:", error);
      alert("حدث خطأ أثناء حفظ المشروع سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (p: any) => {
    setProject(p);
    setIsModalOpen(true);
  };

  const openNotesModal = (p: any) => {
    setActiveProjectForNotes(p);
    setNewNoteInput('');
    setIsNotesModalOpen(true);
  };

  const handleAddNote = async () => {
    if (!newNoteInput.trim() || !activeProjectForNotes) return;

    let username = 'موظف نوركاست';
    try {
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('adminUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        username = parsed.username || parsed.name || parsed.email?.split('@')[0] || 'موظف';
      }
    } catch (e) {
      username = localStorage.getItem('userEmail')?.split('@')[0] || 'موظف';
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toLocaleString('ar-SA');
      const formattedNewNote = `[${timestamp}] (${username} - مشروع): ${newNoteInput.trim()}`;
      
      const existingNotes = activeProjectForNotes.notes || '';
      const updatedNotesList = existingNotes ? `${formattedNewNote}\n---\n${existingNotes}` : formattedNewNote;

      const updatedProj = {
        ...activeProjectForNotes,
        notes: updatedNotesList
      };

      await saveProjectToSheet(updatedProj);

      const tasksData = await getTasks().catch(() => []);
      if (Array.isArray(tasksData)) {
        const matchedTask = tasksData.find((t: any) => String(t.project || '').trim() === String(activeProjectForNotes.name).trim());
        if (matchedTask) {
          matchedTask.notes = updatedNotesList;
          await saveTaskToSheet(matchedTask);
        }
      }

      await fetchProjectsAndSync();
      setActiveProjectForNotes(updatedProj);
      setNewNoteInput('');
      alert("تمت إضافة التحديث بنجاح! ✅");
    } catch (e) {
      alert("فشل حفظ الملاحظة سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المشروع سحابياً؟")) {
      try {
        setLoading(true);
        await deleteProjectFromSheet(id);
        await fetchProjectsAndSync();
      } catch (e) {
        alert("فشل حذف المشروع.");
        setLoading(false);
      }
    }
  };

  const updateStatusQuick = async (p: any, newStatus: string) => {
    const updatedProject = {
      ...p,
      status: newStatus,
      progress: newStatus === 'مكتمل ومعزز' ? '100' : p.progress
    };

    try {
      await saveProjectToSheet(updatedProject);
      
      const tasksData = await getTasks().catch(() => []);
      if (Array.isArray(tasksData)) {
        const matchedTask = tasksData.find((t: any) => String(t.project || '').trim() === String(p.name).trim());
        if (matchedTask) {
          matchedTask.status = newStatus === 'مكتمل ومعزز' ? 'مكتمل' : 'قيد التنفيذ';
          await saveTaskToSheet(matchedTask);
        }
      }

      await fetchProjectsAndSync();
    } catch (e) {
      alert("فشل تحديث حالة المشروع.");
    }
  };

  const updateStageQuick = async (p: any, newStage: string) => {
    const updatedProject = { ...p, stage: newStage };
    try {
      await saveProjectToSheet(updatedProject);
      await fetchProjectsAndSync();
    } catch (e) {
      alert("فشل تحديث المرحلة التشغيلية.");
    }
  };

  const getLastNotePreview = (notesStr: string) => {
    if (!notesStr) return 'لا توجد ملاحظات';
    const lines = notesStr.split('---').filter(l => l.trim().length > 0);
    const absoluteLatest = lines.length > 0 ? lines[0] : 'لا توجد ملاحظات';

    let cleaned = absoluteLatest
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(\s+\d{1,2}:\d{2}(:\d{2})?)?\b/g, '')
      .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(\s+\d{1,2}:\d{2}(:\d{2})?)?\b/g, '')
      .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/(تاريخ|الساعة|بتاريخ|التوقيت):?/g, '')
      .trim();

    cleaned = cleaned.replace(/^[-–—,:\s]+|[-–—,:\s]+$/g, '').trim();
    return cleaned.length > 0 ? cleaned : absoluteLatest;
  };

  const filteredProjects = filterStatus ? projects.filter(p => p.status === filterStatus) : projects;

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      {/* حقن قواعد الاستجابة الذكية (Media Queries) للعرض المزدوج */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-table-view { display: none !important; }
          .mobile-cards-view { display: flex !important; }
        }
        @media (min-width: 901px) {
          .desktop-table-view { display: block !important; }
          .mobile-cards-view { display: none !important; }
        }
      `}</style>

      {/* رأس الصفحة مع ترتيب الأزرار */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={iconHeaderBox}><FiFolder style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            إدارة المشاريع 
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            غرفة عمليات نوركاست: متابعة المشاريع القادمة من المبيعات، المراحل التشغيلية، وملاحظات فريق العمل
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={fetchProjectsAndSync} style={secondaryBtn} disabled={loading}>
            {loading ? <FiLoader className="spin" /> : <FiRefreshCw />} تحديث
          </button>
          
          <button onClick={() => { setProject({ id: '', name: '', clientName: '', stage: 'مرحلة البدء', startDate: '', progress: '0', status: 'قيد التخطيط والتأسيس', notes: '' }); setIsModalOpen(true); }} style={primaryBtn}>
            <FiPlus style={{ color: 'white' }} /> إضافة مشروع جديد
          </button>

          <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">كل حالات المشاريع</option>
            <option>شغال بنجاح</option>
            <option>مكتمل ومعزز</option>
            <option>قيد التخطيط والتأسيس</option>
          </select>
        </div>
      </div>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#1e293b', marginBottom: '20px', fontWeight: 'bold' }}>
              {project.id ? ' تعديل تفاصيل المشروع' : ' إضافة مشروع جديد'}
            </h3>
            
            <div style={fieldGroup}>
              <label style={labelStyle}>اسم المشروع *</label>
              <input placeholder="مثل: حملة اليوم الوطني الإعلانية" style={inputStyle} value={project.name} onChange={e => setProject({...project, name: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>اسم العميل / الجهة</label>
              <input placeholder="مثل: شركة الرواد" style={inputStyle} value={project.clientName} onChange={e => setProject({...project, clientName: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>المرحلة التشغيلية</label>
              <select style={inputStyle} value={project.stage} onChange={e => setProject({...project, stage: e.target.value})} disabled={isSubmitting}>
                <option value="مرحلة البدء">مرحلة البدء 🏁 (قادم من المبيعات)</option>
                <option value="تحت التأسيس">تحت التأسيس 🛠️ (ينزل للمهام)</option>
                <option value="المونتاج والمكساج">المونتاج والمكساج</option>
                <option value="التسليم النهائي">التسليم النهائي</option>
              </select>
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>تاريخ البدء</label>
                <input type="date" style={inputStyle} value={project.startDate} onChange={e => setProject({...project, startDate: e.target.value})} disabled={isSubmitting} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>نسبة الإنجاز (%)</label>
                <input type="number" min="0" max="100" placeholder="50" style={inputStyle} value={project.progress} onChange={e => setProject({...project, progress: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>حالة المشروع</label>
              <select style={inputStyle} value={project.status} onChange={e => setProject({...project, status: e.target.value})} disabled={isSubmitting}>
                <option>شغال بنجاح</option>
                <option>مكتمل ومعزز</option>
                <option>قيد التخطيط والتأسيس</option>
              </select>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>ملاحظات أولية</label>
              <textarea placeholder="اكتب تفاصيل أو ملاحظات حول سير العمل..." style={{...inputStyle, height: '70px', resize: 'vertical'}} value={project.notes} onChange={e => setProject({...project, notes: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveProject} style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                {isSubmitting ? '⏳ جاري الحفظ...' : 'حفظ سحابياً'}
              </button>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة السجل المنظمة */}
      {isNotesModalOpen && activeProjectForNotes && (
        <div style={modalOverlay}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMessageSquare style={{ color: '#2563eb' }} /> سجل المحادثات: {activeProjectForNotes.name}
              </h3>
              <button onClick={() => setIsNotesModalOpen(false)} style={closeBtnStyle}><FiX size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '45vh', overflowY: 'auto', paddingLeft: '5px', marginBottom: '20px' }}>
              {activeProjectForNotes.notes ? (
                activeProjectForNotes.notes.split('---').map((noteBlock: string, index: number) => {
                  if (!noteBlock.trim()) return null;
                  return (
                    <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>ملاحظة رقم #{index + 1}</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{noteBlock.trim()}</div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>لا توجد ملاحظات مسجلة لهذا المشروع حتى الآن.</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <label style={labelStyle}>إضافة تحديث أو ملاحظة جديدة </label>
              <textarea 
                placeholder="اكتب تفاصيل التحديث هنا..." 
                style={{ ...inputStyle, height: '70px', resize: 'vertical' }} 
                value={newNoteInput} 
                onChange={e => setNewNoteInput(e.target.value)} 
                disabled={isSubmitting}
              />

              {isSubmitting && (
                <div style={{ margin: '8px 0', padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                  ⏳ جاري إرسال الحفظ السحابي... الرجاء الانتظار وعدم إغلاق النافذة.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleAddNote} 
                  style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إضافة التحديث ✅'}
                </button>
                <button onClick={() => setIsNotesModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
      <div className="desktop-table-view" style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1e293b' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a' }}>
              {['اسم المشروع', 'العميل', 'المرحلة التشغيلية', 'تاريخ البدء', 'الحالة العامة', 'آخر ملاحظة', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري جلب المشاريع سحابياً... 🔄</td></tr>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((p, index) => (
                <tr key={p.id || index} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'white' }}>{p.name}</td>
                  <td style={{ ...tdStyle, color: '#38bdf8' }}>{p.clientName || '-'}</td>
                  
                  <td style={tdStyle}>
                    <select 
                      value={p.stage || 'مرحلة البدء'} 
                      onChange={(e) => updateStageQuick(p, e.target.value)}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #334155', 
                        background: p.stage === 'تحت التأسيس' ? '#1e40af' : '#b45309', 
                        color: 'white', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="مرحلة البدء">🏁 مرحلة البدء</option>
                      <option value="تحت التأسيس">🛠️ تحت التأسيس (ينزل للمهام)</option>
                      <option value="المونتاج والمكساج">🎬 المونتاج والمكساج</option>
                      <option value="التسليم النهائي">✅ التسليم النهائي</option>
                    </select>
                  </td>

                  <td style={{ ...tdStyle, color: '#94a3b8' }}>{formatDateOnly(p.startDate)}</td>
                  
                  <td style={tdStyle}>
                    <select 
                      value={p.status} 
                      onChange={(e) => updateStatusQuick(p, e.target.value)} 
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #334155', 
                        background: p.status === 'مكتمل ومعزز' ? '#065f46' : p.status === 'شغال بنجاح' ? '#1e40af' : '#b45309',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option style={{ background: '#1e293b', color: 'white' }}>شغال بنجاح</option>
                      <option style={{ background: '#1e293b', color: 'white' }}>مكتمل ومعزز</option>
                      <option style={{ background: '#1e293b', color: 'white' }}>قيد التخطيط والتأسيس</option>
                    </select>
                  </td>

                  <td style={tdStyle}>
                    <div 
                      onClick={() => openNotesModal(p)} 
                      style={{ color: '#cbd5e1', fontSize: '0.85rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} 
                      title="اضغط لعرض السجل الكامل وإضافة ملاحظة"
                    >
                      <FiMessageSquare style={{ color: '#38bdf8', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getLastNotePreview(p.notes)}</span>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(p)} style={actionBtn} title="تعديل المشروع"><FiEdit2 /></button>
                      <button onClick={() => deleteProject(p.id)} style={{...actionBtn, background: '#ef4444', color: 'white'}} title="حذف المشروع"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  لا توجد مشاريع مسجلة سحابياً حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
      <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري جلب المشاريع سحابياً... 🔄</div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((p, index) => (
            <div key={p.id || index} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{p.name}</span>
                <select 
                  value={p.status} 
                  onChange={(e) => updateStatusQuick(p, e.target.value)} 
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    background: p.status === 'مكتمل ومعزز' ? '#065f46' : p.status === 'شغال بنجاح' ? '#1e40af' : '#b45309',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <option style={{ background: '#1e293b', color: 'white' }}>شغال بنجاح</option>
                  <option style={{ background: '#1e293b', color: 'white' }}>مكتمل ومعزز</option>
                  <option style={{ background: '#1e293b', color: 'white' }}>قيد التخطيط والتأسيس</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{p.clientName || 'بدون عميل'}</span>
                <span style={{ color: '#94a3b8' }}>📅 {formatDateOnly(p.startDate)}</span>
              </div>

              {/* المرحلة التشغيلية */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>المرحلة التشغيلية:</span>
                <select 
                  value={p.stage || 'مرحلة البدء'} 
                  onChange={(e) => updateStageQuick(p, e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '8px 10px', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    background: p.stage === 'تحت التأسيس' ? '#1e40af' : '#b45309', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="مرحلة البدء">🏁 مرحلة البدء</option>
                  <option value="تحت التأسيس">🛠️ تحت التأسيس (ينزل للمهام)</option>
                  <option value="المونتاج والمكساج">🎬 المونتاج والمكساج</option>
                  <option value="التسليم النهائي">✅ التسليم النهائي</option>
                </select>
              </div>

              {/* آخر ملاحظة */}
              <div 
                onClick={() => openNotesModal(p)} 
                style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiMessageSquare style={{ color: '#38bdf8' }} /> آخر ملاحظة (اضغط للعرض والإضافة):
                </div>
                {getLastNotePreview(p.notes)}
              </div>

              {/* أزرار الإجراءات */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => startEdit(p)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#334155', gap: '6px' }}>
                  <FiEdit2 /> تعديل المشروع
                </button>
                <button onClick={() => deleteProject(p.id)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#ef4444', color: 'white', gap: '6px' }}>
                  <FiTrash2 /> حذف
                </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
            لا توجد مشاريع مسجلة سحابياً حالياً.
          </div>
        )}
      </div>

    </div>
  );
}

const iconHeaderBox = { background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const thStyle = { padding: '14px 16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.9rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', color: '#f8fafc', verticalAlign: 'middle' as const };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block', marginBottom: '5px' };
const fieldGroup = { marginBottom: '10px' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const primaryBtn = { padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const secondaryBtn = { padding: '10px 18px', background: '#334155', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { border: 'none', borderRadius: '8px', padding: '8px 10px', color: '#fff', background: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '550px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' };