import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useEffect } from 'react';

const locales = { 'ar-SA': arSA };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // جلب المهام من localStorage وتحويلها لتنسيق التقويم
    const savedTasks = JSON.parse(localStorage.getItem('tasks-list') || '[]');
    const formattedEvents = savedTasks.map((t: any, index: number) => ({
      id: index,
      title: t.title,
      start: new Date(), // يمكنك تعديل هذا ليأخذ تاريخ المهمة الفعلي إذا أضفت حقل تاريخ
      end: new Date(),
    }));
    setEvents(formattedEvents);
  }, []);

  return (
    <div style={{ height: '80vh', padding: '24px', color: 'white' }}>
      <h1>جدول التقويم الزمني</h1>
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', height: '100%' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}