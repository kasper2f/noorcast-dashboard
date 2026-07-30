import { useState, useEffect } from 'react';
import { FiPlus, FiFileText, FiDownload, FiBriefcase, FiDollarSign, FiSettings, FiEdit2, FiTrash2, FiSearch, FiUserCheck, FiCreditCard, FiUpload } from 'react-icons/fi';
import { saveInvoiceToSheet, saveExpenseToSheet, saveIncomingBillToSheet, getFreelanceFinanceSheet, saveFreelanceFinanceToSheet } from '@/services/dbService';

export default function SalesContractsPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'clients_contracts' | 'freelancer_contracts' | 'invoices' | 'incoming_bills'>('quotes');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noorcastLogoUrl = 'https://res.cloudinary.com/dfwfh4xzb/image/upload/v1782727817/WhatsApp_Image_2026-06-21_at_12.56.07_AM_dhzswc.png';

  const [companyInfo, setCompanyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('noorcast_company_profile');
      return saved ? JSON.parse(saved) : {
        name: 'شركة نوركاست للإعلام والإنتاج',
        crNumber: '1010000000',
        vatNumber: '300000000000003',
        city: 'الرياض، المملكة العربية السعودية'
      };
    } catch {
      return { name: 'شركة نوركاست للإعلام والإنتاج', crNumber: '1010000000', vatNumber: '300000000000003', city: 'الرياض' };
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [quotes, setQuotes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('noorcast_official_quotes');
      return saved ? JSON.parse(saved) : [
        { id: 'QT-2026-01', client: 'شركة التقنية المتقدمة', clientTaxNumber: '300111222333003', serviceType: 'إنتاج هوية بصرية متكاملة', amount: 15000, vat: 2250, total: 17250, terms: 'صالح لمدة 15 يوماً.', date: '2026-07-28' }
      ];
    } catch { return []; }
  });

  const [clientContracts, setClientContracts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('noorcast_client_contracts_archive');
      return saved ? JSON.parse(saved) : [
        { id: 'CON-C-101', title: 'عقد تقديم خدمات إنتاج مرئي', party: 'مؤسسة أفق الابداعية', type: 'عميل', value: '15,000 ر.س', fileName: 'contract_ofoq_signed.pdf', fileUrl: null, date: '2026-07-01' }
      ];
    } catch { return []; }
  });

  const [freelancerContracts, setFreelancerContracts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('noorcast_freelancer_contracts');
      return saved ? JSON.parse(saved) : [
        { id: 'CON-F-501', freelancerName: 'أحمد العتيبي', projectTask: 'تصميم موشن جرافيك', amount: 2500, duration: 'أسبوعين', date: '2026-07-15' }
      ];
    } catch { return []; }
  });

  const [invoices, setInvoices] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('noorcast_tax_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [incomingBills, setIncomingBills] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('noorcast_incoming_bills');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isClientContractModalOpen, setIsClientContractModalOpen] = useState(false);
  const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const [newQuote, setNewQuote] = useState({ clientName: '', clientTaxNumber: '', serviceType: '', amount: 0, terms: 'صالح لمدة 15 يوماً.' });
  const [newClientContract, setNewClientContract] = useState({ title: '', party: '', type: 'عميل', value: '', file: null as File | null });
  const [newFreelancer, setNewFreelancer] = useState({ freelancerName: '', projectTask: '', amount: 0, duration: 'أسبوع واحد' });
  const [newInvoice, setNewInvoice] = useState({ clientName: '', clientTaxNumber: '', serviceType: '', amount: 0, status: 'تم الإرسال', dueDate: new Date().toISOString().split('T')[0], file: null as File | null });
  
  const [newBill, setNewBill] = useState({ 
    supplier: '', 
    category: 'إيجار المقر', 
    customCategory: '', 
    amount: 0, 
    status: 'مسددة', 
    frequency: 'شهري',
    isTaxable: true,
    dueDate: new Date().toISOString().split('T')[0], 
    file: null as File | null 
  });

  const clearFinancialCache = () => {
    localStorage.removeItem('noorcast_cached_invoices');
    localStorage.removeItem('noorcast_cached_expenses');
    localStorage.removeItem('noorcast_cached_bills');
  };

  useEffect(() => { try { localStorage.setItem('noorcast_official_quotes', JSON.stringify(quotes)); } catch {} }, [quotes]);
  useEffect(() => { try { localStorage.setItem('noorcast_client_contracts_archive', JSON.stringify(clientContracts)); } catch {} }, [clientContracts]);
  useEffect(() => { try { localStorage.setItem('noorcast_freelancer_contracts', JSON.stringify(freelancerContracts)); } catch {} }, [freelancerContracts]);
  useEffect(() => { 
    try { 
      localStorage.setItem('noorcast_tax_invoices', JSON.stringify(invoices)); 
      clearFinancialCache();
    } catch {} 
  }, [invoices]);
  useEffect(() => { 
    try { 
      localStorage.setItem('noorcast_incoming_bills', JSON.stringify(incomingBills)); 
      clearFinancialCache();
    } catch {} 
  }, [incomingBills]);
  useEffect(() => { try { localStorage.setItem('noorcast_company_profile', JSON.stringify(companyInfo)); } catch {} }, [companyInfo]);

  const syncFreelancerStatusOnBillPaid = async (supplierName: string) => {
    try {
      const remoteFinance = await getFreelanceFinanceSheet().catch(() => []);
      if (Array.isArray(remoteFinance) && remoteFinance.length > 0) {
        const supLower = String(supplierName || '').toLowerCase().trim();
        for (const record of remoteFinance) {
          const freeName = String(record.freelancerName || '').toLowerCase().trim();
          if ((supLower.includes(freeName) || freeName.includes(supLower)) && String(record.status || '').includes('معلق')) {
            const updatedRecord = { ...record, status: 'تم السداد / مصروف فعلي ✅' };
            await saveFreelanceFinanceToSheet(updatedRecord);
          }
        }
      }
    } catch (err) {
      console.error("Error syncing freelancer status from bill:", err);
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, newStatus: string) => {
    setIsSubmitting(true);
    try {
      const updated = invoices.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv);
      setInvoices(updated);
      clearFinancialCache();
      
      const targetInv = updated.find(i => i.id === id);
      if (targetInv) {
        await saveInvoiceToSheet({
          id: targetInv.id,
          number: targetInv.id,
          client: targetInv.client,
          amount: targetInv.total || targetInv.amount,
          status: newStatus,
          dueDate: targetInv.dueDate || new Date().toISOString().split('T')[0],
          isExternal: true
        });
      }
      alert(`تم تحديث حالة الفاتورة الصادرة إلى [${newStatus}] بنجاح! 🔄☁️`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التحديث.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBillStatus = async (id: string, newStatus: string) => {
    setIsSubmitting(true);
    try {
      let targetBill: any = null;
      const updated = incomingBills.map(bill => {
        if (bill.id === id) {
          targetBill = { ...bill, status: newStatus };
          return targetBill;
        }
        return bill;
      });
      setIncomingBills(updated);
      clearFinancialCache();

      if (targetBill) {
        await saveIncomingBillToSheet({
          id: targetBill.id,
          supplier: targetBill.supplier,
          category: targetBill.category,
          amount: targetBill.amount,
          status: newStatus,
          frequency: targetBill.frequency,
          dueDate: targetBill.dueDate,
          date: targetBill.date,
          isTaxable: targetBill.isTaxable ?? true
        });

        if (newStatus === 'مسددة') {
          await saveExpenseToSheet({
            id: `EXP-BILL-${targetBill.id}`,
            description: targetBill.supplier,
            category: targetBill.category,
            amount: Number(targetBill.amount),
            responsible: 'الإدارة',
            type: 'مصروف',
            date: targetBill.date || new Date().toISOString().split('T')[0]
          });

          await syncFreelancerStatusOnBillPaid(targetBill.supplier);
        }
      }
      alert(`تم تحديث حالة الالتزام الوارد إلى [${newStatus}] وترحيله سحابياً بنجاح! 🔄☁️`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التحديث سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadInvoiceFile = (id: string, file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const updated = invoices.map(inv => inv.id === id ? { ...inv, fileName: file.name, fileUrl } : inv);
    setInvoices(updated);
    alert(`تم إرفاق ملف الفاتورة الصادرة (${file.name}) بنجاح! 📎`);
  };

  const handleRemoveInvoiceFile = (id: string) => {
    const updated = invoices.map(inv => inv.id === id ? { ...inv, fileName: '', fileUrl: null } : inv);
    setInvoices(updated);
    alert("تمت إزالة المرفق بنجاح! ❌");
  };

  const handleUploadBillFile = (id: string, file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const updated = incomingBills.map(b => b.id === id ? { ...b, fileName: file.name, fileUrl } : b);
    setIncomingBills(updated);
    alert(`تم إرفاق ملف الفاتورة الواردة (${file.name}) بنجاح! 📎`);
  };

  const handleRemoveBillFile = (id: string) => {
    const updated = incomingBills.map(b => b.id === id ? { ...b, fileName: '', fileUrl: null } : b);
    setIncomingBills(updated);
    alert("تمت إزالة المرفق بنجاح! ❌");
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.clientName || !newQuote.amount) { alert("أدخل اسم العميل والمبلغ."); return; }
    setIsSubmitting(true);
    
    setTimeout(() => {
      const subTotal = Number(newQuote.amount);
      const vat = subTotal * 0.15;
      const total = subTotal + vat;

      if (editingQuoteId) {
        setQuotes(quotes.map(q => q.id === editingQuoteId ? { ...q, ...newQuote, client: newQuote.clientName, amount: subTotal, vat, total } : q));
        setEditingQuoteId(null);
      } else {
        const created = { id: `QT-2026-${Math.floor(100 + Math.random() * 900)}`, client: newQuote.clientName, clientTaxNumber: newQuote.clientTaxNumber, serviceType: newQuote.serviceType, amount: subTotal, vat, total, terms: newQuote.terms, date: new Date().toISOString().split('T')[0] };
        setQuotes([created, ...quotes]);
      }
      setIsQuoteModalOpen(false);
      setNewQuote({ clientName: '', clientTaxNumber: '', serviceType: '', amount: 0, terms: 'صالح لمدة 15 يوماً.' });
      setIsSubmitting(false);
      alert("تم الحفظ بنجاح! ✅");
    }, 300);
  };

  const handleEditQuote = (q: any) => {
    setEditingQuoteId(q.id);
    setNewQuote({ clientName: q.client, clientTaxNumber: q.clientTaxNumber || '', serviceType: q.serviceType, amount: q.amount, terms: q.terms });
    setIsQuoteModalOpen(true);
  };
  const handleDeleteQuote = (id: string) => { if (confirm("حذف العرض؟")) setQuotes(quotes.filter(q => q.id !== id)); };

  const handleUploadClientContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientContract.title || !newClientContract.party) { alert("أدخل البيانات الأساسية."); return; }
    setIsSubmitting(true);

    setTimeout(() => {
      const fileObj = newClientContract.file;
      const fileUrl = fileObj ? URL.createObjectURL(fileObj) : '';
      const created = {
        id: `CON-${Math.floor(100 + Math.random() * 900)}`,
        title: newClientContract.title,
        party: newClientContract.party,
        type: newClientContract.type,
        value: newClientContract.value || 'حسب الاتفاق',
        fileName: fileObj ? fileObj.name : 'عقد_رسمي.pdf',
        fileUrl,
        date: new Date().toISOString().split('T')[0]
      };
      setClientContracts([created, ...clientContracts]);
      setIsClientContractModalOpen(false);
      setNewClientContract({ title: '', party: '', type: 'عميل', value: '', file: null });
      setIsSubmitting(false);
      alert("تم أرشفة ملف الـ PDF بنجاح! 📁");
    }, 300);
  };
  const handleDeleteClientContract = (id: string) => { if (confirm("حذف العقد؟")) setClientContracts(clientContracts.filter(c => c.id !== id)); };

  const handleSaveFreelancer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFreelancer.freelancerName || !newFreelancer.amount) { alert("أدخل اسم المستقل والمبلغ."); return; }
    setIsSubmitting(true);

    setTimeout(() => {
      const created = { id: `CON-F-${Math.floor(100 + Math.random() * 900)}`, ...newFreelancer, date: new Date().toISOString().split('T')[0] };
      setFreelancerContracts([created, ...freelancerContracts]);
      setIsFreelancerModalOpen(false);
      setNewFreelancer({ freelancerName: '', projectTask: '', amount: 0, duration: 'أسبوع واحد' });
      setIsSubmitting(false);
      alert("تم إصدار عقد المستقل بنجاح! 📄");
    }, 300);
  };
  const handleDeleteFreelancer = (id: string) => { if (confirm("حذف العقد؟")) setFreelancerContracts(freelancerContracts.filter(f => f.id !== id)); };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientName || !newInvoice.amount) { alert("أدخل البيانات."); return; }
    
    setIsSubmitting(true);
    try {
      const subTotal = Number(newInvoice.amount);
      const vat = subTotal * 0.15;
      const total = subTotal + vat;
      const invoiceId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
      
      const fileObj = newInvoice.file;
      const fileUrl = fileObj ? URL.createObjectURL(fileObj) : '';
      
      const created = { 
        id: invoiceId, 
        client: newInvoice.clientName, 
        clientTaxNumber: newInvoice.clientTaxNumber, 
        serviceType: newInvoice.serviceType, 
        amount: subTotal, 
        vat, 
        total, 
        status: newInvoice.status, 
        dueDate: newInvoice.dueDate, 
        date: new Date().toISOString().split('T')[0],
        fileName: fileObj ? fileObj.name : 'فاتورة_صادرة.pdf',
        fileUrl,
        isExternal: true 
      };
      
      setInvoices([created, ...invoices]);
      clearFinancialCache();

      await saveInvoiceToSheet({
        id: invoiceId,
        number: invoiceId,
        client: created.client,
        amount: total,
        status: created.status,
        dueDate: created.dueDate,
        isExternal: true
      });

      setIsInvoiceModalOpen(false);
      setNewInvoice({ clientName: '', clientTaxNumber: '', serviceType: '', amount: 0, status: 'تم الإرسال', dueDate: new Date().toISOString().split('T')[0], file: null });
      alert(`تم إصدار الفاتورة الصادرة بحالة [${created.status}] وحفظها سحابياً بنجاح! 💰☁️`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الإصدار والحفظ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoice = (id: string) => { 
    if (confirm("حذف الفاتورة؟")) {
      setInvoices(invoices.filter(i => i.id !== id)); 
      clearFinancialCache();
    }
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBill.supplier || !newBill.amount) { alert("أدخل اسم المورد والمبلغ."); return; }
    
    setIsSubmitting(true);
    try {
      const finalCategory = newBill.category === 'تصنيف مخصص (أكتبه بنفسك)...' ? (newBill.customCategory || 'أخرى') : newBill.category;
      const fileObj = newBill.file;
      const fileUrl = fileObj ? URL.createObjectURL(fileObj) : '';
      const billId = `BILL-${Math.floor(100 + Math.random() * 900)}`;
      
      const created = {
        id: billId,
        supplier: newBill.supplier,
        category: finalCategory,
        amount: Number(newBill.amount),
        isTaxable: newBill.isTaxable,
        fileName: fileObj ? fileObj.name : 'فاتورة_التزام.pdf',
        fileUrl,
        date: new Date().toISOString().split('T')[0],
        dueDate: newBill.dueDate,
        status: newBill.status,
        frequency: newBill.frequency
      };

      setIncomingBills([created, ...incomingBills]);
      clearFinancialCache();

      await saveIncomingBillToSheet({
        id: created.id,
        supplier: created.supplier,
        category: created.category,
        amount: created.amount,
        isTaxable: created.isTaxable,
        status: created.status,
        frequency: created.frequency,
        dueDate: created.dueDate,
        date: created.date
      });

      if (newBill.status === 'مسددة') {
        await saveExpenseToSheet({
          id: `EXP-BILL-${billId}`,
          description: created.supplier,
          category: created.category,
          amount: created.amount,
          responsible: 'الإدارة',
          type: 'مصروف',
          date: created.date
        });

        await syncFreelancerStatusOnBillPaid(created.supplier);
      }

      setIsBillModalOpen(false);
      setNewBill({ supplier: '', category: 'إيجار المقر', customCategory: '', amount: 0, status: 'مسددة', frequency: 'شهري', isTaxable: true, dueDate: new Date().toISOString().split('T')[0], file: null });
      alert("تم حفظ فاتورة الالتزام الواردة مع خيار الضريبة ومزامنتها سحابياً بنجاح! 📊☁️");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ السحابي.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBill = (id: string) => { 
    if (confirm("حذف الفاتورة؟")) {
      setIncomingBills(incomingBills.filter(b => b.id !== id)); 
      clearFinancialCache();
    }
  };

  const handleViewOrPrintPDF = (item: any) => {
    if (item.fileUrl) { window.open(item.fileUrl, '_blank'); } 
    else { alert(`المستند "${item.fileName || item.id}" محفوظ رقمياً في النظام.`); }
  };

  const handlePrintDocument = (item: any, docType: 'quote' | 'invoice') => {
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
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-title { display: flex; align-items: center; gap: 15px; }
            .logo-title img { height: 50px; object-fit: contain; }
            .company-info h2 { margin: 0; color: #0f172a; font-size: 1.3rem; }
            .company-info p { margin: 2px 0; font-size: 0.8rem; color: #475569; }
            .doc-meta { text-align: left; font-size: 0.9rem; color: #334155; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; font-size: 0.9rem; }
            th { background: #f1f5f9; }
            .terms-box { margin-top: 25px; background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #92400e; white-space: pre-line; }
            .total-section { margin-top: 20px; text-align: left; font-size: 1.05rem; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.8rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-title">
              <img src="${noorcastLogoUrl}" alt="Noorcast Logo" />
              <div class="company-info">
                <h2>${companyInfo.name}</h2>
                <p><strong>السجل التجاري:</strong> ${companyInfo.crNumber} | <strong>الرقم الضريبي:</strong> ${companyInfo.vatNumber}</p>
                <p><strong>العنوان:</strong> ${companyInfo.city}</p>
              </div>
            </div>
            <div class="doc-meta">
              <h3 style="margin: 0 0 5px 0; color: #2563eb;">${docType === 'invoice' ? 'فاتورة ضريبية رسمية' : 'عرض سعر'}</h3>
              <strong>رقم المستند:</strong> ${item.id}<br/>
              <strong>تاريخ الإصدار:</strong> ${item.date}<br/>
              ${item.dueDate ? `<strong>تاريخ الاستحقاق:</strong> ${item.dueDate}` : ''}
            </div>
          </div>

          <div class="box">
            <strong>موجّه إلى العميل / الجهة:</strong> ${item.client}<br/>
            ${item.clientTaxNumber ? `<strong>الرقم الضريبي للعميل:</strong> ${item.clientTaxNumber}<br/>` : ''}
            <strong>طبيعة الخدمة / المشروع:</strong> ${item.serviceType}
          </div>

          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>وصف الخدمة / البند</th>
                <th>المبلغ الأساسي</th>
                <th>الإجمالي غير شامل الضريبة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${item.serviceType}</td>
                <td>${subTotal.toLocaleString()} ر.س</td>
                <td>${subTotal.toLocaleString()} ر.س</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <p>المبلغ الخاضع للضريبة: ${subTotal.toLocaleString()} ر.س</p>
            <p>ضريبة القيمة المضافة (15%): ${vatAmount.toLocaleString()} ر.س</p>
            <p style="color: #2563eb; font-size: 1.2rem;">الإجمالي النهائي شامل الضريبة: ${finalTotal.toLocaleString()} ر.س</p>
          </div>

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

  const handlePrintFreelancerContract = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <title>عقد تقديم خدمات مستقل - ${item.freelancerName}</title>
          <style>
            body { font-family: 'Cairo', Tahoma, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.8; font-size: 0.95rem; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-title { display: flex; align-items: center; gap: 12px; }
            .logo-title img { height: 45px; object-fit: contain; }
            h1 { text-align: center; font-size: 1.3rem; color: #0f172a; margin: 0 0 5px 0; }
            .subtitle { text-align: center; font-size: 0.85rem; color: #64748b; margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #2563eb; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-title">
              <img src="${noorcastLogoUrl}" alt="Noorcast Logo" />
              <div><strong>${companyInfo.name}</strong></div>
            </div>
            <div style="font-size: 0.85rem; color: #475569;">رقم العقد: ${item.id}</div>
          </div>
          <h1>عقد تقديم خدمات (مستقل / فريلانسر)</h1>
          <div class="subtitle">التاريخ: ${item.date}</div>
          <p><strong>الطرف الأول:</strong> ${companyInfo.name} (${companyInfo.city})</p>
          <p><strong>الطرف الثاني:</strong> ${item.freelancerName}</p>
          <div class="section-title">المادة الأولى: نطاق العمل</div>
          <p>${item.projectTask}</p>
          <div class="section-title">المادة الثانية: المقابل المالي والمدة</div>
          <p>المبلغ: <strong>${Number(item.amount).toLocaleString()} ر.س</strong> | المدة: <strong>${item.duration}</strong></p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) { alert("لا توجد بيانات."); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredQuotes = quotes.filter(q => (q.client || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredClientContracts = clientContracts.filter(c => (c.party || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFreelancers = freelancerContracts.filter(f => (f.freelancerName || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInvoices = invoices.filter(i => (i.client || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredBills = incomingBills.filter(b => (b.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      {/* حقن قواعد الاستجابة الذكية (Media Queries) للعرض المزدوج */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-table-view { display: none !important; }
          .mobile-cards-view { display: flex !important; }
        }
        @media (min-width: 901px) {
          .desktop-table-view { display: block !important; }
          .mobile-cards-view { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>العقود والاتفاقيات والمستندات الرسمية</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            إدارة عروض الأسعار، الأرشيف القانوني، الفواتير الضريبية (صادر)، وفواتير الالتزامات والمصروفات (وارد)
          </p>
        </div>

        <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={secondaryBtn}>
          <FiSettings /> {isEditingProfile ? 'إغلاق إعدادات الشركة' : 'إعدادات بيانات الشركة والسجل التجاري ⚙️'}
        </button>
      </div>

      {isEditingProfile && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #3b82f6', marginBottom: '25px', boxSizing: 'border-box' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8', fontSize: '1.1rem' }}>⚙️ إعدادات بيانات المنشأة</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', boxSizing: 'border-box' }}>
            <div>
              <label style={labelStyle}>اسم المنشأة التجاري:</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: شركة نوركاست للإعلام والإنتاج" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>رقم السجل التجاري (C.R):</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: 1010000000" value={companyInfo.crNumber} onChange={e => setCompanyInfo({...companyInfo, crNumber: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>الرقم الضريبي (VAT Number):</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: 300000000000003" value={companyInfo.vatNumber} onChange={e => setCompanyInfo({...companyInfo, vatNumber: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>المدينة:</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: الرياض" value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'left' }}>
            <button onClick={() => { setIsEditingProfile(false); alert("تم حفظ البيانات! ✅"); }} style={primaryBtn}>حفظ الإعدادات 💾</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
          <input type="text" placeholder="بحث عام بالاسم أو الوصف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={searchInputStyle} />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'quotes' && <button onClick={() => { setEditingQuoteId(null); setIsQuoteModalOpen(true); }} style={primaryBtn}><FiPlus /> إنشاء عرض سعر ➕</button>}
          {activeTab === 'clients_contracts' && <button onClick={() => setIsClientContractModalOpen(true)} style={primaryBtn}><FiPlus /> رفع عقد PDF 📥</button>}
          {activeTab === 'freelancer_contracts' && <button onClick={() => setIsFreelancerModalOpen(true)} style={primaryBtn}><FiPlus /> عقد فريلانسر 📄</button>}
          {activeTab === 'invoices' && <button onClick={() => setIsInvoiceModalOpen(true)} style={primaryBtn}><FiPlus /> إصدار فاتورة ضريبية 💰</button>}
          {activeTab === 'incoming_bills' && <button onClick={() => setIsBillModalOpen(true)} style={primaryBtn}><FiPlus /> إضافة فاتورة التزام (وارد) 🧾</button>}
          <button onClick={() => exportToCSV(activeTab === 'quotes' ? quotes : activeTab === 'clients_contracts' ? clientContracts : activeTab === 'freelancer_contracts' ? freelancerContracts : activeTab === 'invoices' ? invoices : incomingBills, 'Report')} style={secondaryBtn}>
            <FiDownload /> تحميل (CSV) 📊
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('quotes')} style={activeTab === 'quotes' ? activeTabBtn : tabBtn}><FiFileText /> عروض الأسعار</button>
        <button onClick={() => setActiveTab('clients_contracts')} style={activeTab === 'clients_contracts' ? activeTabBtn : tabBtn}><FiBriefcase /> أرشيف العقود (PDF)</button>
        <button onClick={() => setActiveTab('freelancer_contracts')} style={activeTab === 'freelancer_contracts' ? activeTabBtn : tabBtn}><FiUserCheck /> عقود المستقلين</button>
        <button onClick={() => setActiveTab('invoices')} style={activeTab === 'invoices' ? activeTabBtn : tabBtn}><FiDollarSign /> الفواتير الضريبية (صادر / ايرادات)</button>
        <button onClick={() => setActiveTab('incoming_bills')} style={activeTab === 'incoming_bills' ? activeTabBtn : tabBtn}><FiCreditCard /> فواتير الالتزامات (وارد / مصروفات)</button>
      </div>

      {isQuoteModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveQuote} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>📄 عرض سعر احترافي</h3>
            <label style={labelStyle}>اسم العميل:</label>
            <input style={inputStyle} value={newQuote.clientName} onChange={e => setNewQuote({...newQuote, clientName: e.target.value})} required />
            <label style={labelStyle}>الرقم الضريبي:</label>
            <input style={inputStyle} value={newQuote.clientTaxNumber} onChange={e => setNewQuote({...newQuote, clientTaxNumber: e.target.value})} />
            <label style={labelStyle}>وصف الخدمة:</label>
            <input style={inputStyle} value={newQuote.serviceType} onChange={e => setNewQuote({...newQuote, serviceType: e.target.value})} required />
            <label style={labelStyle}>المبلغ غير شامل (ر.س):</label>
            <input type="number" style={inputStyle} value={newQuote.amount} onChange={e => setNewQuote({...newQuote, amount: Number(e.target.value)})} required />
            <label style={labelStyle}>الشروط:</label>
            <textarea rows={3} style={inputStyle} value={newQuote.terms} onChange={e => setNewQuote({...newQuote, terms: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ ✅'}</button>
              <button type="button" onClick={() => setIsQuoteModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
            </div>
          </form>
        </div>
      )}

      {isClientContractModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleUploadClientContract} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>📁 رفع عقد PDF جديد</h3>
            <label style={labelStyle}>عنوان العقد:</label>
            <input style={inputStyle} value={newClientContract.title} onChange={e => setNewClientContract({...newClientContract, title: e.target.value})} required />
            <label style={labelStyle}>الطرف الثاني:</label>
            <input style={inputStyle} value={newClientContract.party} onChange={e => setNewClientContract({...newClientContract, party: e.target.value})} required />
            <label style={labelStyle}>التصنيف:</label>
            <select style={inputStyle} value={newClientContract.type} onChange={e => setNewClientContract({...newClientContract, type: e.target.value})}>
              <option value="عميل">عميل</option>
              <option value="موظف">موظف</option>
            </select>
            <label style={labelStyle}>القيمة:</label>
            <input style={inputStyle} value={newClientContract.value} onChange={e => setNewClientContract({...newClientContract, value: e.target.value})} />
            <label style={labelStyle}>ملف العقد (PDF):</label>
            <input type="file" accept=".pdf" style={{ marginBottom: '15px' }} onChange={(e: any) => setNewClientContract({...newClientContract, file: e.target.files[0]})} required />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الرفع...' : 'رفع 📥'}</button>
              <button type="button" onClick={() => setIsClientContractModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
            </div>
          </form>
        </div>
      )}

      {isFreelancerModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveFreelancer} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>📄 عقد فريلانسر</h3>
            <label style={labelStyle}>اسم المستقل:</label>
            <input style={inputStyle} value={newFreelancer.freelancerName} onChange={e => setNewFreelancer({...newFreelancer, freelancerName: e.target.value})} required />
            <label style={labelStyle}>المهمة:</label>
            <input style={inputStyle} value={newFreelancer.projectTask} onChange={e => setNewFreelancer({...newFreelancer, projectTask: e.target.value})} required />
            <label style={labelStyle}>المبلغ (ر.س):</label>
            <input type="number" style={inputStyle} value={newFreelancer.amount} onChange={e => setNewFreelancer({...newFreelancer, amount: Number(e.target.value)})} required />
            <label style={labelStyle}>المدة:</label>
            <input style={inputStyle} value={newFreelancer.duration} onChange={e => setNewFreelancer({...newFreelancer, duration: e.target.value})} required />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الإصدار...' : 'إصدار ✅'}</button>
              <button type="button" onClick={() => setIsFreelancerModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
            </div>
          </form>
        </div>
      )}

      {isInvoiceModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleCreateInvoice} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>💰 فاتورة ضريبية رسمية</h3>
            <label style={labelStyle}>اسم العميل:</label>
            <input style={inputStyle} value={newInvoice.clientName} onChange={e => setNewInvoice({...newInvoice, clientName: e.target.value})} required />
            <label style={labelStyle}>الرقم الضريبي:</label>
            <input style={inputStyle} value={newInvoice.clientTaxNumber} onChange={e => setNewInvoice({...newInvoice, clientTaxNumber: e.target.value})} />
            <label style={labelStyle}>وصف الخدمة:</label>
            <input style={inputStyle} value={newInvoice.serviceType} onChange={e => setNewInvoice({...newInvoice, serviceType: e.target.value})} required />
            <label style={labelStyle}>المبلغ غير شامل الضريبة (ر.س):</label>
            <input type="number" style={inputStyle} value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: Number(e.target.value)})} required />
            <label style={labelStyle}>تاريخ الاستحقاق:</label>
            <input type="date" style={inputStyle} value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} required />
            <label style={labelStyle}>حالة الفاتورة الابتدائي:</label>
            <select style={inputStyle} value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value})}>
              <option value="مسودة">مسودة (0% - لا تُحسب)</option>
              <option value="تم الإرسال">تم الإرسال (0% - غير مسددة)</option>
              <option value="تم سداد المقدم">تم سداد المقدم (50% تحصيل تلقائي)</option>
              <option value="تم سداد الفاتورة كاملة">تم سداد الفاتورة كاملة (100% تحصيل)</option>
            </select>
            
            <label style={labelStyle}>إرفاق ملف الفاتورة / إيصال السداد (PDF):</label>
            <input type="file" accept=".pdf" style={{ marginBottom: '15px' }} onChange={(e: any) => setNewInvoice({...newInvoice, file: e.target.files[0]})} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الإصدار والحفظ...' : 'إصدار سحابياً 🖨️'}</button>
              <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
            </div>
          </form>
        </div>
      )}

      {isBillModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveBill} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontWeight: 'bold' }}>🧾 إضافة فاتورة التزام (وارد / مصروف)</h3>
            <label style={labelStyle}>اسم المورد:</label>
            <input placeholder="مثل: شركة الكهرباء أو اسم المستقل" style={inputStyle} value={newBill.supplier} onChange={e => setNewBill({...newBill, supplier: e.target.value})} required />
            
            <label style={labelStyle}>التصنيف المالي:</label>
            <select style={inputStyle} value={newBill.category} onChange={e => setNewBill({...newBill, category: e.target.value})}>
              <option value="إيجار المقر">إيجار المقر</option>
              <option value="مصروفات تشغيلية (كهرباء وماء)">مصروفات تشغيلية (كهرباء وماء)</option>
              <option value="اشتراكات برمجية وتقنية">اشتراكات برمجية وتقنية</option>
              <option value="مستحقات مستقلين ومزودين">مستحقات مستقلين ومزودين</option>
              <option value="مصروفات أخرى">مصروفات أخرى</option>
              <option value="تصنيف مخصص (أكتبه بنفسك)...">تصنيف مخصص (أكتبه بنفسك)...</option>
            </select>

            {newBill.category === 'تصنيف مخصص (أكتبه بنفسك)...' && (
              <>
                <label style={labelStyle}>اكتب التصنيف الجديد:</label>
                <input placeholder="مثل: ضيافة ومكتبية" style={inputStyle} value={newBill.customCategory} onChange={e => setNewBill({...newBill, customCategory: e.target.value})} required />
              </>
            )}

            <label style={labelStyle}>المبلغ (ر.س):</label>
            <input type="number" style={inputStyle} value={newBill.amount} onChange={e => setNewBill({...newBill, amount: Number(e.target.value)})} required />
            
            <label style={labelStyle}>تاريخ الاستحقاق:</label>
            <input type="date" style={inputStyle} value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})} required />

            <label style={labelStyle}>دورية السداد:</label>
            <select style={inputStyle} value={newBill.frequency} onChange={e => setNewBill({...newBill, frequency: e.target.value})}>
              <option value="شهري">شهري 🔄</option>
              <option value="ربع سنوي">ربع سنوي 📊</option>
              <option value="نصف سنوي">نصف سنوي 📆</option>
              <option value="سنوي">سنوي 📅</option>
              <option value="سداد لمرة واحدة">سداد لمرة واحدة ⚡</option>
            </select>

            <label style={labelStyle}>حالة الضريبة للقيمة المضافة:</label>
            <select style={inputStyle} value={newBill.isTaxable ? 'true' : 'false'} onChange={e => setNewBill({...newBill, isTaxable: e.target.value === 'true'})}>
              <option value="true">خاضع للضريبة (15% استردادية)</option>
              <option value="false">غير خاضع للضريبة (غير مستردة)</option>
            </select>

            <label style={labelStyle}>حالة السداد:</label>
            <select style={inputStyle} value={newBill.status} onChange={e => setNewBill({...newBill, status: e.target.value})}>
              <option value="مسددة">مسددة (رفع للسحابة)</option>
              <option value="قيد الانتظار">قيد الانتظار (معلقة)</option>
            </select>
            
            <label style={labelStyle}>إرفاق ملف الفاتورة / إيصال السداد (PDF):</label>
            <input type="file" accept=".pdf" style={{ marginBottom: '15px' }} onChange={(e: any) => setNewBill({...newBill, file: e.target.files[0]})} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ والترحيل...' : 'حفظ وترحيل سحابياً 📊'}</button>
              <button type="button" onClick={() => setIsBillModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '25px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
        
        {activeTab === 'quotes' && (
          <div>
            {/* 1. عرض الشاشات الكبيرة واللابتوب */}
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العرض', 'العميل', 'نطاق الخدمة', 'المبلغ غير شامل', 'الضريبة (15%)', 'الإجمالي', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((q: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{q.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{q.client}</td>
                      <td style={tdStyle}>{q.serviceType}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{Number(q.amount).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#f59e0b', whiteSpace: 'nowrap' }}>{Number(q.vat).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(q.total).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handlePrintDocument(q, 'quote')} style={actionBtn} title="طباعة">طباعة</button>
                          <button onClick={() => handleEditQuote(q)} style={iconEditBtn} title="تعديل"><FiEdit2 /></button>
                          <button onClick={() => handleDeleteQuote(q.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. عرض الجوال */}
            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {filteredQuotes.map((q: any, idx: number) => (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{q.id}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{Number(q.total).toLocaleString()} ر.س</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{q.client}</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{q.serviceType}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                    <button onClick={() => handlePrintDocument(q, 'quote')} style={{ ...actionBtn, flex: 1, padding: '8px' }}>طباعة</button>
                    <button onClick={() => handleEditQuote(q)} style={{ ...iconEditBtn, flex: 1, padding: '8px' }}>تعديل</button>
                    <button onClick={() => handleDeleteQuote(q.id)} style={{ ...iconDeleteBtn, flex: 1, padding: '8px' }}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'clients_contracts' && (
          <div>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العقد', 'عنوان العقد', 'الطرف الثاني', 'التصنيف', 'الملف', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredClientContracts.map((c: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{c.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{c.title}</td>
                      <td style={tdStyle}>{c.party}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}><span style={{ padding: '4px 8px', borderRadius: '6px', background: c.type === 'عميل' ? '#1e40af' : '#6b21a8', color: 'white', fontSize: '0.75rem' }}>{c.type}</span></td>
                      <td style={{ ...tdStyle, color: '#94a3b8', whiteSpace: 'nowrap' }}>{c.fileName}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handleViewOrPrintPDF(c)} style={actionBtn}>معاينة PDF</button>
                          <button onClick={() => handleDeleteClientContract(c.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {filteredClientContracts.map((c: any, idx: number) => (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{c.id}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: c.type === 'عميل' ? '#1e40af' : '#6b21a8', color: 'white', fontSize: '0.75rem' }}>{c.type}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{c.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>الطرف الثاني: {c.party}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                    <button onClick={() => handleViewOrPrintPDF(c)} style={{ ...actionBtn, flex: 1, padding: '8px' }}>معاينة PDF</button>
                    <button onClick={() => handleDeleteClientContract(c.id)} style={{ ...iconDeleteBtn, flex: 1, padding: '8px' }}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'freelancer_contracts' && (
          <div>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العقد', 'اسم المستقل', 'المهمة', 'المبلغ', 'المدة', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredFreelancers.map((f: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{f.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{f.freelancerName}</td>
                      <td style={tdStyle}>{f.projectTask}</td>
                      <td style={{ ...tdStyle, color: '#4ade80', whiteSpace: 'nowrap' }}>{Number(f.amount).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{f.duration}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handlePrintFreelancerContract(f)} style={actionBtn}>طباعة</button>
                          <button onClick={() => handleDeleteFreelancer(f.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {filteredFreelancers.map((f: any, idx: number) => (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{f.id}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{Number(f.amount).toLocaleString()} ر.س</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{f.freelancerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{f.projectTask} (المدة: {f.duration})</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                    <button onClick={() => handlePrintFreelancerContract(f)} style={{ ...actionBtn, flex: 1, padding: '8px' }}>طباعة</button>
                    <button onClick={() => handleDeleteFreelancer(f.id)} style={{ ...iconDeleteBtn, flex: 1, padding: '8px' }}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم الفاتورة', 'العميل', 'المبلغ (غير شامل)', 'الإجمالي شامل الضريبة', 'تاريخ الاستحقاق', 'حالة السداد', 'ملف PDF', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{inv.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{inv.client}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{Number(inv.amount || 0).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(inv.total || (inv.amount * 1.15)).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#f59e0b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{inv.dueDate || '-'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <select 
                          value={inv.status} 
                          onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                          disabled={isSubmitting}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: inv.status.includes('كاملة') || inv.status === 'تم التنفيذ' ? '#065f46' : inv.status.includes('مقدم') ? '#b45309' : '#334155', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                        >
                          <option value="مسودة">مسودة</option>
                          <option value="تم الإرسال">تم الإرسال</option>
                          <option value="تم سداد المقدم">مقدم 50%</option>
                          <option value="تم سداد الفاتورة كاملة">مسددة كاملة</option>
                        </select>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {inv.fileUrl ? (
                            <>
                              <button onClick={() => handleViewOrPrintPDF(inv)} style={actionBtn}>عرض 📄</button>
                              <button onClick={() => handleRemoveInvoiceFile(inv.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }} title="إزالة الملف">❌</button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>بدون ملف</span>
                          )}
                          <label style={{ cursor: 'pointer', background: '#334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', border: '1px solid #475569' }} title="رفع ملف PDF">
                            <FiUpload /> رفع
                            <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e: any) => { if(e.target.files[0]) handleUploadInvoiceFile(inv.id, e.target.files[0]); }} />
                          </label>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handlePrintDocument(inv, 'invoice')} style={actionBtn}>طباعة</button>
                          <button onClick={() => handleDeleteInvoice(inv.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {filteredInvoices.map((inv: any, idx: number) => (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{inv.id}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{Number(inv.total || (inv.amount * 1.15)).toLocaleString()} ر.س</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{inv.client}</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{inv.serviceType} (الاستحقاق: {inv.dueDate || '-'})</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                    <select 
                      value={inv.status} 
                      onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                      disabled={isSubmitting}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: inv.status.includes('كاملة') || inv.status === 'تم التنفيذ' ? '#065f46' : '#334155', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', outline: 'none' }}
                    >
                      <option value="مسودة">مسودة</option>
                      <option value="تم الإرسال">تم الإرسال</option>
                      <option value="تم سداد المقدم">مقدم 50%</option>
                      <option value="تم سداد الفاتورة كاملة">مسددة كاملة</option>
                    </select>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handlePrintDocument(inv, 'invoice')} style={actionBtn}>طباعة</button>
                      <button onClick={() => handleDeleteInvoice(inv.id)} style={iconDeleteBtn}><FiTrash2 /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'incoming_bills' && (
          <div>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '950px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم الفاتورة', 'المورد / الجهة', 'التصنيف المالي', 'المبلغ', 'دورية السداد', 'تاريخ الاستحقاق', 'حالة السداد', 'ملف PDF', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map((b: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                        <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{b.id}</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>{b.supplier}</td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}><span style={{ padding: '4px 8px', borderRadius: '6px', background: '#b45309', color: 'white', fontSize: '0.75rem' }}>{b.category}</span></td>
                        <td style={{ ...tdStyle, color: '#ef4444', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(b.amount).toLocaleString()} ر.س</td>
                        <td style={{ ...tdStyle, color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{b.frequency || 'شهري'}</td>
                        <td style={{ ...tdStyle, color: '#f59e0b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{b.dueDate || '-'}</td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <select 
                            value={b.status} 
                            onChange={(e) => handleUpdateBillStatus(b.id, e.target.value)}
                            disabled={isSubmitting}
                            style={{ padding: '6px 10px', borderRadius: '6px', background: b.status === 'مسددة' ? '#065f46' : '#b45309', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="مسددة">مسددة</option>
                            <option value="قيد الانتظار">قيد الانتظار</option>
                          </select>
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {b.fileUrl ? (
                              <>
                                <button onClick={() => handleViewOrPrintPDF(b)} style={actionBtn}>عرض 📄</button>
                                <button onClick={() => handleRemoveBillFile(b.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }} title="إزالة الملف">❌</button>
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>بدون ملف</span>
                            )}
                            <label style={{ cursor: 'pointer', background: '#334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', border: '1px solid #475569' }} title="رفع ملف PDF">
                              <FiUpload /> رفع
                              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e: any) => { if(e.target.files[0]) handleUploadBillFile(b.id, e.target.files[0]); }} />
                            </label>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => handleViewOrPrintPDF(b)} style={actionBtn}>معاينة</button>
                            <button onClick={() => handleDeleteBill(b.id)} style={iconDeleteBtn} title="حذف"><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد فواتير التزامات واردة.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {filteredBills.length > 0 ? (
                filteredBills.map((b: any, idx: number) => (
                  <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{b.id}</span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{Number(b.amount).toLocaleString()} ر.س</span>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{b.supplier}</div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>التصنيف: {b.category} (الاستحقاق: {b.dueDate || '-'})</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                      <select 
                        value={b.status} 
                        onChange={(e) => handleUpdateBillStatus(b.id, e.target.value)}
                        disabled={isSubmitting}
                        style={{ padding: '6px 10px', borderRadius: '6px', background: b.status === 'مسددة' ? '#065f46' : '#b45309', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', outline: 'none' }}
                      >
                        <option value="مسددة">مسددة</option>
                        <option value="قيد الانتظار">قيد الانتظار</option>
                      </select>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleViewOrPrintPDF(b)} style={actionBtn}>معاينة</button>
                        <button onClick={() => handleDeleteBill(b.id)} style={iconDeleteBtn}><FiTrash2 /></button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد فواتير التزامات واردة.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, fontWeight: 'bold' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, verticalAlign: 'middle' as const };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const inputStyleWithPlaceholder = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', backgroundColor: '#ffffff', fontSize: '0.9rem', outline: 'none' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block', marginBottom: '5px' };
const primaryBtn = { padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };
const secondaryBtn = { padding: '8px 16px', background: '#334155', border: '1px solid #475569', borderRadius: '8px', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', whiteSpace: 'nowrap' as const };
const iconEditBtn = { background: '#2563eb', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const iconDeleteBtn = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const tabBtn = { padding: '10px 18px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' as const };
const activeTabBtn = { padding: '10px 18px', background: '#2563eb', border: '1px solid #2563eb', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' as const };
const searchInputStyle = { width: '100%', padding: '10px 35px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: 'white', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px', boxSizing: 'border-box' as const };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const, boxSizing: 'border-box' as const };