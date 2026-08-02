import { useState, useEffect } from 'react';
import { FiTrendingUp, FiTag, FiShare2, FiCalendar, FiPlus, FiTrash2, FiEdit2, FiLoader, FiRefreshCw, FiUpload, FiX, FiEdit } from 'react-icons/fi';
import { getCoupons, getMarketingSocialSheet, saveMarketingSocialToSheet, deleteMarketingSocialFromSheet, logDashboardAction, uploadFileToCloudinary } from '@/services/dbService';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlL0sfoWhBFXXoLd9ZiPu6boq9WvLlalu4_kf6DkXMdQtmf-XMM32Hxrq0TzFPga3K/exec';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('social'); 
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [couponItems, setCouponItems] = useState<any[]>([]);
  const [socialItems, setSocialItems] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false); // نافذة خاصة للكوبونات
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    platform: 'تيك توك',
    postType: 'فيديو',
    postTitle: '',
    caption: '',
    date: '',
    status: 'مجدول',
    mediaFile: null as File | null,
    mediaUrl: ''
  });

  // نموذج الكوبونات
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discount: '',
    status: 'نشط'
  });

  useEffect(() => {
    fetchDataFromCloud();
  }, []);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '-';
    try {
      const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = String(parseInt(parts[1], 10)); 
        const day = String(parseInt(parts[2], 10));   
        return `${year}-${month}-${day}`;
      }
      return cleanStr;
    } catch {
      return String(dateStr).substring(0, 10);
    }
  };

  const fetchDataFromCloud = async () => {
    setLoading(true);
    try {
      const coupons = await getCoupons();
      if (Array.isArray(coupons)) {
        setCouponItems(coupons.map((c: any, idx: number) => ({
          id: String(idx + 1),
          code: c?.Code || '',
          discount: c?.DiscountPercentage || '',
          status: String(c?.Active || '').toLowerCase() === 'true' || c?.Active === 'نشط' ? 'نشط' : 'متوقف',
          updatedBy: 'قوقل شيت'
        })));
      }

      const socialData = await getMarketingSocialSheet();
      if (Array.isArray(socialData)) {
        setSocialItems(socialData.map((s: any) => ({ ...s, date: formatDate(s.date) })));
      }
    } catch (e) {
      console.error("Error fetching cloud data:", e);
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

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      platform: 'تيك توك',
      postType: 'فيديو',
      postTitle: '',
      caption: '',
      date: new Date().toISOString().split('T')[0],
      status: 'مجدول',
      mediaFile: null,
      mediaUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    if (!item) return;
    setEditingId(item.id);
    setFormData({
      platform: item.platform || 'تيك توك',
      postType: item.postType || 'فيديو',
      postTitle: item.postTitle || '',
      caption: item.caption || '',
      date: item.date || '',
      status: item.status || 'مجدول',
      mediaFile: null,
      mediaUrl: item.mediaUrl || ''
    });
    setIsModalOpen(true);
  };

  // حفظ الكوبون سحابياً
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormData.code || !couponFormData.discount) {
      alert("يرجى إدخال كود الخصم ونسبته.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveCoupon',
          code: couponFormData.code.toUpperCase(),
          discount: couponFormData.discount,
          active: couponFormData.status === 'نشط'
        })
      });
      await fetchDataFromCloud();
      await logDashboardAction('COUPON_UPDATE', couponFormData.code, `تم حفظ الكوبون التسويقي سحابياً`);
      setIsCouponModalOpen(false);
      setCouponFormData({ code: '', discount: '', status: 'نشط' });
      alert("تم حفظ وتحديث الكوبون سحابياً بنجاح! 🏷️☁️");
    } catch (err) {
      alert("فشل حفظ الكوبون.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // تبديل حالة الكوبون مباشرة من الجدول (نشط / متوقف)
  const handleToggleCouponStatus = async (item: any) => {
    const newStatus = item.status === 'نشط' ? 'متوقف' : 'نشط';
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveCoupon',
          code: item.code,
          discount: item.discount,
          active: newStatus === 'نشط'
        })
      });
      await fetchDataFromCloud();
      alert(`تم تحديث حالة الكوبون إلى [${newStatus}] بنجاح!`);
    } catch (e) {
      alert("فشل تحديث الحالة.");
    }
  };

  const handleSaveItem = async () => {
    const username = getCurrentUsername();
    setIsSubmitting(true);

    try {
      if (activeTab === 'social') {
        let uploadedUrl = formData.mediaUrl;
        if (formData.mediaFile) {
          uploadedUrl = await uploadFileToCloudinary(formData.mediaFile);
        }

        const payload = {
          id: editingId || ('SOC-' + Date.now()),
          platform: formData.platform,
          postType: formData.postType,
          postTitle: formData.postTitle,
          caption: formData.caption,
          date: formData.date,
          mediaUrl: uploadedUrl,
          status: formData.status,
          updatedBy: username
        };

        await saveMarketingSocialToSheet(payload);
        await fetchDataFromCloud();
        await logDashboardAction('MARKETING_UPDATE', `Social Post: ${formData.postTitle}`, `قام الموظف (${username}) بحفظ/تحديث منشور تسويقي سحابياً`);
        setIsModalOpen(false);
        alert("تم حفظ المنشور والمزامنة السحابية بنجاح! 🚀☁️");
      }
    } catch (e) {
      alert("حدث خطأ أثناء الحفظ سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMediaInline = async (item: any, newMediaUrl: string) => {
    try {
      const username = getCurrentUsername();
      const updated = { ...item, mediaUrl: newMediaUrl, updatedBy: username };
      await saveMarketingSocialToSheet(updated);
      await fetchDataFromCloud();
      alert("تم تحديث الملف المرفق بنجاح! 📎");
    } catch (e) {
      alert("فشل تحديث الملف.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("هل أنت متأكد من الحذف سحابياً؟")) {
      try {
        await deleteMarketingSocialFromSheet(id);
        await fetchDataFromCloud();
        alert("تم الحذف بنجاح!");
      } catch (e) {
        alert("فشل الحذف.");
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const targetItem = socialItems.find((i: any) => i.id === id);
    if (!targetItem) return;

    try {
      const updated = { ...targetItem, status: newStatus, updatedBy: getCurrentUsername() };
      await saveMarketingSocialToSheet(updated);
      fetchDataFromCloud();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
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

      {/* رأس الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={iconHeaderBox}><FiTrendingUp style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            غرفة عمليات التسويق السحابية 🚀
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            إدارة المحتوى، الوسائط (صور/فيديوهات)، الحملات، والتقويم التسويقي المنهجي
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDataFromCloud} style={secondaryBtn} disabled={loading} title="مزامنة مع قوقل شيت">
            {loading ? <FiLoader className="spin" /> : <FiRefreshCw />} مزامنة سحابية 🔄
          </button>
          {activeTab === 'social' && (
            <button onClick={handleOpenAddModal} style={primaryBtn}>
              <FiPlus /> إضافة منشور جديد 
            </button>
          )}
          {activeTab === 'campaigns' && (
            <button onClick={() => { setCouponFormData({ code: '', discount: '', status: 'نشط' }); setIsCouponModalOpen(true); }} style={primaryBtn}>
              <FiPlus /> إضافة كوبون جديد 🏷️
            </button>
          )}
        </div>
      </div>

      {/* شريط التبويبات */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('social')} style={activeTab === 'social' ? activeTabBtn : tabBtn}><FiShare2 /> وسائل التواصل الاجتماعي والمحتوى</button>
        <button onClick={() => setActiveTab('campaigns')} style={activeTab === 'campaigns' ? activeTabBtn : tabBtn}><FiTag /> حملات النمو والكوبونات</button>
        <button onClick={() => setActiveTab('calendar')} style={activeTab === 'calendar' ? activeTabBtn : tabBtn}><FiCalendar /> التقويم التسويقي المنهجي</button>
      </div>

      {/* نافذة إضافة أو تعديل منشور */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#1e293b', marginBottom: '20px', fontWeight: 'bold' }}>
              {editingId ? '✏️ تعديل محتوى المنشور' : '➕ إضافة منشور جديد وإرفاق الوسائط'}
            </h3>

            <div style={fieldGroup}>
              <label style={labelStyle}>المنصة</label>
              <select style={inputStyle} value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                <option>تيك توك</option>
                <option>إنستغرام</option>
                <option>إكس (تويتر)</option>
                <option>سناب شات</option>
              </select>
            </div>
            
            <div style={fieldGroup}>
              <label style={labelStyle}>النوع</label>
              <input style={inputStyle} value={formData.postType} onChange={e => setFormData({...formData, postType: e.target.value})} placeholder="فيديو / صورة / ريلز" />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>عنوان المنشور</label>
              <input style={inputStyle} value={formData.postTitle} onChange={e => setFormData({...formData, postTitle: e.target.value})} placeholder="عنوان الفيديو أو التصميم" />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>الكابشن (Caption)</label>
              <textarea style={{...inputStyle, height: '70px', resize: 'vertical'}} value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} placeholder="اكتب النص التسويقي..." />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>التاريخ</label>
              <input type="date" style={inputStyle} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>إرفاق التصميم أو الفيديو (سحابياً):</label>
              <div style={uploadBoxStyle}>
                <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>📥</span>
                <input type="file" accept="image/*,video/*,.pdf" style={{ fontSize: '0.85rem', color: '#1e293b', width: '100%', cursor: 'pointer' }} onChange={(e: any) => setFormData({...formData, mediaFile: e.target.files[0]})} />
              </div>
              {formData.mediaUrl && !formData.mediaFile && (
                <a href={formData.mediaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'underline' }}>عرض المرفق الحالي 📎</a>
              )}
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>الحالة التفاعلية</label>
              <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>مجدول</option>
                <option>معتمد</option>
                <option>نشط</option>
                <option>متوقف</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveItem} style={primaryBtn} disabled={isSubmitting}>
                {isSubmitting ? '⏳ جاري الرفع والحفظ...' : 'حفظ سحابياً 🚀'}
              </button>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة أو تعديل الكوبونات */}
      {isCouponModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveCoupon} style={modalContent}>
            <h3 style={{ color: '#1e293b', marginBottom: '20px', fontWeight: 'bold' }}>🏷️ إضافة أو تعديل كوبون خصم سحابياً</h3>
            <div style={fieldGroup}>
              <label style={labelStyle}>كود الخصم (مثل: NOOR20):</label>
              <input style={inputStyle} value={couponFormData.code} onChange={e => setCouponFormData({...couponFormData, code: e.target.value})} placeholder="أدخل الكود..." required />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>نسبة الخصم (مثل: 20%):</label>
              <input style={inputStyle} value={couponFormData.discount} onChange={e => setCouponFormData({...couponFormData, discount: e.target.value})} placeholder="أدخل النسبة..." required />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>حالة الكوبون:</label>
              <select style={inputStyle} value={couponFormData.status} onChange={e => setCouponFormData({...couponFormData, status: e.target.value})}>
                <option>نشط</option>
                <option>متوقف</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>
                {isSubmitting ? '⏳ جاري الحفظ...' : 'حفظ الكوبون سحابياً 🚀'}
              </button>
              <button type="button" onClick={() => setIsCouponModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* الجداول التفاعلية */}
      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '30px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        
        {activeTab === 'social' && (
          <div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '15px' }}>📱 وسائل التواصل الاجتماعي وإدارة المحتوى والوسائط</h2>
            
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <th style={thStyle}>المنصة والنوع</th>
                    <th style={thStyle}>عنوان المنشور والكابشن</th>
                    <th style={thStyle}>التاريخ</th>
                    <th style={thStyle}>الوسائط المرفقة</th>
                    <th style={thStyle}>الحالة التفاعلية</th>
                    <th style={thStyle}>آخر تعديل بواسطة</th>
                    <th style={thStyle}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(socialItems) && socialItems.map((item: any, idx: number) => (
                    <tr key={item?.id || idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={tdStyle}>
                        <strong style={{ color: '#38bdf8' }}>{item?.platform || 'تيك توك'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item?.postType || 'فيديو'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold' }}>{item?.postTitle || 'بدون عنوان'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '280px', whiteSpace: 'pre-wrap' }}>{item?.caption || ''}</div>
                      </td>
                      <td style={tdStyle}>{item?.date || '-'}</td>
                      
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                          {item?.mediaUrl ? (
                            <>
                              <a href={item.mediaUrl} target="_blank" rel="noreferrer" style={{ background: '#2563eb', color: 'white', padding: '5px 8px', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                                <FiUpload /> معاينة
                              </a>
                              <label style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '5px 7px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} title="تغيير الملف">
                                <FiEdit size={12} />
                                <input type="file" accept="image/*,video/*,.pdf" style={{ display: 'none' }} onChange={async (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const newUrl = await uploadFileToCloudinary(file);
                                    await handleUpdateMediaInline(item, newUrl);
                                  }
                                }} />
                              </label>
                              <button onClick={() => handleUpdateMediaInline(item, '')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 7px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }} title="حذف الملف المرفق">
                                <FiX size={12} />
                              </button>
                            </>
                          ) : (
                            <label style={{ background: '#334155', color: '#38bdf8', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                              <span>📥 رفع ملف</span>
                              <input type="file" accept="image/*,video/*,.pdf" style={{ display: 'none' }} onChange={async (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const newUrl = await uploadFileToCloudinary(file);
                                  await handleUpdateMediaInline(item, newUrl);
                                }
                              }} />
                            </label>
                          )}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <select value={item?.status || 'مجدول'} onChange={(e) => handleStatusChange(item.id, e.target.value)} style={statusSelectStyle(item?.status)}>
                          <option>مجدول</option>
                          <option>معتمد</option>
                          <option>نشط</option>
                          <option>متوقف</option>
                        </select>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#94a3b8' }}>👤 {item?.updatedBy || 'النظام'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleOpenEditModal(item)} style={editBtn}><FiEdit2 /></button>
                          <button onClick={() => handleDeleteItem(item.id)} style={deleteBtn}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* عرض الجوال */}
            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {Array.isArray(socialItems) && socialItems.map((item: any, idx: number) => (
                <div key={item?.id || idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{item?.platform || 'تيك توك'} ({item?.postType || 'فيديو'})</span>
                    <select value={item?.status || 'مجدول'} onChange={(e) => handleStatusChange(item.id, e.target.value)} style={statusSelectStyle(item?.status)}>
                      <option>مجدول</option>
                      <option>معتمد</option>
                      <option>نشط</option>
                      <option>متوقف</option>
                    </select>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#f8fafc' }}>{item?.postTitle || 'بدون عنوان'}</div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap' }}>{item?.caption || ''}</p>
                  
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
                    {item?.mediaUrl ? (
                      <>
                        <a href={item.mediaUrl} target="_blank" rel="noreferrer" style={{ background: '#2563eb', color: 'white', padding: '5px 8px', borderRadius: '6px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                          <FiUpload /> معاينة
                        </a>
                        <label style={{ background: '#334155', color: '#38bdf8', padding: '5px 7px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                          <FiEdit size={12} />
                          <input type="file" accept="image/*,video/*,.pdf" style={{ display: 'none' }} onChange={async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const newUrl = await uploadFileToCloudinary(file);
                              await handleUpdateMediaInline(item, newUrl);
                            }
                          }} />
                        </label>
                        <button onClick={() => handleUpdateMediaInline(item, '')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 7px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                          <FiX size={12} />
                        </button>
                      </>
                    ) : (
                      <label style={{ background: '#334155', color: '#38bdf8', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        📥 رفع ملف
                        <input type="file" accept="image/*,video/*,.pdf" style={{ display: 'none' }} onChange={async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const newUrl = await uploadFileToCloudinary(file);
                            await handleUpdateMediaInline(item, newUrl);
                          }
                        }} />
                      </label>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>📅 {item?.date || '-'} | 👤 {item?.updatedBy || 'النظام'}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleOpenEditModal(item)} style={editBtn}><FiEdit2 /></button>
                      <button onClick={() => handleDeleteItem(item.id)} style={deleteBtn}><FiTrash2 /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {activeTab === 'campaigns' && (
          <div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '15px' }}>🏷️ حملات النمو والكوبونات (مربوطة مع قوقل شيت)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <th style={thStyle}>كود الخصم</th>
                    <th style={thStyle}>نسبة الخصم</th>
                    <th style={thStyle}>الحالة السحابية</th>
                    <th style={thStyle}>الإجراءات السريعة (تنشيط / إيقاف)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(couponItems) && couponItems.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{item?.code || ''}</td>
                      <td style={tdStyle}>{item?.discount || ''}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: item?.status === 'نشط' ? '#065f46' : '#b45309', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {item?.status || 'نشط'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => handleToggleCouponStatus(item)} style={{ background: item?.status === 'نشط' ? '#b45309' : '#065f46', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          {item?.status === 'نشط' ? 'إيقاف الكوبون ⏹️' : 'تنشيط الكوبون ▶️'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '15px' }}>📅 التقويم التسويقي المنهجي والموحد</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {Array.isArray(socialItems) && socialItems.map((s: any, idx: number) => (
                <div key={idx} style={{ background: '#1a2638', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #3b82f6', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold' }}>📱 {s?.platform || 'تيك توك'} ({s?.date || '-'})</span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', background: s?.status === 'نشط' || s?.status === 'معتمد' ? '#065f46' : '#b45309', color: 'white' }}>
                      {s?.status || 'مجدول'}
                    </span>
                  </div>
                  <h4 style={{ color: 'white', margin: '4px 0', fontSize: '0.95rem' }}>{s?.postTitle || ''}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>{s?.caption || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

const iconHeaderBox = { background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const tabBtn = { padding: '10px 18px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' };
const activeTabBtn = { padding: '10px 18px', background: '#2563eb', border: '1px solid #2563eb', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' };
const primaryBtn = { padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const secondaryBtn = { padding: '10px 18px', background: '#334155', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const editBtn = { background: '#3b82f6', border: 'none', borderRadius: '6px', padding: '6px 8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const deleteBtn = { background: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const thStyle = { padding: '12px 16px', textAlign: 'right' as const };
const tdStyle = { padding: '12px 16px', textAlign: 'right' as const, color: '#f8fafc', fontSize: '0.9rem', verticalAlign: 'middle' as const };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block', marginBottom: '5px' };
const uploadBoxStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1' };
const fieldGroup = { marginBottom: '10px' };
const statusSelectStyle = (status: string) => ({
  border: 'none', borderRadius: '6px', padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
  background: status === 'نشط' || status === 'معتمد' ? '#065f46' : '#b45309', outline: 'none'
});
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const };