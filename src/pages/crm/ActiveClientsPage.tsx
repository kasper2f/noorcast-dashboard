import { useState, useEffect } from 'react';
import { updateClient, deleteClient, addClient } from "../../firebase/firebaseService"; // تأكد أن addClient موجودة
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "../../firebase/config";

export default function ActiveClientsPage() {
  const [activeClients, setActiveClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  useEffect(() => { loadActiveClients(); }, []);

  const loadActiveClients = async () => {
    const q = query(collection(db, 'crm_clients'), where("status", "==", "تم التعاقد"));
    const querySnapshot = await getDocs(q);
    setActiveClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientData = {
      name: formData.get('companyName'),
      contact: formData.get('clientName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      value: formData.get('ltv'),
      assignedEmployee: formData.get('employee'),
      lastContacted: formData.get('lastContacted'),
      status: 'تم التعاقد', // ثابت للعملاء الفعليين
    };

    if (editingClient) await updateClient(editingClient.id, clientData);
    else await addClient(clientData);
    
    setIsModalOpen(false);
    setEditingClient(null);
    loadActiveClients();
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>✅ العملاء الفعليون</h1>
      <button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} style={primaryBtn}>+ إضافة عميل فعلي</button>

      {/* نافذة الإضافة/التعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSave} style={modalContent}>
            <h2>{editingClient ? 'تعديل عميل فعلي' : 'إضافة عميل فعلي جديد'}</h2>
            <input name="clientName" placeholder="اسم العميل الشخصي" defaultValue={editingClient?.contact} style={inputStyle} required />
            <input name="companyName" placeholder="الشركة / الجهة" defaultValue={editingClient?.name} style={inputStyle} required />
            <input name="email" placeholder="البريد الإلكتروني" defaultValue={editingClient?.email} style={inputStyle} required />
            <input name="phone" placeholder="رقم الجوال لتوصيل الوثائق" defaultValue={editingClient?.phone} style={inputStyle} required />
            <input name="ltv" placeholder="إجمالي قيمة التعاقد (LTV)" type="number" defaultValue={editingClient?.value} style={inputStyle} required />
            <input name="employee" placeholder="الموظف المسؤول" defaultValue={editingClient?.assignedEmployee} style={inputStyle} required />
            <input name="lastContacted" placeholder="آخر تواصل دائم" type="date" defaultValue={editingClient?.lastContacted} style={inputStyle} required />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={primaryBtn}>حفظ</button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={secondaryBtn}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <table style={{ width: '100%', marginTop: '20px', background: 'white', color: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['الشركة', 'العميل', 'الإيميل', 'الجوال', 'القيمة (LTV)', 'المسؤول', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {activeClients.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.contact}</td>
              <td style={tdStyle}>{c.email}</td>
              <td style={tdStyle}>{c.phone}</td>
              <td style={tdStyle}>{c.value}</td>
              <td style={tdStyle}>{c.assignedEmployee}</td>
              <td style={tdStyle}>
                <button onClick={() => { setEditingClient(c); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>✏️</button>
                <button onClick={() => deleteClient(c.id).then(loadActiveClients)} style={{ cursor: 'pointer', marginRight: '5px' }}>🗑️</button>
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