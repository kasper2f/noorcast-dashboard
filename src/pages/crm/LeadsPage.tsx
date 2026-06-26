import { useState, useEffect } from 'react';
import { getClients, addClient, updateClient, deleteClient, addInvoice } from "../../firebase/firebaseService";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "../../firebase/config";

const statuses = ['تم التواصل', 'تحت الإجراء', 'تم التعاقد', 'لا يوجد رد', 'مغلق'];

export default function LeadsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    const data = await getClients();
    setClients(data);
  };

  const handleStatusChange = async (client: any, newStatus: string) => {
    const name = prompt("يرجى إدخال اسمك لتسجيل العملية:");
    if (!name) return;

    await updateClient(client.id, { status: newStatus, lastContactedBy: name });

    if (newStatus === 'تم التعاقد') {
      const q = query(collection(db, 'invoices'), where("clientId", "==", client.id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addInvoice({
          clientName: client.name,
          amount: client.value || 0,
          date: new Date().toISOString().split('T')[0],
          status: 'غير مدفوع',
          source: 'CRM',
          clientId: client.id
        });
        alert("تم إنشاء فاتورة للعميل في النظام المالي!");
      }
    }
    loadClients();
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientData = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      socialMedia: formData.get('socialMedia'),
      status: formData.get('status'),
      value: formData.get('value'),
      lastContactedBy: editingClient ? editingClient.lastContactedBy : 'جديد',
    };

    if (editingClient) await updateClient(editingClient.id, clientData);
    else await addClient(clientData);
    
    setIsModalOpen(false);
    setEditingClient(null);
    loadClients();
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>📋 العملاء المحتملون (Leads)</h1>
      <button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} style={primaryBtn}>+ إضافة عميل</button>

      {/* نافذة الإضافة/التعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSave} style={modalContent}>
            <h2>{editingClient ? 'تعديل العميل' : 'إضافة عميل جديد'}</h2>
            <input name="name" placeholder="اسم الشركة" defaultValue={editingClient?.name} style={inputStyle} required />
            <input name="contact" placeholder="المسؤول" defaultValue={editingClient?.contact} style={inputStyle} />
            <input name="email" placeholder="الإيميل" defaultValue={editingClient?.email} style={inputStyle} />
            <input name="phone" placeholder="الجوال" defaultValue={editingClient?.phone} style={inputStyle} />
            <input name="socialMedia" placeholder="السوشل ميديا" defaultValue={editingClient?.socialMedia} style={inputStyle} />
            <input name="value" placeholder="القيمة" type="number" defaultValue={editingClient?.value} style={inputStyle} />
            <select name="status" defaultValue={editingClient?.status || 'تم التواصل'} style={inputStyle}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={primaryBtn}>حفظ</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </form>
        </div>
      )}
      
      {/* الجدول */}
      <table style={{ width: '100%', marginTop: '20px', background: 'white', color: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['الشركة', 'المسؤول', 'الإيميل', 'الجوال', 'السوشل ميديا', 'القيمة', 'الحالة (بواسطة)', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.contact}</td>
              <td style={tdStyle}>{c.email}</td>
              <td style={tdStyle}>{c.phone}</td>
              <td style={tdStyle}>{c.socialMedia}</td>
              <td style={tdStyle}>{c.value}</td>
              <td style={tdStyle}>
                <select value={c.status} onChange={(e) => handleStatusChange(c, e.target.value)} style={{ padding: '5px' }}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{c.lastContactedBy || 'لا يوجد'}</div>
              </td>
              <td style={tdStyle}>
                <button onClick={() => { setEditingClient(c); setIsModalOpen(true); }} style={{marginRight: '5px'}}>✏️</button>
                <button onClick={() => deleteClient(c.id).then(loadClients)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'right' as const };
const tdStyle = { padding: '12px', textAlign: 'right' as const };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0', borderRadius: '4px', border: '1px solid #ccc' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const secondaryBtn = { background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { background: 'white', color: 'black', padding: '20px', borderRadius: '8px', width: '400px' };