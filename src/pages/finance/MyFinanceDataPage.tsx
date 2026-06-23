import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchFinanceByEmail } from '@/services/firestore/finance';
import { formatCurrency, formatDate } from '@/utils/format';
import { ar } from '@/i18n/ar';
import type { FinanceRecord } from '@/types/finance';

const TYPE_LABELS: Record<string, string> = {
  salary: 'راتب',
  bonus: 'مكافأة',
  expense: 'مصروف',
  invoice: 'فاتورة',
};

export default function MyFinanceDataPage() {
  const { employee } = useAuth();
  const { data: initialData } = useAsyncData(
    () => fetchFinanceByEmail(employee!.email),
    [employee?.email]
  );

  const [data, setData] = useState<FinanceRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  const addRecord = () => {
    if (!amount || !description) return;
    const newRecord: FinanceRecord = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      type: type as any,
      date: new Date().toISOString(),
      email: employee!.email
    };
    setData([newRecord, ...data]);
    setAmount('');
    setDescription('');
  };

  const removeRecord = (id: string) => {
    setData(data.filter(item => item.id !== id));
  };

  // الحسبة التلقائية
  const totalIncome = data.filter(r => r.type === 'salary' || r.type === 'bonus' || r.type === 'invoice')
                          .reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = data.filter(r => r.type === 'expense')
                            .reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <div style={{ padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      <h2>{ar.pages.finance.myData}</h2>

      {/* بطاقات الحسبة التلقائية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#16a34a', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: 0, opacity: 0.8 }}>الإيرادات</p>
          <strong style={{ fontSize: '1.2rem' }}>{formatCurrency(totalIncome)}</strong>
        </div>
        <div style={{ background: '#dc2626', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: 0, opacity: 0.8 }}>المصروفات</p>
          <strong style={{ fontSize: '1.2rem' }}>{formatCurrency(totalExpenses)}</strong>
        </div>
        <div style={{ background: '#3b82f6', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: 0, opacity: 0.8 }}>صافي الربح</p>
          <strong style={{ fontSize: '1.2rem' }}>{formatCurrency(netProfit)}</strong>
        </div>
      </div>

      {/* منطقة الإضافة */}
      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input placeholder="المبلغ" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '10px', borderRadius: '8px', flex: 1, background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
        <input placeholder="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '10px', borderRadius: '8px', flex: 2, background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155' }}>
          {Object.keys(TYPE_LABELS).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <button onClick={addRecord} style={{ padding: '10px 20px', background: '#3b82f6', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer' }}>إضافة</button>
      </div>

      {/* الجدول مع زر الحذف */}
      <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {data.map((row) => (
          <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #334155', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', width: '80px' }}>{TYPE_LABELS[row.type]}</span>
            <span style={{ width: '100px' }}>{formatCurrency(row.amount)}</span>
            <span style={{ flex: 1 }}>{row.description}</span>
            <span style={{ color: '#94a3b8', marginRight: '10px' }}>{row.date ? row.date.split('T')[0] : 'غير متوفر'}</span>
            <button onClick={() => removeRecord(row.id)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' }}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}