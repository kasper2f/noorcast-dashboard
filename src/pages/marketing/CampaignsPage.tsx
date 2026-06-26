import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', platform: '', budget: '', spent: '', status: 'جارية', notes: '' });

  const fetchCampaigns = async () => {
    const querySnapshot = await getDocs(collection(db, 'campaigns'));
    setCampaigns(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleSave = async () => {
    if (!formData.name) return alert("يرجى إدخال اسم الحملة");
    if (editingId) {
      await updateDoc(doc(db, 'campaigns', editingId), formData);
    } else {
      await addDoc(collection(db, 'campaigns'), formData);
    }
    fetchCampaigns();
    resetForm();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'campaigns', id), { status: newStatus });
    fetchCampaigns();
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setFormData(c);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', platform: '', budget: '', spent: '', status: 'جارية', notes: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>إدارة الحملات 📈</h1>
      
      {/* الرسم البياني الحيوي */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', height: '300px', marginBottom: '20px', color: '#1e293b' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={campaigns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#2563eb" name="الميزانية" />
            <Bar dataKey="spent" fill="#ef4444" name="المصروف" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}><FiPlus /> إضافة حملة جديدة</button>

      {/* نافذة الإضافة/التعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{editingId ? 'تعديل الحملة' : 'إضافة حملة جديدة'}</h3>
            <input placeholder="اسم الحملة" value={formData.name} style={inputStyle} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input placeholder="المنصة" value={formData.platform} style={inputStyle} onChange={e => setFormData({...formData, platform: e.target.value})} />
            <input type="number" placeholder="الميزانية" value={formData.budget} style={inputStyle} onChange={e => setFormData({...formData, budget: e.target.value})} />
            <input type="number" placeholder="المصروف" value={formData.spent} style={inputStyle} onChange={e => setFormData({...formData, spent: e.target.value})} />
            <select value={formData.status} style={inputStyle} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option>مخطط لها</option><option>جارية</option><option>انتهت</option>
            </select>
            <textarea placeholder="الملاحظات" value={formData.notes} style={inputStyle} onChange={e => setFormData({...formData, notes: e.target.value})} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={handleSave} style={primaryBtn}>حفظ</button>
              <button onClick={resetForm} style={secondaryBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* الجدول */}
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f8fafc', color: '#1e293b' }}>
            {['الاسم', 'المنصة', 'الميزانية', 'المصروف', 'الحالة', 'الملاحظات', 'الإجراء'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c: any) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.platform}</td>
              <td style={tdStyle}>{c.budget}</td>
              <td style={tdStyle}>{c.spent}</td>
              <td style={tdStyle}>
                <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)} style={{ padding: '5px', borderRadius: '4px' }}>
                  <option>مخطط لها</option><option>جارية</option><option>انتهت</option>
                </select>
              </td>
              <td style={tdStyle}>{c.notes}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => startEdit(c)} style={{...iconBtn, color: '#2563eb'}}><FiEdit2 /></button>
                  <button onClick={() => deleteDoc(doc(db, 'campaigns', c.id)).then(fetchCampaigns)} style={{...iconBtn, color: '#ef4444'}}><FiTrash2 /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// التنسيقات
const tableStyle = { width: '100%', background: 'white', color: '#1e293b', borderCollapse: 'collapse', marginTop: '20px', borderRadius: '8px', overflow: 'hidden' };
const thStyle = { padding: '12px', textAlign: 'right' as const };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' as const };
const primaryBtn = { padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const secondaryBtn = { padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: 'white', padding: '20px', borderRadius: '8px', width: '400px', color: '#1e293b' };