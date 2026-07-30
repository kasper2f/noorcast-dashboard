import { useState, useEffect } from 'react';
import { getInvestorsSheet, saveInvestorToSheet, getExpensesSheet, getInvoicesSheet, getIncomingBillsSheet, getFreelanceFinanceSheet } from '@/services/dbService';
import { FiPlus, FiSave, FiTrash2, FiRefreshCw, FiDownload, FiSearch, FiEdit2 } from 'react-icons/fi';

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [netProfit, setNetProfit] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');

  const [formData, setFormData] = useState({
    investorId: '',
    name: '',
    ownershipPercentage: '',
    investedAmount: '',
    payoutCycle: 'ربع سنوي',
    payoutStatus: 'جاهز للصرف',
    notes: ''
  });

  useEffect(() => {
    loadInvestorsCloudData();
  }, []);

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const loadInvestorsCloudData = async () => {
    try {
      setLoading(true);

      const localInvoices = JSON.parse(localStorage.getItem('noorcast_tax_invoices') || '[]');
      const localBills = JSON.parse(localStorage.getItem('noorcast_incoming_bills') || '[]');

      const [sheetData, sheetExpenses, cloudInvoices, cloudBills, freeFinanceData] = await Promise.all([
        getInvestorsSheet(),
        getExpensesSheet().catch(() => []),
        getInvoicesSheet().catch(() => []),
        getIncomingBillsSheet().catch(() => []),
        getFreelanceFinanceSheet().catch(() => [])
      ]);

      const mapped = Array.isArray(sheetData) ? sheetData.map((item: any, index: number) => ({
        investorId: String(item?.investorId || item?.id || 'inv-' + index),
        name: String(item?.name || ''),
        ownershipPercentage: cleanPrice(item?.ownershipPercentage),
        investedAmount: cleanPrice(item?.investedAmount),
        payoutCycle: String(item?.payoutCycle || 'ربع سنوي'),
        payoutStatus: String(item?.payoutStatus || 'جاهز للصرف'),
        notes: String(item?.notes || '-')
      })) : [];

      setInvestors(mapped);

      const allInvoices = [...localInvoices, ...(Array.isArray(cloudInvoices) ? cloudInvoices : [])];
      const uniqueInvoices = Array.from(new Map(allInvoices.map((item: any) => [item.id || item.number, item])).values());

      const getEffectiveFinancials = (item: any) => {
        const status = String(item.status || '').trim();
        const rawTotal = cleanPrice(item.total || item.amount);
        let ratio = 0; 
        if (status === 'تم سداد الفاتورة كاملة' || status === 'تم التنفيذ' || status === 'تم السداد' || status === 'مسددة') {
          ratio = 1.0; 
        } else if (status === 'تم سداد المقدم') {
          ratio = 0.5; 
        }
        const effectiveTotal = rawTotal * ratio;
        const effectiveVat = effectiveTotal * (15 / 115);
        const effectiveBasic = effectiveTotal - effectiveVat;
        return { ratio, effectiveTotal, effectiveVat, effectiveBasic, statusLabel: status };
      };

      const paidInvoicesList = uniqueInvoices.map(inv => {
        const financials = getEffectiveFinancials(inv);
        return { ...inv, financials };
      }).filter(inv => inv.financials.ratio > 0);

      const totalRevenues = paidInvoicesList.reduce((sum, inv) => sum + cleanPrice(inv.financials.effectiveTotal), 0);
      const totalInvoicesVat = paidInvoicesList.reduce((sum, inv) => sum + cleanPrice(inv.financials.effectiveVat), 0);

      let formattedExpenses = Array.isArray(sheetExpenses) ? sheetExpenses.map((item: any, index: number) => ({
        id: String(item.id || 'sheet-' + index),
        description: String(item.description || ''),
        category: String(item.category || 'تشغيل'),
        amount: cleanPrice(item.amount),
        responsible: String(item.responsible || 'الإدارة'),
        type: String(item.type || 'مصروف'),
        date: String(item.date || new Date().toISOString().split('T')[0])
      })) : [];

      formattedExpenses = formattedExpenses.filter(e => {
        const desc = String(e.description || '').toLowerCase();
        const amount = cleanPrice(e.amount);
        return amount > 0 && amount !== 5750 && !desc.includes('مقدم فاتورة') && !desc.includes('inv-2026-001');
      });

      const allBills = [...localBills, ...(Array.isArray(cloudBills) ? cloudBills : [])];
      const uniqueBills = Array.from(new Map(allBills.map((item: any) => [item.id || item.supplier, item])).values());

      const totalExpenses = formattedExpenses.reduce((sum, e) => sum + cleanPrice(e.amount), 0);

      const totalBillsVat = uniqueBills
        .filter(b => {
          const status = String(b.status || '').trim();
          const isPaid = status === 'مسددة';
          const isTaxable = b.isTaxable !== false && b.isTaxable !== 'false';
          return isPaid && isTaxable;
        })
        .reduce((sum, b) => sum + (cleanPrice(b.amount) * (15 / 115)), 0);

      const billsLiabilities = uniqueBills
        .filter(b => String(b.status || '').trim() === 'قيد الانتظار' || String(b.status || '').trim() === 'معلق')
        .reduce((sum, b) => sum + cleanPrice(b.amount), 0);

      const freelanceLiabilities = Array.isArray(freeFinanceData) ? freeFinanceData
        .filter(f => String(f.status || '').includes('معلق'))
        .reduce((sum, f) => sum + cleanPrice(f.actualCost), 0) : 0;

      const totalLiabilities = billsLiabilities + freelanceLiabilities;
      const netVatDue = totalInvoicesVat - totalBillsVat;

      const netActualProfit = totalRevenues - totalExpenses - totalLiabilities - (netVatDue > 0 ? netVatDue : 0);
      setNetProfit(netActualProfit);

    } catch (error) {
      console.error("خطأ في جلب مستحقات المستثمرين سحابياً:", error);
      setInvestors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayoutStatus = async (investorId: string, newStatus: string) => {
    const targetInvestor = investors.find(i => i.investorId === investorId);
    if (!targetInvestor) return;

    const updatedItem = { ...targetInvestor, payoutStatus: newStatus };

    try {
      setLoading(true);
      await saveInvestorToSheet(updatedItem);
      setInvestors(investors.map(item => item.investorId === investorId ? updatedItem : item));
      alert("تم تحديث حالة الصرف سحابياً بنجاح لجميع الأجهزة! 🔄☁️");
    } catch (err) {
      console.error("خطأ في التحديث السحابي لحالة الصرف:", err);
      alert("حدث خطأ أثناء التحديث السحابي.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.ownershipPercentage) {
      alert("الرجاء إدخال اسم المستثمر ونسبة الشراكة.");
      return;
    }

    const percentage = cleanPrice(formData.ownershipPercentage);
    const invested = cleanPrice(formData.investedAmount);

    const investorItem = {
      investorId: editingId || ('inv-' + Date.now().toString()),
      name: formData.name,
      ownershipPercentage: percentage,
      investedAmount: invested,
      payoutCycle: formData.payoutCycle,
      payoutStatus: formData.payoutStatus,
      notes: formData.notes
    };

    try {
      setLoading(true);
      await saveInvestorToSheet(investorItem);

      if (editingId) {
        setInvestors(investors.map((item: any) => item.investorId === editingId ? investorItem : item));
      } else {
        setInvestors([...investors, investorItem]);
      }

      resetForm();
      alert("تم حفظ وترحيل بيانات المستثمر سحابياً بنجاح! ☁️✅");
    } catch (err) {
      console.error("فشل الترحيل السحابي لشيت المستثمرين:", err);
      alert("حدث خطأ أثناء الحفظ السحابي.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      investorId: '',
      name: '',
      ownershipPercentage: '',
      investedAmount: '',
      payoutCycle: 'ربع سنوي',
      payoutStatus: 'جاهز للصرف',
      notes: ''
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const startEdit = (item: any) => {
    setEditingId(item.investorId);
    setFormData(item);
    setIsModalOpen(true);
  };

  const deleteItem = async (investorId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستثمر؟")) {
      setInvestors(investors.filter((item: any) => item.investorId !== investorId));
      alert("تم الحذف محلياً. تأكد من إزالته من شيت قوقل مباشرة إن لزم الأمر.");
    }
  };

  const exportToExcel = () => {
    if (!Array.isArray(filteredInvestors) || filteredInvestors.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const headers = ['اسم الشريك / المستثمر', 'نسبة الشراكة', 'رأس المال المستثمر', 'دورية الأرباح', 'حالة الصرف', 'ملاحظات'];
    const rows = filteredInvestors.map(item => [
      `"${item.name}"`,
      `${item.ownershipPercentage}%`,
      cleanPrice(item.investedAmount),
      `"${item.payoutCycle}"`,
      `"${item.payoutStatus}"`,
      `"${item.notes || '-'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Investors_Cloud_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvestors = Array.isArray(investors) ? investors.filter((item: any) => {
    if (!item) return false;
    const nameStr = String(item.name || '').toLowerCase();
    const notesStr = String(item.notes || '').toLowerCase();
    const matchesSearch = nameStr.includes(searchTerm.toLowerCase()) || notesStr.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'الكل' || item.payoutStatus === filterStatus;
    return matchesSearch && matchesStatus;
  }) : [];

  const totalInvestedCapital = filteredInvestors.reduce((sum: number, item: any) => sum + cleanPrice(item?.investedAmount), 0);

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>مستحقات وحصص المستثمرين والشركاء</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>إدارة رؤوس الأموال ومتابعة العوائد المشتركة بدقة</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={exportToExcel} style={{ background: '#059669', color: 'white', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiDownload /> تصدير Excel 📊
          </button>
          <button onClick={loadInvestorsCloudData} style={secondaryBtn}>
            <FiRefreshCw /> مزامنة سحابية 🔄
          </button>
          <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>
            <FiPlus /> إضافة مستثمر جديد ➕
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '25px' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي رؤوس الأموال المفلترة:</span>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: '#38bdf8', marginTop: '6px' }}>
            {totalInvestedCapital.toLocaleString()} ر.س
          </strong>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>صافي أرباح الشركة الفعلي (المطابق لصفحة الإيرادات والمصروفات):</span>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: netProfit >= 0 ? '#4ade80' : '#f87171', marginTop: '6px' }}>
            {netProfit.toLocaleString()} ر.س
          </strong>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', top: '14px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث باسم المستثمر أو الملاحظات..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '11px 40px 11px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: 'white', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '11px 18px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: 'white', cursor: 'pointer', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="الكل">كل حالات الصرف</option>
            <option value="جاهز للصرف">جاهز للصرف</option>
            <option value="تم التحويل">تم التحويل</option>
            <option value="معلق / إعادة استثمار">معلق / إعادة استثمار</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري سحب بيانات المستثمرين سحابياً...</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
          <div className="desktop-table-view" style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '20px', marginTop: '25px', overflowX: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  {['اسم الشريك / المستثمر', 'نسبة الشراكة', 'رأس المال المستثمر', 'دورية الأرباح', 'العائد المتوقع', 'حالة الصرف (تعديل مباشر)', 'ملاحظات', 'الإجراءات'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.length > 0 ? (
                  filteredInvestors.map((item: any, index: number) => {
                    const percentage = cleanPrice(item?.ownershipPercentage);
                    const estimatedProfitShare = netProfit > 0 ? (netProfit * percentage) / 100 : 0;
                    
                    return (
                      <tr key={item.investorId} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8' }}>{item?.name}</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>{percentage}%</td>
                        <td style={tdStyle}>{cleanPrice(item?.investedAmount).toLocaleString()} ر.س</td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#334155', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {item?.payoutCycle || 'ربع سنوي'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#4ade80' }}>
                          {estimatedProfitShare.toLocaleString()} ر.س
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={item?.payoutStatus || 'جاهز للصرف'}
                            onChange={(e) => handleUpdatePayoutStatus(item.investorId, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: item?.payoutStatus === 'تم التحويل' ? '#065f46' : '#b45309',
                              color: 'white',
                              border: 'none',
                              fontWeight: 'bold',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="جاهز للصرف">جاهز للصرف</option>
                            <option value="تم التحويل">تم التحويل</option>
                            <option value="معلق / إعادة استثمار">معلق / إعادة استثمار</option>
                          </select>
                        </td>
                        <td style={{ ...tdStyle, color: '#94a3b8' }}>{item?.notes || '-'}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => startEdit(item)} style={iconEditBtn} title="تعديل"><FiEdit2 /></button>
                            <button onClick={() => deleteItem(item.investorId)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      لا توجد بيانات مستثمرين مسجلة سحابياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            {filteredInvestors.length > 0 ? (
              filteredInvestors.map((item: any) => {
                const percentage = cleanPrice(item?.ownershipPercentage);
                const estimatedProfitShare = netProfit > 0 ? (netProfit * percentage) / 100 : 0;

                return (
                  <div key={item.investorId} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'white' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#38bdf8' }}>{item?.name}</span>
                      <select
                        value={item?.payoutStatus || 'جاهز للصرف'}
                        onChange={(e) => handleUpdatePayoutStatus(item.investorId, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: item?.payoutStatus === 'تم التحويل' ? '#065f46' : '#b45309',
                          color: 'white',
                          border: 'none',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="جاهز للصرف">جاهز للصرف</option>
                        <option value="تم التحويل">تم التحويل</option>
                        <option value="معلق / إعادة استثمار">معلق / إعادة استثمار</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>نسبة الشراكة: <strong style={{ color: '#fff' }}>{percentage}%</strong></span>
                      <span style={{ color: '#cbd5e1' }}>الدورية: <strong style={{ color: '#fff' }}>{item?.payoutCycle || 'ربع سنوي'}</strong></span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                      <div>رأس المال: <strong style={{ color: '#38bdf8' }}>{cleanPrice(item?.investedAmount).toLocaleString()} ر.س</strong></div>
                      <div>العائد المتوقع: <strong style={{ color: '#4ade80' }}>{estimatedProfitShare.toLocaleString()} ر.س</strong></div>
                    </div>

                    {item?.notes && item?.notes !== '-' && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ملاحظات: {item.notes}</div>
                    )}

                    {/* أزرار الإجراءات */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => startEdit(item)} style={{ ...iconEditBtn, flex: 1, padding: '10px', fontSize: '0.85rem', gap: '6px' }}>
                        <FiEdit2 /> تعديل
                      </button>
                      <button onClick={() => deleteItem(item.investorId)} style={{ ...iconDeleteBtn, flex: 1, padding: '10px', fontSize: '0.85rem', gap: '6px' }}>
                        <FiTrash2 /> حذف
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد بيانات مستثمرين مسجلة سحابياً.
              </div>
            )}
          </div>
        </>
      )}

      {/* المودال */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>{editingId ? 'تعديل بيانات المستثمر' : 'إضافة مستثمر جديد سحابياً'}</h3>
            
            <label style={labelStyle}>اسم الشريك / المستثمر:</label>
            <input placeholder="مثل: شركة الاستثمار التقني" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={loading} />
            
            <label style={labelStyle}>نسبة الشراكة / الأرباح (%):</label>
            <input type="number" placeholder="مثال: 10" style={inputStyle} value={formData.ownershipPercentage} onChange={e => setFormData({...formData, ownershipPercentage: e.target.value})} disabled={loading} />
            
            <label style={labelStyle}>رأس المال المستثمر (ر.س):</label>
            <input type="number" placeholder="0.00" style={inputStyle} value={formData.investedAmount} onChange={e => setFormData({...formData, investedAmount: e.target.value})} disabled={loading} />

            <label style={labelStyle}>دورية توزيع الأرباح:</label>
            <select style={inputStyle} value={formData.payoutCycle} onChange={e => setFormData({...formData, payoutCycle: e.target.value})} disabled={loading}>
              <option>شهري</option>
              <option>ربع سنوي</option>
              <option>نصف سنوي</option>
              <option>سنوي</option>
              <option>عند الطلب</option>
            </select>
            
            <label style={labelStyle}>حالة الأرباح المستحقة:</label>
            <select style={inputStyle} value={formData.payoutStatus} onChange={e => setFormData({...formData, payoutStatus: e.target.value})} disabled={loading}>
              <option>جاهز للصرف</option>
              <option>تم التحويل</option>
              <option>معلق / إعادة استثمار</option>
            </select>

            <label style={labelStyle}>ملاحظات واتفاقية الشراكة:</label>
            <input placeholder="تفاصيل إضافية أو شروط خاصة" style={inputStyle} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} disabled={loading} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
                <FiSave /> {loading ? 'جاري الحفظ والترحيل... ⏳' : 'حفظ سحابياً ✅'}
              </button>
              <button onClick={resetForm} style={cancelBtn} disabled={loading}>إلغاء ❌</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', verticalAlign: 'middle' as const };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#1e293b' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '14px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const secondaryBtn = { background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' };
const cancelBtn = { background: '#64748b', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const iconEditBtn = { background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' };
const iconDeleteBtn = { background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const };