import { useState, useEffect } from 'react';
import { getIncomingBillsSheet, saveIncomingBillToSheet } from '@/services/dbService';
import { FiPlus, FiSave, FiTrash2, FiRefreshCw, FiDownload, FiSearch, FiEdit3 } from 'react-icons/fi';

export default function FixedExpensesPage() {
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCycle, setFilterCycle] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('الكل');

  const [formData, setFormData] = useState({
    id: '',
    description: '',
    category: 'اشتراكات وبنية تحتية',
    amount: '',
    billingCycle: 'شهري',
    responsible: '',
    date: new Date().toISOString().split('T')[0],
    status: 'قيد الانتظار'
  });

  useEffect(() => {
    loadFixedExpensesFromCloud();
  }, []);

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // --- دالة تنسيق التاريخ ليكون (يوم/شهر/سنة) بدقة وبدون أصفار إضافية ---
  const formatDateClean = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const cleanDatePart = String(dateStr).split('T')[0];
      const parts = cleanDatePart.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const dayNum = parseInt(parts[2], 10);
        return `${dayNum}/${month}/${year}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // سحب المصروفات الثابتة والالتزامات سحابياً من قوقل شيت
  const loadFixedExpensesFromCloud = async () => {
    try {
      setLoading(true);
      const sheetData = await getIncomingBillsSheet();
      if (Array.isArray(sheetData)) {
        const mapped = sheetData.map((item: any, index: number) => ({
          id: String(item.id || 'fix-' + index),
          description: String(item.supplier || item.description || ''),
          category: String(item.category || 'اشتراكات وبنية تحتية'),
          amount: cleanPrice(item.amount),
          billingCycle: String(item.billingCycle || item.frequency || 'شهري'),
          responsible: String(item.responsible || 'الإدارة'),
          date: String(item.dueDate || item.date || new Date().toISOString().split('T')[0]),
          status: String(item.status || 'قيد الانتظار')
        }));
        setFixedExpenses(mapped);
      }
    } catch (error) {
      console.error("خطأ في جلب المصروفات الثابتة سحابياً:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      alert("الرجاء إدخال الوصف والمبلغ.");
      return;
    }

    const numericAmount = cleanPrice(formData.amount);
    const itemData = {
      id: editingId || ('FIX-' + Date.now()),
      supplier: formData.description,
      description: formData.description,
      category: formData.category,
      amount: numericAmount,
      billingCycle: formData.billingCycle,
      frequency: formData.billingCycle,
      responsible: formData.responsible || 'الإدارة',
      dueDate: formData.date,
      date: formData.date,
      status: formData.status
    };

    try {
      setLoading(true);
      await saveIncomingBillToSheet(itemData);

      if (editingId) {
        setFixedExpenses(fixedExpenses.map((item: any) => item.id === editingId ? { ...item, ...formData, amount: numericAmount } : item));
      } else {
        setFixedExpenses([...fixedExpenses, { ...itemData, date: itemData.dueDate }]);
      }

      resetForm();
      alert("تم حفظ المصروف الثابت وتحديث حالة السداد وترحيله سحابياً بنجاح! ☁️✅");
      await loadFixedExpensesFromCloud();
    } catch (error) {
      console.error("فشل الحفظ السحابي للمصروف الثابت:", error);
      alert("حدث خطأ أثناء الحفظ السحابي.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      description: '',
      category: 'اشتراكات وبنية تحتية',
      amount: '',
      billingCycle: 'شهري',
      responsible: '',
      date: new Date().toISOString().split('T')[0],
      status: 'قيد الانتظار'
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      id: item.id,
      description: item.description || item.supplier || '',
      category: item.category || 'اشتراكات وبنية تحتية',
      amount: item.amount || '',
      billingCycle: item.billingCycle || 'شهري',
      responsible: item.responsible || '',
      date: item.date || new Date().toISOString().split('T')[0],
      status: item.status || 'قيد الانتظار'
    });
    setIsModalOpen(true);
  };

  const deleteItem = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف الثابت من السحاب؟")) {
      setFixedExpenses(fixedExpenses.filter((item: any) => item.id !== id));
    }
  };

  // تصدير إلى Excel (CSV)
  const exportToExcel = () => {
    if (filteredExpenses.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const headers = ['وصف المصروف', 'التصنيف', 'دورية السداد', 'المبلغ (ر.س)', 'حالة السداد', 'المسؤول', 'التاريخ'];
    const rows = filteredExpenses.map(item => [
      `"${item.description}"`,
      `"${item.category}"`,
      `"${item.billingCycle}"`,
      cleanPrice(item.amount),
      `"${item.status}"`,
      `"${item.responsible}"`,
      `"${formatDateClean(item.date)}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fixed_Expenses_Cloud_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تصفية وبحث البيانات
  const filteredExpenses = fixedExpenses.filter((item: any) => {
    const desc = String(item.description || '').toLowerCase();
    const resp = String(item.responsible || '').toLowerCase();
    const cat = String(item.category || '').toLowerCase();
    
    const matchesSearch = desc.includes(searchTerm.toLowerCase()) ||
                          resp.includes(searchTerm.toLowerCase()) ||
                          cat.includes(searchTerm.toLowerCase());
    const matchesCycle = filterCycle === 'الكل' || item.billingCycle === filterCycle;
    const matchesStatus = filterStatus === 'الكل' || item.status === filterStatus;
    return matchesSearch && matchesCycle && matchesStatus;
  });

  const totalFixedExpenses = filteredExpenses.reduce((sum: number, item: any) => sum + cleanPrice(item.amount), 0);

  return (
    <div style={{ padding: '32px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>الالتزامات الدورية</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>قائمة سحابية مشتركة لمتابعة الاشتراكات والالتزامات وحالات سدادها لفتراتها</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={exportToExcel} style={{ background: '#059669', color: 'white', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <FiDownload /> تصدير Excel 📊
          </button>
          <button onClick={loadFixedExpensesFromCloud} style={secondaryBtn}>
            <FiRefreshCw /> مزامنة سحابية 🔄
          </button>
          <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>
            <FiPlus /> إضافة مصروف ثابت
          </button>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', top: '13px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث بالوصف، المسؤول، أو التصنيف..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 38px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <div>
          <select 
            value={filterCycle} 
            onChange={(e) => setFilterCycle(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
          >
            <option value="الكل">كل دوريات السداد</option>
            <option value="شهري">شهري</option>
            <option value="ربع سنوي">ربع سنوي</option>
            <option value="نصف سنوي">نصف سنوي</option>
            <option value="سنوي">سنوي</option>
            <option value="مرة واحدة">مرة واحدة</option>
          </select>
        </div>

        <div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
          >
            <option value="الكل">كل حالات السداد</option>
            <option value="مسددة">مسددة لهذه الفترة ✅</option>
            <option value="قيد الانتظار">قيد الانتظار ⏳</option>
          </select>
        </div>

        <div style={{ background: '#0f172a', padding: '10px 20px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>الإجمالي المفلتر:</span>
          <strong style={{ color: '#f87171', fontSize: '1.1rem' }}>{totalFixedExpenses.toLocaleString()} ر.س</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8', fontSize: '1rem', fontWeight: 'bold' }}>جاري المزامنة السحابية للمصروفات الثابتة... 🔄</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
          <div className="desktop-table-view" style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a' }}>
                  {['وصف المصروف / الاشتراك', 'التصنيف', 'دورية السداد', 'المبلغ', 'حالة السداد للفترة', 'المسؤول', 'التاريخ', 'إجراء'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((item: any, index: number) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: 'white' }}>{item.description}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '6px 10px', borderRadius: '8px', background: '#334155', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #475569', display: 'inline-block' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ padding: '6px 10px', borderRadius: '8px', background: '#0f172a', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #334155', display: 'inline-block' }}>
                          {item.billingCycle || 'شهري'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f87171' }}>{cleanPrice(item.amount).toLocaleString()} ر.س</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', background: item.status === 'مسددة' ? '#065f46' : '#b45309', color: 'white', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-block' }}>
                          {item.status === 'مسددة' ? 'مسددة لهذه الفترة ✅' : 'قيد الانتظار ⏳'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{item.responsible || '-'}</td>
                      <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold' }}>{formatDateClean(item.date)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => startEdit(item)} style={actionBtn} title="تعديل"><FiEdit3 /> تعديل</button>
                          <button onClick={() => deleteItem(item.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '0.95rem' }}>
                      لا توجد مصروفات ثابتة مسجلة سحابياً مطابقة لخيارات البحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((item: any) => (
                <div key={item.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'white' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: item.status === 'مسددة' ? '#065f46' : '#b45309', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {item.status === 'مسددة' ? 'مسددة لهذه الفترة ✅' : 'قيد الانتظار ⏳'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>📅 {formatDateClean(item.date)}</span>
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>
                    {item.description}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{item.category}</span>
                    <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.05rem' }}>{cleanPrice(item.amount).toLocaleString()} ر.س</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>دورية السداد: <strong style={{ color: '#fff' }}>{item.billingCycle || 'شهري'}</strong></span>
                    <span>المسؤول: <strong style={{ color: '#fff' }}>{item.responsible || '-'}</strong></span>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => startEdit(item)} style={{ ...actionBtn, flex: 1, padding: '10px', justifyContent: 'center', fontSize: '0.85rem' }}>
                      <FiEdit3 /> تعديل
                    </button>
                    <button onClick={() => deleteItem(item.id)} style={{ ...iconDeleteBtn, flex: 1, padding: '10px', justifyContent: 'center', fontSize: '0.85rem' }}>
                      <FiTrash2 /> حذف
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد مصروفات ثابتة مسجلة سحابياً مطابقة لخيارات البحث.
              </div>
            )}
          </div>
        </>
      )}

      {/* المودال */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingId ? '✏️ تعديل المصروف الثابت' : '➕ إضافة مصروف ثابت جديد سحابياً'}
            </h3>
            
            <label style={labelStyle}>وصف المصروف أو الاشتراك:</label>
            <input placeholder="مثال: اشتراك استضافة سيرفرات" style={inputStyle} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            
            <label style={labelStyle}>التصنيف:</label>
            <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>اشتراكات وبنية تحتية</option>
              <option>إيجارات ومقرات</option>
              <option>خدمات حكومية ورسوم</option>
              <option>أخرى</option>
            </select>

            <label style={labelStyle}>دورية السداد (التكرار):</label>
            <select style={inputStyle} value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})}>
              <option value="شهري">شهري 🔄</option>
              <option value="ربع سنوي">ربع سنوي 📊</option>
              <option value="نصف سنوي">نصف سنوي 📆</option>
              <option value="سنوي">سنوي 📅</option>
              <option value="مرة واحدة">مرة واحدة ⚡</option>
            </select>

            <label style={labelStyle}>حالة السداد (لهذه الفترة):</label>
            <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="قيد الانتظار">قيد الانتظار (معلقة) ⏳</option>
              <option value="مسددة">مسددة (لهذه الفترة) ✅</option>
            </select>
            
            <label style={labelStyle}>المبلغ (ر.س):</label>
            <input type="number" placeholder="0.00" style={inputStyle} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            
            <label style={labelStyle}>المسؤول أو الجهة:</label>
            <input placeholder="اسم المسؤول أو الشركة" style={inputStyle} value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} />

            <label style={labelStyle}>تاريخ الاستحقاق:</label>
            <input type="date" style={inputStyle} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} style={primaryBtn}><FiSave /> حفظ سحابياً</button>
              <button onClick={resetForm} style={cancelBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', verticalAlign: 'middle' as const, color: '#f8fafc' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#1e293b' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '14px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };
const secondaryBtn = { background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };
const cancelBtn = { background: '#64748b', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const actionBtn = { background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' };
const iconDeleteBtn = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const };