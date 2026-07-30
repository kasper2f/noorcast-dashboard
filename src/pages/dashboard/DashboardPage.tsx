import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getOrders, getHRPayrollSheet, getTasks } from '@/services/dbService';
import { FiUsers, FiCheckCircle, FiClock, FiStar, FiActivity, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';

export function DashboardPage() {
  const [stats, setStats] = useState<any>({ leads: 0, activeClients: 0, totalOrders: 0, completedTasks: 0, pendingTasks: 0 });
  const [taskData, setTaskData] = useState<any[]>([]);
  const [starEmployee, setStarEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperationalData();
  }, []);

  const fetchOperationalData = async () => {
    setLoading(true);
    try {
      const [orders, hrData, tasksData] = await Promise.all([
        getOrders().catch(() => []),
        getHRPayrollSheet().catch(() => []),
        getTasks().catch(() => [])
      ]);

      const localClients = JSON.parse(localStorage.getItem('crm_clients') || '[]');
      const combinedClients = [...(Array.isArray(orders) ? orders : []), ...localClients];

      const isCompletedStatus = (status: string) => {
        if (!status) return false;
        const s = status.trim().toLowerCase();
        return s.includes('تم التنفيذ') || s.includes('مكتمل') || s.includes('تعاقد') || s.includes('completed') || s.includes('مدفوع');
      };

      const completedOrdersCount = combinedClients.filter((c: any) => isCompletedStatus(c.status)).length;
      const pendingOrdersCount = combinedClients.filter((c: any) => !isCompletedStatus(c.status)).length;

      const tasksList = Array.isArray(tasksData) ? tasksData : [];
      const completedTasksCount = tasksList.filter((t: any) => {
        const s = String(t.status || '').trim().toLowerCase();
        return s.includes('مكتمل') || s.includes('منجزة') || s.includes('completed') || s.includes('تم');
      }).length;

      const pendingTasksCount = tasksList.length - completedTasksCount;

      const finalCompletedTasks = tasksList.length > 0 ? completedTasksCount : completedOrdersCount;
      const finalPendingTasks = tasksList.length > 0 ? pendingTasksCount : pendingOrdersCount;

      setStats({
        leads: pendingOrdersCount,
        activeClients: completedOrdersCount,
        totalOrders: combinedClients.length,
        completedTasks: finalCompletedTasks, 
        pendingTasks: finalPendingTasks     
      });

      setTaskData([
        { name: 'منجزة', value: finalCompletedTasks },
        { name: 'قيد الإنجاز / معلقة', value: finalPendingTasks }
      ]);

      let selectedStar = null;
      if (Array.isArray(hrData) && hrData.length > 0) {
        selectedStar = hrData.find((emp: any) => {
          const nameStr = String(emp.name || '').toLowerCase();
          const statusStr = String(emp.status || '').toLowerCase();
          return nameStr.includes('أحمد مرتضى') || statusStr.includes('متميز') || statusStr.includes('نجم');
        });
      }

      if (!selectedStar) {
        selectedStar = {
          name: 'احمد مرتضى اسماعيل',
          position: 'احمد • مدير العمليات',
          status: 'نجم الأداء المتميز ⭐'
        };
      } else {
        selectedStar = {
          ...selectedStar,
          name: selectedStar.name || 'احمد مرتضى اسماعيل',
          position: selectedStar.position || 'احمد • مدير العمليات',
          status: 'نجم الأداء المتميز ⭐'
        };
      }

      setStarEmployee(selectedStar);
    } catch (error) {
      console.error("Error loading operational dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* حقن أنماط الموشن والحركة الديناميكية الناعمة */}
      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-hover-effect {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .card-hover-effect:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px -10px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      {/* رأس الصفحة الرئيسي مع موشن ظهور */}
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={iconHeaderBox}><FiActivity style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            الرئيسية والعمليات التشغيلية 🚀
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            نظرة حية وشاملة على مؤشرات الأداء (KPIs)، الطلبات، وحالة فرق العمل
          </p>
        </div>
        <button 
          onClick={fetchOperationalData} 
          style={refreshBtn}
        >
          {loading ? 'جاري التحديث...' : <><FiRefreshCw /> تحديث المؤشرات 🔄</>}
        </button>
      </div>

      {/* بطاقات المؤشرات التشغيلية الحية (KPIs) مع موشن وتأثير تفاعلي */}
      <div className="animate-fade-in" style={{ ...gridStyle, animationDelay: '0.1s' }}>
        <div className="card-hover-effect">
          <StatCard title="إجمالي الطلبات والعملاء" value={stats.totalOrders} icon={<FiUsers />} color="#3b82f6" />
        </div>
        <div className="card-hover-effect">
          <StatCard title="العملاء الفعليون (المنجزون)" value={stats.activeClients} icon={<FiCheckCircle />} color="#10b981" />
        </div>
        <div className="card-hover-effect">
          <StatCard title="المهام المعلقة (التشغيل)" value={stats.pendingTasks} icon={<FiClock />} color="#f59e0b" />
        </div>
        <div className="card-hover-effect">
          <StatCard title="المهام المنجزة (التشغيل)" value={stats.completedTasks} icon={<FiTrendingUp />} color="#ec4899" />
        </div>
      </div>

      {/* قسم المخططات التشغيلية وركن التميز مع موشن متسلسل */}
      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '30px', animationDelay: '0.2s' }}>
        
        {/* مخطط توزيع المهام */}
        <div style={chartContainerStyle} className="card-hover-effect">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981' }}>📊</span> مؤشر إنجاز المهام التشغيلية
          </h3>
          <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskData} dataKey="value" outerRadius={75} innerRadius={45} label>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <span>🟢 منجزة ({stats.completedTasks})</span>
            <span>🟠 قيد الإنجاز / معلقة ({stats.pendingTasks})</span>
          </div>
        </div>

        {/* الموظف المميز أسبوعياً (أحمد مرتضى) */}
        <div style={chartContainerStyle} className="card-hover-effect">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiStar style={{ color: '#f59e0b' }} /> الموظف المميز أسبوعياً ⭐
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', minHeight: '180px' }}>
            {starEmployee ? (
              <div style={{ background: '#0f172a', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f59e0b44' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={empAvatar}>{starEmployee.name ? starEmployee.name[0] : 'أ'}</div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: 'white' }}>{starEmployee.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{starEmployee.position || 'احمد • مدير العمليات'}</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
                  ⭐ {starEmployee.status || 'نجم الأداء المتميز'}
                </span>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.85rem' }}>جاري استعراض الموظف المميز...</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) {
  return (
    <div style={{...cardStyle, borderLeft: `4px solid ${color}`}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ color: '#94a3b8', margin: '0 0 8px 0', fontSize: '0.85rem' }}>{title}</h4>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'white' }}>{value}</div>
        </div>
        <div style={{ background: `${color}20`, color: color, padding: '10px', borderRadius: '10px', display: 'flex', fontSize: '1.2rem' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const iconHeaderBox = { background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' };
const cardStyle = { background: '#1e293b', padding: '22px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' };
const chartContainerStyle = { background: '#1e293b', padding: '24px', borderRadius: '20px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' };
const empAvatar = { width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' };
const refreshBtn = { background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };