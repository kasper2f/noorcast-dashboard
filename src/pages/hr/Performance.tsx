import { useState, useEffect } from 'react';
import { getOrders, getHRPayrollSheet, getAuditLogs, nominateEmployeeForExcellence } from '@/services/dbService';
import { FiRefreshCw, FiStar, FiAward, FiCheckCircle, FiTrendingUp, FiUsers, FiActivity, FiSearch, FiZap } from 'react-icons/fi';

export default function Performance() {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('الكل');

  useEffect(() => {
    calculatePerformanceMetrics();
  }, []);

  const calculatePerformanceMetrics = async () => {
    try {
      setLoading(true);

      const sheetData = await getHRPayrollSheet();
      let employeesList = Array.isArray(sheetData) && sheetData.length > 0 ? sheetData : [];
      setTotalActiveEmployees(employeesList.length);

      if (employeesList.length === 0) {
        setPerformanceData([]);
        setLoading(false);
        return;
      }

      const [orders, auditLogs] = await Promise.all([
        getOrders(),
        getAuditLogs().catch(() => [])
      ]);

      const validOrders = Array.isArray(orders) ? orders : [];
      const validLogs = Array.isArray(auditLogs) ? auditLogs : [];

      const evaluated = employeesList.map((emp: any, index: number) => {
        const empName = String(emp.name || '').toLowerCase().trim();
        const empRole = String(emp.position || emp.role || '').toLowerCase().trim();
        const empEmail = String(emp.email || emp.employeeEmail || '').toLowerCase().trim();
        const empUsername = String(emp.username || emp.name?.split(' ')[0] || '').toLowerCase().trim();
        const firstName = empName.split(' ')[0];

        let empOrders: any[] = [];
        let empLogs: any[] = [];
        let financialVolume = 0;

        if (empRole.includes('مالي') || empRole.includes('محاسب') || empName.includes('محمد')) {
          empOrders = [];
          empLogs = validLogs.filter((log: any) => log && (String(log.username || '').toLowerCase().includes(empUsername) || String(log.email || '').toLowerCase().includes(empEmail)));
          financialVolume = 0; 
        } else {
          empOrders = validOrders.filter((o: any) => {
            if (!o) return false;
            const assigned = String(o.lastContactedBy || o.assignedEmployee || o.freelancerName || '').toLowerCase().trim();
            const orderEmail = String(o.email || o.clientEmail || '').toLowerCase().trim();

            const matchEmail = empEmail && orderEmail === empEmail;
            const matchUsername = empUsername && (assigned === empUsername || assigned.includes(empUsername));
            const matchFullName = empName && (assigned === empName || assigned.includes(empName));

            return matchEmail || matchUsername || matchFullName;
          });

          empLogs = validLogs.filter((log: any) => {
            if (!log) return false;
            const logUser = String(log.username || '').toLowerCase().trim();
            const logEmail = String(log.email || '').toLowerCase().trim();

            return (empUsername && logUser === empUsername) || 
                   (empEmail && logEmail === empEmail) ||
                   (firstName && logUser.includes(firstName));
          });

          financialVolume = empOrders
            .filter((o: any) => {
              const status = String(o.status || '').trim();
              return ['تم التنفيذ', 'تم التعاقد', 'مكتمل', 'منجز'].includes(status);
            })
            .reduce((sum: number, o: any) => {
              const val = o.price || o.amount || o.value || 0;
              const clean = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
              return sum + clean;
            }, 0);
        }

        const dealsClosedFromOrders = empOrders.filter((o: any) => {
          const status = String(o.status || '').trim();
          return status === 'تم التنفيذ' || status === 'تم التعاقد' || status === 'مكتمل' || status === 'منجز';
        }).length;

        const completedProjects = Math.max(dealsClosedFromOrders, empLogs.length);
        const totalProjects = Math.max(empOrders.length, empLogs.length);
        const activityCount = empLogs.length;

        const target = Number(emp.financialTarget) || 50000;
        const percentage = target > 0 ? (financialVolume / target) * 100 : (completedProjects > 0 ? 100 : 0);

        let badge = 'نشط ومستمر 🚀';
        let badgeColor = '#3b82f6';
        if (completedProjects >= 3) {
          badge = 'نجم الأداء المتميز 🌟';
          badgeColor = '#10b981';
        } else if (completedProjects >= 1) {
          badge = 'إنجاز تصاعدي 📈';
          badgeColor = '#f59e0b';
        }

        return {
          id: String(emp.employeeId || emp.id || index),
          name: emp.name || 'موظف',
          username: emp.username || emp.name?.split(' ')[0] || 'user',
          role: emp.position || emp.role || 'موظف عام',
          department: emp.department || 'التشغيل والـ CRM',
          totalProjects,
          completedProjects,
          activityCount,
          financialVolume,
          percentage: Math.min(percentage, 100),
          badge,
          badgeColor
        };
      });

      setPerformanceData(evaluated);
    } catch (error) {
      console.error("خطأ في حساب المؤشرات:", error);
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

  const mostActiveEmployee = performanceData.length > 0 
    ? [...performanceData].sort((a, b) => b.activityCount - a.activityCount)[0] 
    : null;

  const filteredData = performanceData.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'الكل') return matchesSearch;
    if (filterType === 'المتميزون') return matchesSearch && p.completedProjects >= 3;
    if (filterType === 'النشطون') return matchesSearch && p.activityCount > 0;
    return matchesSearch;
  });

  const totalTeamProjects = performanceData.reduce((acc, curr) => acc + curr.completedProjects, 0);
  const totalFinancialGrowth = performanceData.reduce((acc, curr) => acc + curr.financialVolume, 0);

  return (
    <div style={{ padding: '32px', background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* تنسيقات متجاوبة للشاشات الضيقة */}
      <style>{`
        @media (max-width: 600px) {
          .perf-stats-grid {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⭐</span> لوحة قياس الأداء والتميز الحي (KPIs)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            مؤشرات أداء حية ومبالغ مالية محسوبة بدقة تامة من الطلبات المنجزة
          </p>
        </div>
        <button onClick={calculatePerformanceMetrics} style={primaryBtn}>
          <FiRefreshCw style={{ marginLeft: '8px' }} /> 
          {loading ? 'جاري المزامنة...' : 'تحديث وفحص فوري 🔄'}
        </button>
      </div>

      {/* قسم مميز: العضو الأكثر نشاطاً وحركة في الموقع (شعلة النظام) */}
      {!loading && mostActiveEmployee && mostActiveEmployee.activityCount > 0 && (
        <div style={topMoverCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={flameIconStyle}>
              <FiZap style={{ fontSize: '1.8rem', color: '#fbbf24' }} />
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                🔥 الأنشطة الأكثر تفاعلاً وحركة بالنظام
              </span>
              <h2 style={{ margin: '5px 0 2px 0', fontSize: '1.2rem', color: 'white', wordBreak: 'break-word' }}>
                {mostActiveEmployee.name} <span style={{ color: '#38bdf8', fontSize: '0.9rem' }}>(@{mostActiveEmployee.username})</span>
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                متصدر النشاط السحابي بـ <strong style={{ color: '#34d399' }}>{mostActiveEmployee.activityCount} حركة تفاعلية وتحديث</strong> مسجلة في النظام!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="perf-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي الموظفين النشطين</span>
            <FiUsers style={{ color: '#3b82f6', fontSize: '1.4rem' }} />
          </div>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '1.8rem', color: 'white' }}>{totalActiveEmployees} موظف</h2>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>مجموع المهام والصفقات المنجزة</span>
            <FiCheckCircle style={{ color: '#10b981', fontSize: '1.4rem' }} />
          </div>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '1.8rem', color: '#34d399' }}>{totalTeamProjects} مهمة</h2>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>إجمالي الحجم المالي المحقق</span>
            <FiTrendingUp style={{ color: '#f59e0b', fontSize: '1.4rem' }} />
          </div>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '1.8rem', color: '#fbbf24', wordBreak: 'break-word' }}>{totalFinancialGrowth.toLocaleString()} ر.س</h2>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <FiSearch style={{ position: 'absolute', right: '12px', top: '13px', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الـ Username، أو الدور..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 35px 10px 15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['الكل', 'المتميزون', 'النشطون'].map((type) => (
            <button 
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                background: filterType === type ? '#2563eb' : '#0f172a',
                color: filterType === type ? 'white' : '#94a3b8',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* شبكة الكروت */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#1e293b', borderRadius: '16px' }}>
            <FiActivity style={{ fontSize: '2.5rem', marginBottom: '10px' }} />
            <p>جاري فحص وتدقيق الأداء والمبالغ المكتسبة...</p>
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((p: any) => (
            <div key={p.id} style={liveCardStyle}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 'bold', wordBreak: 'break-word' }}>
                    {p.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px' }}>
                    @{p.username} • {p.role}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', background: p.badgeColor, color: 'white', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {p.badge}
                </span>
              </div>

              <div style={{ margin: '20px 0 10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>نسبة تحقيق المستهدف المالي</span>
                  <strong style={{ color: '#34d399' }}>{p.percentage.toFixed(0)}%</strong>
                </div>
                <div style={progressBg}>
                  <div style={{ ...progressBar, width: `${Math.min(p.percentage, 100)}%`, background: p.percentage > 50 ? '#10b981' : '#3b82f6' }} />
                </div>
              </div>

              <div style={miniStatsGrid}>
                <div style={miniStatBox}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>المهام المنجزة</span>
                  <strong style={{ fontSize: '1.1rem', color: 'white' }}>{p.completedProjects} منجز</strong>
                </div>
                <div style={miniStatBox}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>القيمة المحققة</span>
                  <strong style={{ fontSize: '1.1rem', color: '#34d399', wordBreak: 'break-word' }}>{p.financialVolume.toLocaleString()} ر.س</strong>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => handleNominateExcellence(p)} style={excellenceBtn}>
                  <FiStar style={{ fontSize: '1rem' }} /> ترشيح للتميز الأسبوعي 🌟
                </button>
              </div>

            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: '#1e293b', borderRadius: '16px', color: '#94a3b8', border: '1px solid #334155' }}>
            <FiAward style={{ fontSize: '3rem', marginBottom: '10px', color: '#f59e0b' }} />
            <p>لا توجد نتائج مطابقة لبحثك.</p>
          </div>
        )}
      </div>

    </div>
  );
}

const statCardStyle = { background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', boxSizing: 'border-box' as const };
const topMoverCardStyle = { background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #f59e0b', padding: '20px', borderRadius: '16px', marginBottom: '25px', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.2)', boxSizing: 'border-box' as const };
const flameIconStyle = { background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const liveCardStyle = { background: '#1e293b', border: '1px solid #334155', padding: '22px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', boxSizing: 'border-box' as const };
const progressBg = { background: '#0f172a', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #334155' };
const progressBar = { height: '100%', transition: 'width 0.6s ease-in-out', borderRadius: '5px' };
const miniStatsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px', background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' };
const miniStatBox = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' };
const excellenceBtn = { width: '100%', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' };