import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi'; 

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ 
    client: '', service: '', serviceDetails: '', amount: '', deliveryTime: '', paymentTerms: '50% دفعة مقدمة، 50% عند التسليم' 
  });

  const fetchQuotes = async () => {
    const querySnapshot = await getDocs(collection(db, 'quotes'));
    setQuotes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchQuotes(); }, []);

  const handleSave = async () => {
    if (!formData.client || !formData.amount) return alert("يرجى تعبئة الحقول الأساسية");

    let uploadedUrl = formData.fileUrl || '';
    if (file) {
      const storageRef = ref(storage, `quotes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      uploadedUrl = await getDownloadURL(storageRef);
    }

    if (editingId) {
      await updateDoc(doc(db, 'quotes', editingId), { ...formData, fileUrl: uploadedUrl });
    } else {
      await addDoc(collection(db, 'quotes'), { ...formData, fileUrl: uploadedUrl, createdAt: new Date().toISOString() });
    }
    fetchQuotes();
    resetForm();
  };

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setFormData(q);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ client: '', service: '', serviceDetails: '', amount: '', deliveryTime: '', paymentTerms: '50% دفعة مقدمة، 50% عند التسليم' });
    setFile(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh' }}>
      <h1 style={{ color: 'white' }}>عروض الأسعار 🎬</h1>
      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}>+ إضافة عرض جديد</button>

      {/* المودال */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editingId ? 'تعديل عرض سعر' : 'إضافة عرض جديد'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="اسم العميل" style={inputStyle} value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
              <input placeholder="نوع الخدمة" style={inputStyle} value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} />
              <input type="number" placeholder="المبلغ" style={inputStyle} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <input placeholder="مدة التسليم" style={inputStyle} value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} />
            </div>
            <textarea placeholder="تفاصيل الخدمة" style={{...inputStyle, marginTop: '10px'}} value={formData.serviceDetails} onChange={e => setFormData({...formData, serviceDetails: e.target.value})} />
            <textarea placeholder="مراحل الدفع" style={{...inputStyle, marginTop: '10px'}} value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} />
            <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} style={{ margin: '15px 0' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={resetForm} style={secondaryBtn}>إلغاء</button>
              <button onClick={handleSave} style={primaryBtn}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول الكامل */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['العميل', 'الخدمة', 'التفاصيل', 'المبلغ', 'التسليم', 'الدفع', 'الإجراء'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {quotes.map((q: any) => (
            <tr key={q.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{q.client}</td>
              <td style={tdStyle}>{q.service}</td>
              <td style={tdStyle}>{q.serviceDetails}</td>
              <td style={tdStyle}>{q.amount} ر.س</td>
              <td style={tdStyle}>{q.deliveryTime}</td>
              <td style={tdStyle}>{q.paymentTerms}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {q.fileUrl && <a href={q.fileUrl} target="_blank" rel="noreferrer" style={{color: '#10b981'}}><FiFileText size={18}/></a>}
                  <button onClick={() => startEdit(q)} style={{background:'none', border:'none', color:'#f59e0b', cursor:'pointer'}}><FiEdit2 size={18}/></button>
                  <button onClick={() => deleteDoc(doc(db, 'quotes', q.id)).then(fetchQuotes)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><FiTrash2 size={18}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'right' as const, color: '#64748b' };
const tdStyle = { padding: '12px', textAlign: 'right' as const, color: '#1e293b' };
const tableStyle = { width: '100%', background: 'white', borderRadius: '8px', borderCollapse: 'collapse', marginTop: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' };
const primaryBtn = { padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const secondaryBtn = { padding: '10px 20px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '8px', width: '550px' };