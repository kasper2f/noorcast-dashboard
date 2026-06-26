import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { FiPlus, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', status: 'عميل محتمل', price: '' });

  const fetchClients = async () => {
    const querySnapshot = await getDocs(collection(db, 'clients'));
    setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchClients(); }, []);

  const addClient = async () => {
    await addDoc(collection(db, 'clients'), newClient);
    fetchClients();
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1>إدارة العملاء CRM 🤝</h1>
      <button onClick={() => setIsModalOpen(true)} style={primaryBtn}><FiPlus /> عميل جديد</button>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f8fafc', color: '#1e293b' }}>
            <th>الاسم</th><th>التواصل</th><th>السعر</th><th>الحالة</th><th>إجراء</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id}>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.phone}</td>
              <td style={tdStyle}>{c.price} ر.س</td>
              <td style={tdStyle}>{c.status}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link to={`/crm/quote/${c.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}><FiFileText /> عرض</Link>
                  <button onClick={() => alert('تم التأكيد')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer' }}><FiCheckCircle /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* (المودال كما في الكود السابق) */}
    </div>
  );
}

// التنسيقات (كما في الكود السابق)
const tableStyle = { width: '100%', background: 'white', color: '#1e293b', borderCollapse: 'collapse', marginTop: '20px' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #e2e8f0' };
const primaryBtn = { background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' };