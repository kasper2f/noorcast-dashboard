import { useState } from 'react';

export default function QuotePage() {
  // هذه البيانات سيتم جلبها لاحقاً بناءً على معرف العميل (ID)
  const [quoteData] = useState({
    clientName: 'شركة الأثاث العالمية',
    service: 'تصوير فيديو إعلاني',
    details: 'تصوير 3 فيديوهات قصيرة مع المونتاج',
    price: 5000,
    date: '2026-06-26'
  });

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <div style={{ maxWidth: '600px', margin: 'auto', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h1>عرض سعر رقمي 📄</h1>
        <hr />
        <p><strong>العميل:</strong> {quoteData.clientName}</p>
        <p><strong>الخدمة:</strong> {quoteData.service}</p>
        <p><strong>التفاصيل:</strong> {quoteData.details}</p>
        <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
          <h3>القيمة الإجمالية: {quoteData.price} ر.س</h3>
        </div>
        <button style={{ width: '100%', padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          موافقة واعتماد العرض
        </button>
      </div>
    </div>
  );
}