import { useState, useEffect } from 'react';
import { getOrders, getHRPayrollSheet, getHRActionLogs, nominateEmployeeForExcellence, addHREntryToSheet } from '@/services/dbService';
import { FiSearch, FiRefreshCw, FiStar, FiEdit2, FiSave } from 'react-icons/fi';

export default function HRPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');

  // حالات نافذة التعديل المنبثقة (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLiveHRData();
  }, []);

  const loadLiveHRData = async () => {
    try {
      setLoading(true);

      const [sheetData, orders] = await Promise.all([
        getHRPayrollSheet(),
        getOrders().catch(() => [])
      ]);

      let payrollEmployees = Array.isArray(sheetData) && sheetData.length > 0 ? sheetData : [];
      if (payrollEmployees.length === 0) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      const validOrders = Array.isArray(orders) ? orders : [];

      const analyzedEmployees = payrollEmployees.map((emp: any, index: number) => {
        const empEmail = String(emp.email || emp.employeeEmail || '').toLowerCase().trim();
        const empUsername = String(emp.username || emp.name?.split(' ')[0] || '').toLowerCase().trim();

        // 1. تصفية طلبات الـ CRM الخاصة حصراً بهذا الموظف بالمطابقة الصارمة
        const empOrders = validOrders.filter((o: any) => {
          if (!o) return false;
          const assigned = String(o.lastContactedBy || o.assignedEmployee || '').toLowerCase().trim();
          const orderEmail = String(o.email || o.clientEmail || '').toLowerCase().trim();

          const matchEmail = empEmail && orderEmail === empEmail;
          const matchUsername = empUsername && (assigned === empUsername || assigned === `@${empUsername}`);

          return matchEmail || matchUsername;
        });

        // 2. الحالة تُؤخذ مباشرة وحصراً من عمود الـ status المحدث في شيت HR_Payroll
        let currentStatus = emp.status && emp.status.trim() !== '' ? emp.status : 'نشط ومتواجد بالخدمة';

        // صفقات الموظف المنجزة والمالية
        const closedOrders = empOrders.filter((o: any) => {
          const status = String(o.status || '').trim();
          return ['تم التنفيذ', 'تم التعاقد', 'مكتمل', 'منجز'].includes(status);
        });

        const dealsClosed = closedOrders.length;

        const financialAchieved = closedOrders.reduce((sum: number, o: any) => {
          const val = o.price || o.amount || o.value || 0;
          const clean = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
          return sum + clean;
        }, 0);

        // نسبة النشاط التشغيلي بناءً على عدد طلباته الفعلية
        const activityPercentage = empOrders.length > 0 ? Math.min(Math.round((empOrders.length / 10) * 100), 100) : 0;

        return {
          id: String(emp.employeeId || emp.id || index),
          name: emp.name || 'موظف',
          username: emp.username || emp.name?.split(' ')[0] || 'user', 
          email: emp.email || emp.employeeEmail || '',
          role: emp.position || emp.role || 'موظف عام',
          phone: emp.phone || '0500000000',
          salary: emp.salary || 0,
          projectBonus: emp.projectBonus || 0,
          netSalary: emp.netSalary || 0,
          billingCycle: emp.billingCycle || 'شهري',
          dueDate: emp.dueDate || '',
          status: currentStatus, 
          initial: emp.name ? emp.name[0] : 'م',
          color: '#3b82f6',
          kpi: {
            financialTarget: Number(emp.financialTarget) || 100000,
            financialAchieved: financialAchieved, 
            activityPercentage: activityPercentage, 
            dealsClosed: dealsClosed, 
            rating: dealsClosed > 0 ? 5.0 : 4.0
          }
        };
      });

      setEmployees(analyzedEmployees);
    } catch (error) {
      console.error("خطأ في جلب بيانات HR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNominateExcellence = async (emp: any) => {
    if (!confirm(`هل أنت متأكد من ترشيح الموظف (${emp.name}) لجائزة التميز؟`)) return;

    try {
      await nominateEmployeeForExcellence({
        employeeId: emp.id,
        name: emp.name,
        username: emp.username
      });
      alert(`تم بنجاح ترشيح الموظف: ${emp.name} لجائزة التميز سحابياً! 🌟🏆`);
    } catch (error) {
      console.error("خطأ في الترشيح:", error);
      alert("حدث خطأ أثناء إرسال الترشيح.");
    }
  };

  // فتح نافذة التعديل وتعبئة البيانات الحالية للموظف
  const handleOpenEditModal = (emp: any) => {
    setEditingEmployee({ ...emp });
    setIsModalOpen(true);
  };

  // حفظ التعديلات سحابياً في قوقل شيت
  const handleSaveEmployeeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name) {
      alert("الرجاء إدخال اسم الموظف على الأقل.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: editingEmployee.id,
        id: editingEmployee.id,
        name: editingEmployee.name,
        role: editingEmployee.role,
        position: editingEmployee.role,
        salary: editingEmployee.salary || 0,
        projectBonus: editingEmployee.projectBonus || 0,
        netSalary: editingEmployee.netSalary || 0,
        billingCycle: editingEmployee.billingCycle || 'شهري',
        dueDate: editingEmployee.dueDate || '',
        email: editingEmployee.email,
        username: editingEmployee.username,
        status: editingEmployee.status
      };

      await addHREntryToSheet(payload);
      setIsModalOpen(false);
      setEditingEmployee(null);
      alert("تم تحديث بيانات الموظف وحفظها في قوقل شيت بنجاح! 🚀✅");
      await loadLiveHRData();
    } catch (error) {
      console.error("خطأ أثناء تحديث بيانات الموظف سحابياً:", error);
      alert("حدث خطأ أثناء التحديث السحابي.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const matchesFilter = filter === 'الكل' || e.status.includes(filter);
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '32px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>لوحة إدارة شؤون الموظفين والكفاءات</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>مؤشرات أداء مرتبطة حصراً بطلبات الـ CRM وحالة الحوكمة الإدارية</p>
        </div>
        <button onClick={loadLiveHRData} style={primaryBtn}>
          <FiRefreshCw style={{ marginLeft: '5px' }} /> تحديث ومزامنة 🔄
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', top: '13px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الـ Username، أو الإيميل..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 38px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '25px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#94a3b8' }}>جاري التحميل...</div>
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <div key={emp.id} style={cardStyle}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.75rem', background: emp.status.includes('إجازة') ? 'rgba(245, 158, 11, 0.15)' : emp.status.includes('منتهي') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 95, 70, 0.2)', color: emp.status.includes('إجازة') ? '#fbbf24' : emp.status.includes('منتهي') ? '#f87171' : '#4ade80', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                  {emp.status}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', background: 'rgba(56, 189, 248, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>@{emp.username}</span>
                  <button onClick={() => handleOpenEditModal(emp)} style={iconEditBtn} title="تعديل بيانات الموظف"><FiEdit2 /></button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{...circleStyle, background: emp.color}}>{emp.initial}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 'bold' }}>{emp.name}</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{emp.role} • <strong style={{ color: '#38bdf8' }}>@{emp.username}</strong></p>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '15px', background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <p style={{ margin: '3px 0' }}>📧 {emp.email || 'بدون إيميل مسجل'}</p>
                <p style={{ margin: '3px 0' }}>👤 Username في النظام: <strong style={{ color: '#38bdf8' }}>{emp.username}</strong></p>
              </div>

              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>⭐ مؤشرات الأداء الحية</p>
                
                <p style={{fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 4px 0'}}>نسبة النشاط التشغيلي: <strong style={{ color: '#38bdf8' }}>{emp.kpi.activityPercentage}%</strong></p>
                <div style={progressBg}><div style={{...progressBar, width: `${emp.kpi.activityPercentage}%`}} /></div>
                
                <p style={{fontSize: '0.8rem', color: '#94a3b8', margin: '12px 0 4px 0'}}>المستهدف المالي المحقق: <strong style={{ color: '#4ade80' }}>{emp.kpi.financialAchieved.toLocaleString()} / {emp.kpi.financialTarget.toLocaleString()} ر.س</strong></p>
                <div style={{...progressBg, background: '#0f172a'}}><div style={{...progressBar, width: `${Math.min((emp.kpi.financialAchieved / (emp.kpi.financialTarget || 1)) * 100, 100)}%`, background: '#10b981'}} /></div>
              </div>

              <div style={{ marginTop: '15px', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', textAlign: 'center', borderRadius: '10px', fontSize: '0.85rem', color: '#60a5fa', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                🚀 {emp.kpi.dealsClosed} صفقات ومهام منجزة | 💰 {emp.kpi.financialAchieved.toLocaleString()} ر.س محققة
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '15px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                <button 
                  onClick={() => handleNominateExcellence(emp)} 
                  style={{ width: '100%', background: 'rgba(6, 95, 70, 0.2)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FiStar /> ترشيح للتميز
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: '#1e293b', borderRadius: '12px', color: '#94a3b8', border: '1px solid #334155' }}>لا توجد موظفين.</div>
        )}
      </div>

      {/* نافذة تعديل بيانات الموظف المنبثقة (Modal) */}
      {isModalOpen && editingEmployee && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveEmployeeUpdate} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>✏️ تعديل بيانات الموظف سحابياً</h3>
            
            <label style={labelStyle}>الاسم الكامل:</label>
            <input style={inputStyle} value={editingEmployee.name} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} required />

            <label style={labelStyle}>معرف الـ CRM (Username):</label>
            <input style={inputStyle} value={editingEmployee.username} onChange={e => setEditingEmployee({...editingEmployee, username: e.target.value})} required />

            <label style={labelStyle}>البريد الإلكتروني:</label>
            <input type="email" style={inputStyle} value={editingEmployee.email} onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} />

            <label style={labelStyle}>المسمى الوظيفي:</label>
            <input style={inputStyle} value={editingEmployee.role} onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})} required />

            <label style={labelStyle}>حالة الدوام / العمل:</label>
            <select style={inputStyle} value={editingEmployee.status} onChange={e => setEditingEmployee({...editingEmployee, status: e.target.value})}>
              <option value="نشط ومتواجد بالخدمة">🟢 نشط ومتواجد بالخدمة</option>
              <option value="في إجازة 🌴">🌴 في إجازة</option>
              <option value="إجازة مرضية 🏥">🏥 إجازة مرضية</option>
              <option value="منتهي الخدمة 📄">📄 منتهي الخدمة / استقالة</option>
            </select>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>
                <FiSave /> {isSubmitting ? 'جاري الحفظ والتحديث...' : 'حفظ التعديلات سحابياً ✅'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>
                إلغاء ❌
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

const cardStyle = { background: '#1e293b', padding: '20px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', border: '1px solid #334155', boxSizing: 'border-box' as const };
const circleStyle = { width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' };
const progressBg = { background: '#0f172a', height: '10px', borderRadius: '5px', marginBottom: '10px', overflow: 'hidden', border: '1px solid #334155' };
const progressBar = { background: '#3b82f6', height: '100%', borderRadius: '5px', transition: 'width 0.5s ease-in-out' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '0.9rem', gap: '6px' };
const cancelBtn = { background: '#64748b', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const iconEditBtn = { background: '#2563eb', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#1e293b' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '14px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px', boxSizing: 'border-box' as const };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const, boxSizing: 'border-box' as const };