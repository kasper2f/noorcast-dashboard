import { useState, useEffect } from 'react';
import { FiPlus, FiFileText, FiDownload, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiX } from 'react-icons/fi';
import {  
  getQuotesSheet,
  saveQuoteToSheet,
  uploadFileToCloudinary
} from '@/services/dbService';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 اللوقو الرسمي المعتمد الجديد
  const noorcastLogoUrl = 'https://res.cloudinary.com/dfwfh4xzb/image/upload/v1790846600/%D8%AC%D8%AF%D9%8A%D8%AF_%D8%B1%D8%A7%D8%B3%D9%8A_%D8%A7%D8%A8%D9%8A%D8%B61_s6ubcr.png';

  const cleanPrice = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '-';
    try {
      const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
      const dateObj = new Date(cleanStr);
      if (isNaN(dateObj.getTime())) return cleanStr;
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return String(dateStr).substring(0, 10);
    }
  };

  const [companyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('noorcast_company_profile');
      return saved ? JSON.parse(saved) : {
        name: 'شركة نوركاست للإعلام والإنتاج',
        mainCompanyName: 'شركة النوركاست العالمية المحدودة',
        crNumber: '1010000000',
        vatNumber: '300000000000003',
        city: 'الرياض، المملكة العربية السعودية',
        bankName: 'مصرف الراجحي',
        bankAccountName: 'شركة نوركاست للإعلام والإنتاج',
        bankIban: 'SA0380000000108010000003'
      };
    } catch {
      return { 
        name: 'شركة نوركاست للإعلام والإنتاج', 
        mainCompanyName: 'شركة النوركاست العالمية المحدودة',
        crNumber: '1010000000', 
        vatNumber: '300000000000003', 
        city: 'الرياض',
        bankName: 'مصرف الراجحي',
        bankAccountName: 'شركة نوركاست للإعلام والإنتاج',
        bankIban: 'SA0380000000108010000003'
      };
    }
  });

  const [newQuote, setNewQuote] = useState({ 
    clientName: '', 
    clientTaxNumber: '', 
    terms: 'صالح لمدة 15 يوماً.',
    discount: 0,
    file: null as File | null,
    items: [{ serviceName: '', quantity: 1, description: '', unitPrice: 0, discountPercent: 0 }]
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoadingCloud(true);
      const cloudQuotes = await getQuotesSheet().catch(() => []);
      if (Array.isArray(cloudQuotes)) {
        setQuotes(cloudQuotes.map((q: any) => {
          let parsedItems = [];
          try {
            parsedItems = typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || []);
          } catch {
            parsedItems = [{ serviceName: q.serviceType || 'خدمة', quantity: 1, description: '', unitPrice: cleanPrice(q.amount), discountPercent: 0 }];
          }
          return {
            id: String(q.id || 'QT-2026'),
            client: String(q.client || ''),
            clientTaxNumber: String(q.clientTaxNumber || ''),
            items: parsedItems.length > 0 ? parsedItems : [{ serviceName: 'خدمة', quantity: 1, description: '', unitPrice: cleanPrice(q.amount), discountPercent: 0 }],
            amount: Number(q.amount || 0),
            vat: Number(q.vat || 0),
            total: Number(q.total || 0),
            discount: cleanPrice(q.discount || 0),
            terms: String(q.terms || ''),
            fileUrl: q.fileUrl || '',
            date: formatDate(q.date)
          };
        }));
      }
    } catch (err) {
      console.error("خطأ في جلب عروض الأسعار:", err);
    } finally {
      setLoadingCloud(false);
    }
  };

  const calculateItemSubtotal = (item: any) => {
    const qty = cleanPrice(item.quantity);
    const price = cleanPrice(item.unitPrice);
    const disc = cleanPrice(item.discountPercent);
    const sub = qty * price;
    return Math.max(0, sub - (sub * (disc / 100)));
  };

  const handleQuoteItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newQuote.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewQuote({ ...newQuote, items: updatedItems });
  };

  const handleAddQuoteItem = () => {
    setNewQuote({ ...newQuote, items: [...newQuote.items, { serviceName: '', quantity: 1, description: '', unitPrice: 0, discountPercent: 0 }] });
  };

  const handleRemoveQuoteItem = (index: number) => {
    if (newQuote.items.length === 1) return;
    setNewQuote({ ...newQuote, items: newQuote.items.filter((_, i) => i !== index) });
  };

  const calculateQuoteSubtotal = () => {
    const sumItems = newQuote.items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
    const generalDisc = cleanPrice(newQuote.discount);
    return Math.max(0, sumItems - (sumItems * (generalDisc / 100)));
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.clientName || newQuote.items.length === 0) { alert("أدخل اسم العميل وبند واحد على الأقل."); return; }
    setIsSubmitting(true);
    
    try {
      let fileUrl = newQuote.file ? '' : (editingQuoteId ? quotes.find(q => q.id === editingQuoteId)?.fileUrl : '');
      if (newQuote.file) {
        fileUrl = await uploadFileToCloudinary(newQuote.file);
      }

      const subTotal = calculateQuoteSubtotal();
      const vat = subTotal * 0.15;
      const total = subTotal + vat;
      const quoteId = editingQuoteId || `QT-2026-${Math.floor(100 + Math.random() * 900)}`;

      const quoteData = {
        id: quoteId,
        client: newQuote.clientName,
        clientTaxNumber: newQuote.clientTaxNumber,
        items: JSON.stringify(newQuote.items),
        amount: subTotal,
        vat,
        total,
        discount: newQuote.discount,
        terms: newQuote.terms,
        fileUrl,
        date: new Date().toISOString().split('T')[0]
      };

      await saveQuoteToSheet(quoteData);

      const formattedQuote = { 
        ...quoteData, 
        items: newQuote.items,
        date: formatDate(quoteData.date) 
      };

      if (editingQuoteId) {
        setQuotes(quotes.map(q => q.id === editingQuoteId ? formattedQuote : q));
        setEditingQuoteId(null);
      } else {
        setQuotes([formattedQuote, ...quotes]);
      }

      setIsModalOpen(false);
      resetForm();
      alert("تم حفظ وترحيل عرض السعر سحابياً بنجاح! ✅☁️");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ السحابي.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuote = (q: any) => {
    setEditingQuoteId(q.id);
    setNewQuote({ 
      clientName: q.client, 
      clientTaxNumber: q.clientTaxNumber || '', 
      terms: q.terms, 
      discount: q.discount || 0,
      file: null,
      items: Array.isArray(q.items) && q.items.length > 0 ? q.items : [{ serviceName: 'خدمة', quantity: 1, description: '', unitPrice: cleanPrice(q.amount), discountPercent: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm("هل أنت متأكد من حذف عرض السعر؟")) {
      setQuotes(quotes.filter(q => q.id !== id));
    }
  };

  const resetForm = () => {
    setEditingQuoteId(null);
    setNewQuote({ 
      clientName: '', 
      clientTaxNumber: '', 
      terms: 'صالح لمدة 15 يوماً.', 
      discount: 0, 
      file: null,
      items: [{ serviceName: '', quantity: 1, description: '', unitPrice: 0, discountPercent: 0 }] 
    });
  };

  const handlePrintQuote = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const subTotal = Number(item.amount || 0);
    const vatAmount = item.vat || (subTotal * 0.15);
    const finalTotal = item.total || (subTotal + vatAmount);

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <title>${item.id} - ${companyInfo.name}</title>
          <style>
            body { font-family: 'Cairo', Tahoma, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
            .logo-img { height: 50px; object-fit: contain; margin-bottom: 10px; }
            .main-comp { font-size: 1.25rem; font-weight: bold; color: #0f172a; }
            .sub-comp { font-size: 0.95rem; color: #64748b; margin-top: 4px; }
            .doc-header-center { text-align: center; margin-bottom: 25px; }
            .doc-header-center h3 { margin: 0 0 8px 0; color: #f59e0b; font-size: 1.3rem; font-weight: bold; }
            .doc-meta { font-size: 0.9rem; color: #334155; line-height: 1.6; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; font-size: 0.9rem; }
            th { background: #f1f5f9; }
            .terms-box { margin-top: 20px; background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #92400e; white-space: pre-line; }
            .bank-box { margin-top: 20px; background: #fef08a; border: 1px solid #eab308; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #000000; font-weight: 500; }
            .bank-box h4 { margin: 0 0 8px 0; color: #713f12; font-weight: bold; }
            .total-section { margin-top: 20px; text-align: left; font-size: 1.05rem; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.8rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${noorcastLogoUrl}" alt="Noorcast Logo" class="logo-img" />
            <div class="main-comp">${companyInfo.mainCompanyName || 'شركة النوركاست العالمية المحدودة'}</div>
            <div class="sub-comp">السجل: ${companyInfo.crNumber} | الرقم الضريبي: ${companyInfo.vatNumber}</div>
          </div>

          <div class="doc-header-center">
            <h3>عرض سعر</h3>
            <div class="doc-meta">
              <strong>رقم المستند:</strong> ${item.id} &nbsp;|&nbsp; 
              <strong>تاريخ الإصدار:</strong> ${formatDate(item.date)}
              <br/><strong>العنوان:</strong> ${companyInfo.city}
            </div>
          </div>

          <div class="box">
            <strong>موجّه إلى العميل / الجهة:</strong> ${item.client}<br/>
            ${item.clientTaxNumber ? `<strong>الرقم الضريبي للعميل:</strong> ${item.clientTaxNumber}<br/>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>الخدمة</th>
                <th>التفاصيل</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الخصم (%)</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${Array.isArray(item.items) ? item.items.map((it: any, i: number) => {
                const itemTot = cleanPrice(it.quantity) * cleanPrice(it.unitPrice);
                const discVal = itemTot * (cleanPrice(it.discountPercent) / 100);
                const finalItemTot = Math.max(0, itemTot - discVal);
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${it.serviceName}</strong></td>
                    <td>${it.description || '-'}</td>
                    <td>${it.quantity}</td>
                    <td>${cleanPrice(it.unitPrice).toLocaleString()} ر.س</td>
                    <td>${cleanPrice(it.discountPercent)}%</td>
                    <td>${finalItemTot.toLocaleString()} ر.س</td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td>1</td>
                  <td>خدمة</td>
                  <td>-</td>
                  <td>1</td>
                  <td>${subTotal.toLocaleString()} ر.س</td>
                  <td>0%</td>
                  <td>${subTotal.toLocaleString()} ر.س</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="total-section">
            ${item.discount ? `<p>نسبة الخصم الإضافي: ${item.discount}%</p>` : ''}
            <p>المبلغ غير شامل الضريبة: ${subTotal.toLocaleString()} ر.س</p>
            <p>ضريبة القيمة المضافة (15%): ${vatAmount.toLocaleString()} ر.س</p>
            <p style="color: #f59e0b; font-size: 1.2rem;">الإجمالي النهائي شامل الضريبة: ${finalTotal.toLocaleString()} ر.س</p>
          </div>

          ${companyInfo.bankIban ? `
            <div class="bank-box">
              <h4>🏦 بيانات التحويل والحساب البنكي المعتمد:</h4>
              <strong>اسم البنك:</strong> ${companyInfo.bankName || '-'}<br/>
              <strong>اسم الحساب:</strong> ${companyInfo.bankAccountName || '-'}<br/>
              <strong>رقم الآيبان (IBAN):</strong> <span style="direction: ltr; display: inline-block; font-weight: bold;">${companyInfo.bankIban}</span>
            </div>
          ` : ''}

          ${item.terms ? `
            <div class="terms-box">
              <strong>الشروط والأحكام:</strong><br/>
              ${item.terms}
            </div>
          ` : ''}

          <div class="footer">
            <p>هذا المستند صادر إلكترونياً من نظام نوركاست الإداري ويعتبر معتمداً رسمياً وفق لوائح وأنظمة المملكة العربية السعودية.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredQuotes = quotes.filter(q => (q.client || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '18px' }}>
        <img src={noorcastLogoUrl} alt="Noorcast Logo" style={{ height: '45px', objectFit: 'contain', marginBottom: '8px' }} />
        <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#f59e0b', letterSpacing: '0.5px' }}>
          {companyInfo.mainCompanyName || 'شركة النوركاست العالمية المحدودة'}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '4px' }}>
          السجل التجاري: {companyInfo.crNumber} | الرقم الضريبي: {companyInfo.vatNumber}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>عروض الأسعار 🎬</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>إدارة وإنشاء عروض الأسعار سحابياً والربط مع قوقل شيت</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadQuotes} style={secondaryBtn} disabled={loadingCloud}>
            <FiRefreshCw /> {loadingCloud ? 'جاري المزامنة...' : 'تحديث 🔄'}
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} style={primaryBtn}>
            <FiPlus /> إنشاء عرض سعر جديد ➕
          </button>
        </div>
      </div>

      {/* شريط البحث */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
        <input type="text" placeholder="بحث باسم العميل..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={searchInputStyle} />
      </div>

      {/* مودال الإنشاء والتعديل */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={noorcastLogoUrl} alt="Logo" style={{ height: '30px', objectFit: 'contain' }} />
                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 'bold' }}>{editingQuoteId ? '✏️ تعديل عرض السعر' : '➕ إضافة عرض سعر جديد'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveQuote}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>اسم العميل *</label>
                  <input style={inputStyle} value={newQuote.clientName} onChange={e => setNewQuote({...newQuote, clientName: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>الرقم الضريبي للعميل</label>
                  <input style={inputStyle} value={newQuote.clientTaxNumber} onChange={e => setNewQuote({...newQuote, clientTaxNumber: e.target.value})} />
                </div>
              </div>

              {/* جدول الخدمات المتعددة */}
              <div style={{ margin: '15px 0 10px 0', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, fontSize: '0.95rem', color: '#f59e0b' }}>بنود عرض السعر (الخدمة - التفاصيل - الكمية - السعر - الخصم %):</label>
                  <button type="button" onClick={handleAddQuoteItem} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    + إضافة بند جديد
                  </button>
                </div>

                {newQuote.items.map((item, index) => (
                  <div key={index} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', display: 'grid', gridTemplateColumns: '2fr 2.5fr 0.8fr 1.2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>الخدمة</label>
                      <input style={{ ...inputStyle, margin: 0, padding: '8px' }} placeholder="اسم الخدمة" value={item.serviceName} onChange={e => handleQuoteItemChange(index, 'serviceName', e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>التفاصيل</label>
                      <input style={{ ...inputStyle, margin: 0, padding: '8px' }} placeholder="وصف الخدمة" value={item.description} onChange={e => handleQuoteItemChange(index, 'description', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>الكمية</label>
                      <input type="number" min="1" style={{ ...inputStyle, margin: 0, padding: '8px' }} value={item.quantity} onChange={e => handleQuoteItemChange(index, 'quantity', e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>السعر (ر.س)</label>
                      <input type="number" step="0.01" style={{ ...inputStyle, margin: 0, padding: '8px' }} value={item.unitPrice} onChange={e => handleQuoteItemChange(index, 'unitPrice', e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>الخصم (%)</label>
                      <input type="number" min="0" max="100" style={{ ...inputStyle, margin: 0, padding: '8px' }} value={item.discountPercent} onChange={e => handleQuoteItemChange(index, 'discountPercent', e.target.value)} />
                    </div>
                    <div>
                      {newQuote.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveQuoteItem(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', marginTop: '16px' }} title="حذف البند">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f1f5f9', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>نسبة الخصم الإضافي على عرض السعر (%):</label>
                  <input type="number" min="0" max="100" style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={newQuote.discount} onChange={e => setNewQuote({...newQuote, discount: cleanPrice(e.target.value)})} />
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#1e293b', marginLeft: '10px' }}>الإجمالي الكلي:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#16a34a' }}>{calculateQuoteSubtotal().toLocaleString()} ر.س</span>
                </div>
              </div>

              <label style={labelStyle}>الشروط والأحكام:</label>
              <textarea rows={3} style={inputStyle} value={newQuote.terms} onChange={e => setNewQuote({...newQuote, terms: e.target.value})} />

              <label style={labelStyle}>إرفاق ملف PDF (اختياري):</label>
              <input type="file" accept=".pdf" style={{ marginBottom: '15px' }} onChange={e => setNewQuote({...newQuote, file: e.target.files ? e.target.files[0] : null})} />

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : (editingQuoteId ? 'تحديث عرض السعر سحابياً 🔄' : 'حفظ وترحيل سحابياً ✅')}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={secondaryBtn} disabled={isSubmitting}>إلغاء ❌</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* الجدول المحدث */}
      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '25px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                {['رقم العرض', 'العميل', 'المبلغ الإجمالي', 'تاريخ الإصدار', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q: any) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #334155', background: '#1e293b' }}>
                    <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{q.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{q.client}</td>
                    <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(q.total).toLocaleString()} ر.س</td>
                    <td style={{ ...tdStyle, color: '#cbd5e1', whiteSpace: 'nowrap' }}>{q.date}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => handlePrintQuote(q)} style={actionBtn} title="طباعة">طباعة 🖨️</button>
                        {q.fileUrl && <a href={q.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', padding: '6px 10px', background: '#334155', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem' }}><FiFileText /> ملف</a>}
                        <button onClick={() => handleEditQuote(q)} style={iconEditBtn} title="تعديل"><FiEdit2 /></button>
                        <button onClick={() => handleDeleteQuote(q.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد عروض أسعار سحابية مطابقة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, fontWeight: 'bold' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, verticalAlign: 'middle' as const };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block', marginBottom: '5px' };
const primaryBtn = { padding: '10px 18px', background: '#f59e0b', border: 'none', borderRadius: '10px', color: '#000000', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };
const secondaryBtn = { padding: '8px 16px', background: '#334155', border: '1px solid #475569', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { background: '#334155', color: '#f59e0b', border: '1px solid #475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', whiteSpace: 'nowrap' as const };
const iconEditBtn = { background: '#f59e0b', color: '#000000', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const iconDeleteBtn = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const searchInputStyle = { width: '100%', padding: '10px 35px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: 'white', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px', boxSizing: 'border-box' as const };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const, boxSizing: 'border-box' as const };