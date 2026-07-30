import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, saveProjectToSheet } from '@/services/dbService';
import { FiMessageSquare, FiX, FiSearch } from 'react-icons/fi';

const statuses = ['تحت الإجراء', 'لم يتم الرد', 'تم التواصل', 'تم التعاقد', 'تم التنفيذ', 'مغلق'];

export default function ActiveClientsPage() {
  const [activeClients, setActiveClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // شريط البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');

  // حالة التحكم بالنافذة المنبثقة (Modal) عند تغيير الحالة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');

  // حالات نافذة عرض سجل المحادثات
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<any>(null);

  const getCurrentUsername = () => {
    try {
      const currentUserStr = localStorage.getItem('currentUser') || localStorage.getItem('adminUser');
      if (currentUserStr) {
        const parsed = JSON.parse(currentUserStr);
        if (parsed.username) return parsed.username;
        if (parsed.email) return parsed.email.split('@')[0];
      }
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) return userEmail.split('@')[0];
    } catch (e) {
      console.error("Error parsing current user session:", e);
    }
    return localStorage.getItem('userName') || 'أحمد';
  };

  const currentEmployee = getCurrentUsername();

  useEffect(() => { 
    loadActiveClients(); 
  }, []);

  const cleanValue = (val: any) => {
    if (val === null || val === undefined || val === '') return '0';
    const cleanStr = String(val).replace(/ر\.س/g, '').replace(/SAR/gi, '').replace(/,/g, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? cleanStr : num.toLocaleString();
  };

  const loadActiveClients = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      
      const records = Array.isArray(data) ? data
        .filter((item: any) => {
          const status = (item.status || '').trim();
          return status !== 'جديد' && status !== 'مغلق' && status !== '';
        })
        .map((item: any, index: number) => ({
          id: item.orderId || item.id || index,
          name: item.customerName || item.clientName || item.name || 'شركة غير معروفة',
          contact: item.customerName || item.clientName || '-',
          email: item.email || item.clientEmail || '-',
          phone: item.whatsapp || item.phone || item.mobile || item.phoneNumber || item.tel || '-',
          value: cleanValue(item.price || item.amount || item.value || '0'),
          assignedEmployee: item.lastContactedBy || item.assignedEmployee || 'النظام',
          notes: item.notes || item.details || 'لا توجد ملاحظات سابقة',
          status: item.status || 'تحت الإجراء'
        })) : [];

      setActiveClients(records);
    } catch (error) {
      console.error("خطأ في جلب العملاء الفعليين من قوقل شيت:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestNote = (notesString: string) => {
    if (!notesString || notesString === 'لا توجد ملاحظات سابقة') return 'لا توجد ملاحظات سابقة';
    const parts = notesString.split('---');
    let latest = parts[0].trim();
    
    latest = latest
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(\s+\d{1,2}:\d{2}(:\d{2})?)?\b/g, '')
      .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(\s+\d{1,2}:\d{2}(:\d{2})?)?\b/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/(تاريخ|الساعة|بتاريخ):?/g, '')
      .trim();

    latest = latest.replace(/^[-–—,:\s]+|[-–—,:\s]+$/g, '').trim();
    return latest.length > 0 ? latest : 'لا توجد ملاحظات سابقة';
  };

  const handleStatusSelect = (client: any, newStatus: string) => {
    if (client.status === newStatus) return;
    setSelectedClient(client);
    setPendingStatus(newStatus);
    setNoteInput('');
    setIsModalOpen(true);
  };

  const handleConfirmUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toLocaleString('ar-SA');
      const formattedNote = `[${timestamp}] @${currentEmployee} غير الحالة إلى (${pendingStatus})${noteInput ? `: ${noteInput}` : ''}`;
      
      const finalNotes = selectedClient.notes && selectedClient.notes !== 'لا توجد ملاحظات سابقة' 
        ? `${formattedNote} \n---\n ${selectedClient.notes}` 
        : formattedNote;

      await updateOrderStatus(selectedClient.id, pendingStatus, currentEmployee, finalNotes);
      
      if (pendingStatus === 'تم التعاقد') {
        const projectId = 'PRJ-' + Date.now();
        await saveProjectToSheet({
          id: projectId,
          name: selectedClient.name,
          clientName: selectedClient.name,
          stage: 'مرحلة البدء', 
          startDate: new Date().toISOString().split('T')[0],
          progress: '0',
          status: 'قيد التخطيط والتأسيس',
          notes: `--- سجل ملاحظات CRM المحول --- \n${finalNotes}`
        });
      }

      setIsModalOpen(false);
      setSelectedClient(null);
      loadActiveClients();
      alert("تم تحديث الحالة وترحيل المشروع بكافة ملاحظاته بنجاح! 🚀");
    } catch (error) {
      console.error("خطأ أثناء التحديث:", error);
      alert("فشل التحديث، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuickNote = async (client: any) => {
    const note = prompt("اكتب ملاحظتك الجديدة ليراها بقية الزملاء في الداشبورد:");
    if (!note) return;

    try {
      const timestamp = new Date().toLocaleString('ar-SA');
      const formattedNote = `[${timestamp}] @${currentEmployee}: ${note}`;
      const finalNotes = client.notes && client.notes !== 'لا توجد ملاحظات سابقة' 
        ? `${formattedNote} \n---\n ${client.notes}` 
        : formattedNote;

      await updateOrderStatus(client.id, client.status, currentEmployee, finalNotes);
      loadActiveClients();
      alert("تمت إضافة الملاحظة بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء إضافة الملاحظة:", error);
      alert("فشل الحفظ.");
    }
  };

  // تصفية العملاء بناءً على البحث والفلترة
  const filteredClients = activeClients.filter(c => {
    const nameStr = String(c.name || '').toLowerCase();
    const emailStr = String(c.email || '').toLowerCase();
    const phoneStr = String(c.phone || '');
    const term = searchTerm.toLowerCase();

    const matchesSearch = nameStr.includes(term) || emailStr.includes(term) || phoneStr.includes(term);
    const matchesStatus = filterStatus === 'الكل' || c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
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

      {/* رأس الصفحة وزر التحديث */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>العملاء الفعليين (Audit Trail)</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>متابعة العملاء الفعليين وسجل المتابعة اللحظي</p>
        </div>
        <button onClick={loadActiveClients} style={primaryBtn}>تحديث البيانات 🔄</button>
      </div>

      {/* شريط البحث والفلترة الذكية */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', top: '13px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث ذكي (اسم الشركة، الإيميل، الجوال)..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 38px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
          >
            <option value="الكل">كل الحالات (فلترة)</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>جاري التحميل...</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
          <div className="desktop-table-view" style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '1100px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                  {['الشركة', 'الإيميل', 'الجوال', 'القيمة', 'آخر مسؤول', 'سجل المتابعة (آخر تحديث)', 'الحالة'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredClients.length > 0 ? (
                  filteredClients.map(c => {
                    const cleanPhone = String(c.phone || '').replace(/[^0-9]/g, '');
                    const whatsappUrl = cleanPhone.length > 5 ? `https://wa.me/${cleanPhone}` : '#';
                    const gmailUrl = c.email && c.email !== '-' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}&su=${encodeURIComponent('تواصل بخصوص مشاريعكم معنا')}` : '#';

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f8fafc' }}>{c.name}</td>
                        <td style={{ ...tdStyle, color: '#94a3b8' }}>
                          {c.email && c.email !== '-' ? (
                            <a href={gmailUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                              {c.email}
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ ...tdStyle, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          <span dir="ltr">
                            {cleanPhone.length > 5 ? (
                              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 'bold' }}>
                                {c.phone}
                              </a>
                            ) : c.phone}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{c.value} ر.س</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#60a5fa', whiteSpace: 'nowrap' }}>@{c.assignedEmployee}</td>
                        
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px', background: '#0f172a', padding: '8px', borderRadius: '6px', border: '1px solid #334155', maxWidth: '300px' }}>
                            {getLatestNote(c.notes)}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => handleAddQuickNote(c)}
                              style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #38bdf844', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              + ملاحظة 📝
                            </button>

                            <button 
                              onClick={() => { setHistoryClient(c); setIsHistoryModalOpen(true); }}
                              style={{ fontSize: '0.75rem', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid #475569', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              💬 السجل الكامل ({c.notes.split('---').length})
                            </button>
                          </div>
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <select 
                            value={c.status} 
                            onChange={(e) => handleStatusSelect(c, e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #475569', cursor: 'pointer', background: '#065f46', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', outline: 'none' }}
                          >
                            {statuses.map(s => <option key={s} value={s} style={{ background: '#1e293b', color: 'white' }}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      لا توجد عملاء تحت المتابعة النشطة مطابقة للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
            {filteredClients.length > 0 ? (
              filteredClients.map(c => {
                const cleanPhone = String(c.phone || '').replace(/[^0-9]/g, '');
                const whatsappUrl = cleanPhone.length > 5 ? `https://wa.me/${cleanPhone}` : '#';
                const gmailUrl = c.email && c.email !== '-' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}&su=${encodeURIComponent('تواصل بخصوص مشاريعكم معنا')}` : '#';

                return (
                  <div key={c.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{c.name}</span>
                      <select 
                        value={c.status} 
                        onChange={(e) => handleStatusSelect(c, e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', background: '#065f46', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', outline: 'none' }}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>@{c.assignedEmployee}</span>
                      <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{c.value} ر.س</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <div>📱 <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 'bold' }}>{c.phone}</a></div>
                      <div>✉️ <a href={gmailUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>{c.email !== '-' ? c.email : 'لا يوجد'}</a></div>
                    </div>

                    {/* آخر ملاحظة */}
                    <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>آخر تحديث:</div>
                      {getLatestNote(c.notes)}
                    </div>

                    {/* أزرار الإجراءات */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        onClick={() => handleAddQuickNote(c)}
                        style={{ flex: 1, fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #38bdf844', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        + ملاحظة 📝
                      </button>

                      <button 
                        onClick={() => { setHistoryClient(c); setIsHistoryModalOpen(true); }}
                        style={{ flex: 1, fontSize: '0.8rem', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid #475569', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        💬 السجل ({c.notes.split('---').length})
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد عملاء مطابقة للبحث الحالي.
              </div>
            )}
          </div>
        </>
      )}

      {/* نافذة تغيير الحالة */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleConfirmUpdate} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>📝 توثيق تغيير الحالة وترحيل المشروع</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}>
              أنت على وشك تغيير حالة العميل إلى: <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{pendingStatus}</span>
              {pendingStatus === 'تم التعاقد' && <span style={{ display: 'block', color: '#059669', fontWeight: 'bold', marginTop: '5px' }}>✨ سيتم إنشاء مشروع جديد مع كافة ملاحظات CRM تلقائياً!</span>}
            </p>
            
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', color: '#1e293b' }}>
              اكتب تفاصيل التحديث أو الملاحظة للموظف التالي:
            </label>
            <textarea 
              rows={4}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="اكتب تفاصيل ما حدث مع العميل هنا..."
              style={textareaStyle}
              disabled={isSubmitting}
              required
            />

            {isSubmitting && (
              <div style={{ margin: '10px 0', padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                ⏳ جاري الحفظ والتحديث سحابياً... الرجاء الانتظار وعدم إغلاق النافذة.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتحديث ✅'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={secondaryBtn} disabled={isSubmitting}>إلغاء ❌</button>
            </div>
          </form>
        </div>
      )}

      {/* نافذة سجل المحادثات الكامل */}
      {isHistoryModalOpen && historyClient && (
        <div style={modalOverlay}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '550px', maxWidth: '90%', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMessageSquare style={{ color: '#2563eb' }} /> سجل المحادثات: {historyClient.name}
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingLeft: '5px', marginBottom: '20px' }}>
              {historyClient.notes ? (
                historyClient.notes.split('---').map((noteBlock: string, index: number) => {
                  if (!noteBlock.trim()) return null;
                  return (
                    <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>ملاحظة رقم #{index + 1}</div>
                      <div style={{ whiteSpace: 'pre-line' }}>{noteBlock.trim()}</div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>لا توجد ملاحظات مسجلة لهذا العميل حتى الآن.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <button onClick={() => setIsHistoryModalOpen(false)} style={primaryBtn}>إغلاق النافذة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.85rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, verticalAlign: 'middle' as const };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const secondaryBtn = { background: '#64748b', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem' };
const textareaStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' as const, color: '#1e293b' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', color: '#1e293b', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' };