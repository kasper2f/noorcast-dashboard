import { useState, useEffect } from 'react';
import { getOrders, getInvoicesSheet, saveInvoiceToSheet } from '@/services/dbService';
import { FiDownload, FiRefreshCw, FiSearch, FiPlus, FiSave, FiX } from 'react-icons/fi';

export default function SalesContractsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    id: '',
    number: `INV-EXT-${Math.floor(100 + Math.random() * 900)}`,
    client: '',
    amount: '',
    status: 'تم التنفيذ',
    dueDate: new Date().toISOString().split('T')[0],
    isExternal: true
  });

  useEffect(() => {
    loadAllInvoices();
  }, []);

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // دالة موحدة لتنسيق التاريخ بصيغة اليوم / الشهر / السنة
  const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const cleanDate = dateStr.toString().split('T')[0].split(' ')[0];
      const d = new Date(cleanDate);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day} / ${month} / ${year}`;
      }
      return cleanDate;
    } catch (e) {
      return dateStr;
    }
  };

  const loadAllInvoices = async () => {
    try {
      setLoading(true);
      const [orders, cloudInvoices] = await Promise.all([
        getOrders().catch(() => []),
        getInvoicesSheet().catch(() => [])
      ]);
      
      const orderInvoices = Array.isArray(orders) ? orders
        .filter((item: any) => {
          if (!item) return false;
          const status = String(item.status || '').trim();
          return status === 'تم التنفيذ';
        })
        .map((item: any, index: number) => ({
          id: String(item.orderId || item.id || index),
          number: `INV-2026-${String(index + 1).padStart(3, '0')}`,
          client: String(item.customerName || item.clientName || item.name || 'عميل غير معروف'),
          amount: cleanPrice(item.price ?? item.amount ?? item.value ?? 0),
          status: String(item.status || 'تم التنفيذ').trim(),
          dueDate: String(item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          isExternal: false
        })) : [];

      const formattedCloudInvoices = Array.isArray(cloudInvoices) ? cloudInvoices
        .filter((item: any) => item !== null && item !== undefined)
        .map((item: any, idx: number) => ({
          id: String(item?.id || 'ext-cloud-' + idx),
          number: String(item?.number || `INV-EXT-${idx}`),
          client: String(item?.client || 'عميل'),
          amount: cleanPrice(item?.amount),
          status: String(item?.status || 'تم التنفيذ'),
          dueDate: String(item?.dueDate || new Date().toISOString().split('T')[0]),
          isExternal: Boolean(item?.isExternal ?? true)
        })) : [];

      const combined = [...formattedCloudInvoices, ...orderInvoices];
      const uniqueInvoices = Array.from(new Map(combined.map(item => [item.id || item.number, item])).values());

      setInvoices(uniqueInvoices);
    } catch (error) {
      console.error("خطأ في مزامنة الفواتير سحابياً:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExternalInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.client || !newInvoice.amount) {
      alert("الرجاء إدخال اسم العميل ومبلغ الفاتورة على الأقل.");
      return;
    }

    const invoiceToAdd = {
      id: 'ext-' + Date.now(),
      number: newInvoice.number || `INV-EXT-${Math.floor(100 + Math.random() * 900)}`,
      client: newInvoice.client,
      amount: cleanPrice(newInvoice.amount),
      status: newInvoice.status,
      dueDate: newInvoice.dueDate,
      isExternal: true
    };

    try {
      setLoading(true);
      await saveInvoiceToSheet(invoiceToAdd);

      setInvoices(prev => [invoiceToAdd, ...prev]);
      setIsModalOpen(false);
      setNewInvoice({
        id: '',
        number: `INV-EXT-${Math.floor(100 + Math.random() * 900)}`,
        client: '',
        amount: '',
        status: 'تم التنفيذ',
        dueDate: new Date().toISOString().split('T')[0],
        isExternal: true
      });
      alert("تمت إضافة الفاتورة وحفظها سحابياً بنجاح لجميع الأجهزة! 📄☁️✅");
    } catch (err) {
      console.error("خطأ في حفظ الفاتورة سحابياً:", err);
      alert("حدث خطأ أثناء الحفظ السحابي.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => {
    if (!inv) return false;
    const num = String(inv.number || '').toLowerCase();
    const client = String(inv.client || '').toLowerCase();
    const matchesSearch = num.includes(searchTerm.toLowerCase()) || client.includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (!inv.dueDate) return true;

    const invDate = new Date(inv.dueDate);
    const now = new Date();

    if (filterType === 'month') {
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    } else if (filterType === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return invDate >= oneWeekAgo && invDate <= now;
    } else if (filterType === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return invDate >= start && invDate <= end;
    }

    return true;
  }) : [];

  const filteredTotal = filteredInvoices.reduce((sum, inv) => sum + cleanPrice(inv?.amount), 0);

  const exportToExcel = () => {
    if (filteredInvoices.length === 0) {
      alert("لا توجد فواتير مطابقة للفلترة الحالية لتصديرها.");
      return;
    }

    const headers = ['رقم الفاتورة', 'اسم العميل', 'المبلغ المستقطب (ر.س)', 'حالة السداد', 'تاريخ الإصدار', 'نوع الفاتورة'];
    const rows = filteredInvoices.map(inv => [
      inv.number,
      `"${inv.client}"`,
      cleanPrice(inv.amount),
      inv.status,
      formatDateToDDMMYYYY(inv.dueDate),
      inv.isExternal ? 'خارجية يدوية' : 'تلقائية من الطلبات'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Invoices_Report_${filterType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* رأس الصفحة وأزرار الإجراءات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>ارشيف المطالبات</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>مزامنة مركزية للطلبات المنفذة والفواتير الخارجية المرئية لجميع المستخدمين</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>
            <FiPlus style={{ marginLeft: '5px' }} /> إضافة فاتورة خارجية ➕
          </button>
          <button onClick={exportToExcel} style={successBtn}>
            <FiDownload style={{ marginLeft: '5px' }} /> تحميل التقرير (Excel) 📊
          </button>
          <button onClick={loadAllInvoices} style={refreshBtn}>
            <FiRefreshCw style={{ marginLeft: '5px' }} /> تحديث 🔄
          </button>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', marginTop: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #334155' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم العميل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterType('all')} style={filterType === 'all' ? activeTabStyle : tabStyle}>كل الفواتير</button>
          <button onClick={() => setFilterType('month')} style={filterType === 'month' ? activeTabStyle : tabStyle}>الشهر الحالي 📅</button>
          <button onClick={() => setFilterType('week')} style={filterType === 'week' ? activeTabStyle : tabStyle}>الأسبوع ⏱️</button>
          <button onClick={() => setFilterType('custom')} style={filterType === 'custom' ? activeTabStyle : tabStyle}>تاريخ مخصص 🔍</button>
        </div>

        {filterType === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '5px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>من:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={dateInputStyle} />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>إلى:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={dateInputStyle} />
          </div>
        )}
      </div>

      {/* بطاقة الإجمالي */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: '#1e293b', padding: '15px 20px', borderRadius: '12px', border: '1px solid #334155', minWidth: '250px' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي الفواتير المطابقة للفلترة:</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#38bdf8', marginTop: '4px' }}>
            {filteredTotal.toLocaleString()} ر.س <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({filteredInvoices.length} فاتورة)</span>
          </strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>جاري سحب الفواتير والمطالبات سحابياً...</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View - بلون نظام نوركاست الداكن) */}
          <div className="desktop-table-view" style={{ overflowX: 'auto', marginTop: '20px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', background: '#0f172a' }}>
                  {['رقم الفاتورة', 'العميل', 'المبلغ المستقطب', 'حالة السداد', 'تاريخ الإصدار', 'نوع المصدر'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv: any, index: number) => (
                    <tr key={inv.id || inv.number} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8' }}>{inv.number}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f8fafc' }}>{inv.client}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#4ade80' }}>{cleanPrice(inv.amount).toLocaleString()} ر.س</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '5px 10px', borderRadius: '6px', background: '#065f46', color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold' }}>{formatDateToDDMMYYYY(inv.dueDate)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: inv.isExternal ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: inv.isExternal ? '#fbbf24' : '#38bdf8', fontWeight: 'bold' }}>
                          {inv.isExternal ? 'فاتورة خارجية يدوية ✍️' : 'تلقائية من الطلبات ⚡'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      لا توجد فواتير مطابقة لخيارات البحث أو الفلترة المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv: any) => (
                <div key={inv.id || inv.number} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'white' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#38bdf8' }}>{inv.number}</span>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#065f46', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {inv.status}
                    </span>
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>
                    {inv.client}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1rem' }}>{cleanPrice(inv.amount).toLocaleString()} ر.س</span>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>📅 {formatDateToDDMMYYYY(inv.dueDate)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>نوع المصدر:</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: inv.isExternal ? 'rgba(254, 243, 199, 0.15)' : 'rgba(224, 242, 254, 0.15)', color: inv.isExternal ? '#fbbf24' : '#38bdf8', fontWeight: 'bold' }}>
                      {inv.isExternal ? 'فاتورة خارجية يدوية ✍️' : 'تلقائية من الطلبات ⚡'}
                    </span>
                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد فواتير مطابقة لخيارات البحث أو الفلترة المحددة.
              </div>
            )}
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.2rem' }}>➕ إضافة فاتورة خارجية سحابياً</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveExternalInvoice}>
              <div style={fieldGroup}>
                <label style={labelStyle}>رقم الفاتورة *</label>
                <input style={inputStyle} value={newInvoice.number} onChange={e => setNewInvoice({...newInvoice, number: e.target.value})} required />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>اسم العميل / الجهة *</label>
                <input style={inputStyle} placeholder="مثل: شركة الأفق للتجارة" value={newInvoice.client} onChange={e => setNewInvoice({...newInvoice, client: e.target.value})} required />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>المبلغ المستقطب (ر.س) *</label>
                <input type="number" style={inputStyle} placeholder="0.00" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} required />
              </div>

              <div style={rowStyle}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>حالة السداد</label>
                  <select style={inputStyle} value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value})}>
                    <option value="تم التنفيذ">تم التنفيذ / مسددة 🟢</option>
                    <option value="قيد الانتظار">قيد الانتظار ⏳</option>
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>تاريخ الإصدار</label>
                  <input type="date" style={inputStyle} value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} required />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="submit" style={primaryBtn}><FiSave /> حفظ سحابياً</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.9rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', verticalAlign: 'middle' as const };
const primaryBtn = { padding: '8px 16px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' };
const successBtn = { padding: '8px 16px', background: '#16a34a', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' };
const refreshBtn = { padding: '8px 16px', background: '#334155', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' };
const searchInputStyle = { padding: '8px 35px 8px 12px', borderRadius: '8px', border: '1px solid #334155', outline: 'none', width: '100%', background: '#1e293b', color: 'white', boxSizing: 'border-box' as const };
const tabStyle = { padding: '6px 12px', background: '#334155', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.85rem' };
const activeTabStyle = { padding: '6px 12px', background: '#2563eb', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' };
const dateInputStyle = { padding: '6px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '0.85rem' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginTop: '5px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold' };
const fieldGroup = { display: 'flex', flexDirection: 'column' as const, marginBottom: '15px' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const modalStyle = { background: 'white', color: '#1e293b', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' };
const modalOverlay = { position: 'fixed' as const, top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2000, padding: '16px' };
const secondaryBtn = { background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };