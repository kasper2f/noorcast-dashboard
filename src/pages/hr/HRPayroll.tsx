import { useState, useEffect } from 'react';
import { getHRPayrollSheet, getHRActionLogs, addHREntryToSheet, saveExpenseToSheet } from '@/services/dbService';
import { FiPlus, FiSave, FiTrash2, FiRefreshCw, FiDollarSign, FiDownload } from 'react-icons/fi';

export default function HRPayroll() {
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHRAndActionsFromCloud();
  }, []);

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  // دالة تنسيق التاريخ ليكون (يوم شهر سنة) بشكل نظيف
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const loadHRAndActionsFromCloud = async () => {
    try {
      setLoading(true);
      const [sheetData, hrActionsData] = await Promise.all([
        getHRPayrollSheet().catch(() => []),
        getHRActionLogs().catch(() => [])
      ]);

      const validActions = Array.isArray(hrActionsData) ? hrActionsData : [];

      if (Array.isArray(sheetData) && sheetData.length > 0) {
        const mapped = sheetData.map((item: any, index: number) => {
          const empUsername = String(item.username || item.name?.split(' ')[0] || '').toLowerCase().trim();
          const sal = cleanPrice(item.salary);
          const bonusVal = cleanPrice(item.projectBonus || 0);

          const empAdditions = validActions.filter((a: any) => {
            const actUser = String(a.employeeUsername || '').toLowerCase().trim();
            const actType = String(a.actionType || '');
            const isMatchUser = actUser === empUsername || actUser === `@${empUsername}`;
            const isAdditionType = actType.includes('مكافأة') || actType.includes('بدل') || actType.includes('عمولة');
            return isMatchUser && isAdditionType;
          });

          const totalAdditions = empAdditions.reduce((sum: number, act: any) => sum + cleanPrice(act.amount), 0);
          const profitShareAmount = (sal * bonusVal) / 100;
          const netSalary = sal + profitShareAmount + totalAdditions;

          return {
            id: String(item.employeeId || item.id || 'EMP-' + index),
            employeeId: String(item.employeeId || item.id || 'EMP-' + index),
            name: String(item.name || ''),
            username: String(item.username || item.name?.split(' ')[0] || ''),
            email: String(item.email || item.employeeEmail || ''),
            role: String(item.position || item.role || ''),
            salary: sal,
            projectBonus: bonusVal,
            additionsFromGovernance: totalAdditions,
            netSalary: netSalary,
            dueDate: String(item.dueDate || new Date().toISOString().split('T')[0]),
            billingCycle: String(item.billingCycle || 'شهري')
          };
        });
        setPayrollData(mapped);
      } else {
        setPayrollData([]);
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات الـ HR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateSingleEmployee = async (p: any) => {
    if (!confirm(`هل أنت متأكد من ترحيل راتب الموظف (${p.name}) بمبلغ ${cleanPrice(p.netSalary).toLocaleString()} ر.س إلى المصروفات السحابية؟`)) return;
    
    setIsSubmitting(true);
    try {
      const expenseId = `HR-EXP-${p.id}-${Date.now()}`;
      const description = `[راتب موظف - ${p.billingCycle}] ${p.name} (${p.role})`;
      const category = 'رواتب وأجور (HR)';
      const amount = cleanPrice(p.netSalary);
      const date = new Date().toISOString().split('T')[0];

      await saveExpenseToSheet({
        id: expenseId,
        description,
        category,
        amount,
        responsible: p.name,
        date
      });

      alert(`تم ترحيل راتب الموظف (${p.name}) إلى سحابة المصروفات بنجاح! 🚀✅`);
    } catch (error) {
      console.error("خطأ في الترحيل الفردي:", error);
      alert("حدث خطأ أثناء الترحيل السحابي.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMigratePayrollToExpenses = async () => {
    if (payrollData.length === 0) { alert("لا توجد رواتب لترحيلها."); return; }
    if (!confirm("هل أنت متأكد من ترحيل مسير الرواتب بالكامل دفعة واحدة إلى سحابة المصروفات؟")) return;

    setIsSubmitting(true);
    try {
      for (const p of payrollData) {
        const expenseId = `HR-EXP-${p.id}-${Date.now()}`;
        const description = `[راتب موظف - ${p.billingCycle}] ${p.name} (${p.role})`;
        const category = 'رواتب وأجور (HR)';
        const amount = cleanPrice(p.netSalary);
        const date = p.dueDate || new Date().toISOString().split('T')[0];

        await saveExpenseToSheet({
          id: expenseId,
          description,
          category,
          amount,
          responsible: p.name,
          date
        }).catch(err => console.error("Cloud sync error for:", p.name, err));
      }

      alert("تم ترحيل مسير الرواتب بالكامل إلى سحابة المصروفات بنجاح! 🚀🔥");
    } catch (error) {
      console.error("خطأ في الترحيل الجماعي:", error);
      alert("حدث خطأ أثناء الترحيل السحابي الجماعي.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportToExcel = () => {
    if (payrollData.length === 0) { alert("لا توجد بيانات."); return; }
    const headers = ["الاسم الكامل", "معرف الـ CRM", "البريد الإلكتروني", "المسمى الوظيفي", "الراتب الأساسي", "نسبة الأرباح (%)", "الحوافز والإضافات", "دورية السداد", "تاريخ الاستحقاق", "صافي الراتب الإجمالي"];
    const rows = payrollData.map(p => [
      `"${p.name || ''}"`, `"@${p.username || ''}"`, `"${p.email || ''}"`, `"${p.role || ''}"`,
      cleanPrice(p.salary), p.projectBonus, cleanPrice(p.additionsFromGovernance),
      `"${p.billingCycle || 'شهري'}"`, `"${p.dueDate || ''}"`, cleanPrice(p.netSalary)
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `مسير_الرواتب_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!editingEntry.name || !editingEntry.email) {
      alert("الرجاء إدخال الاسم الكامل والبريد الإلكتروني على الأقل.");
      return;
    }

    setIsSubmitting(true);
    const sal = cleanPrice(editingEntry.salary);
    const bonus = cleanPrice(editingEntry.projectBonus);
    const calculatedNet = sal + (sal * bonus) / 100;

    const targetId = editingEntry.employeeId || editingEntry.id || ('EMP-' + Date.now());

    const entryToSave = {
      ...editingEntry,
      salary: sal,
      projectBonus: bonus,
      netSalary: calculatedNet,
      username: editingEntry.username || editingEntry.name.split(' ')[0],
      dueDate: editingEntry.dueDate || new Date().toISOString().split('T')[0],
      billingCycle: editingEntry.billingCycle || 'شهري',
      employeeId: targetId,
      id: targetId
    };

    try {
      await addHREntryToSheet(entryToSave);
      setIsModalOpen(false);
      setEditingEntry(null);
      alert("تم حفظ وتحديث بيانات الموظف سحابياً بنجاح! ✅");
      loadHRAndActionsFromCloud();
    } catch (error) {
      console.error("خطأ أثناء حفظ الموظف للشيت:", error);
      alert("حدث خطأ أثناء الحفظ السحابي، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEntry = (id: any) => {
    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
      setPayrollData(payrollData.filter((p: any) => p.id !== id));
    }
  };

  const totalPayroll = payrollData.reduce((sum: number, p: any) => sum + cleanPrice(p.netSalary), 0);

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
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>مسير الرواتب والحوكمة المالية المطور 💰</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>إدارة الرواتب وترحيلها سحابياً إلى مسجل المصروفات</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={loadHRAndActionsFromCloud} style={secondaryBtn} disabled={isSubmitting}><FiRefreshCw style={{ marginLeft: '5px' }} /> مزامنة وتحديث 🔄</button>
          <button onClick={handleExportToExcel} style={{ background: '#0284c7', color: 'white', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <FiDownload style={{ marginLeft: '5px' }} /> تحميل Excel 📊
          </button>
          <button onClick={handleMigratePayrollToExpenses} style={{ background: '#10b981', color: 'white', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} disabled={isSubmitting}>
            <FiDollarSign style={{ marginLeft: '5px' }} /> {isSubmitting ? 'جاري الترحيل...' : 'ترحيل كل الرواتب للمصروفات 📤'}
          </button>
          <button onClick={() => { setEditingEntry({ name: '', username: '', email: '', role: '', salary: 0, projectBonus: 0, netSalary: 0, dueDate: new Date().toISOString().split('T')[0], billingCycle: 'شهري' }); setIsModalOpen(true); }} style={primaryBtn} disabled={isSubmitting}>
            <FiPlus style={{ marginLeft: '5px' }} /> إضافة موظف جديد
          </button>
        </div>
      </div>

      <div style={{ background: '#1e293b', padding: '16px 20px', borderRadius: '12px', marginTop: '20px', border: '1px solid #334155', maxWidth: '320px' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي الرواتب والأرباح والحوافز الشهرية:</span>
        <strong style={{ display: 'block', fontSize: '1.5rem', color: '#34d399', marginTop: '4px' }}>
          {totalPayroll.toLocaleString()} ر.س
        </strong>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8' }}>جاري مزامنة البيانات والحوكمة السحابية...</div>
      ) : (
        <>
          {/* 1. عرض الشاشات الكبيرة واللابتوب (Desktop Table View) */}
          <div className="desktop-table-view" style={{ overflowX: 'auto', marginTop: '20px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                  {['الاسم الكامل', 'المعرف', 'المسمى الوظيفي', 'الراتب الأساسي', 'نسبة الأرباح (%)', 'الحوافز', 'دورية السداد', 'تاريخ الاستحقاق', 'صافي الراتب الإجمالي', 'إجراءات السداد', 'الإدارة'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payrollData.length > 0 ? (
                  payrollData.map((p: any, index: number) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#f8fafc' }}>{p.name}</td>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>@{p.username || '-'}</td>
                      <td style={tdStyle}>{p.role}</td>
                      <td style={tdStyle}>{cleanPrice(p.salary).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 'bold' }}>{p.projectBonus}%</td>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{p.additionsFromGovernance > 0 ? `+${p.additionsFromGovernance.toLocaleString()} ر.س` : '-'}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#334155', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {p.billingCycle || 'شهري'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>{formatDate(p.dueDate)}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#4ade80', fontSize: '1rem' }}>{cleanPrice(p.netSalary).toLocaleString()} ر.س</td>
                      
                      <td style={tdStyle}>
                        <button 
                          onClick={() => handleMigrateSingleEmployee(p)} 
                          style={smallMigrateBtn}
                          disabled={isSubmitting}
                        >
                          ترحيل
                        </button>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => { setEditingEntry(p); setIsModalOpen(true); }} style={actionIconBtn} title="تعديل">✏️</button>
                          <button onClick={() => deleteEntry(p.id)} style={{ ...actionIconBtn, background: '#ef4444', color: 'white' }} title="حذف"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد سجلات رواتب حالياً. أضف موظفاً جديداً للبدء.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 2. عرض الجوال والأجهزة الذكية الصغرى (Mobile Cards View) */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            {payrollData.length > 0 ? (
              payrollData.map((p: any) => (
                <div key={p.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'white' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{p.name}</span>
                    <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>@{p.username || '-'}</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    المسمى الوظيفي: <strong style={{ color: '#fff' }}>{p.role}</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #334155', borderBottom: '1px solid #334155', padding: '8px 0', fontSize: '0.85rem' }}>
                    <div>الأساسي: <strong style={{ color: '#fff' }}>{cleanPrice(p.salary).toLocaleString()} ر.س</strong></div>
                    <div>صافي الراتب: <strong style={{ color: '#4ade80' }}>{cleanPrice(p.netSalary).toLocaleString()} ر.س</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>الدورية: {p.billingCycle || 'شهري'}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>📅 {formatDate(p.dueDate)}</span>
                  </div>

                  {/* أزرار الترحيل والإجراءات */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => handleMigrateSingleEmployee(p)} style={{ ...smallMigrateBtn, flex: 1, padding: '10px', fontSize: '0.85rem', textAlign: 'center' }} disabled={isSubmitting}>
                      📤 ترحيل للمصروفات
                    </button>
                    <button onClick={() => { setEditingEntry(p); setIsModalOpen(true); }} style={{ ...actionIconBtn, padding: '8px 12px', background: '#334155', color: '#38bdf8' }} title="تعديل">
                      ✏️ تعديل
                    </button>
                    <button onClick={() => deleteEntry(p.id)} style={{ ...actionIconBtn, padding: '8px 12px', background: '#ef4444', color: 'white' }} title="حذف">
                      <FiTrash2 />
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                لا توجد سجلات رواتب حالياً. أضف موظفاً جديداً للبدء.
              </div>
            )}
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalStyle}>
            <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: '1.2rem' }}>{editingEntry.employeeId || editingEntry.id ? '✏️ تعديل بيانات الموظف' : '➕ إضافة موظف جديد'}</h2>
            
            <div style={fieldGroup}><label style={labelStyle}>الاسم الكامل *</label><input style={inputStyle} value={editingEntry.name} onChange={e => setEditingEntry({...editingEntry, name: e.target.value})} /></div>
            
            <div style={rowStyle}>
              <div style={fieldGroup}><label style={labelStyle}>معرف الـ CRM *</label><input style={inputStyle} placeholder="مثل: احمد" value={editingEntry.username || ''} onChange={e => setEditingEntry({...editingEntry, username: e.target.value})} /></div>
              <div style={fieldGroup}><label style={labelStyle}>البريد الإلكتروني *</label><input style={inputStyle} placeholder="example@domain.com" value={editingEntry.email || ''} onChange={e => setEditingEntry({...editingEntry, email: e.target.value})} /></div>
            </div>

            <div style={fieldGroup}><label style={labelStyle}>المسمى الوظيفي *</label><input style={inputStyle} value={editingEntry.role} onChange={e => setEditingEntry({...editingEntry, role: e.target.value})} /></div>
            
            <div style={rowStyle}>
              <div style={fieldGroup}><label style={labelStyle}>الراتب الأساسي (ر.س)</label><input type="number" style={inputStyle} value={editingEntry.salary} onChange={e => setEditingEntry({...editingEntry, salary: e.target.value})} /></div>
              <div style={fieldGroup}><label style={labelStyle}>نسبة الأرباح (%)</label><input type="number" style={inputStyle} value={editingEntry.projectBonus} onChange={e => setEditingEntry({...editingEntry, projectBonus: e.target.value})} /></div>
            </div>
            
            <div style={rowStyle}>
              <div style={fieldGroup}>
                <label style={labelStyle}>دورية السداد:</label>
                <select style={inputStyle} value={editingEntry.billingCycle || 'شهري'} onChange={e => setEditingEntry({...editingEntry, billingCycle: e.target.value})}>
                  <option>شهري</option>
                  <option>ربع سنوي</option>
                  <option>نصف سنوي</option>
                  <option>سنوي</option>
                  <option>مرة واحدة</option>
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>تاريخ الاستحقاق:</label>
                <input type="date" style={inputStyle} value={editingEntry.dueDate || ''} onChange={e => setEditingEntry({...editingEntry, dueDate: e.target.value})} />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} style={primaryBtn} disabled={isSubmitting}><FiSave /> {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
              <button onClick={() => setIsModalOpen(false)} style={secondaryBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, color: '#94a3b8', fontSize: '0.9rem' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, fontSize: '0.9rem', color: '#f8fafc', verticalAlign: 'middle' as const };
const actionIconBtn = { border: 'none', background: '#334155', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const smallMigrateBtn = { background: '#059669', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginTop: '5px', boxSizing: 'border-box' as const, color: '#1e293b', outline: 'none' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold' };
const fieldGroup = { display: 'flex', flexDirection: 'column' as const, marginBottom: '15px' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const modalStyle = { background: 'white', color: '#1e293b', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const };
const modalOverlay = { position: 'fixed' as const, top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2000, padding: '16px' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' };
const secondaryBtn = { background: '#64748b', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };