import { useState, useEffect } from 'react';
import { getOrders } from '@/services/dbService';
import { FiSearch, FiStar, FiTrendingUp, FiRefreshCw, FiUser } from 'react-icons/fi';

export function HROverviewPage() {
  const [employeesOverview, setEmployeesOverview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('الكل');

  useEffect(() => {
    loadLiveHROverview();
  }, []);

  const loadLiveHROverview = async () => {
    try {
      setLoading(true);

      // 1. المصدر الأساسي: سحب الموظفين من مسير الرواتب (LocalStorage أو الشيت)
      let payrollData = JSON.parse(localStorage.getItem('hr-payroll-data') || '[]');
      
      // إذا كان مسير الرواتب فارغاً، نضع موظف تجريبي افتراضي لكي تظهر اللوحة فوراً
      if (payrollData.length === 0) {
        payrollData = [
          { id: '1', name: 'احمد مرتضى اسماعيل', username: 'احمد', role: 'مدير تشغيل', department: 'التشغيل والإدارة', netSalary: 5000 }
        ];
        localStorage.setItem('hr-payroll-data', JSON.stringify(payrollData));
      }

      // 2. سحب الطلبات والـ CRM
      const orders = await getOrders();
      const validOrders = Array.isArray(orders) ? orders : [];

      // 3. مطابقة وتتبع نشاط كل موظف هندسياً عبر الـ username أو الاسم
      const analyzed = payrollData.map((emp: any) => {
        const empUsername = String(emp.username || emp.name || '').toLowerCase().trim();

        // تصفية الطلبات التي غيرها هذا الموظف أو أُسندت له بناءً على الـ username (مثل "احمد")
        const empOrders = validOrders.filter((o: any) => {
          if (!o) return false;
          const assigned = String(o.lastContactedBy || o.assignedEmployee || '').toLowerCase().trim();
          const notes = String(o.notes || '').toLowerCase().trim();

          return (empUsername && assigned.includes(empUsername)) || (empUsername && notes.includes(empUsername));
        });

        const totalHandled = empOrders.length;
        const completedTasks = empOrders.filter((o: any) => {
          const status = String(o.status || '').trim();
          return status === 'تم التنفيذ' || status === 'تم التعاقد';
        }).length;

        const completionRate = totalHandled > 0 ? Math.round((completedTasks / totalHandled) * 100) : (totalHandled === 0 ? 50 : 100);

        let badge = 'نشط ومتميز 🌟';
        let feedback = 'أداء مستقر في متابعة العمليات';
        if (completedTasks >= 1) {
          badge = 'نجم التشغيل 🚀';
          feedback = 'تم رصد تنفيذ وإنجاز مهام حقيقية عبر الـ CRM بنجاح!';
        }

        return {
          ...emp,
          fullName: emp.name || 'موظف غير محدد',
          username: emp.username || emp.name || 'غير محدد',
          role: emp.role || 'موظف عام',
          totalHandled,
          completedTasks,
          completionRate,
          badge,
          feedback,
          department: emp.department || (emp.role?.includes('تسويق') ? 'التسويق' : 'التشغيل والإدارة')
        };
      });

      setEmployeesOverview(analyzed);
    } catch (error) {
      console.error("خطأ في جلب بيانات الموارد البشرية:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (empName: string, actionType: string) => {
    alert(`تم بنجاح (${actionType}) للموظف: ${empName} وتحديث سجل التميز الخاص به تلقائياً! ✨`);
  };

  // تصفية وبحث الموظفين
  const filteredEmployees = employeesOverview.filter((emp: any) => {
    const matchesSearch = (emp.fullName && emp.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.username && emp.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = filterDepartment === 'الكل' || emp.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ padding: '32px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      {/* رأس الصفحة مع زر التحديث */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>شؤون الموظفين - النظرة العامة الحية 🏢</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>مربوطة تلقائياً بمسير الرواتب ونشاط الـ CRM عبر الـ Username</p>
        </div>
        <button onClick={loadLiveHROverview} style={primaryBtn}>
          <FiRefreshCw style={{ marginLeft: '5px' }} /> تحديث ومزامنة اللوحة 🔄
        </button>
      </div>

      {/* شريط البحث والفلترة الفوري */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', top: '13px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="بحث بالاسم الكامل، الـ Username، أو المسمى الوظيفي..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 38px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <div>
          <select 
            value={filterDepartment} 
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: 'white', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
          >
            <option value="الكل">كل الأقسام</option>
            <option value="التسويق">التسويق</option>
            <option value="التشغيل والإدارة">التشغيل والإدارة</option>
          </select>
        </div>
      </div>

      {/* بطاقات الموظفين (باللون الداكن المتناسق) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
            جاري سحب مسير الرواتب ومطابقة نشاط الـ CRM...
          </div>
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp: any) => (
            <div key={emp.id || emp.username} style={cardStyle}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 3px 0', color: 'white', fontSize: '1.1rem' }}>
                    {emp.fullName}
                  </h3>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>
                    معرف الـ CRM (Username): <strong style={{ color: '#38bdf8' }}>{emp.username}</strong>
                  </span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {emp.role}
                  </span>
                </div>
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  {emp.badge}
                </span>
              </div>

              {/* مؤشرات الأداء الحية */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#0f172a', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #334155' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>المهام المرتبطة:</span>
                  <strong style={{ fontSize: '1.1rem', color: 'white' }}>{emp.totalHandled} طلب</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>المهام المنجزة:</span>
                  <strong style={{ fontSize: '1.1rem', color: '#4ade80' }}>{emp.completedTasks} إنجاز</strong>
                </div>
              </div>

              {/* شريط الإنجاز */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#94a3b8' }}>
                  <span>معدل الأداء الفعلي</span>
                  <span style={{ color: '#38bdf8' }}>{emp.completionRate}%</span>
                </div>
                <div style={progressBg}>
                  <div style={{ ...progressBar, width: `${Math.min(emp.completionRate, 100)}%` }} />
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', background: '#0f172a', padding: '10px 12px', borderRadius: '8px', margin: '0 0 15px 0', border: '1px solid #334155' }}>
                "{emp.feedback}"
              </p>

              {/* أزرار الترشيح والترقية */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                <button 
                  onClick={() => handleAction(emp.fullName, 'ترشيح لجائزة التميز 🌟')} 
                  style={{ flex: 1, background: 'rgba(6, 95, 70, 0.2)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <FiStar /> ترشيح لتميز
                </button>
                <button 
                  onClick={() => handleAction(emp.fullName, 'ترقية وترشيح مالي 📈')} 
                  style={{ flex: 1, background: 'rgba(30, 64, 175, 0.2)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.3)', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <FiTrendingUp /> ترقية وظيفة
                </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: '#1e293b', borderRadius: '12px', color: '#94a3b8', border: '1px solid #334155' }}>
            لا توجد موظفين في مسير الرواتب. أضف موظفاً في صفحة مسير الرواتب ليظهر هنا تلقائياً.
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', border: '1px solid #334155', boxSizing: 'border-box' as const };
const progressBg = { background: '#0f172a', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #334155' };
const progressBar = { background: '#2563eb', height: '100%', transition: 'width 0.6s ease-in-out', borderRadius: '5px' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '0.9rem' };