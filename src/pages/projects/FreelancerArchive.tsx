import { useState, useEffect } from 'react';
import { getFreelanceSheet, saveFreelanceToSheet, deleteFreelanceFromSheet } from '@/services/dbService';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiRefreshCw, FiLoader, FiUser, FiX } from 'react-icons/fi';

export default function FreelancerArchive() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFreelancer, setCurrentFreelancer] = useState({
    id: '',
    name: '',
    specialty: '',
    phone: '',
    value: '',
    maxValue: '',
    status: 'نشط'
  });

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const data = await getFreelanceSheet();
      const list = Array.isArray(data) ? data : [];
      list.sort((a: any, b: any) => {
        const idA = Number(String(a.id).replace(/\D/g, '')) || 0;
        const idB = Number(String(b.id).replace(/\D/g, '')) || 0;
        return idB - idA;
      });
      setFreelancers(list);
    } catch (error) {
      console.error("Error fetching freelance archive:", error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (freelancer: any = null) => {
    if (freelancer) {
      setCurrentFreelancer(freelancer);
    } else {
      setCurrentFreelancer({
        id: 'FR-' + Date.now(),
        name: '',
        specialty: '',
        phone: '',
        value: '',
        maxValue: '',
        status: 'نشط'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentFreelancer.name.trim()) {
      alert("الرجاء إدخال اسم المستقل أو المزود.");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveFreelanceToSheet(currentFreelancer);
      await fetchFreelancers();
      setIsModalOpen(false);
      alert("تم حفظ بيانات المستقل سحابياً بنجاح! ✅");
    } catch (error) {
      console.error("Error saving freelancer:", error);
      alert("فشل الحفظ، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستقل/المزود من الأرشيف؟")) {
      try {
        setLoading(true);
        await deleteFreelanceFromSheet(id);
        await fetchFreelancers();
      } catch (error) {
        alert("فشل الحذف سحابياً.");
        setLoading(false);
      }
    }
  };

  const handleStatusChangeQuick = async (f: any, newStatus: string) => {
    const updated = { ...f, status: newStatus };
    try {
      await saveFreelanceToSheet(updated);
      await fetchFreelancers();
    } catch (error) {
      alert("فشل تحديث الحالة.");
    }
  };

  const filteredFreelancers = freelancers.filter(f => {
    const name = String(f.name || '').toLowerCase();
    const specialty = String(f.specialty || '').toLowerCase();
    const phone = String(f.phone || '');
    const term = searchTerm.toLowerCase();
    return name.includes(term) || specialty.includes(term) || phone.includes(term);
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

      {/* رأس الصفحة وأزرار التحكم */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={iconHeaderBox}><FiUser style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            أرشيف المستقلين 
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            قاعدة بيانات تشغيلية سحابية لإدارة بيانات المزودين والمستقلين، التخصصات، الحدود المالية، وحالات التعاون
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '550px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <FiSearch style={{ position: 'absolute', right: '12px', top: '13px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="بحث بالاسم، التخصص، أو الجوال..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <button onClick={fetchFreelancers} style={secondaryBtn} disabled={loading}>
            {loading ? <FiLoader className="spin" /> : <FiRefreshCw />} تحديث
          </button>
          <button onClick={() => handleOpenModal()} style={primaryBtn}>
            <FiPlus style={{ color: 'white' }} /> إضافة مزود جديد
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 'bold' }}>
                {currentFreelancer.id ? '✏️ تعديل بيانات المستقل / المزود' : '➕ إضافة مزود أو مستقل جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}><FiX size={18} /></button>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>اسم المستقل / المزود *</label>
              <input placeholder="مثل: أحمد محمد" style={inputStyle} value={currentFreelancer.name} onChange={e => setCurrentFreelancer({...currentFreelancer, name: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>التخصص 🏷️</label>
              <input placeholder="مثل: مونتاج فيديو / تصميم واجهات / تعليق صوتي" style={inputStyle} value={currentFreelancer.specialty} onChange={e => setCurrentFreelancer({...currentFreelancer, specialty: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>رقم التواصل (الجوال / الواتساب)</label>
              <input placeholder="مثل: +966500000000" style={inputStyle} value={currentFreelancer.phone} onChange={e => setCurrentFreelancer({...currentFreelancer, phone: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>القيمة الحالية (ر.س)</label>
                <input type="number" placeholder="0.00" style={inputStyle} value={currentFreelancer.value} onChange={e => setCurrentFreelancer({...currentFreelancer, value: e.target.value})} disabled={isSubmitting} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>القيمة كحد أقصى (ر.س)</label>
                <input type="number" placeholder="0.00" style={inputStyle} value={currentFreelancer.maxValue} onChange={e => setCurrentFreelancer({...currentFreelancer, maxValue: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>الحالة</label>
              <select style={inputStyle} value={currentFreelancer.status} onChange={e => setCurrentFreelancer({...currentFreelancer, status: e.target.value})} disabled={isSubmitting}>
                <option value="نشط">🟢 نشط</option>
                <option value="متوقف">🟡 متوقف</option>
                <option value="ملغي">🔴 ملغي</option>
              </select>
            </div>

            {isSubmitting && (
              <div style={{ margin: '10px 0', padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                ⏳ جاري الحفظ سحابياً... الرجاء الانتظار.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} style={{ ...primaryBtn, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ سحابياً ✅'}
              </button>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
      <div className="desktop-table-view" style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1e293b' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a' }}>
              {['المستقل / المزود', 'التخصص', 'رقم التواصل', 'القيمة الحالية', 'الحد الأقصى', 'الحالة التشغيلية', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري جلب بيانات الأرشيف سحابياً... 🔄</td></tr>
            ) : filteredFreelancers.length > 0 ? (
              filteredFreelancers.map((f, index) => (
                <tr key={f.id || index} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'white' }}>{f.name}</td>
                  
                  <td style={tdStyle}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {f.specialty || 'غير مصنف'}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, color: '#38bdf8' }}><span dir="ltr">{f.phone || '-'}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#4ade80' }}>{f.value ? Number(f.value).toLocaleString() + ' ر.س' : '0 ر.س'}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f87171' }}>{f.maxValue ? Number(f.maxValue).toLocaleString() + ' ر.س' : 'غير محدود'}</td>
                  
                  <td style={tdStyle}>
                    <select 
                      value={f.status || 'نشط'} 
                      onChange={(e) => handleStatusChangeQuick(f, e.target.value)}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #334155', 
                        background: f.status === 'نشط' ? '#065f46' : f.status === 'متوقف' ? '#b45309' : '#991b1b', 
                        color: 'white', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="نشط">🟢 نشط</option>
                      <option value="متوقف">🟡 متوقف</option>
                      <option value="ملغي">🔴 ملغي</option>
                    </select>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(f)} style={actionBtn} title="تعديل"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(f.id)} style={{...actionBtn, background: '#ef4444', color: 'white'}} title="حذف"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  لا توجد سجلات مسجلة في أرشيف المستقلين حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
      <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري جلب بيانات الأرشيف سحابياً... 🔄</div>
        ) : filteredFreelancers.length > 0 ? (
          filteredFreelancers.map((f, index) => {
            const cleanPhone = String(f.phone || '').replace(/[^0-9]/g, '');
            const whatsappUrl = cleanPhone.length > 5 ? `https://wa.me/${cleanPhone}` : '#';

            return (
              <div key={f.id || index} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{f.name}</span>
                  <select 
                    value={f.status || 'نشط'} 
                    onChange={(e) => handleStatusChangeQuick(f, e.target.value)}
                    style={{ 
                      padding: '6px 10px', 
                      borderRadius: '8px', 
                      border: '1px solid #334155', 
                      background: f.status === 'نشط' ? '#065f46' : f.status === 'متوقف' ? '#b45309' : '#991b1b', 
                      color: 'white', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    <option value="نشط">🟢 نشط</option>
                    <option value="متوقف">🟡 متوقف</option>
                    <option value="ملغي">🔴 ملغي</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 'bold' }}>
                    {f.specialty || 'غير مصنف'}
                  </span>
                  <span dir="ltr">📱 <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 'bold' }}>{f.phone || 'لا يوجد'}</a></span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <div>القيمة الحالية: <strong style={{ color: '#4ade80' }}>{f.value ? Number(f.value).toLocaleString() + ' ر.س' : '0 ر.س'}</strong></div>
                  <div>الحد الأقصى: <strong style={{ color: '#f87171' }}>{f.maxValue ? Number(f.maxValue).toLocaleString() + ' ر.س' : 'غير محدود'}</strong></div>
                </div>

                {/* أزرار الإجراءات */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => handleOpenModal(f)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#334155', gap: '6px' }}>
                    <FiEdit2 /> تعديل
                  </button>
                  <button onClick={() => handleDelete(f.id)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#ef4444', color: 'white', gap: '6px' }}>
                    <FiTrash2 /> حذف
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
            لا توجد سجلات مسجلة في أرشيف المستقلين حالياً.
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
const searchInputStyle = { padding: '10px 35px 10px 15px', borderRadius: '10px', border: '1px solid #334155', outline: 'none', width: '100%', background: '#1e293b', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' as const };
const primaryBtn = { padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const secondaryBtn = { padding: '10px 18px', background: '#334155', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { border: 'none', borderRadius: '8px', padding: '8px 10px', color: '#fff', background: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' };