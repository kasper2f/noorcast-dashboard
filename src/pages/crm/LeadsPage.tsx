import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '@/services/dbService';
import { FiSearch } from 'react-icons/fi';

const statuses = ['جديد', 'تحت الإجراء', 'لم يتم الرد', 'تم التواصل', 'تم التعاقد', 'تم التنفيذ', 'مغلق'];

export default function LeadsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');

  // حالة التحكم بالنافذة المنبثقة (Modal) عند تغيير الحالة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false); // ⏳ حالة الإرسال والانتظار لمنع التكرار

  // استخراج اسم المستخدم (Username) الحقيقي للموظف المسجل دخول حالياً
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
    loadClients(); 
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      
      const records = Array.isArray(data) ? data
        .filter((item: any) => {
          const status = (item.status || 'جديد').trim();
          return status === 'جديد' || status === 'مغلق' || status === '' || status === 'تحت الإجراء' || status === 'تم التواصل';
        })
        .map((item: any, index: number) => ({
          id: item.orderId || item.id || index,
          orderId: item.orderId || item.id || item.order_id || `#${index + 1}`,
          name: item.customerName || item.clientName || item.name || 'عميل غير معروف',
          contact: item.customerName || item.clientName || '-',
          email: item.email || item.clientEmail || '-',
          phone: item.whatsapp || item.phone || item.mobile || item.phoneNumber || item.tel || '-',
          socialMedia: item.socials || item.socialMedia || item.social || '-',
          packageName: item.packageName || item.package || item.serviceName || item.orderType || '-',
          details: item.details || item.orderDescription || item.description || item.requestDetails || item.orderNotes || '-',
          value: item.price || item.amount || item.value || '0',
          notes: item.notes || item.details || 'لا توجد ملاحظات سابقة',
          status: item.status || 'جديد',
        })) : [];
      setClients(records);
    } catch (error) {
      console.error("خطأ في جلب العملاء من قوقل شيت:", error);
    } finally {
      setLoading(false);
    }
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
    if (!selectedClient || isSubmitting) return;

    try {
      setIsSubmitting(true); // تفعيل مؤشر الانتظار وتعطل الأزرار فوراً لمنع التكرار
      const timestamp = new Date().toLocaleString('ar-SA');
      const formattedNote = `[${timestamp}] @${currentEmployee} غير الحالة إلى (${pendingStatus})${noteInput ? `: ${noteInput}` : ''}`;
      
      const finalNotes = selectedClient.notes && selectedClient.notes !== 'لا توجد ملاحظات سابقة' 
        ? `${formattedNote} \n---\n ${selectedClient.notes}` 
        : formattedNote;

      await updateOrderStatus(selectedClient.id, pendingStatus, currentEmployee, finalNotes);
      
      setIsModalOpen(false);
      setSelectedClient(null);
      await loadClients();
      alert("تم تحديث الحالة وتسجيل الملاحظة بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء تحديث الحالة:", error);
      alert("فشل تحديث الحالة، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false); // إعادة تعيين حالة الانتظار بعد الانتهاء
    }
  };

  const filteredClients = clients.filter(c => {
    const orderIdStr = String(c.orderId || '').toLowerCase();
    const nameStr = String(c.name || '').toLowerCase();
    const emailStr = String(c.email || '').toLowerCase();
    const phoneStr = String(c.phone || '');
    const packageStr = String(c.packageName || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = orderIdStr.includes(term) || nameStr.includes(term) || emailStr.includes(term) || phoneStr.includes(term) || packageStr.includes(term);
    const matchesStatus = filterStatus === 'الكل' || c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      {/* حقن قواعد الاستجابة الذكية (Media Queries) */}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>العملاء المحتملين</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>إدارة الطلبات الجديدة ومتابعتها بلحظية</p>
        </div>
        <button onClick={loadClients} style={primaryBtn}>تحديث البيانات 🔄</button>
      </div>

      {/* شريط البحث والفلترة الذكية */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', alignItems: 'center' }}>
        
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', top: '13px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث ذكي (برقم الطلب، الاسم، الإيميل، الجوال، أو الباقة)..." 
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
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>جاري تحميل البيانات...</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب */}
          <div className="desktop-table-view" style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '1200px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                  {['رقم الطلب (ID)', 'الشركة / العميل', 'الإيميل', 'الجوال / الواتساب', 'السوشل ميديا', 'نوع الباقة (Package)', 'تفاصيل الطلب (Details)', 'القيمة (ر.س)', 'الحالة'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredClients.length > 0 ? (
                  filteredClients.map(c => {
                    const cleanPhone = String(c.phone || '').replace(/[^0-9]/g, '');
                    const whatsappUrl = cleanPhone.length > 5 ? `https://wa.me/${cleanPhone}` : '#';
                    const gmailUrl = c.email && c.email !== '-' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}&su=${encodeURIComponent('تواصل بخصوص طلبكم معنا')}` : '#';

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8', whiteSpace: 'nowrap' }}>
                          <span style={{ background: '#0f172a', padding: '5px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                            {c.orderId}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f8fafc', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ ...tdStyle, color: '#94a3b8' }}>
                          {c.email && c.email !== '-' ? (
                            <a href={gmailUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }} title="إرسال بريد إلكتروني">
                              {c.email}
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ ...tdStyle, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          <span dir="ltr">
                            {cleanPhone.length > 5 ? (
                              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 'bold' }} title="مراسلة عبر واتساب">
                                {c.phone}
                              </a>
                            ) : c.phone}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{c.socialMedia}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: '5px 10px', borderRadius: '6px', background: '#334155', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', border: '1px solid #475569' }}>
                            {c.packageName}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', minWidth: '200px', maxWidth: '300px', whiteSpace: 'pre-line', lineHeight: '1.4' }} title={c.details}>
                            {c.details}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{c.value} ر.س</td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <select 
                            value={c.status} 
                            onChange={(e) => handleStatusSelect(c, e.target.value)} 
                            style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #475569', cursor: 'pointer', background: '#1e293b', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', outline: 'none' }}
                          >
                            {statuses.map(s => <option key={s} value={s} style={{ background: '#1e293b', color: 'white' }}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      لا توجد طلبات مطابقة لخيارات البحث أو الفلترة الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. عرض الجوال والأجهزة الذكية الصغرى */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
            {filteredClients.length > 0 ? (
              filteredClients.map(c => {
                const cleanPhone = String(c.phone || '').replace(/[^0-9]/g, '');
                const whatsappUrl = cleanPhone.length > 5 ? `https://wa.me/${cleanPhone}` : '#';
                const gmailUrl = c.email && c.email !== '-' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}&su=${encodeURIComponent('تواصل بخصوص طلبكم معنا')}` : '#';

                return (
                  <div key={c.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: '#0f172a', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #334155' }}>
                        {c.orderId}
                      </span>
                      <select 
                        value={c.status} 
                        onChange={(e) => handleStatusSelect(c, e.target.value)} 
                        style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', background: '#0f172a', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', outline: 'none' }}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{c.name}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#38bdf8' }}>{c.value} ر.س</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <div>📱 <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 'bold' }}>{c.phone}</a></div>
                      <div>✉️ <a href={gmailUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>{c.email !== '-' ? c.email : 'لا يوجد'}</a></div>
                      <div>🌐 <span style={{ color: '#cbd5e1' }}>{c.socialMedia}</span></div>
                      <div>📦 <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{c.packageName}</span></div>
                    </div>

                    {c.details && c.details !== '-' && (
                      <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.82rem', color: '#e2e8f0', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>التفاصيل والإضافات:</div>
                        {c.details}
                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد طلبات مطابقة للبحث الحالي.
              </div>
            )}
          </div>
        </>
      )}

      {/* نافذة التوثيق عند تغيير الحالة (مع تفعيل اشعار الانتظار والتعطيل) */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleConfirmUpdate} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>توثيق تغيير الحالة</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}>
              أنت على وشك تغيير حالة الطلب إلى: <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{pendingStatus}</span>
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} disabled={isSubmitting}>
                {isSubmitting ? '⏳ جاري الحفظ والتحديث...' : 'حفظ وتحديث ✅'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...secondaryBtn, opacity: isSubmitting ? 0.5 : 1 }} disabled={isSubmitting}>
                إلغاء ❌
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 14px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.85rem' };
const tdStyle = { padding: '12px 14px', textAlign: 'right' as const, verticalAlign: 'middle' as const };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const secondaryBtn = { background: '#64748b', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem' };
const textareaStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' as const, color: '#1e293b' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', color: '#1e293b', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' };