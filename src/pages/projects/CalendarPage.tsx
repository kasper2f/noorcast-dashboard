import { useState, useEffect } from 'react';
import { getProjects, getTasks } from '@/services/dbService';
import { FiCalendar, FiFolder, FiCheckSquare, FiRefreshCw, FiLoader, FiSearch, FiFilter } from 'react-icons/fi';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات البحث والفلترة الذكية
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'project' | 'task'

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // سحب المشاريع والمهام من السحابة في نفس اللحظة
      const [projectsData, tasksData] = await Promise.all([
        getProjects().catch(() => []),
        getTasks().catch(() => [])
      ]);

      const calendarEvents: any[] = [];

      // 1. تحويل المشاريع إلى أحداث تقويمية (تعتمد على تاريخ البدء startDate)
      if (Array.isArray(projectsData)) {
        projectsData.forEach((p: any) => {
          if (p.startDate) {
            calendarEvents.push({
              id: `proj-${p.id}`,
              title: `مشروع: ${p.name}`,
              date: p.startDate.split('T')[0].split(' ')[0],
              type: 'project',
              status: p.status,
              client: p.clientName || 'عميل نوركاست',
              badgeColor: '#3b82f6' // أزرق للمشاريع
            });
          }
        });
      }

      // 2. تحويل المهام إلى أحداث تقويمية (تعتمد على تاريخ الديدلاين deadline)
      if (Array.isArray(tasksData)) {
        tasksData.forEach((t: any) => {
          if (t.deadline) {
            calendarEvents.push({
              id: `task-${t.id}`,
              title: `مهمة (${t.department || 'عام'}): ${t.title}`,
              date: t.deadline.split('T')[0].split(' ')[0],
              type: 'task',
              status: t.status,
              assignedTo: t.assignedTo || 'غير مسند',
              badgeColor: t.status === 'مكتمل' ? '#10b981' : '#f59e0b' // أخضر للمكتمل، أصفر للقيد
            });
          }
        });
      }

      // ترتيب الأحداث تصاعدياً حسب التاريخ الأقرب
      calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  // تصفية الأحداث بناءً على البحث ونوع الفلتر
  const filteredEvents = events.filter(ev => {
    const matchesFilter = filterType === 'ALL' ? true : ev.type === filterType;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      ev.title.toLowerCase().includes(query) || 
      (ev.client && ev.client.toLowerCase().includes(query)) || 
      (ev.assignedTo && ev.assignedTo.toLowerCase().includes(query)) ||
      ev.date.includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      {/* رأس الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={iconHeaderBox}><FiCalendar style={{ color: '#3b82f6', fontSize: '1.5rem' }} /></span>
            التقويم
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            سحب تلقائي ومباشر لتواريخ بدء المشاريع ومواعيد إنجاز المهام (Deadlines) من السحابة
          </p>
        </div>

        <button onClick={fetchCalendarData} style={secondaryBtn} disabled={loading}>
          {loading ? <FiLoader className="spin" /> : <FiRefreshCw />} مزامنة الأحداث سحابياً
        </button>
      </div>

      {/* شريط البحث وقائمة الفلترة الذكية */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {/* شريط البحث */}
        <div style={{ flex: 1, minWidth: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiSearch style={{ position: 'absolute', right: '14px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="ابحث باسم المشروع، المهمة، العميل، أو المكلف..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 40px',
              borderRadius: '12px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* قائمة الفلترة الذكية */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '6px 12px', borderRadius: '12px', border: '1px solid #334155' }}>
          <FiFilter style={{ color: '#3b82f6' }} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              outline: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <option value="ALL" style={{ background: '#1e293b' }}>عرض كل الأحداث ({events.length})</option>
            <option value="project" style={{ background: '#1e293b' }}>المشاريع التشغيلية فقط 📁</option>
            <option value="task" style={{ background: '#1e293b' }}>المهام الميدانية فقط 📋</option>
          </select>
        </div>
      </div>

      {/* عرض الأحداث المسحوبة في شبكة متجاوبة بالكامل */}
      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📌 الأحداث التشغيلية المجدولة ({filteredEvents.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>جاري سحب المواعيد من المشاريع والمهام... 🔄</div>
        ) : filteredEvents.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredEvents.map((ev, idx) => (
              <div key={idx} style={{ background: '#1a2638', border: '1px solid #334155', borderRadius: '12px', padding: '16px', borderRight: `5px solid ${ev.badgeColor}`, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: ev.type === 'project' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: ev.type === 'project' ? '#60a5fa' : '#fbbf24', fontWeight: 'bold' }}>
                    {ev.type === 'project' ? '📁 مشروع تشغيلي' : '📋 مهمة ميدانية'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 'bold' }}>
                    📅 {ev.date}
                  </span>
                </div>

                <h4 style={{ color: 'white', margin: '8px 0', fontSize: '1rem', fontWeight: 'bold', wordBreak: 'break-word' }}>{ev.title}</h4>
                
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  {ev.type === 'project' ? (
                    <>
                      <span>🏢 العميل: <strong style={{ color: '#f8fafc' }}>{ev.client}</strong></span>
                      <span>⚙️ الحالة: <strong style={{ color: '#38bdf8' }}>{ev.status}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>👤 المكلف: <strong style={{ color: '#f8fafc' }}>{ev.assignedTo}</strong></span>
                      <span>📌 حالة المهمة: <strong style={{ color: ev.status === 'مكتمل' ? '#10b981' : '#f59e0b' }}>{ev.status}</strong></span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
            لا توجد أحداث مطابقة لبحثك أو فلترتك الحالية.
          </div>
        )}
      </div>

    </div>
  );
}

const iconHeaderBox = { background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const secondaryBtn = { padding: '10px 18px', background: '#334155', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };