import { useState, useEffect } from 'react';
import { getTasks, saveTaskToSheet, deleteTaskFromSheet, getHRPayrollSheet, getProjects, saveProjectToSheet, getOrders, updateOrderStatus } from '@/services/dbService';
import { FiPlus, FiEdit2, FiTrash2, FiCheckSquare, FiUser, FiRefreshCw, FiLoader, FiMessageSquare, FiCalendar, FiClock, FiX } from 'react-icons/fi';

export default function TaskManager() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [task, setTask] = useState({ 
    id: '', 
    title: '', 
    project: '', 
    department: 'قسم التسويق', 
    assignedTo: '', 
    priority: 'متوسطة', 
    deadline: '', 
    completedAt: '', 
    status: 'قيد التنفيذ', 
    notes: '' 
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [activeTaskForNotes, setActiveTaskForNotes] = useState<any>(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [activeTaskForDeadline, setActiveTaskForDeadline] = useState<any>(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  useEffect(() => {
    fetchDataAndSyncProjects();
  }, []);

  const fetchDataAndSyncProjects = async () => {
    setLoading(true);
    try {
      const [tasksData, hrData, projectsData] = await Promise.all([
        getTasks().catch(() => []),
        getHRPayrollSheet().catch(() => []),
        getProjects().catch(() => [])
      ]);

      let tasksList = Array.isArray(tasksData) ? tasksData : [];
      const projectsList = Array.isArray(projectsData) ? projectsData : [];

      tasksList.sort((a: any, b: any) => {
        const idA = Number(String(a.id).replace(/\D/g, '')) || 0;
        const idB = Number(String(b.id).replace(/\D/g, '')) || 0;
        return idB - idA;
      });

      let newTasksAdded = false;
      for (const p of projectsList) {
        if (p.stage === 'تحت التأسيس') {
          const exists = tasksList.find((t: any) => String(t.project || '').trim() === String(p.name).trim() || String(t.title || '').includes(p.name));
          if (!exists) {
            const autoTask = {
              id: 'TSK-AUTO-' + Date.now() + Math.floor(Math.random() * 1000),
              title: `تنفيذ مشروع: ${p.name}`,
              project: p.name,
              department: 'قسم الإدارة',
              assignedTo: 'فريق العمل',
              priority: 'عالية',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              completedAt: '',
              status: 'قيد التنفيذ',
              notes: p.notes 
            };
            await saveTaskToSheet(autoTask);
            tasksList.unshift(autoTask);
            newTasksAdded = true;
          }
        }
      }

      setTasks(tasksList);
      setEmployees(Array.isArray(hrData) ? hrData : []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUsername = () => {
    try {
      const storedUser = localStorage.getItem('currentUser') || localStorage.getItem('adminUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return parsed.username || parsed.name || parsed.email?.split('@')[0] || 'موظف';
      }
    } catch (e) {}
    return localStorage.getItem('userEmail')?.split('@')[0] || 'موظف نوركاست';
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

  const handleSaveTask = async () => {
    if (!task.title.trim()) {
      alert("الرجاء إدخال عنوان المهمة على الأقل.");
      return;
    }

    setIsSubmitting(true);

    const timestamp = new Date().toLocaleString('ar-SA');
    const username = getCurrentUsername();

    let finalNotes = task.notes;
    if (!task.id && task.notes && !task.notes.includes(']:')) {
      finalNotes = `[${timestamp}] (${username}): ${task.notes.trim()}`;
    } else if (!task.id && !task.notes) {
      finalNotes = `[${timestamp}] (${username}): تم إنشاء المهمة.`;
    }

    const taskDataToSave = {
      ...task,
      id: task.id || String(Date.now()),
      notes: finalNotes,
      completedAt: task.status === 'مكتمل' ? (task.completedAt || timestamp) : ''
    };

    try {
      await saveTaskToSheet(taskDataToSave);
      await fetchDataAndSyncProjects();
      setTask({ id: '', title: '', project: '', department: 'قسم التسويق', assignedTo: '', priority: 'متوسطة', deadline: '', completedAt: '', status: 'قيد التنفيذ', notes: '' });
      setIsModalOpen(false);
      alert("تم حفظ المهمة بنجاح! 🚀");
    } catch (error) {
      alert("حدث خطأ أثناء حفظ المهمة سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (t: any) => {
    setTask(t);
    setIsModalOpen(true);
  };

  const openNotesModal = (t: any) => {
    setActiveTaskForNotes(t);
    setNewNoteInput('');
    setIsNotesModalOpen(true);
  };

  const openDeadlineModal = (t: any) => {
    setActiveTaskForDeadline(t);
    setIsDeadlineModalOpen(true);
  };

  const handleAddNote = async () => {
    if (!newNoteInput.trim() || !activeTaskForNotes) return;

    const username = getCurrentUsername();
    setIsSubmitting(true);

    try {
      const timestamp = new Date().toLocaleString('ar-SA');
      const formattedNewNote = `[${timestamp}] (${username}): ${newNoteInput.trim()}`;
      
      const existingNotes = activeTaskForNotes.notes || '';
      const updatedNotesList = existingNotes ? `${formattedNewNote}\n---\n${existingNotes}` : formattedNewNote;

      const updatedTask = {
        ...activeTaskForNotes,
        notes: updatedNotesList
      };

      await saveTaskToSheet(updatedTask);
      await fetchDataAndSyncProjects();
      
      setActiveTaskForNotes(updatedTask);
      setNewNoteInput('');
      alert("تمت إضافة التحديث بنجاح! ✅");
    } catch (e) {
      alert("فشل حفظ الملاحظة سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المهمة سحابياً؟")) {
      try {
        setLoading(true);
        await deleteTaskFromSheet(id);
        await fetchDataAndSyncProjects();
      } catch (e) {
        alert("فشل حذف المهمة.");
        setLoading(false);
      }
    }
  };

  const updateStatusDirectly = async (t: any, newStatus: string) => {
    const timestampNow = new Date().toLocaleString('ar-SA');
    const updatedTask = { 
      ...t, 
      status: newStatus,
      completedAt: newStatus === 'مكتمل' ? (t.completedAt || timestampNow) : '' 
    };

    try {
      await saveTaskToSheet(updatedTask);

      const targetName = String(t.project || t.title.replace('تنفيذ مشروع: ', '')).trim();

      const projectsData = await getProjects().catch(() => []);
      if (Array.isArray(projectsData)) {
        const matchedProj = projectsData.find((p: any) => String(p.name || '').trim() === targetName);
        if (matchedProj) {
          matchedProj.status = newStatus === 'مكتمل' ? 'مكتمل ومعزز' : 'قيد التخطيط والتأسيس';
          matchedProj.progress = newStatus === 'مكتمل' ? '100' : matchedProj.progress;
          await saveProjectToSheet(matchedProj);
        }
      }

      if (newStatus === 'مكتمل') {
        const ordersData = await getOrders().catch(() => []);
        if (Array.isArray(ordersData)) {
          const matchedOrder = ordersData.find((o: any) => {
            const customer = String(o.customerName || o.clientName || o.name || '').trim();
            return customer === targetName;
          });
          if (matchedOrder) {
            const orderId = matchedOrder.orderId || matchedOrder.id;
            const currentNotes = matchedOrder.notes || matchedOrder.details || '';
            const newAuditNote = `[${timestampNow}] @النظام: تحولت حالة العميل تلقائياً إلى (تم التنفيذ) لاكتمال المهام التشغيلية`;
            const finalNotes = currentNotes ? `${newAuditNote}\n---\n${currentNotes}` : newAuditNote;
            
            await updateOrderStatus(orderId, 'تم التنفيذ', 'النظام الآلي', finalNotes);
          }
        }
      }

      await fetchDataAndSyncProjects();
    } catch (e) {
      alert("فشل تحديث حالة المهمة.");
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

  const filteredTasks = tasks.filter(t => {
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    const matchDept = filterDept ? t.department === filterDept : true;
    return matchStatus && matchDept;
  });

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
            <span style={iconHeaderBox}><FiCheckSquare style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            إدارة المهام     </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            توزيع المهام حسب الأقسام، المتابعة عبر تواريخ الإنجاز (Deadline)، والمزامنة التبادلية الكاملة مع المشاريع والـ CRM
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={fetchDataAndSyncProjects} style={secondaryBtn} disabled={loading}>
            {loading ? <FiLoader className="spin" /> : <FiRefreshCw />} تحديث
          </button>
          
          <button onClick={() => { setTask({ id: '', title: '', project: '', department: 'قسم التسويق', assignedTo: '', priority: 'متوسطة', deadline: '', completedAt: '', status: 'قيد التنفيذ', notes: '' }); setIsModalOpen(true); }} style={primaryBtn}>
            <FiPlus style={{ color: 'white' }} /> إضافة مهمة جديدة
          </button>
          
          <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">كل حالات المهام</option>
            <option value="قيد التنفيذ">قيد التنفيذ ⏳</option>
            <option value="مكتمل">مكتمل 🟢</option>
          </select>

          <select style={selectStyle} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">كل الأقسام</option>
            <option>قسم التسويق</option>
            <option>قسم التصوير</option>
            <option>قسم التصميم</option>
            <option>قسم المونتاج</option>
            <option>قسم الإدارة</option>
            <option>قسم البرمجة والتقنية</option>
          </select>
        </div>
      </div>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#1e293b', marginBottom: '20px', fontWeight: 'bold' }}>
              {task.id ? '✏️ تعديل بيانات المهمة' : ' إضافة مهمة جديدة'}
            </h3>
            
            <div style={fieldGroup}>
              <label style={labelStyle}>عنوان المهمة *</label>
              <input placeholder="مثل: تصميم بوستر حملة اليوم الوطني" style={inputStyle} value={task.title} onChange={e => setTask({...task, title: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>القسم التشغيلي </label>
                <select style={inputStyle} value={task.department} onChange={e => setTask({...task, department: e.target.value})} disabled={isSubmitting}>
                  <option>قسم التسويق</option>
                  <option>قسم التصوير</option>
                  <option>قسم التصميم</option>
                  <option>قسم المونتاج</option>
                  <option>قسم الإدارة</option>
                  <option>قسم البرمجة والتقنية</option>
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>المشروع المرتبط</label>
                <input placeholder="مثل: حملة نوركاست" style={inputStyle} value={task.project} onChange={e => setTask({...task, project: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>المكلف بالمهمة 👤</label>
                <input 
                  list="employees-list" 
                  placeholder="اختر موظفاً أو اكتب اسماً يدوياً..." 
                  style={inputStyle} 
                  value={task.assignedTo} 
                  onChange={e => setTask({...task, assignedTo: e.target.value})} 
                  disabled={isSubmitting}
                />
                <datalist id="employees-list">
                  {employees.map((emp: any, idx: number) => (
                    <option key={idx} value={emp.name}>{emp.position ? `(${emp.position})` : ''}</option>
                  ))}
                </datalist>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>الأولوية</label>
                <select style={inputStyle} value={task.priority} onChange={e => setTask({...task, priority: e.target.value})} disabled={isSubmitting}>
                  <option>عالية</option>
                  <option>متوسطة</option>
                  <option>منخفضة</option>
                </select>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>تاريخ الإنجاز (Deadline) 📅</label>
                <input type="date" style={inputStyle} value={task.deadline} onChange={e => setTask({...task, deadline: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>ملاحظات أولية</label>
              <textarea placeholder="تعليمات المهمة..." style={{...inputStyle, height: '70px', resize: 'vertical'}} value={task.notes} onChange={e => setTask({...task, notes: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveTask} style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                {isSubmitting ? '⏳ جاري الحفظ...' : 'حفظ سحابياً'}
              </button>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة السجل المنظمة للمهام */}
      {isNotesModalOpen && activeTaskForNotes && (
        <div style={modalOverlay}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMessageSquare style={{ color: '#2563eb' }} /> سجل ملاحظات: {activeTaskForNotes.title}
              </h3>
              <button onClick={() => setIsNotesModalOpen(false)} style={closeBtnStyle}><FiX size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '45vh', overflowY: 'auto', paddingLeft: '5px', marginBottom: '20px' }}>
              {activeTaskForNotes.notes ? (
                activeTaskForNotes.notes.split('---').map((noteBlock: string, index: number) => {
                  if (!noteBlock.trim()) return null;
                  return (
                    <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>ملاحظة رقم #{index + 1}</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{noteBlock.trim()}</div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>لا توجد ملاحظات مسجلة لهذه المهمة حتى الآن.</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <label style={labelStyle}>إضافة ملاحظة جديدة أو تحديث </label>
              <textarea 
                placeholder="اكتب ملاحظتك هنا..." 
                style={{ ...inputStyle, height: '70px', resize: 'vertical' }} 
                value={newNoteInput} 
                onChange={e => setNewNoteInput(e.target.value)} 
                disabled={isSubmitting}
              />

              {isSubmitting && (
                <div style={{ margin: '8px 0', padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                  ⏳ جاري إرسال الحفظ السحابي... الرجاء الانتظار.
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

      {isDeadlineModalOpen && activeTaskForDeadline && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, width: '400px' }}>
            <h3 style={{ color: '#1e293b', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiClock style={{ color: '#f59e0b' }} /> تفاصيل التوقيت والديدلاين
            </h3>
            
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
              <p style={{ color: '#334155', fontSize: '0.9rem', marginBottom: '10px' }}>
                📌 <strong>المهمة:</strong> {activeTaskForDeadline.title}
              </p>
              <p style={{ color: '#d97706', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCalendar /> <strong>تاريخ الاستحقاق (Deadline):</strong> {formatDateOnly(activeTaskForDeadline.deadline)}
              </p>
              <p style={{ color: activeTaskForDeadline.status === 'مكتمل' ? '#059669' : '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiClock /> <strong>تاريخ الإنجاز الفعلي:</strong> {activeTaskForDeadline.completedAt || (activeTaskForDeadline.status === 'مكتمل' ? new Date().toLocaleString('ar-SA') : 'لم يتم الإنجاز بعد ⏳')}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsDeadlineModalOpen(false)} style={primaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
      <div className="desktop-table-view" style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1e293b' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a' }}>
              {['عنوان المهمة', 'القسم / المشروع', 'المكلف (مسند إلى)', 'الأولوية', 'تاريخ الإنجاز (Deadline)', 'الحالة', 'الملاحظة', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري المزامنة السحابية... 🔄</td></tr>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((t, index) => (
                <tr key={t.id || index} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'white' }}>{t.title}</td>
                  <td style={tdStyle}>
                    <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.85rem' }}>{t.department || 'عام'}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.project || '-'}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc' }}>
                      <FiUser style={{ color: '#3b82f6' }} /> {t.assignedTo || 'غير مسند'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold',
                      background: t.priority === 'عالية' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: t.priority === 'عالية' ? '#f87171' : '#60a5fa'
                    }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={tdStyle} onClick={() => openDeadlineModal(t)} title="اضغط لعرض تفاصيل الديدلاين ووقت الإنجاز الفعلي">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <FiCalendar /> {formatDateOnly(t.deadline)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <select 
                      value={t.status} 
                      onChange={(e) => updateStatusDirectly(t, e.target.value)}
                      style={{
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '5px 10px', 
                        color: '#fff', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        background: t.status === 'مكتمل' ? '#065f46' : '#b45309',
                        outline: 'none'
                      }}
                    >
                      <option style={{ background: '#1e293b', color: 'white' }} value="قيد التنفيذ">⏳ قيد التنفيذ</option>
                      <option style={{ background: '#1e293b', color: 'white' }} value="مكتمل">🟢 مكتمل</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <div 
                      onClick={() => openNotesModal(t)} 
                      style={{ color: '#cbd5e1', fontSize: '0.85rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} 
                      title="اضغط لعرض السجل الكامل وإضافة ملاحظة"
                    >
                      <FiMessageSquare style={{ color: '#38bdf8', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getLastNotePreview(t.notes)}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(t)} style={actionBtn} title="تعديل"><FiEdit2 /></button>
                      <button onClick={() => deleteTask(t.id)} style={{...actionBtn, background: '#ef4444', color: 'white'}} title="حذف"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>لا توجد مهام مسجلة سحابياً.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
      <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري المزامنة السحابية... 🔄</div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((t, index) => (
            <div key={t.id || index} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{t.title}</span>
                <select 
                  value={t.status} 
                  onChange={(e) => updateStatusDirectly(t, e.target.value)}
                  style={{
                    border: 'none', 
                    borderRadius: '8px', 
                    padding: '6px 10px', 
                    color: '#fff', 
                    cursor: 'pointer', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    background: t.status === 'مكتمل' ? '#065f46' : '#b45309',
                    outline: 'none'
                  }}
                >
                  <option style={{ background: '#1e293b', color: 'white' }} value="قيد التنفيذ">⏳ قيد التنفيذ</option>
                  <option style={{ background: '#1e293b', color: 'white' }} value="مكتمل">🟢 مكتمل</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{t.department || 'عام'} ({t.project || '-'})</span>
                <span style={{ 
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                  background: t.priority === 'عالية' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: t.priority === 'عالية' ? '#f87171' : '#60a5fa'
                }}>
                  {t.priority}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                  <FiUser style={{ color: '#3b82f6' }} /> {t.assignedTo || 'غير مسند'}
                </div>
                <div onClick={() => openDeadlineModal(t)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer' }}>
                  <FiCalendar /> {formatDateOnly(t.deadline)}
                </div>
              </div>

              {/* آخر ملاحظة */}
              <div 
                onClick={() => openNotesModal(t)} 
                style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiMessageSquare style={{ color: '#38bdf8' }} /> آخر ملاحظة (اضغط للعرض والإضافة):
                </div>
                {getLastNotePreview(t.notes)}
              </div>

              {/* أزرار الإجراءات */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => startEdit(t)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#334155', gap: '6px' }}>
                  <FiEdit2 /> تعديل
                </button>
                <button onClick={() => deleteTask(t.id)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#ef4444', color: 'white', gap: '6px' }}>
                  <FiTrash2 /> حذف
                </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
            لا توجد مهام مسجلة سحابياً.
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
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '550px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' };