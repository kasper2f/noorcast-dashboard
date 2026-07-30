import { useState, useEffect } from 'react';
import { 
  getFreelanceFinanceSheet, 
  saveFreelanceFinanceToSheet, 
  deleteFreelanceFinanceFromSheet, 
  getProjects,
  getIncomingBillsSheet
} from '@/services/dbService';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiRefreshCw, FiLoader, FiDollarSign, FiX, FiDownload, FiFilter } from 'react-icons/fi';

export default function FreelancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // حالات الفلترة
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [nameFilter, setNameFilter] = useState('ALL');

  // حالات النافذة المنبثقة (إضافة / تعديل التزام)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: '',
    projectId: '',
    freelancerName: '',
    desc: '',
    category: 'تصميم ومونتاج',
    estimatedCost: '',
    actualCost: '',
    sellPrice: '',
    status: 'معلق / مستحق ⏳',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [financeData, projectsData, incomingBillsData] = await Promise.all([
        getFreelanceFinanceSheet().catch(() => []),
        getProjects().catch(() => []),
        getIncomingBillsSheet().catch(() => [])
      ]);

      let list = Array.isArray(financeData) ? financeData : [];
      let updatedAny = false;

      // المطابقة التلقائية والحفظ الجذري السحابي إذا وُجدت فاتورة واردة مسددة
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const isPending = String(item.status || '').includes('معلق');

        if (isPending) {
          const matchedBill = incomingBillsData.find((bill: any) => {
            const supplierName = String(bill.supplier || '').toLowerCase().trim();
            const freelancerName = String(item.freelancerName || '').toLowerCase().trim();
            const billStatus = String(bill.status || '').toLowerCase().trim();

            const isNameMatch = supplierName.includes(freelancerName) || freelancerName.includes(supplierName);
            const isPaid = billStatus.includes('مسدد') || billStatus.includes('تم السداد') || billStatus.includes('مدفوع');

            return isNameMatch && isPaid;
          });

          if (matchedBill) {
            list[i].status = 'تم السداد / مصروف فعلي ✅';
            updatedAny = true;

            try {
              await saveFreelanceFinanceToSheet(list[i]);
            } catch (err) {
              console.error("Failed to sync auto-status to cloud:", err);
            }
          }
        }
      }

      list.sort((a: any, b: any) => {
        const idA = Number(String(a.id).replace(/\D/g, '')) || 0;
        const idB = Number(String(b.id).replace(/\D/g, '')) || 0;
        return idB - idA;
      });

      setRecords(list);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Error fetching freelance finance data:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setCurrentItem(item);
    } else {
      setCurrentItem({
        id: 'FRF-' + Date.now(),
        projectId: '',
        freelancerName: '',
        desc: '',
        category: 'تصميم ومونتاج',
        estimatedCost: '',
        actualCost: '',
        sellPrice: '',
        status: 'معلق / مستحق ⏳',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const cleanPrice = (val: any) => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const handleSave = async () => {
    if (!currentItem.freelancerName.trim() || !currentItem.desc.trim()) {
      alert("الرجاء إدخال اسم المستقل ووصف المهمة على الأقل.");
      return;
    }

    const actual = cleanPrice(currentItem.actualCost);
    const sell = cleanPrice(currentItem.sellPrice);
    const calculatedProfit = sell - actual;

    const payload = {
      ...currentItem,
      actualCost: actual,
      sellPrice: sell,
      profit: calculatedProfit
    };

    setIsSubmitting(true);
    try {
      await saveFreelanceFinanceToSheet(payload);
      await fetchData();
      setIsModalOpen(false);
      alert("تم حفظ التزام المستقل سحابياً بنجاح! ✅");
    } catch (error) {
      console.error("Error saving freelance finance item:", error);
      alert("فشل الحفظ سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا السجل المالي؟")) {
      try {
        setLoading(true);
        await deleteFreelanceFinanceFromSheet(id);
        await fetchData();
      } catch (error) {
        alert("فشل الحذف سحابياً.");
        setLoading(false);
      }
    }
  };

  const handleStatusChangeQuick = async (item: any, newStatus: string) => {
    const updated = { ...item, status: newStatus };
    try {
      await saveFreelanceFinanceToSheet(updated);
      await fetchData();
    } catch (error) {
      alert("فشل تحديث الحالة.");
    }
  };

  const uniqueFreelancerNames = Array.from(new Set(records.map(r => r.freelancerName).filter(Boolean)));

  const handleExportExcel = () => {
    const reportRows = [
      ["=== تقرير الالتزامات المالية للمستقلين والمزودين ==="],
      ["المستقل / المزود", "وصف المهمة", "التصنيف", "التكلفة الفعلية (ر.س)", "سعر البيع (ر.س)", "صافي الربح (ر.س)", "الحالة", "التاريخ", "ملاحظات"]
    ];

    filteredRecords.forEach((r: any) => {
      reportRows.push([
        r.freelancerName || '',
        r.desc || '',
        r.category || '',
        cleanPrice(r.actualCost),
        cleanPrice(r.sellPrice),
        cleanPrice(r.profit),
        r.status || '',
        r.date || '',
        r.notes || ''
      ]);
    });

    const csvContent = "\uFEFF" + reportRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `التزامات_المستقلين_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLiabilities = records
    .filter(r => String(r.status || '').includes('معلق'))
    .reduce((sum, r) => sum + cleanPrice(r.actualCost), 0);

  const totalPaidActual = records
    .filter(r => String(r.status || '').includes('تم السداد'))
    .reduce((sum, r) => sum + cleanPrice(r.actualCost), 0);

  const totalProfits = records.reduce((sum, r) => sum + cleanPrice(r.profit), 0);

  const filteredRecords = records.filter(r => {
    const name = String(r.freelancerName || '').toLowerCase();
    const desc = String(r.desc || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = name.includes(term) || desc.includes(term);
    
    const statusVal = String(r.status || '');
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'PENDING' && statusVal.includes('معلق')) || 
      (statusFilter === 'PAID' && statusVal.includes('تم السداد'));

    const matchesName = nameFilter === 'ALL' || r.freelancerName === nameFilter;

    return matchesSearch && matchesStatus && matchesName;
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

      {/* رأس الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={iconHeaderBox}><FiDollarSign style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            مستحقات المستقلين 
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            متابعة التكاليف الفعلية، أجور الفريلانسرز، وعقود المشاريع الموكلة اليهم
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleExportExcel} style={{ background: '#059669', color: 'white', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiDownload /> تحميل كـ Excel 📊
          </button>
          <button onClick={fetchData} style={secondaryBtn} disabled={loading}>
            {loading ? <FiLoader className="spin" /> : <FiRefreshCw />} تحديث
          </button>
          <button onClick={() => handleOpenModal()} style={primaryBtn}>
            <FiPlus style={{ color: 'white' }} /> تسجيل التزام / مهمة جديدة
          </button>
        </div>
      </div>

      {/* شريط الفلاتر والبحث */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>
          <FiFilter /> خيارات الفلترة:
        </div>

        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', right: '12px', top: '13px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث حر (اسم المستقل أو المهمة)..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={selectFilterStyle}
          >
            <option value="ALL">🔍 كل الحالات</option>
            <option value="PENDING">⏳ معلق / مستحق فقط</option>
            <option value="PAID">✅ تم السداد فقط</option>
          </select>
        </div>

        <div>
          <select 
            value={nameFilter} 
            onChange={e => setNameFilter(e.target.value)}
            style={selectFilterStyle}
          >
            <option value="ALL">👤 جميع المستقلين</option>
            {uniqueFreelancerNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* بطاقات المؤشرات المالية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={cardStyle}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي الالتزامات المعلقة (مستحقات غير مسددة):</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', color: '#38bdf8', marginTop: '5px' }}>{totalLiabilities.toLocaleString()} ر.س</strong>
        </div>
        <div style={cardStyle}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي المدفوع الفعلي للمستقلين:</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', color: '#4ade80', marginTop: '5px' }}>{totalPaidActual.toLocaleString()} ر.س</strong>
        </div>
        <div style={{ ...cardStyle, background: '#065f46', border: '1px solid #059669' }}>
          <span style={{ color: '#d1fae5', fontSize: '0.85rem' }}>صافي الأرباح المحققة من مهام المستقلين:</span>
          <strong style={{ display: 'block', fontSize: '1.5rem', color: 'white', marginTop: '5px' }}>{totalProfits.toLocaleString()} ر.س</strong>
        </div>
      </div>

      {/* نافذة الإضافة والتعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 'bold' }}>
                {currentItem.id ? '✏️ تعديل الالتزام المالي' : '➕ تسشيل مهمة / التزام جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}><FiX size={18} /></button>
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>اسم المستقل / المزود *</label>
                <input placeholder="اسم المستقل" style={inputStyle} value={currentItem.freelancerName} onChange={e => setCurrentItem({...currentItem, freelancerName: e.target.value})} disabled={isSubmitting} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>المشروع المرتبط</label>
                <select style={inputStyle} value={currentItem.projectId} onChange={e => setCurrentItem({...currentItem, projectId: e.target.value})} disabled={isSubmitting}>
                  <option value="">-- بدون مشروع محدد --</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name || `مشروع #${p.id}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>وصف المهمة / الخدمة *</label>
              <input placeholder="مثل: مونتاج إعلان اليوم الوطني" style={inputStyle} value={currentItem.desc} onChange={e => setCurrentItem({...currentItem, desc: e.target.value})} disabled={isSubmitting} />
            </div>

            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>التصنيف</label>
                <input placeholder="تصميم، مونتاج، برمجة..." style={inputStyle} value={currentItem.category} onChange={e => setCurrentItem({...currentItem, category: e.target.value})} disabled={isSubmitting} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>التاريخ</label>
                <input type="date" style={inputStyle} value={currentItem.date} onChange={e => setCurrentItem({...currentItem, date: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={fieldGroup}>
                <label style={labelStyle}>تكلفة تقديرية</label>
                <input type="number" placeholder="0" style={inputStyle} value={currentItem.estimatedCost} onChange={e => setCurrentItem({...currentItem, estimatedCost: e.target.value})} disabled={isSubmitting} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>التكلفة الفعلية</label>
                <input type="number" placeholder="0" style={inputStyle} value={currentItem.actualCost} onChange={e => setCurrentItem({...currentItem, actualCost: e.target.value})} disabled={isSubmitting} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>سعر البيع (للعميل)</label>
                <input type="number" placeholder="0" style={inputStyle} value={currentItem.sellPrice} onChange={e => setCurrentItem({...currentItem, sellPrice: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>حالة السداد والالتزام</label>
              <select style={inputStyle} value={currentItem.status} onChange={e => setCurrentItem({...currentItem, status: e.target.value})} disabled={isSubmitting}>
                <option value="معلق / مستحق ⏳">⏳ معلق / مستحق</option>
                <option value="تم السداد / مصروف فعلي ✅">✅ تم السداد / مصروف فعلي</option>
              </select>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>ملاحظات</label>
              <input placeholder="أي ملاحظات إضافية..." style={inputStyle} value={currentItem.notes} onChange={e => setCurrentItem({...currentItem, notes: e.target.value})} disabled={isSubmitting} />
            </div>

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
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a', color: '#94a3b8' }}>
              {['المستقل / المزود', 'الوصف والتصنيف', 'التكلفة الفعلية', 'سعر البيع', 'صافي الربح', 'حالة السداد', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري جلب سجلات الالتزامات سحابياً... 🔄</td></tr>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((r, index) => (
                <tr key={r.id || index} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: 'white' }}>{r.freelancerName}</td>
                  <td style={tdStyle}>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>{r.desc}</div>
                    <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>{r.category || 'عام'}</div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f87171' }}>{cleanPrice(r.actualCost).toLocaleString()} ر.س</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8' }}>{cleanPrice(r.sellPrice).toLocaleString()} ر.س</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#4ade80' }}>{cleanPrice(r.profit).toLocaleString()} ر.س</td>
                  
                  <td style={tdStyle}>
                    <select 
                      value={r.status || 'معلق / مستحق ⏳'} 
                      onChange={(e) => handleStatusChangeQuick(r, e.target.value)}
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #334155', 
                        background: String(r.status).includes('تم السداد') ? '#065f46' : '#b45309', 
                        color: 'white', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="معلق / مستحق ⏳">⏳ معلق / مستحق</option>
                      <option value="تم السداد / مصروف فعلي ✅">✅ تم السداد / مصروف فعلي</option>
                    </select>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(r)} style={actionBtn} title="تعديل"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(r.id)} style={{...actionBtn, background: '#ef4444', color: 'white'}} title="حذف"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  لا توجد التزامات مالية مطابقة لخيارات الفلترة الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
      <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري جلب سجلات الالتزامات سحابياً... 🔄</div>
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((r, index) => (
            <div key={r.id || index} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'white' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{r.freelancerName}</span>
                <select 
                  value={r.status || 'معلق / مستحق ⏳'} 
                  onChange={(e) => handleStatusChangeQuick(r, e.target.value)}
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    background: String(r.status).includes('تم السداد') ? '#065f46' : '#b45309', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="معلق / مستحق ⏳">⏳ معلق / مستحق</option>
                  <option value="تم السداد / مصروف فعلي ✅">✅ تم السداد / مصروف فعلي</option>
                </select>
              </div>

              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#38bdf8' }}>
                {r.desc} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({r.category || 'عام'})</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid #334155', borderBottom: '1px solid #334155', padding: '8px 0', fontSize: '0.85rem' }}>
                <div>التكلفة: <strong style={{ color: '#f87171' }}>{cleanPrice(r.actualCost).toLocaleString()} ر.س</strong></div>
                <div>البيع: <strong style={{ color: '#38bdf8' }}>{cleanPrice(r.sellPrice).toLocaleString()} ر.س</strong></div>
                <div>الربح: <strong style={{ color: '#4ade80' }}>{cleanPrice(r.profit).toLocaleString()} ر.س</strong></div>
              </div>

              {/* أزرار الإجراءات */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => handleOpenModal(r)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#334155', gap: '6px' }}>
                  <FiEdit2 /> تعديل
                </button>
                <button onClick={() => handleDelete(r.id)} style={{ ...actionBtn, flex: 1, padding: '10px', fontSize: '0.85rem', background: '#ef4444', color: 'white', gap: '6px' }}>
                  <FiTrash2 /> حذف
                </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
            لا توجد التزامات مالية مطابقة لخيارات الفلترة الحالية.
          </div>
        )}
      </div>

    </div>
  );
}

const iconHeaderBox = { background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardStyle = { background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' };
const thStyle = { padding: '14px 16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.9rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', color: '#f8fafc', verticalAlign: 'middle' as const };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem' };
const selectFilterStyle = { padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block', marginBottom: '5px' };
const fieldGroup = { marginBottom: '10px' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const searchInputStyle = { padding: '10px 35px 10px 15px', borderRadius: '10px', border: '1px solid #334155', outline: 'none', width: '100%', background: '#0f172a', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' as const };
const primaryBtn = { padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const secondaryBtn = { padding: '10px 18px', background: '#334155', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { border: 'none', borderRadius: '8px', padding: '8px 10px', color: '#fff', background: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', maxHeight: '90vh', overflowY: 'auto' as const };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' };