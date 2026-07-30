import { useState, useEffect } from 'react';
import { getOrders } from '@/services/dbService';
import { FiSearch, FiMessageSquare, FiMail, FiFileText, FiX } from 'react-icons/fi';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // حالات نافذة سجل المحادثات الكاملة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientNotes, setSelectedClientNotes] = useState<string[]>([]);
  const [selectedClientName, setSelectedClientName] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const cleanPrice = (item: any) => {
    const rawVal = item.price ?? item.amount ?? item.value ?? item.packagePrice ?? 0;
    if (rawVal === null || rawVal === undefined || rawVal === '') return 0;
    
    const cleanStr = String(rawVal).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const getAbsoluteLatestNote = (notesString: string) => {
    if (!notesString || notesString === 'لا توجد ملاحظات سابقة') return 'لا توجد ملاحظات سابقة';
    
    const notesList = notesString.split('\n').filter(n => n.trim().length > 0);
    if (notesList.length === 0) return 'لا توجد ملاحظات سابقة';

    const absoluteLatest = notesList[0];

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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      
      const records = Array.isArray(data) ? data
        .filter((item: any) => {
          if (!item) return false;
          const status = String(item.status || '').trim().toLowerCase();
          return status === 'تم التنفيذ';
        })
        .map((item: any, index: number) => {
          const rawNotes = String(item.notes || item.details || 'لا توجد ملاحظات سابقة');
          const notesList = rawNotes.split('\n').filter(n => n.trim().length > 0);

          return {
            id: String(item.orderId || item.id || index),
            name: String(item.customerName || item.clientName || item.name || 'شركة غير معروفة'),
            email: String(item.email || item.clientEmail || '-'),
            phone: String(item.whatsapp || item.phone || item.mobile || item.phoneNumber || item.tel || '-'),
            value: cleanPrice(item),
            assignedEmployee: String(item.lastContactedBy || item.assignedEmployee || 'النظام'),
            notesList: notesList.length > 0 ? notesList : ['لا توجد ملاحظات سابقة'],
            latestNote: getAbsoluteLatestNote(rawNotes), 
            status: String(item.status || 'تم التنفيذ').trim()
          };
        }) : [];

      setClients(records);
    } catch (error) {
      console.error("خطأ في جلب بيانات أرشيف العملاء من قوقل شيت:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const openHistoryModal = (clientName: string, notes: string[]) => {
    setSelectedClientName(clientName);
    setSelectedClientNotes(notes);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c => {
    const name = String(c.name || '').toLowerCase();
    const email = String(c.email || '').toLowerCase();
    const phone = String(c.phone || '');
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
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

      {/* رأس الصفحة وشريط البحث */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>أرشيف العملاء المنفذين</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>سجل العملاء الذين اكتملت مشاريعهم وتم إنجازها بنجاح</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '450px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="بحث بالاسم، الإيميل، أو الجوال..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <button onClick={fetchClients} style={primaryBtn}>تحديث 🔄</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8', fontSize: '1.1rem' }}>جاري تحميل أرشيف العملاء...</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
          <div className="desktop-table-view" style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  {['الشركة / العميل', 'البريد الإلكتروني', 'الجوال / الواتساب', 'إجمالي التعاقد (LTV)', 'آخر مسؤول', 'آخر تحديث (ملاحظة أو النظام)', 'الحالة', 'تواصل سريع'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClients.length > 0 ? (
                  filteredClients.map(c => {
                    const cleanPhone = String(c.phone || '').replace(/[^0-9]/g, '');
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}&su=${encodeURIComponent('تواصل بخصوص مشروعكم معنا')}`;

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f8fafc', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{c.email}</td>
                        <td style={{ ...tdStyle, color: '#94a3b8', whiteSpace: 'nowrap' }}><span dir="ltr">{c.phone}</span></td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8', whiteSpace: 'nowrap' }}>{c.value.toLocaleString()} ر.س</td>
                        <td style={{ ...tdStyle, color: '#60a5fa', fontWeight: 'bold', whiteSpace: 'nowrap' }}>@{c.assignedEmployee}</td>
                        
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', maxWidth: '300px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.latestNote}>
                              {c.latestNote}
                            </div>
                            {c.notesList.length > 1 && (
                              <button 
                                onClick={() => openHistoryModal(c.name, c.notesList)} 
                                style={historyBtnStyle}
                              >
                                <FiFileText size={13} /> عرض سجل المحادثات والملاحظات ({c.notesList.length})
                              </button>
                            )}
                          </div>
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <span style={{ padding: '6px 12px', borderRadius: '8px', background: '#065f46', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', textAlign: 'center' }}>
                            {c.status}
                          </span>
                        </td>

                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {cleanPhone && cleanPhone.length > 5 && (
                              <a 
                                href={`https://wa.me/${cleanPhone}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title="مراسلة عبر واتساب"
                                style={waBtnStyle}
                              >
                                <FiMessageSquare size={16} />
                              </a>
                            )}
                            {c.email && c.email !== '-' && (
                              <a 
                                href={gmailUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                title="إرسال بريد إلكتروني عبر Gmail"
                                style={emailBtnStyle}
                              >
                                <FiMail size={16} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                      لا توجد عملاء في الأرشيف حالياً (بانتظار إنجاز المشاريع وتحويل حالتها إلى "تم التنفيذ").
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
                const gmailUrl = c.email && c.email !== '-' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}&su=${encodeURIComponent('تواصل بخصوص مشروعكم معنا')}` : '#';

                return (
                  <div key={c.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{c.name}</span>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#065f46', color: '#ffffff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {c.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>@{c.assignedEmployee}</span>
                      <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{c.value.toLocaleString()} ر.س</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <div>📱 <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 'bold' }}>{c.phone}</a></div>
                      <div>✉️ <a href={gmailUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>{c.email !== '-' ? c.email : 'لا يوجد'}</a></div>
                    </div>

                    {/* آخر ملاحظة */}
                    <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>آخر تحديث:</div>
                      {c.latestNote}
                    </div>

                    {/* زر عرض السجل الكامل إن وجد */}
                    {c.notesList.length > 1 && (
                      <button 
                        onClick={() => openHistoryModal(c.name, c.notesList)} 
                        style={{ ...historyBtnStyle, width: '100%', justifyContent: 'center', padding: '8px' }}
                      >
                        <FiFileText size={14} /> عرض سجل المحادثات ({c.notesList.length})
                      </button>
                    )}

                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد عملاء في الأرشيف مطابقة للبحث الحالي.
              </div>
            )}
          </div>
        </>
      )}

      {/* نافذة منبثقة (Modal) لعرض جميع المحادثات والملاحظات السابقة */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>💬 سجل المحادثات والملاحظات الكامل: {selectedClientName}</h3>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}><FiX size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingLeft: '5px' }}>
              {selectedClientNotes.map((note, index) => (
                <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>ملاحظة رقم #{index + 1}</div>
                  {note}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              <button onClick={() => setIsModalOpen(false)} style={primaryBtn}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tableStyle = { width: '100%', background: '#1e293b', color: 'white', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '1000px' };
const thStyle = { padding: '16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' };
const tdStyle = { padding: '16px', textAlign: 'right' as const, verticalAlign: 'middle' as const };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const searchInputStyle = { padding: '10px 35px 10px 15px', borderRadius: '8px', border: '1px solid #475569', outline: 'none', width: '100%', background: '#1e293b', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' as const };
const waBtnStyle = { background: '#22c55e', color: 'white', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };
const emailBtnStyle = { background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };
const historyBtnStyle = { background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'fit-content' };

const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '550px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' };