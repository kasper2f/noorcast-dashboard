import { useState, useEffect } from 'react';
import { getHRPayrollSheet, getHRActionLogs, submitAdministrativeAction, updateEmployeeStatusInSheet } from '@/services/dbService';
import { FiShield, FiCheckCircle, FiDollarSign, FiUser, FiFileText, FiBriefcase, FiRefreshCw, FiSearch, FiTrash2 } from 'react-icons/fi';

export default function HRAdminControlPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  
  const [categoryType, setCategoryType] = useState('جزاءات');
  const [actionType, setActionType] = useState('خصم تأخير');
  
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchLogTerm, setSearchLogTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, logsData] = await Promise.all([
        getHRPayrollSheet(),
        getHRActionLogs().catch(() => [])
      ]);

      if (Array.isArray(empData)) {
        setEmployees(empData);
        if (empData.length > 0 && !selectedUsername) setSelectedUsername(empData[0].username || '');
      }
      if (Array.isArray(logsData)) {
        setActionLogs(logsData.reverse());
      }
    } catch (error) {
      console.error("Error loading HR data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmpObj = employees.find(e => (e.username || e.name) === selectedUsername);

  const getActionOptions = () => {
    switch (categoryType) {
      case 'جزاءات':
        return [
          { label: 'خصم تأخير عن ساعات العمل ⏱️', value: 'خصم تأخير' },
          { label: 'تسجيل غياب (بدون أجر) ❌', value: 'غياب بدون عذر' },
          { label: 'فرض غرامة / جزاء إداري ⚠️', value: 'جزاء إداري/مخالفة' }
        ];
      case 'حوافز':
        return [
          { label: 'صرف نسبة / عمولة مستحقة من مشروع 💵', value: 'مكافأة مشروع / عمولة' },
          { label: 'أجر ساعات عمل إضافية 📈', value: 'بدل إضافي' }
        ];
      case 'إجازات':
        return [
          { label: 'تسجيل إجازة سنوية مدفوعة 🌴', value: 'إجازة سنوية مدفوعة' },
          { label: 'تسجيل إجازة مرضية 🏥', value: 'إجازة مرضية' },
          { label: 'عودة للعمل وتنشيط الحساب 🚀', value: 'عودة من الإجازة / تنشيط' }
        ];
      case 'نهايات':
        return [
          { label: 'إجراء استقالة وتسوية مستحقات 📄', value: 'استقالة / تسوية' },
          { label: 'قرار استغناء / إنهاء مادة (77) ⚖️', value: 'إلغاء عقد / استغناء' }
        ];
      default:
        return [];
    }
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsername) {
      alert("الرجاء اختيار الموظف المستهدف");
      return;
    }

    try {
      setLoading(true);
      setSuccessMsg('');

      await submitAdministrativeAction({
        employeeUsername: selectedUsername,
        actionType,
        amount: parseFloat(amount) || 0,
        reason
      });

      setSuccessMsg(`تم بنجاح اعتماد الإجراء (${actionType}) للموظف وتحديث حالته سحابياً! ✅`);
      setAmount('');
      setReason('');
      await loadData();
    } catch (error) {
      console.error("Error executing action:", error);
      alert("حدث خطأ أثناء تنفيذ الإجراء.");
    } finally {
      setLoading(false);
    }
  };

  const handleInlineStatusChange = async (username: string, newStatus: string) => {
    try {
      setLoading(true);
      await updateEmployeeStatusInSheet(username, newStatus);
      alert(`تم بنجاح تحديث حالة الموظف @${username} إلى (${newStatus}) 🚀`);
      await loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("فشل تحديث الحالة سحابياً.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (actionId: string) => {
    if (!confirm(`هل أنت متأكد من حذف السجل رقم (${actionId}) نهائياً؟`)) return;

    try {
      setLoading(true);
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlL0sfoWhBFXXoLd9ZiPu6boq9WvLlalu4_kf6DkXMdQtmf-XMM32Hxrq0TzFPga3K/exec';
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteHRAction', actionId })
      });

      alert("تم إرسال طلب الحذف بنجاح! 🗑️");
      await loadData();
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("حدث خطأ أثناء محاولة الحذف.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = actionLogs.filter((log: any) => {
    const term = searchLogTerm.toLowerCase();
    const matchesSearch = String(log.employeeUsername || '').toLowerCase().includes(term) ||
                          String(log.actionType || '').toLowerCase().includes(term) ||
                          String(log.reason || '').toLowerCase().includes(term);

    const empMatch = employees.find(e => (e.username || '').toLowerCase() === (log.employeeUsername || '').toLowerCase());
    const currentStatus = empMatch?.status || 'نشط ومتواجد بالخدمة';

    if (statusFilter === 'الكل') return matchesSearch;
    if (statusFilter === 'نشط' && currentStatus.includes('نشط')) return matchesSearch;
    if (statusFilter === 'إجازة' && currentStatus.includes('إجازة')) return matchesSearch;
    if (statusFilter === 'منتهي' && currentStatus.includes('منتهي')) return matchesSearch;

    return matchesSearch;
  });

  return (
    <div style={{ padding: '32px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* رأس الصفحة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold' }}>
              <span style={iconHeaderBox}><FiShield style={{ color: '#3b82f6', fontSize: '1.4rem' }} /></span> 
              التحكم الإداري وحوكمة الموارد البشرية
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
              إدارة الجزاءات، الحوافز، الإجازات، وتعديل حالات وسجلات الموظفين من شريط المتابعة السفلي
            </p>
          </div>
          <button onClick={loadData} style={refreshBtn}>
            <FiRefreshCw /> تحديث البيانات 🔄
          </button>
        </div>

        {successMsg && (
          <div style={successBanner}>
            <FiCheckCircle style={{ fontSize: '1.3rem', flexShrink: 0 }} /> 
            <span>{successMsg}</span>
          </div>
        )}

        {/* نموذج اعتماد الإجراء الإداري */}
        <form onSubmit={handleSubmitAction} style={mainCardStyle}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px', boxSizing: 'border-box' }}>
            
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                <FiUser style={{ color: '#38bdf8' }} /> الموظف المستهدف
              </label>
              <select 
                value={selectedUsername} 
                onChange={(e) => setSelectedUsername(e.target.value)}
                style={selectStyle}
              >
                {employees.map((emp, idx) => (
                  <option key={idx} value={emp.username || emp.name} style={{ background: '#1e293b', color: 'white' }}>
                    {emp.name} (@{emp.username || 'user'}) — الحالة: {emp.status || 'نشط'}
                  </option>
                ))}
              </select>
              {selectedEmpObj && (
                <div style={empPreviewBadge}>
                  <span>الراتب: <strong>{selectedEmpObj.salary || 0} ر.س</strong></span>
                  <span>الحالة الحالية: <strong style={{ color: '#34d399' }}>{selectedEmpObj.status || 'نشط'}</strong></span>
                </div>
              )}
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                <FiBriefcase style={{ color: '#f59e0b' }} /> قسم الإجراء الإداري
              </label>
              <select 
                value={categoryType} 
                onChange={(e) => {
                  setCategoryType(e.target.value);
                  if (e.target.value === 'جزاءات') setActionType('خصم تأخير');
                  else if (e.target.value === 'حوافز') setActionType('مكافأة مشروع / عمولة');
                  else if (e.target.value === 'إجازات') setActionType('إجازة سنوية مدفوعة');
                  else if (e.target.value === 'نهايات') setActionType('استقالة / تسوية');
                }}
                style={selectStyle}
              >
                <option value="جزاءات">⚠️ الجزاءات والخصومات</option>
                <option value="حوافز">💰 الحوافز والعمولات</option>
                <option value="إجازات">🏖️ الإجازات والتنشيط</option>
                <option value="نهايات">📄 الاستقالات والنهايات</option>
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                <FiFileText style={{ color: '#a78bfa' }} /> نوع الإجراء الدقيق
              </label>
              <select 
                value={actionType} 
                onChange={(e) => setActionType(e.target.value)}
                style={selectStyle}
              >
                {getActionOptions().map((opt, i) => (
                  <option key={i} value={opt.value} style={{ background: '#1e293b', color: 'white' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div style={{ marginBottom: '24px', boxSizing: 'border-box' }}>
            <label style={labelStyle}>
              <FiDollarSign style={{ color: '#10b981' }} /> القيمة المالية (ريال سعودي) - إن وجدت
            </label>
            <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />
              <span style={currencyLabel}>ر.س</span>
            </div>
          </div>

          <div style={{ marginBottom: '30px', boxSizing: 'border-box' }}>
            <label style={labelStyle}>
              <FiFileText style={{ color: '#38bdf8' }} /> السبب والمستند النظامي
            </label>
            <textarea 
              rows={3}
              placeholder="اكتب تفاصيل القرار الإداري، رقم الخطاب، أو سبب الإجازة/الجزاء..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={textareaStyle}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? 'جاري الاعتماد والترحيل...' : 'اعتماد الإجراء وتحديث الحالة سحابياً 🚀'}
          </button>

        </form>

        {/* --- شريط المتابعة والتحكم الحي السفلي --- */}
        <div style={{ marginTop: '40px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📋 شريط المتابعة الحية وسجلات الموظفين
            </h2>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="الكل">🔍 جميع الحالات</option>
                <option value="نشط">🟢 النشطون فقط</option>
                <option value="إجازة">🌴 في إجازة</option>
                <option value="منتهي">📄 منتهى الخدمة</option>
              </select>

              <div style={{ position: 'relative', width: '250px' }}>
                <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="بحث في السجلات..." 
                  value={searchLogTerm}
                  onChange={(e) => setSearchLogTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 35px 8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={tableContainerStyle}>
            
            {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
            <div className="desktop-table-view" style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem', minWidth: '950px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px' }}>معرف الإجراء</th>
                    <th style={{ padding: '12px' }}>الموظف</th>
                    <th style={{ padding: '12px' }}>الإجراء المتخذ</th>
                    <th style={{ padding: '12px' }}>المبلغ</th>
                    <th style={{ padding: '12px' }}>السبب / التفاصيل</th>
                    <th style={{ padding: '12px' }}>تاريخ التسجيل</th>
                    <th style={{ padding: '12px' }}>حالة الموظف الحية</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log: any, index: number) => {
                      const empMatch = employees.find(e => (e.username || '').toLowerCase() === (log.employeeUsername || '').toLowerCase());
                      const currentEmpStatus = empMatch?.status || 'نشط ومتواجد بالخدمة';

                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? 'rgba(30, 41, 59, 0.4)' : 'transparent' }}>
                          <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 'bold' }}>{log.actionId || 'ACT-' + index}</td>
                          <td style={{ padding: '12px', color: 'white', fontWeight: 'bold' }}>@{log.employeeUsername}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                              {log.actionType}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: log.amount > 0 ? '#34d399' : '#94a3b8' }}>
                            {log.amount > 0 ? `${log.amount} ر.س` : '-'}
                          </td>
                          <td style={{ padding: '12px', color: '#cbd5e1' }}>{log.reason}</td>
                          <td style={{ padding: '12px', color: '#94a3b8', fontSize: '0.78rem' }}>
                            {log.date ? new Date(log.date).toLocaleString('ar-SA') : 'غير متوفر'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <select
                              value={currentEmpStatus}
                              onChange={(e) => handleInlineStatusChange(log.employeeUsername, e.target.value)}
                              style={inlineSelectStyle}
                            >
                              <option value="نشط ومتواجد بالخدمة">🟢 نشط ومتواجد بالخدمة</option>
                              <option value="في إجازة 🌴">🌴 في إجازة</option>
                              <option value="إجازة مرضية 🏥">🏥 إجازة مرضية</option>
                              <option value="منتهي الخدمة 📄">📄 منتهي الخدمة / استقالة</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteLog(log.actionId)}
                              style={deleteIconBtnStyle}
                              title="حذف السجل"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>لا توجد إجراءات إدارية مطابقة لبحثك.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log: any, index: number) => {
                  const empMatch = employees.find(e => (e.username || '').toLowerCase() === (log.employeeUsername || '').toLowerCase());
                  const currentEmpStatus = empMatch?.status || 'نشط ومتواجد بالخدمة';

                  return (
                    <div key={index} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'white', boxSizing: 'border-box', width: '100%' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{log.actionId || 'ACT-' + index}</span>
                        <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {log.actionType}
                        </span>
                      </div>

                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#f8fafc', wordBreak: 'break-word' }}>
                        الموظف: <strong style={{ color: '#38bdf8' }}>@{log.employeeUsername}</strong>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', wordBreak: 'break-word' }}>
                        السبب: {log.reason}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px', fontSize: '0.85rem', flexWrap: 'wrap', gap: '5px' }}>
                        <span style={{ color: log.amount > 0 ? '#34d399' : '#94a3b8', fontWeight: 'bold' }}>
                          {log.amount > 0 ? `${log.amount} ر.س` : 'بدون مبلغ'}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          📅 {log.date ? new Date(log.date).toLocaleString('ar-SA') : 'غير متوفر'}
                        </span>
                      </div>

                      {/* تغيير الحالة والحذف في الجوال */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #334155', paddingTop: '10px', flexWrap: 'wrap' }}>
                        <select
                          value={currentEmpStatus}
                          onChange={(e) => handleInlineStatusChange(log.employeeUsername, e.target.value)}
                          style={{ ...inlineSelectStyle, flex: 1, padding: '8px', minWidth: '140px' }}
                        >
                          <option value="نشط ومتواجد بالخدمة">🟢 نشط</option>
                          <option value="في إجازة 🌴">🌴 في إجازة</option>
                          <option value="إجازة مرضية 🏥">🏥 مرضية</option>
                          <option value="منتهي الخدمة 📄">📄 منتهي</option>
                        </select>

                        <button
                          onClick={() => handleDeleteLog(log.actionId)}
                          style={{ ...deleteIconBtnStyle, padding: '8px 12px' }}
                          title="حذف السجل"
                        >
                          <FiTrash2 size={16} /> حذف
                        </button>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>لا توجد إجراءات إدارية مطابقة لبحثك.</div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

const iconHeaderBox = { background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const successBanner = { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', boxSizing: 'border-box' as const };
const mainCardStyle = { background: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box' as const, width: '100%' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column' as const, gap: '8px', boxSizing: 'border-box' as const };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: '#f8fafc' };
const selectStyle = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' as const, fontSize: '0.95rem', cursor: 'pointer', outline: 'none' };
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' as const, fontSize: '0.95rem', outline: 'none' };
const currencyLabel = { position: 'absolute' as const, left: '16px', top: '13px', color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' };
const textareaStyle = { width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box' as const, fontSize: '0.95rem', resize: 'vertical' as const, outline: 'none' };
const empPreviewBadge = { display: 'flex', justifyContent: 'space-between', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.78rem', color: '#94a3b8', boxSizing: 'border-box' as const, flexWrap: 'wrap' as const, gap: '5px' };
const primaryBtn = { width: '100%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)', transition: 'all 0.2s ease', boxSizing: 'border-box' as const };
const refreshBtn = { background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const tableContainerStyle = { background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '16px', boxSizing: 'border-box' as const, width: '100%', overflowX: 'hidden' as const };
const inlineSelectStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#34d399', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' };
const filterSelectStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' };
const deleteIconBtnStyle = { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };