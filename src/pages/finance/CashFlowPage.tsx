import { useState, useEffect } from 'react';
import { getInvoicesSheet, getIncomingBillsSheet, getExpensesSheet, getHRPayrollSheet, getInvestorsSheet } from '@/services/dbService';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiRefreshCw, FiShield, FiPercent } from 'react-icons/fi';

export default function CashFlowPage() {
  const [cashInTotal, setCashInTotal] = useState(0);
  const [cashOutTotal, setCashOutTotal] = useState(0);
  const [liabilitiesTotal, setLiabilitiesTotal] = useState(0);
  const [vatTotal, setVatTotal] = useState(0);
  const [netActualProfit, setNetActualProfit] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCloudCashFlowData();
  }, []);

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // سحب البيانات من السحابة ومطابقتها حصرياً مع ورقة الإيرادات والمصروفات الرئيسية
  const loadCloudCashFlowData = async () => {
    try {
      setLoading(true);

      const [invoicesData, billsData, expensesData, hrData, investorsData] = await Promise.all([
        getInvoicesSheet(),
        getIncomingBillsSheet(),
        getExpensesSheet(),
        getHRPayrollSheet(),
        getInvestorsSheet()
      ]);

      // 1. التدفق الداخل (Cash In): الفواتير الصادرة المحصلة فعلياً
      const paidInvoices = Array.isArray(invoicesData) ? invoicesData.filter((inv: any) => {
        const s = String(inv.status || '').trim();
        return s === 'تم سداد الفاتورة كاملة' || s === 'تم التنفيذ' || s === 'تم السداد' || s === 'مسددة' || s === 'تم سداد المقدم';
      }) : [];

      const inflowItems = paidInvoices.map((inv: any) => {
        const rawTotal = cleanPrice(inv.total || inv.amount);
        const status = String(inv.status || '').trim();
        const ratio = (status === 'تم سداد المقدم') ? 0.5 : 1.0;
        return rawTotal * ratio;
      });

      const totalIn = inflowItems.reduce((sum, amount) => sum + amount, 0);
      setCashInTotal(totalIn);

      // 2. التدفق الخارج (Cash Out): المصروفات التشغيلية المسحوبة من سحابة Expenses حصرياً
      const rawExpenses = Array.isArray(expensesData) ? expensesData : [];
      const outflowItems = rawExpenses.filter((e: any) => {
        const t = String(e.type || '').trim().toLowerCase();
        const desc = String(e.description || '').toLowerCase();
        const amount = cleanPrice(e.amount);
        return t !== 'إيراد' && t !== 'irad' && amount > 0 && amount !== 5750 && !desc.includes('مقدم فاتورة');
      }).map((e: any) => cleanPrice(e.amount));

      const totalOut = outflowItems.reduce((sum, amount) => sum + amount, 0);
      setCashOutTotal(totalOut);

      // 3. الالتزامات القائمة: تحسب تلقائياً من الفواتير الواردة التي حالتها "قيد الانتظار"
      const rawBills = Array.isArray(billsData) ? billsData : [];
      const totalLiab = rawBills
        .filter(b => String(b.status || '').trim() === 'قيد الانتظار')
        .reduce((sum, b) => sum + cleanPrice(b.amount), 0);
      setLiabilitiesTotal(totalLiab);

      // 4. إجمالي الضرائب (ضريبة القيمة المضافة الصافية المستحقة)
      const totalInvoicesVat = inflowItems.reduce((sum, amount) => sum + (amount * 15 / 115), 0);
      const totalBillsVat = outflowItems.reduce((sum, amount) => sum + (amount * 15 / 115), 0);
      const netVat = totalInvoicesVat - totalBillsVat;
      setVatTotal(netVat > 0 ? netVat : 0);

      // 5. صافي الربح الفعلي للشركة (يُخصم منه الالتزامات المعلقة حسب المنطق المحاسبي الدقيق)
      const actualProfit = totalIn - totalOut - totalLiab - (netVat > 0 ? netVat : 0);
      setNetActualProfit(actualProfit);

    } catch (error) {
      console.error("خطأ في جلب بيانات التدفقات النقدية سحابياً:", error);
    } finally {
      setLoading(false);
    }
  };

  // حساب النسبة المئوية للمؤشرات البصرية للأعمدة
  const maxScale = Math.max(cashInTotal, cashOutTotal, netActualProfit, 1);
  const inPercent = Math.min(Math.round((cashInTotal / maxScale) * 100), 100);
  const outPercent = Math.min(Math.round((cashOutTotal / maxScale) * 100), 100);
  const profitPercent = Math.min(Math.round((Math.abs(netActualProfit) / maxScale) * 100), 100);

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* تحسين التجاوب للشاشات الضيقة */}
      <style>{`
        @media (max-width: 600px) {
          .cashflow-grid {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>

      {/* رأس الصفحة وزر التحديث */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>التدفقات النقدية والمؤشرات الحيوية</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            مؤشرات الأداء المالي والسيولة النقدية مسحوبة مباشرة وحصرياً من ورقة الإيرادات والمصروفات
          </p>
        </div>
        
        <button onClick={loadCloudCashFlowData} style={primaryBtn}>
          <FiRefreshCw style={{ marginLeft: '6px' }} /> {loading ? 'جاري المزامنة...' : 'مزامنة سحابية 🔄'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#38bdf8', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🔄 جاري حساب وتحليل المؤشرات المالية سحابياً... يرجى الانتظار
        </div>
      ) : (
        <>
          {/* لوحة المؤشرات الرئيسية الـ 5 مع ضبط التجاوب الدقيق */}
          <div className="cashflow-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            
            {/* 1. التدفق الداخل */}
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155', borderRight: '5px solid #16a34a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>إجمالي التدفق الداخل</span>
                <div style={{ background: 'rgba(22, 163, 74, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <FiTrendingUp style={{ color: '#4ade80', fontSize: '1.2rem' }} />
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#4ade80', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {cashInTotal.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ر.س</span>
              </strong>
            </div>

            {/* 2. التدفق الخارج */}
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155', borderRight: '5px solid #dc2626', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>إجمالي التدفق الخارج</span>
                <div style={{ background: 'rgba(220, 38, 38, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <FiTrendingDown style={{ color: '#f87171', fontSize: '1.2rem' }} />
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#f87171', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {cashOutTotal.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ر.س</span>
              </strong>
            </div>

            {/* 3. الالتزامات */}
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155', borderRight: '5px solid #0284c7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>إجمالي الالتزامات القائمة</span>
                <div style={{ background: 'rgba(2, 132, 199, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <FiShield style={{ color: '#38bdf8', fontSize: '1.2rem' }} />
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#38bdf8', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {liabilitiesTotal.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ر.س</span>
              </strong>
            </div>

            {/* 4. إجمالي الضرائب */}
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '14px', border: '1px solid #334155', borderRight: '5px solid #d97706', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>إجمالي الضرائب (القيمة المضافة)</span>
                <div style={{ background: 'rgba(217, 119, 6, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <FiPercent style={{ color: '#fbbf24', fontSize: '1.2rem' }} />
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.5rem', color: '#fbbf24', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {vatTotal.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ر.س</span>
              </strong>
            </div>

            {/* 5. صافي الربح الفعلي */}
            <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', padding: '20px', borderRadius: '14px', border: '1px solid #059669', borderRight: '5px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#d1fae5', fontSize: '0.9rem', fontWeight: 'bold' }}>صافي الربح الفعلي للشركة</span>
                <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '8px', borderRadius: '10px' }}>
                  <FiDollarSign style={{ color: 'white', fontSize: '1.2rem' }} />
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.8rem', color: 'white', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {netActualProfit.toLocaleString()} <span style={{ fontSize: '0.95rem', color: '#d1fae5' }}>ر.س</span>
              </strong>
            </div>

          </div>

          {/* لوحة المؤشرات البصرية التفاعلية (الأعمدة الملونة) */}
          <div style={{ background: '#1e293b', padding: '28px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'white', fontSize: '1.1rem' }}>مؤشرات الأداء النسبي للسيولة والربحية 📊</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* مؤشر الإيرادات والتدفق الداخل (أخضر) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', flexWrap: 'wrap', gap: '5px' }}>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>إجمالي التدفق الداخل (الإيرادات المحصلة)</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{cashInTotal.toLocaleString()} ر.س</span>
                </div>
                <div style={{ width: '100%', background: '#0f172a', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <div style={{ width: `${inPercent}%`, background: '#22c55e', height: '100%', borderRadius: '6px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
              </div>

              {/* مؤشر المصروفات والتدفق الخارج (أحمر) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', flexWrap: 'wrap', gap: '5px' }}>
                  <span style={{ color: '#f87171', fontWeight: 'bold' }}>إجمالي التدفق الخارج (المصروفات التشغيلية)</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{cashOutTotal.toLocaleString()} ر.س</span>
                </div>
                <div style={{ width: '100%', background: '#0f172a', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <div style={{ width: `${outPercent}%`, background: '#ef4444', height: '100%', borderRadius: '6px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
              </div>

              {/* مؤشر الضرائب والالتزامات (أصفر) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', flexWrap: 'wrap', gap: '5px' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>إجمالي الضرائب المستحقة (القيمة المضافة)</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{vatTotal.toLocaleString()} ر.س</span>
                </div>
                <div style={{ width: '100%', background: '#0f172a', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <div style={{ width: `${Math.min(Math.round((vatTotal / maxScale) * 100), 100)}%`, background: '#f59e0b', height: '100%', borderRadius: '6px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
              </div>

              {/* مؤشر صافي الربح الفعلي */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', flexWrap: 'wrap', gap: '5px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>صافي الربح الفعلي للشركة</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{netActualProfit.toLocaleString()} ر.س</span>
                </div>
                <div style={{ width: '100%', background: '#0f172a', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <div style={{ width: `${profitPercent}%`, background: '#0ea5e9', height: '100%', borderRadius: '6px', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}

const primaryBtn = { padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '0.95rem' };