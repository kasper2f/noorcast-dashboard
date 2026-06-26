import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { arSA } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useEffect } from 'react';

const locales = { 'ar-SA': arSA };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks-list') || '[]');
    const formattedEvents = savedTasks.map((t: any, index: number) => ({
      id: index,
      title: t.title,
      desc: t.notes || 'لا توجد ملاحظات',
      start: new Date(), 
      end: new Date(),
    }));
    setEvents(formattedEvents);
  }, []);

  // تخصيص شريط الأدوات لجعل الشهر قابلاً للضغط والاختيار
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => { toolbar.onNavigate('PREV'); setCurrentDate(subMonths(currentDate, 1)); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); setCurrentDate(addMonths(currentDate, 1)); };

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
        <button onClick={goToBack} style={navBtn}>السابق</button>
        
        {/* الشهر تفاعلي: عند الضغط عليه يفتح قائمة لاختيار شهر آخر */}
        <input 
          type="month" 
          value={format(currentDate, 'yyyy-MM')}
          onChange={(e) => {
            const date = new Date(e.target.value + '-01');
            setCurrentDate(date);
            toolbar.onNavigate('DATE', date);
          }}
          style={monthPickerStyle}
        />

        <button onClick={goToNext} style={navBtn}>التالي</button>
      </div>
    );
  };

  return (
    <div style={{ height: '85vh', padding: '24px', color: 'white' }}>
      <h1>جدول التقويم الزمني</h1>
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', height: '100%', color: '#1e293b' }}>
        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate} // نتحكم في التاريخ هنا
          onNavigate={(date) => setCurrentDate(date)}
          style={{ height: '100%' }}
          components={{
            toolbar: CustomToolbar,
            event: ({ event }: any) => <div title={event.desc} style={{ fontSize: '0.7rem' }}>{event.title}</div>
          }}
          eventPropGetter={() => ({ style: { backgroundColor: '#3b82f6', borderRadius: '4px' } })}
        />
      </div>
    </div>
  );
}

const navBtn = { padding: '5px 15px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' };
const monthPickerStyle = { padding: '5px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', background: 'transparent', cursor: 'pointer', color: '#1e293b' };