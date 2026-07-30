import { useState, useEffect } from 'react';
import { FiPlus, FiSave, FiTrash2, FiDownload, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import {  
  saveExpenseToSheet,  
  getExpensesSheet,  
  getInvoicesSheet,  
  getIncomingBillsSheet,  
  getHRPayrollSheet,  
  getInvestorsSheet,
  getFreelanceFinanceSheet
} from '@/services/dbService';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [incomingBills, setIncomingBills] = useState<any[]>([]);
  const [hrPayroll, setHrPayroll] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [freelanceFinance, setFreelanceFinance] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'fixed' | 'investors'>('main');
  
  // حالة فلتر الضريبة (الكل أو الخاضعة للضريبة فقط)
  const [taxFilterMode, setTaxFilterMode] = useState<'all' | 'taxable_only'>('all');

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

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

  const loadCloudAccountingData = async () => {
    try {
      setLoading(true);

      const localInvoices = JSON.parse(localStorage.getItem('noorcast_tax_invoices') || '[]');
      const localBills = JSON.parse(localStorage.getItem('noorcast_incoming_bills') || '[]');

      const [sheetExpenses, cloudInvoices, cloudBills, hrData, invsData, freeFinanceData] = await Promise.all([
        getExpensesSheet().catch(() => []),
        getInvoicesSheet().catch(() => []),
        getIncomingBillsSheet().catch(() => []),
        getHRPayrollSheet().catch(() => []),
        getInvestorsSheet().catch(() => []),
        getFreelanceFinanceSheet().catch(() => [])
      ]);

      const allInvoices = [...localInvoices, ...(Array.isArray(cloudInvoices) ? cloudInvoices : [])];
      const uniqueInvoices = Array.from(new Map(allInvoices.map((item: any) => [item.id || item.number, item])).values());

      const allBills = [...localBills, ...(Array.isArray(cloudBills) ? cloudBills : [])];
      const uniqueBills = Array.from(new Map(allBills.map((item: any) => [item.id || item.supplier, item])).values());

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
        return amount > 0 && amount !== 5750 && !desc.includes('مقدم فاتورة') && !desc.includes('inv-2026-001') && !desc.includes('مصروف وارد');
      });

      setExpenses(formattedExpenses);
      setInvoices(uniqueInvoices);
      setIncomingBills(uniqueBills);
      setHrPayroll(Array.isArray(hrData) ? hrData : []);
      setInvestors(Array.isArray(invsData) ? invsData : []);
      setFreelanceFinance(Array.isArray(freeFinanceData) ? freeFinanceData : []);

    } catch (error) {
      console.error("خطأ في جلب البيانات المحاسبية:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCloudAccountingData();
  }, []);

  const [formData, setFormData] = useState({  
    id: '',  
    description: '',  
    category: 'تشغيل',  
    amount: '',  
    responsible: '',  
    type: 'مصروف',  
    date: new Date().toISOString().split('T')[0]  
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const paidInvoicesList = invoices.map(inv => {
    const financials = getEffectiveFinancials(inv);
    return { ...inv, financials };
  }).filter(inv => inv.financials.ratio > 0);

  const totalRevenues = paidInvoicesList.reduce((sum, inv) => sum + cleanPrice(inv.financials.effectiveTotal), 0);
  const totalInvoicesVat = paidInvoicesList.reduce((sum, inv) => sum + cleanPrice(inv.financials.effectiveVat), 0);

  const validExpenses = expenses.filter(e => {
    const t = String(e.type || '').trim().toLowerCase();
    const amount = cleanPrice(e.amount);
    return t !== 'إيراد' && t !== 'irad' && amount > 0;
  });

  const filteredIncomingBillsForCalc = incomingBills.filter(b => {
    const status = String(b.status || '').trim();
    if (status !== 'مسددة') return false;
    
    const isTaxable = b.isTaxable !== false && b.isTaxable !== 'false' && b.isTaxable !== 'FALSE';
    if (taxFilterMode === 'taxable_only' && !isTaxable) return false;
    return true;
  });

  const totalExpenses = validExpenses.reduce((sum, e) => sum + cleanPrice(e.amount), 0) +  
    filteredIncomingBillsForCalc.reduce((sum, b) => sum + cleanPrice(b.amount), 0);
  
  const totalBillsVat = filteredIncomingBillsForCalc
    .filter(b => {
      const isTaxable = b.isTaxable !== false && b.isTaxable !== 'false' && b.isTaxable !== 'FALSE';
      return isTaxable;
    })
    .reduce((sum, b) => sum + (cleanPrice(b.amount) * (15 / 115)), 0);

  const billsLiabilities = incomingBills
    .filter(b => String(b.status || '').trim() === 'قيد الانتظار' || String(b.status || '').trim() === 'معلق')
    .reduce((sum, b) => sum + cleanPrice(b.amount), 0);

  const freelanceLiabilities = freelanceFinance
    .filter(f => String(f.status || '').includes('معلق'))
    .reduce((sum, f) => sum + cleanPrice(f.actualCost), 0);

  const totalLiabilities = billsLiabilities + freelanceLiabilities;
  const netVatDue = totalInvoicesVat - totalBillsVat;
  const netActualProfit = totalRevenues - totalExpenses - totalLiabilities - (netVatDue > 0 ? netVatDue : 0);

  const handleExportFinancialReport = () => {
    const reportTitle = taxFilterMode === 'taxable_only' 
      ? "=== تقرير القوائم المالية (المصروفات الخاضعة للضريبة فقط للإقرار) ===" 
      : "=== تقرير القوائم المالية والملخص المحاسبي (الشامل) ===";

    const reportRows = [
      [reportTitle],
      [`إجمالي الإيرادات:,${totalRevenues} ر.س`],
      [`إجمالي المصروفات:,${totalExpenses} ر.س`],
      [`إجمالي الالتزامات:,${totalLiabilities} ر.س`],
      [`صافي الضريبة المستحقة:,${netVatDue} ر.س`],
      [`صافي الربح الفعلي:,${netActualProfit} ر.س`],
      [""],
      ["=== تفصيل الحركات ==="],
      ["المصدر / الوصف", "النوع", "التصنيف", "المبلغ (ر.س)", "الحالة", "التاريخ"]
    ];

    paidInvoicesList.forEach((inv: any) => {
      reportRows.push([`فاتورة صادرة #${inv.number || inv.id}`, "إيراد", "مبيعات", cleanPrice(inv.financials.effectiveTotal), inv.financials.statusLabel, formatDateClean(inv.dueDate)]);
    });

    validExpenses.forEach((e: any) => {
      reportRows.push([e.description, e.type, e.category, -cleanPrice(e.amount), "مسجل", formatDateClean(e.date)]);
    });

    filteredIncomingBillsForCalc.forEach((b: any) => {
      reportRows.push([`فاتورة واردة: ${b.supplier} (${b.category})`, "مصروف", b.category, -cleanPrice(b.amount), b.status, formatDateClean(b.dueDate)]);
    });

    const csvContent = "\uFEFF" + reportRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_مالي_${taxFilterMode === 'taxable_only' ? 'خاضع_للضريبة' : 'شامل'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveExpense = async () => {
    if (!formData.description || !formData.amount) {
      alert("الرجاء إدخال الوصف والمبلغ.");
      return;
    }
    try {
      setLoading(true);
      await saveExpenseToSheet({
        id: 'MANUAL-' + Date.now(),
        description: formData.description,
        category: formData.category,
        amount: cleanPrice(formData.amount),
        responsible: formData.responsible || 'الإدارة',
        date: formData.date
      });
      await loadCloudAccountingData();
      resetForm();
      alert("تم الحفظ بنجاح! ✅");
    } catch (err) {
      alert("فشل الحفظ.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', description: '', category: 'تشغيل', amount: '', responsible: '', type: 'مصروف', date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>الايرادات والمصروفات</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>حاسبة مالية منضبطة ومطهرة تمنع أي تضخم أو تخلخل في الأرقام والضرائب</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={loadCloudAccountingData} style={{ background: '#334155', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <FiRefreshCcw style={{ marginLeft: '5px' }} /> {loading ? 'جاري السحب...' : 'تحديث 🔄'}
          </button>
          <button onClick={handleExportFinancialReport} style={{ background: '#059669', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <FiDownload style={{ marginLeft: '5px' }} /> تحميل Excel 📊
          </button>
          <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>+ إضافة حركة يدوية</button>
        </div>
      </div>

      {/* شريط الفلتر الضريبي للتحكم الكامل */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px', background: '#1e293b', padding: '12px 18px', borderRadius: '12px', border: '1px solid #334155', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>فلتر عرض المصروفات والأرباح للتقارير:</span>
        <button 
          onClick={() => setTaxFilterMode('all')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: taxFilterMode === 'all' ? '1px solid #3b82f6' : '1px solid #334155', background: taxFilterMode === 'all' ? '#2563eb' : '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
        >
           الكل (شامل غير الخاضع للضريبة)
        </button>
        <button 
          onClick={() => setTaxFilterMode('taxable_only')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: taxFilterMode === 'taxable_only' ? '1px solid #059669' : '1px solid #334155', background: taxFilterMode === 'taxable_only' ? '#059669' : '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
        >
           الخاضعة للضريبة فقط (الصافي للإقرار الضريبي)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('main')} style={tabBtnStyle(activeTab === 'main')}> الإيرادات والمصروفات الرئيسية</button>
        <button onClick={() => setActiveTab('fixed')} style={tabBtnStyle(activeTab === 'fixed')}> المصروفات الثابتة والرواتب (مرجعي)</button>
        <button onClick={() => setActiveTab('investors')} style={tabBtnStyle(activeTab === 'investors')}> المستثمرين ورؤوس الأموال</button>
      </div>

      {activeTab === 'main' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
          <div style={cardStyle}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>إجمالي الإيرادات:</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: '#4ade80', marginTop: '5px' }}>{totalRevenues.toLocaleString()} ر.س</strong>
          </div>
          <div style={cardStyle}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>إجمالي المصروفات التشغيلية:</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: '#f87171', marginTop: '5px' }}>{totalExpenses.toLocaleString()} ر.س</strong>
          </div>
          <div style={cardStyle}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>إجمالي الالتزامات القائمة:</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: '#38bdf8', marginTop: '5px' }}>{totalLiabilities.toLocaleString()} ر.س</strong>
          </div>
          <div style={cardStyle}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>ضريبة القيمة المضافة (صافي الفعلي):</span>
            <strong style={{ display: 'block', fontSize: '1.4rem', color: '#fbbf24', marginTop: '5px' }}>{netVatDue.toLocaleString()} ر.س</strong>
          </div>
          <div style={{ ...cardStyle, background: '#065f46', border: '1px solid #059669' }}>
            <span style={{ color: '#d1fae5', fontSize: '0.8rem' }}>صافي الربح الفعلي للشركة:</span>
            <strong style={{ display: 'block', fontSize: '1.5rem', color: 'white', marginTop: '5px' }}>{netActualProfit.toLocaleString()} ر.س</strong>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🔄 جاري جلب الحركات المحاسبية بدقة...
        </div>
      ) : (
        <>
          {activeTab === 'main' && (
            <div style={{ marginTop: '20px' }}>
              
              {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View - بلون النظام الداكن) */}
              <div className="desktop-table-view" style={{ overflowX: 'auto', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
                <h3 style={{ marginTop: 0, color: 'white', fontSize: '1.1rem' }}>سجل الحركات المالية (بدون تكرار وبحسب الفلتر الضريبي)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', marginTop: '10px', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a', color: '#94a3b8' }}>
                      {['المصدر / الوصف', 'النوع', 'التصنيف', 'المبلغ', 'الجهة / المسؤول', 'الحالة', 'التاريخ'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {paidInvoicesList.map((inv: any, index: number) => (
                      <tr key={`inv-${inv.id}`} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>فاتورة صادرة #{inv.number || inv.id}</td>
                        <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold' }}>إيراد</td>
                        <td style={tdStyle}>مبيعات وعملاء</td>
                        <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold' }}>+{cleanPrice(inv.financials.effectiveTotal).toLocaleString()} ر.س</td>
                        <td style={tdStyle}>{inv.client}</td>
                        <td style={tdStyle}>{inv.financials.statusLabel}</td>
                        <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold' }}>{formatDateClean(inv.dueDate)}</td>
                      </tr>
                    ))}
                    {validExpenses.map((e: any, index: number) => (
                      <tr key={`exp-${e.id}`} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>{e.description}</td>
                        <td style={{ ...tdStyle, color: '#f87171', fontWeight: 'bold' }}>مصروف يدوي</td>
                        <td style={tdStyle}>{e.category}</td>
                        <td style={{ ...tdStyle, color: '#f87171', fontWeight: 'bold' }}>-{cleanPrice(e.amount).toLocaleString()} ر.س</td>
                        <td style={tdStyle}>{e.responsible}</td>
                        <td style={tdStyle}>مسجل</td>
                        <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold' }}>{formatDateClean(e.date)}</td>
                      </tr>
                    ))}
                    {filteredIncomingBillsForCalc.map((b: any, index: number) => (
                      <tr key={`bill-${b.id}`} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>فاتورة واردة: {b.supplier} ({b.category}) {b.isTaxable === false || b.isTaxable === 'false' ? ' [غير خاضع للضريبة]' : ' [خاضع للضريبة]'}</td>
                        <td style={{ ...tdStyle, color: '#f87171', fontWeight: 'bold' }}>مصروف وارد</td>
                        <td style={tdStyle}>{b.category}</td>
                        <td style={{ ...tdStyle, color: '#f87171', fontWeight: 'bold' }}>-{cleanPrice(b.amount).toLocaleString()} ر.س</td>
                        <td style={tdStyle}>{b.supplier}</td>
                        <td style={tdStyle}>{b.status}</td>
                        <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold' }}>{formatDateClean(b.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
              <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                {paidInvoicesList.map((inv: any) => (
                  <div key={`inv-m-${inv.id}`} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#4ade80' }}>إيراد (فاتورة #{inv.number || inv.id})</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📅 {formatDateClean(inv.dueDate)}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f8fafc' }}>العميل: {inv.client}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                      <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.05rem' }}>+{cleanPrice(inv.financials.effectiveTotal).toLocaleString()} ر.س</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#065f46', fontSize: '0.75rem' }}>{inv.financials.statusLabel}</span>
                    </div>
                  </div>
                ))}
                {validExpenses.map((e: any) => (
                  <div key={`exp-m-${e.id}`} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#f87171' }}>مصروف يدوي ({e.category})</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📅 {formatDateClean(e.date)}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f8fafc' }}>{e.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                      <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.05rem' }}>-{cleanPrice(e.amount).toLocaleString()} ر.س</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>المسؤول: {e.responsible}</span>
                    </div>
                  </div>
                ))}
                {filteredIncomingBillsForCalc.map((b: any) => (
                  <div key={`bill-m-${b.id}`} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#f87171' }}>مصروف وارد ({b.category})</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📅 {formatDateClean(b.dueDate)}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f8fafc' }}>المورد: {b.supplier}</div>
                    <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{b.isTaxable === false || b.isTaxable === 'false' ? 'غير خاضع للضريبة' : 'خاضع للضريبة'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                      <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.05rem' }}>-{cleanPrice(b.amount).toLocaleString()} ر.س</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#334155', fontSize: '0.75rem' }}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {activeTab === 'fixed' && (
            <div style={{ marginTop: '20px' }}>
              
              {/* جدول الرواتب والمصروفات الثابتة للابتوب */}
              <div className="desktop-table-view" style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#38bdf8', marginTop: 0, fontSize: '1.1rem' }}>مسودة الرواتب والمصروفات الثابتة (مرجعي)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', marginTop: '15px', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a', color: '#94a3b8' }}>
                      {['الموظف / الجهة', 'المسمى الوظيفي', 'الراتب الأساسي', 'صافي الاستحقاق', 'الحالة'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {hrPayroll.map((emp: any, index: number) => (
                      <tr key={emp.employeeId} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>{emp.name}</td>
                        <td style={tdStyle}>{emp.position}</td>
                        <td style={tdStyle}>{cleanPrice(emp.salary).toLocaleString()} ر.س</td>
                        <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{cleanPrice(emp.netSalary || emp.salary).toLocaleString()} ر.س</td>
                        <td style={tdStyle}>{emp.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* بطاقات الجوال للرواتب */}
              <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                {hrPayroll.map((emp: any) => (
                  <div key={`emp-m-${emp.employeeId}`} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{emp.name}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#334155', fontSize: '0.75rem' }}>{emp.status}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8' }}>{emp.position}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px', fontSize: '0.9rem' }}>
                      <span style={{ color: '#94a3b8' }}>الصافي: <strong style={{ color: '#4ade80' }}>{cleanPrice(emp.netSalary || emp.salary).toLocaleString()} ر.س</strong></span>
                      <span style={{ color: '#94a3b8' }}>الأساسي: {cleanPrice(emp.salary).toLocaleString()} ر.س</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {activeTab === 'investors' && (
            <div style={{ marginTop: '20px' }}>
              
              {/* جدول المستثمرين للابتوب */}
              <div className="desktop-table-view" style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.1rem' }}>قائمة الشركاء والمستثمرين</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', marginTop: '15px', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a', color: '#94a3b8' }}>
                      {['اسم الشريك', 'نسبة الشراكة', 'رأس المال المستثمر', 'حالة الصرف', 'ملاحظات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {investors.map((inv: any, index: number) => (
                      <tr key={inv.investorId} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8' }}>{inv.name}</td>
                        <td style={tdStyle}>{inv.ownershipPercentage}%</td>
                        <td style={tdStyle}>{cleanPrice(inv.investedAmount).toLocaleString()} ر.س</td>
                        <td style={tdStyle}>{inv.payoutStatus}</td>
                        <td style={tdStyle}>{inv.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* بطاقات الجوال للمستثمرين */}
              <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                {investors.map((inv: any) => (
                  <div key={`inv-m-${inv.investorId}`} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#38bdf8' }}>{inv.name}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#065f46', fontSize: '0.75rem', fontWeight: 'bold' }}>{inv.ownershipPercentage}%</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#4ade80' }}>رأس المال: {cleanPrice(inv.investedAmount).toLocaleString()} ر.س</div>
                    {inv.notes && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ملاحظات: {inv.notes}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '8px', fontSize: '0.8rem' }}>
                      <span>الحالة: {inv.payoutStatus}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.2rem' }}>إضافة حركة مالية يدوية سحابياً</h3>
            
            <label style={labelStyle}>نوع الحركة:</label>
            <select style={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="مصروف">مصروف 💸</option>
              <option value="إيراد">إيراد 💰</option>
            </select>

            <label style={labelStyle}>وصف الحركة:</label>
            <input placeholder="مثل: رسوم بنكية أو اشتراك" style={inputStyle} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            
            <label style={labelStyle}>التصنيف:</label>
            <input placeholder="مثل: تشغيل، تسويق" style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            
            <label style={labelStyle}>المبلغ (ر.س):</label>
            <input type="number" placeholder="0.00" style={inputStyle} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            
            <label style={labelStyle}>المسؤول / الجهة:</label>
            <input placeholder="اسم الجهة أو المسؤول" style={inputStyle} value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveExpense} style={primaryBtn} disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ ✅'}</button>
              <button onClick={resetForm} style={secondaryBtn}>إلغاء ❌</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tabBtnStyle = (isActive: boolean) => ({
  background: isActive ? '#2563eb' : '#1e293b',
  color: 'white',
  padding: '10px 18px',
  borderRadius: '10px',
  border: isActive ? '1px solid #3b82f6' : '1px solid #334155',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem'
});

const cardStyle = { background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' };
const thStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', verticalAlign: 'middle' as const };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#1e293b' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem' };
const primaryBtn = { padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const secondaryBtn = { padding: '8px 16px', background: '#64748b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' };
const modalContent = { background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' };