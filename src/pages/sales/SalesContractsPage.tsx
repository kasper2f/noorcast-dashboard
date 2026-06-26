import { useState } from 'react';

export default function SalesContractsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ client: '', value: '', status: 'عرض سعر', file: null as File | null });

  const handleSave = () => {
    // في النظام الحقيقي، هنا سنقوم برفع الملف للـ Storage ثم حفظ الرابط في قاعدة البيانات
    const newDeal = { ...formData, id: Date.now(), fileName: formData.file?.name || 'بدون ملف' };
    setDeals([...deals, newDeal]);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', color: 'white', minHeight: '100vh', background: '#0f172a' }}>
      <h1>المبيعات والعقود 🤝</h1>

      {/* بطاقات المؤشرات */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>إجمالي الفرص: {deals.length}</div>
        <div style={cardStyle}>القيمة المتوقعة: {deals.reduce((a, b) => a + Number(b.value), 0)} ر.س</div>
      </div>

      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>+ إضافة صفقة/عقد جديد</button>

      {/* مودال الإضافة */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>إضافة صفقة جديدة</h3>
            <input placeholder="اسم العميل" style={inputStyle} onChange={e => setFormData({...formData, client: e.target.value})} />
            <input type="number" placeholder="قيمة الصفقة" style={inputStyle} onChange={e => setFormData({...formData, value: e.target.value})} />
            <select style={inputStyle} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option>عرض سعر</option>
              <option>قيد التفاوض</option>
              <option>عقد موقّع</option>
            </select>
            <input type="file" accept=".pdf" onChange={(e: any) => setFormData({...formData, file: e.target.files[0]})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={handleSave} style={primaryBtn}>حفظ الصفقة</button>
              <button onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول الأبيض */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {['العميل', 'القيمة', 'الحالة', 'العقد', 'إجراء'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {deals.map((d: any) => (
            <tr key={d.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{d.client}</td>
              <td style={tdStyle}>{d.value} ر.س</td>
              <td style={tdStyle}>{d.status}</td>
              <td style={tdStyle}>{d.fileName}</td>
              <td style={tdStyle}><button style={actionBtn}>تحميل PDF</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// التنسيقات الموحدة
const cardStyle = { background: '#1e293b', padding: '20px', borderRadius: '12px', flex: 1 };
const tableStyle = { width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', color: '#1e293b', marginTop: '20px' };
const thStyle = { padding: '12px', textAlign: 'right' as const, color: '#64748b' };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' };
const primaryBtn = { padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const secondaryBtn = { padding: '10px 20px', background: '#64748b', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' };
const actionBtn = { background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '12px', width: '400px', color: '#1e293b' };