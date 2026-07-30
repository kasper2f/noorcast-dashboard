import { useState, useEffect } from 'react';
import { getInvoicesSheet, getIncomingBillsSheet, getExpensesSheet, getInvestorsSheet } from '@/services/dbService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiRefreshCw, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

export default function PLPage() {
  const [data, setData] = useState({ sales: 0, expenses: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPLCloudData();
  }, []);

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const loadPLCloudData = async () => {
    try {
      setLoading(true);

      const [invoicesData, expensesData, investorsData] = await Promise.all([
        getInvoicesSheet(),
        getExpensesSheet(),
        getInvestorsSheet()
      ]);

      const paidInvoices = Array.isArray(invoicesData) ? invoicesData.filter((inv: any) => {
        const s = String(inv.status || '').trim();
        return s === 'تم سداد الفاتورة كاملة' || s === 'تم التنفيذ' || s === 'تم السداد' || s === 'مسددة' || s === 'تم سداد المقدم';
      }) : [];

      const totalSales = paidInvoices.reduce((sum, inv) => {
        const rawTotal = cleanPrice(inv.total || inv.amount);
        const status = String(inv.status || '').trim();
        const ratio = (status === 'تم سداد المقدم') ? 0.5 : 1.0;
        return sum + (rawTotal * ratio);
      }, 0);

      const rawExpenses = Array.isArray(expensesData) ? expensesData : [];
      const totalExpensesFromPage = rawExpenses.filter((e: any) => {
        const t = String(e.type || '').trim().toLowerCase();
        const desc = String(e.description || '').toLowerCase();
        const amount = cleanPrice(e.amount);
        return t !== 'إيراد' && t !== 'irad' && amount > 0 && amount !== 5750 && !desc.includes('مقدم فاتورة');
      }).reduce((sum, e) => sum + cleanPrice(e.amount), 0);

      const rawInvestors = Array.isArray(investorsData) ? investorsData : [];
      const totalInvestorsLiabilities = rawInvestors.reduce((sum, inv) => {
        return sum + cleanPrice(inv.investedAmount || inv.amount);
      }, 0);

      const totalCombinedExpensesAndLiabilities = totalExpensesFromPage + totalInvestorsLiabilities;

      const totalInvoicesVat = paidInvoices.reduce((sum, inv) => {
        const rawTotal = cleanPrice(inv.total || inv.amount);
        const status = String(inv.status || '').trim();
        const ratio = (status === 'تم سداد المقدم') ? 0.5 : 1.0;
        return sum + ((rawTotal * ratio) * 15 / 115);
      }, 0);

      const totalBillsVat = rawExpenses.filter((e: any) => {
        const t = String(e.type || '').trim().toLowerCase();
        const desc = String(e.description || '').toLowerCase();
        const amount = cleanPrice(e.amount);
        return t !== 'إيراد' && t !== 'irad' && amount > 0 && amount !== 5750 && !desc.includes('مقدم فاتورة');
      }).reduce((sum, e) => sum + (cleanPrice(e.amount) * 15 / 115), 0);

      const netVatDue = totalInvoicesVat - totalBillsVat;

      const actualNetProfit = totalSales - totalCombinedExpensesAndLiabilities - (netVatDue > 0 ? netVatDue : 0);

      setData({
        sales: totalSales,
        expenses: totalCombinedExpensesAndLiabilities + (netVatDue > 0 ? netVatDue : 0),
        netProfit: actualNetProfit
      });

    } catch (error) {
      console.error("خطأ في حساب تقرير الأرباح والخسائر سحابياً:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'الإيرادات', value: data.sales, color: '#10b981' },
    { name: 'المصروفات والالتزامات', value: data.expenses, color: '#ef4444' },
    { name: 'صافي الربح الفعلي', value: data.netProfit, color: data.netProfit >= 0 ? '#3b82f6' : '#f59e0b' },
  ];

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* تنسيقات متجاوبة لتجنب أي تداخل في الشاشات الضيقة */}
      <style>{`
        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>تقرير الأرباح والخسائر (P&L)</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>تحليل الأداء المالي وصافي الأرباح الفعلي موحداً عبر قوقل شيت</p>
        </div>
        <button onClick={loadPLCloudData} style={primaryBtn}>
          <FiRefreshCw style={{ marginLeft: '5px' }} /> تحديث سحابي 🔄
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>جاري حساب وتحليل مؤشرات الأرباح والخسائر سحابياً...</div>
      ) : (
        <>
          {/* البطاقات الملونة الحيوية */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            <StatCard title="إجمالي الإيرادات (المسددة)" value={`${data.sales.toLocaleString()} ر.س`} color="#10b981" icon={<FiTrendingUp />} />
            <StatCard title="إجمالي المصروفات والالتزامات" value={`${data.expenses.toLocaleString()} ر.س`} color="#ef4444" icon={<FiTrendingDown />} />
            <StatCard title="صافي الربح الفعلي" value={`${data.netProfit.toLocaleString()} ر.س`} color={data.netProfit >= 0 ? '#3b82f6' : '#f59e0b'} icon={<FiDollarSign />} />
          </div>

          {/* منطقة الرسم البياني مع حاوية آمنة للشاشات الضيقة */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', color: 'white', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'white', fontSize: '1rem' }}>تحليل الأداء المالي (مقارنة الإيرادات، المصروفات الشاملة، وصافي الربح)</h3>
            <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
              <div style={{ minWidth: '320px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, color, icon }: { title: string, value: string, color: string, icon: any }) {
  return (
    <div style={{ background: '#1e293b', padding: '18px', borderRadius: '12px', borderBottom: `4px solid ${color}`, border: '1px solid #334155', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>{title}</h4>
        <span style={{ color, fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

const primaryBtn = { padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' };