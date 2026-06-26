import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });

export default function ContentPage() {
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [content, setContent] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'فيديو', platform: '', date: '', link: '', goal: '' });

  const fetchContent = async () => {
    const querySnapshot = await getDocs(collection(db, 'content'));
    const data = querySnapshot.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, ...d, start: new Date(d.date), end: new Date(d.date) };
    });
    setContent(data);
  };

  useEffect(() => { fetchContent(); }, []);

  const handleSave = async () => {
    await addDoc(collection(db, 'content'), formData);
    fetchContent();
    setIsModalOpen(false);
    setFormData({ title: '', type: 'فيديو', platform: '', date: '', link: '', goal: '' });
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>إدارة المحتوى 📅</h1>
      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>+ إضافة محتوى جديد</button>

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <button onClick={() => setView('list')} style={tabBtn(view === 'list')}>جدول المهام</button>
        <button onClick={() => setView('calendar')} style={tabBtn(view === 'calendar')}>التقويم</button>
      </div>

      {view === 'calendar' ? (
        <div style={{ height: '600px', background: 'white', padding: '10px', borderRadius: '8px', color: '#1e293b', fontSize: '12px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>اختر الشهر:</span>
            <select value={currentDate.getMonth()} onChange={(e) => {
                const newDate = new Date(currentDate);
                newDate.setMonth(parseInt(e.target.value));
                setCurrentDate(newDate);
            }} style={{ padding: '5px', borderRadius: '4px' }}>
              {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <Calendar 
            localizer={localizer} events={content} date={currentDate} onNavigate={setCurrentDate}
            startAccessor="start" endAccessor="end"
            components={{ event: ({ event }: any) => <div title={`${event.title} - ${event.platform} - ${event.goal}`}>{event.title}</div> }}
          />
        </div>
      ) : (
        <table style={tableStyle}>
          <thead><tr style={{ background: '#f8fafc', color: '#1e293b' }}>
            <th>العنوان</th><th>النوع</th><th>المنصة</th><th>التاريخ</th><th>الرابط</th><th>الهدف</th>
          </tr></thead>
          <tbody>
            {content.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={tdStyle}>{c.title}</td><td style={tdStyle}>{c.type}</td>
                <td style={tdStyle}>{c.platform}</td><td style={tdStyle}>{c.date}</td>
                <td style={tdStyle}><a href={c.link} target="_blank" style={{color: '#3b82f6'}}>فتح الرابط</a></td>
                <td style={tdStyle}>{c.goal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>إضافة مادة محتوى</h3>
            <input placeholder="العنوان" style={inputStyle} onChange={e => setFormData({...formData, title: e.target.value})} />
            <select style={inputStyle} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option>فيديو</option><option>صور</option>
            </select>
            <input placeholder="المنصة" style={inputStyle} onChange={e => setFormData({...formData, platform: e.target.value})} />
            <input type="date" style={inputStyle} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input placeholder="رابط الملف" style={inputStyle} onChange={e => setFormData({...formData, link: e.target.value})} />
            <input placeholder="الهدف" style={inputStyle} onChange={e => setFormData({...formData, goal: e.target.value})} />
            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button onClick={handleSave} style={primaryBtn}>حفظ</button>
                <button onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tabBtn = (active: boolean) => ({ padding: '10px 20px', background: active ? '#2563eb' : '#334155', color: 'white', border: 'none', cursor: 'pointer', marginRight: '10px', borderRadius: '4px' });
const tableStyle = { width: '100%', background: 'white', color: '#1e293b', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #e2e8f0' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const secondaryBtn = { background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0', boxSizing: 'border-box' as const };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '8px', width: '400px', color: '#1e293b' };