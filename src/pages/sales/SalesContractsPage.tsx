import { useState, useEffect } from 'react';
import { FiPlus, FiFileText, FiDownload, FiDollarSign, FiSettings, FiEdit2, FiTrash2, FiSearch, FiCreditCard, FiUpload, FiRefreshCw, FiX } from 'react-icons/fi';
import {  
  saveInvoiceToSheet,  
  saveExpenseToSheet,  
  saveIncomingBillToSheet,  
  getFreelanceFinanceSheet,  
  saveFreelanceFinanceToSheet,
  getInvoicesSheet,
  getIncomingBillsSheet,
  getQuotesSheet,
  saveQuoteToSheet,
  uploadFileToCloudinary
} from '@/services/dbService';

export default function SalesContractsPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'invoices' | 'incoming_bills'>('quotes');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCloud, setLoadingCloud] = useState(false);

  const noorcastLogoUrl = 'https://res.cloudinary.com/dfwfh4xzb/image/upload/v1782727817/WhatsApp_Image_2026-06-21_at_12.56.07_AM_dhzswc.png';

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

  const [companyInfo, setCompanyInfo] = useState(() => {
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

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [incomingBills, setIncomingBills] = useState<any[]>([]);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const [newQuote, setNewQuote] = useState({ 
    clientName: '', 
    clientTaxNumber: '', 
    terms: 'صالح لمدة 15 يوماً.',
    items: [{ serviceName: '', quantity: 1, description: '', unitPrice: 0 }]
  });

  const [newInvoice, setNewInvoice] = useState({ 
    clientName: '', 
    clientTaxNumber: '', 
    status: 'تم الإرسال', 
    dueDate: new Date().toISOString().split('T')[0], 
    file: null as File | null,
    items: [{ serviceName: '', quantity: 1, description: '', unitPrice: 0 }]
  });
  
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

  useEffect(() => {
    loadCloudDocuments();
  }, []);

  const loadCloudDocuments = async () => {
    try {
      setLoadingCloud(true);
      const [cloudQuotes, cloudInvoices, cloudBills] = await Promise.all([
        getQuotesSheet().catch(() => []),
        getInvoicesSheet().catch(() => []),
        getIncomingBillsSheet().catch(() => [])
      ]);

      if (Array.isArray(cloudQuotes)) {
        setQuotes(cloudQuotes.map((q: any) => ({
          id: String(q.id || 'QT-2026'),
          client: String(q.client || ''),
          clientTaxNumber: String(q.clientTaxNumber || ''),
          items: Array.isArray(q.items) ? q.items : [{ serviceName: q.serviceType || 'خدمة', quantity: 1, description: '', unitPrice: cleanPrice(q.amount) }],
          amount: Number(q.amount || 0),
          vat: Number(q.vat || 0),
          total: Number(q.total || 0),
          terms: String(q.terms || ''),
          fileUrl: q.fileUrl || '',
          date: formatDate(q.date)
        })));
      }

      if (Array.isArray(cloudInvoices)) {
        setInvoices(cloudInvoices.map((inv: any) => ({
          id: String(inv.id || inv.number || 'INV'),
          client: String(inv.client || ''),
          clientTaxNumber: String(inv.clientTaxNumber || ''),
          items: Array.isArray(inv.items) ? inv.items : [{ serviceName: inv.serviceType || 'خدمة', quantity: 1, description: '', unitPrice: cleanPrice(inv.amount) / 1.15 }],
          amount: Number(inv.amount || 0) / 1.15,
          vat: Number(inv.amount || 0) - (Number(inv.amount || 0) / 1.15),
          total: Number(inv.amount || 0),
          status: String(inv.status || 'تم الإرسال'),
          dueDate: formatDate(inv.dueDate),
          date: formatDate(inv.date),
          fileUrl: inv.fileUrl || '',
          fileName: inv.fileUrl ? 'فاتورة_صادرة.pdf' : ''
        })));
      }

      if (Array.isArray(cloudBills)) {
        setIncomingBills(cloudBills.map((b: any) => ({
          id: String(b.id || 'BILL'),
          supplier: String(b.supplier || ''),
          category: String(b.category || ''),
          amount: Number(b.amount || 0),
          frequency: String(b.frequency || 'شهري'),
          dueDate: formatDate(b.dueDate),
          date: formatDate(b.date),
          status: String(b.status || 'مسددة'),
          isTaxable: b.isTaxable !== false && b.isTaxable !== 'false',
          fileUrl: b.fileUrl || '',
          fileName: b.fileUrl ? 'فاتورة_التزام.pdf' : ''
        })));
      }
    } catch (err) {
      console.error("خطأ في جلب بيانات الفواتير سحابياً:", err);
    } finally {
      setLoadingCloud(false);
    }
  };

  useEffect(() => { try { localStorage.setItem('noorcast_company_profile', JSON.stringify(companyInfo)); } catch {} }, [companyInfo]);

  const handleQuoteItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newQuote.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewQuote({ ...newQuote, items: updatedItems });
  };
  const handleAddQuoteItem = () => {
    setNewQuote({ ...newQuote, items: [...newQuote.items, { serviceName: '', quantity: 1, description: '', unitPrice: 0 }] });
  };
  const handleRemoveQuoteItem = (index: number) => {
    if (newQuote.items.length === 1) return;
    setNewQuote({ ...newQuote, items: newQuote.items.filter((_, i) => i !== index) });
  };
  const calculateQuoteSubtotal = () => newQuote.items.reduce((sum, item) => sum + (cleanPrice(item.quantity) * cleanPrice(item.unitPrice)), 0);

  const handleInvoiceItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };
  const handleAddInvoiceItem = () => {
    setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { serviceName: '', quantity: 1, description: '', unitPrice: 0 }] });
  };
  const handleRemoveInvoiceItem = (index: number) => {
    if (newInvoice.items.length === 1) return;
    setNewInvoice({ ...newInvoice, items: newInvoice.items.filter((_, i) => i !== index) });
  };
  const calculateInvoiceSubtotal = () => newInvoice.items.reduce((sum, item) => sum + (cleanPrice(item.quantity) * cleanPrice(item.unitPrice)), 0);

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
      
      const targetInv = updated.find(i => i.id === id);
      if (targetInv) {
        await saveInvoiceToSheet({
          id: targetInv.id,
          number: targetInv.id,
          client: targetInv.client,
          amount: targetInv.total || targetInv.amount,
          status: newStatus,
          dueDate: targetInv.dueDate || new Date().toISOString().split('T')[0],
          isExternal: true,
          fileUrl: targetInv.fileUrl || '',
          items: targetInv.items
        });
      }
      alert(`تم تحديث حالة الفاتورة الصادرة إلى [${newStatus}] سحابياً بنجاح! 🔄☁️`);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التحديث السحابي.");
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
          isTaxable: targetBill.isTaxable ?? true,
          fileUrl: targetBill.fileUrl || ''
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

  const handleUploadInvoiceFile = async (id: string, file: File) => {
    setIsSubmitting(true);
    try {
      const fileUrl = await uploadFileToCloudinary(file);
      const updated = invoices.map(inv => inv.id === id ? { ...inv, fileName: file.name, fileUrl } : inv);
      setInvoices(updated);

      const targetInv = updated.find(i => i.id === id);
      if (targetInv) {
        await saveInvoiceToSheet({
          id: targetInv.id,
          number: targetInv.id,
          client: targetInv.client,
          amount: targetInv.total || targetInv.amount,
          status: targetInv.status,
          dueDate: targetInv.dueDate,
          isExternal: true,
          fileUrl,
          items: targetInv.items
        });
      }
      alert(`تم رفع ملف الفاتورة الصادرة سحابياً بنجاح! 📎☁️`);
    } catch (err) {
      console.error(err);
      alert("فشل رفع الملف للسحابة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadBillFile = async (id: string, file: File) => {
    setIsSubmitting(true);
    try {
      const fileUrl = await uploadFileToCloudinary(file);
      const updated = incomingBills.map(b => b.id === id ? { ...b, fileName: file.name, fileUrl } : b);
      setIncomingBills(updated);

      const targetBill = updated.find(b => b.id === id);
      if (targetBill) {
        await saveIncomingBillToSheet({
          id: targetBill.id,
          supplier: targetBill.supplier,
          category: targetBill.category,
          amount: targetBill.amount,
          status: targetBill.status,
          frequency: targetBill.frequency,
          dueDate: targetBill.dueDate,
          date: targetBill.date,
          isTaxable: targetBill.isTaxable,
          fileUrl
        });
      }
      alert(`تم رفع ملف الالتزام سحابياً بنجاح! 📎☁️`);
    } catch (err) {
      console.error(err);
      alert("فشل رفع الملف للسحابة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.clientName || newQuote.items.length === 0) { alert("أدخل اسم العميل وبند واحد على الأقل."); return; }
    setIsSubmitting(true);
    
    try {
      const subTotal = calculateQuoteSubtotal();
      const vat = subTotal * 0.15;
      const total = subTotal + vat;
      const quoteId = editingQuoteId || `QT-2026-${Math.floor(100 + Math.random() * 900)}`;

      const quoteData = {
        id: quoteId,
        client: newQuote.clientName,
        clientTaxNumber: newQuote.clientTaxNumber,
        items: newQuote.items,
        amount: subTotal,
        vat,
        total,
        terms: newQuote.terms,
        fileUrl: '',
        date: new Date().toISOString().split('T')[0]
      };

      await saveQuoteToSheet(quoteData);

      const formattedQuote = { ...quoteData, date: formatDate(quoteData.date) };
      if (editingQuoteId) {
        setQuotes(quotes.map(q => q.id === editingQuoteId ? formattedQuote : q));
        setEditingQuoteId(null);
      } else {
        setQuotes([formattedQuote, ...quotes]);
      }

      setIsQuoteModalOpen(false);
      setNewQuote({ clientName: '', clientTaxNumber: '', terms: 'صالح لمدة 15 يوماً.', items: [{ serviceName: '', quantity: 1, description: '', unitPrice: 0 }] });
      alert("تم حفظ عرض السعر وترحيله سحابياً بنجاح! ✅☁️");
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
      items: Array.isArray(q.items) && q.items.length > 0 ? q.items : [{ serviceName: q.serviceType || 'خدمة', quantity: 1, description: '', unitPrice: cleanPrice(q.amount) }]
    });
    setIsQuoteModalOpen(true);
  };
  const handleDeleteQuote = (id: string) => { if (confirm("حذف العرض؟")) setQuotes(quotes.filter(q => q.id !== id)); };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientName || newInvoice.items.length === 0) { alert("أدخل اسم العميل وبند واحد على الأقل."); return; }
    
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (newInvoice.file) {
        fileUrl = await uploadFileToCloudinary(newInvoice.file);
      }

      const subTotal = calculateInvoiceSubtotal();
      const vat = subTotal * 0.15;
      const total = subTotal + vat;
      const invoiceId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
      
      const created = { 
        id: invoiceId, 
        client: newInvoice.clientName, 
        clientTaxNumber: newInvoice.clientTaxNumber, 
        items: newInvoice.items,
        amount: subTotal, 
        vat, 
        total, 
        status: newInvoice.status, 
        dueDate: formatDate(newInvoice.dueDate), 
        date: formatDate(new Date()),
        fileName: newInvoice.file ? newInvoice.file.name : 'فاتورة_صادرة.pdf',
        fileUrl,
        isExternal: true 
      };
      
      setInvoices([created, ...invoices]);

      await saveInvoiceToSheet({
        id: invoiceId,
        number: invoiceId,
        client: created.client,
        amount: total,
        status: created.status,
        dueDate: created.dueDate,
        isExternal: true,
        fileUrl,
        items: created.items
      });

      setIsInvoiceModalOpen(false);
      setNewInvoice({ clientName: '', clientTaxNumber: '', status: 'تم الإرسال', dueDate: new Date().toISOString().split('T')[0], file: null, items: [{ serviceName: '', quantity: 1, description: '', unitPrice: 0 }] });
      alert(`تم إصدار الفاتورة وحفظها سحابياً بنجاح! 💰☁️`);
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
    }
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBill.supplier || !newBill.amount) { alert("أدخل اسم المورد والمبلغ."); return; }
    
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (newBill.file) {
        fileUrl = await uploadFileToCloudinary(newBill.file);
      }

      const finalCategory = newBill.category === 'تصنيف مخصص (أكتبه بنفسك)...' ? (newBill.customCategory || 'أخرى') : newBill.category;
      const billId = `BILL-${Math.floor(100 + Math.random() * 900)}`;
      
      const created = {
        id: billId,
        supplier: newBill.supplier,
        category: finalCategory,
        amount: Number(newBill.amount),
        isTaxable: newBill.isTaxable,
        fileName: newBill.file ? newBill.file.name : 'فاتورة_التزام.pdf',
        fileUrl,
        date: formatDate(new Date()),
        dueDate: formatDate(newBill.dueDate),
        status: newBill.status,
        frequency: newBill.frequency
      };

      setIncomingBills([created, ...incomingBills]);

      await saveIncomingBillToSheet({
        id: created.id,
        supplier: created.supplier,
        category: created.category,
        amount: created.amount,
        isTaxable: created.isTaxable,
        status: created.status,
        frequency: created.frequency,
        dueDate: created.dueDate,
        date: created.date,
        fileUrl
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
      alert("تم حفظ فاتورة الالتزام وترحيلها سحابياً بنجاح! 📊☁️");
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
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }
            .logo-img { height: 45px; object-fit: contain; margin-bottom: 10px; }
            .main-comp { font-size: 1.25rem; font-weight: bold; color: #0f172a; }
            .sub-comp { font-size: 0.95rem; color: #64748b; margin-top: 4px; }
            .doc-header-center { text-align: center; margin-bottom: 25px; }
            .doc-header-center h3 { margin: 0 0 8px 0; color: #2563eb; font-size: 1.3rem; }
            .doc-meta { font-size: 0.9rem; color: #334155; line-height: 1.6; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; font-size: 0.9rem; }
            th { background: #f1f5f9; }
            .terms-box { margin-top: 20px; background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #92400e; white-space: pre-line; }
            .bank-box { margin-top: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; font-size: 0.85rem; color: #166534; }
            .bank-box h4 { margin: 0 0 8px 0; color: #15803d; }
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
            <h3>${docType === 'invoice' ? 'فاتورة ضريبية رسمية' : 'عرض سعر'}</h3>
            <div class="doc-meta">
              <strong>رقم المستند:</strong> ${item.id} &nbsp;|&nbsp; 
              <strong>تاريخ الإصدار:</strong> ${formatDate(item.date)} 
              ${item.dueDate ? `&nbsp;|&nbsp; <strong>تاريخ الاستحقاق:</strong> ${formatDate(item.dueDate)}` : ''}
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
                <th>اسم الخدمة</th>
                <th>الكمية</th>
                <th>الوصف التفصيلي</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${Array.isArray(item.items) ? item.items.map((it: any, i: number) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${it.serviceName}</strong></td>
                  <td>${it.quantity}</td>
                  <td>${it.description || '-'}</td>
                  <td>${cleanPrice(it.unitPrice).toLocaleString()} ر.س</td>
                  <td>${(cleanPrice(it.quantity) * cleanPrice(it.unitPrice)).toLocaleString()} ر.س</td>
                </tr>
              `).join('') : `
                <tr>
                  <td>1</td>
                  <td>خدمة</td>
                  <td>1</td>
                  <td>-</td>
                  <td>${subTotal.toLocaleString()} ر.س</td>
                  <td>${subTotal.toLocaleString()} ر.س</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="total-section">
            <p>المبلغ غير شامل الضريبة: ${subTotal.toLocaleString()} ر.س</p>
            <p>ضريبة القيمة المضافة (15%): ${vatAmount.toLocaleString()} ر.س</p>
            <p style="color: #2563eb; font-size: 1.2rem;">الإجمالي النهائي شامل الضريبة: ${finalTotal.toLocaleString()} ر.س</p>
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
  const filteredInvoices = invoices.filter(i => (i.client || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredBills = incomingBills.filter(b => (b.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      {/* الترويسة العليا باسم الشركة الرئيسي */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '18px' }}>
        <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.5px' }}>
          {companyInfo.mainCompanyName || 'شركة النوركاست العالمية المحدودة'}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '5px' }}>
          السجل التجاري: {companyInfo.crNumber} | الرقم الضريبي: {companyInfo.vatNumber}
        </div>
      </div>

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
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>إدارة الفواتير وعروض الأسعار</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            إدارة عروض الأسعار، الفواتير الضريبية (صادر)، وفواتير الالتزامات والمصروفات (وارد)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadCloudDocuments} style={secondaryBtn} disabled={loadingCloud}>
            <FiRefreshCw /> {loadingCloud ? 'جاري المزامنة...' : 'مزامنة المستندات سحابياً 🔄'}
          </button>
          <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={secondaryBtn}>
            <FiSettings /> {isEditingProfile ? 'إغلاق إعدادات الشركة' : 'إعدادات الشركة والبنوك ⚙️'}
          </button>
        </div>
      </div>

      {isEditingProfile && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #3b82f6', marginBottom: '25px', boxSizing: 'border-box' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8', fontSize: '1.1rem' }}>⚙️ إعدادات بيانات المنشأة والحسابات البنكية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', boxSizing: 'border-box' }}>
            <div>
              <label style={labelStyle}>اسم الشركة الرئيسي (في ترويسة الفواتير):</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: شركة النوركاست العالمية المحدودة" value={companyInfo.mainCompanyName || ''} onChange={e => setCompanyInfo({...companyInfo, mainCompanyName: e.target.value})} />
            </div>
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
            <div>
              <label style={labelStyle}>اسم البنك:</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: مصرف الراجحي" value={companyInfo.bankName || ''} onChange={e => setCompanyInfo({...companyInfo, bankName: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>اسم الحساب البنكي:</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: شركة نوركاست" value={companyInfo.bankAccountName || ''} onChange={e => setCompanyInfo({...companyInfo, bankAccountName: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>رقم الآيبان (IBAN):</label>
              <input style={inputStyleWithPlaceholder} placeholder="مثل: SA0380000000108010000003" value={companyInfo.bankIban || ''} onChange={e => setCompanyInfo({...companyInfo, bankIban: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '15px', textAlign: 'left' }}>
            <button onClick={() => { setIsEditingProfile(false); alert("تم حفظ إعدادات المنشأة والبنوك بنجاح! ✅"); }} style={primaryBtn}>حفظ الإعدادات 💾</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
          <input type="text" placeholder="بحث عام بالاسم أو الوصف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={searchInputStyle} />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'quotes' && <button onClick={() => { setEditingQuoteId(null); setIsQuoteModalOpen(true); }} style={primaryBtn}><FiPlus /> إنشاء عرض سعر تفصيلي ➕</button>}
          {activeTab === 'invoices' && <button onClick={() => setIsInvoiceModalOpen(true)} style={primaryBtn}><FiPlus /> إصدار فاتورة ضريبية تفصيلية 💰</button>}
          {activeTab === 'incoming_bills' && <button onClick={() => setIsBillModalOpen(true)} style={primaryBtn}><FiPlus /> إضافة فاتورة التزام (وارد) 🧾</button>}
          <button onClick={() => exportToCSV(activeTab === 'quotes' ? quotes : activeTab === 'invoices' ? invoices : incomingBills, 'Report')} style={secondaryBtn}>
            <FiDownload /> تحميل (CSV) 📊
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('quotes')} style={activeTab === 'quotes' ? activeTabBtn : tabBtn}><FiFileText /> عروض الأسعار</button>
        <button onClick={() => setActiveTab('invoices')} style={activeTab === 'invoices' ? activeTabBtn : tabBtn}><FiDollarSign /> الفواتير الضريبية (صادر)</button>
        <button onClick={() => setActiveTab('incoming_bills')} style={activeTab === 'incoming_bills' ? activeTabBtn : tabBtn}><FiCreditCard /> فواتير الالتزامات (وارد)</button>
      </div>

      {/* مودال عروض الأسعار مع البنود المتعددة */}
      {isQuoteModalOpen && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 'bold' }}>📄 عرض سعر تفصيلي جديد</h3>
              <button onClick={() => setIsQuoteModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiX size={20} /></button>
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

              <div style={{ margin: '15px 0 10px 0', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, fontSize: '0.95rem', color: '#2563eb' }}>بنود عرض السعر (الخدمة - الكمية - الوصف - سعر الوحدة):</label>
                  <button type="button" onClick={handleAddQuoteItem} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    + إضافة بند جديد
                  </button>
                </div>

                {newQuote.items.map((item, index) => (
                  <div key={index} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        style={{ ...inputStyle, flex: 2, margin: 0 }} 
                        placeholder="اسم الخدمة (مثل: تصوير فوتوغرافي)" 
                        value={item.serviceName} 
                        onChange={e => handleQuoteItemChange(index, 'serviceName', e.target.value)} 
                        required 
                      />
                      <input 
                        type="number" 
                        style={{ ...inputStyle, width: '90px', margin: 0 }} 
                        placeholder="الكمية" 
                        value={item.quantity} 
                        min="1"
                        onChange={e => handleQuoteItemChange(index, 'quantity', e.target.value)} 
                        required 
                      />
                      <input 
                        type="number" 
                        style={{ ...inputStyle, width: '130px', margin: 0 }} 
                        placeholder="سعر الوحدة (ر.س)" 
                        value={item.unitPrice} 
                        onChange={e => handleQuoteItemChange(index, 'unitPrice', e.target.value)} 
                        required 
                      />
                      {newQuote.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveQuoteItem(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' }} title="حذف البند">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea 
                      style={{ ...inputStyle, margin: 0, height: '55px', resize: 'vertical' }} 
                      placeholder="وصف الخدمة التفصيلي..." 
                      value={item.description} 
                      onChange={e => handleQuoteItemChange(index, 'description', e.target.value)} 
                    />
                    <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'left' }}>
                      إجمالي البند: <strong style={{ color: '#16a34a' }}>{(cleanPrice(item.quantity) * cleanPrice(item.unitPrice)).toLocaleString()} ر.س</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f1f5f9', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>الإجمالي الكلي (غير شامل الضريبة):</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#16a34a' }}>{calculateQuoteSubtotal().toLocaleString()} ر.س</span>
              </div>

              <label style={labelStyle}>الشروط والأحكام:</label>
              <textarea rows={3} style={inputStyle} value={newQuote.terms} onChange={e => setNewQuote({...newQuote, terms: e.target.value})} />

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ وترحيل سحابياً ✅'}</button>
                <button type="button" onClick={() => setIsQuoteModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال الفواتير الضريبية مع البنود المتعددة */}
      {isInvoiceModalOpen && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 'bold' }}>💰 فاتورة ضريبية رسمية تفصيلية</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiX size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>اسم العميل *</label>
                  <input style={inputStyle} value={newInvoice.clientName} onChange={e => setNewInvoice({...newInvoice, clientName: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>الرقم الضريبي للعميل</label>
                  <input style={inputStyle} value={newInvoice.clientTaxNumber} onChange={e => setNewInvoice({...newInvoice, clientTaxNumber: e.target.value})} />
                </div>
              </div>

              <div style={{ margin: '15px 0 10px 0', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, fontSize: '0.95rem', color: '#2563eb' }}>بنود الفاتورة (الخدمة - الكمية - الوصف - سعر الوحدة):</label>
                  <button type="button" onClick={handleAddInvoiceItem} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    + إضافة بند جديد
                  </button>
                </div>

                {newInvoice.items.map((item, index) => (
                  <div key={index} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        style={{ ...inputStyle, flex: 2, margin: 0 }} 
                        placeholder="اسم الخدمة (مثل: مونتاج فيديو)" 
                        value={item.serviceName} 
                        onChange={e => handleInvoiceItemChange(index, 'serviceName', e.target.value)} 
                        required 
                      />
                      <input 
                        type="number" 
                        style={{ ...inputStyle, width: '90px', margin: 0 }} 
                        placeholder="الكمية" 
                        value={item.quantity} 
                        min="1"
                        onChange={e => handleInvoiceItemChange(index, 'quantity', e.target.value)} 
                        required 
                      />
                      <input 
                        type="number" 
                        style={{ ...inputStyle, width: '130px', margin: 0 }} 
                        placeholder="سعر الوحدة (ر.س)" 
                        value={item.unitPrice} 
                        onChange={e => handleInvoiceItemChange(index, 'unitPrice', e.target.value)} 
                        required 
                      />
                      {newInvoice.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveInvoiceItem(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' }} title="حذف البند">
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea 
                      style={{ ...inputStyle, margin: 0, height: '55px', resize: 'vertical' }} 
                      placeholder="وصف الخدمة التفصيلي..." 
                      value={item.description} 
                      onChange={e => handleInvoiceItemChange(index, 'description', e.target.value)} 
                    />
                    <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'left' }}>
                      إجمالي البند: <strong style={{ color: '#16a34a' }}>{(cleanPrice(item.quantity) * cleanPrice(item.unitPrice)).toLocaleString()} ر.س</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f1f5f9', padding: '12px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>الإجمالي الكلي (شامل الضريبة 15%):</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>{(calculateInvoiceSubtotal() * 1.15).toLocaleString()} ر.س</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>تاريخ الاستحقاق:</label>
                  <input type="date" style={inputStyle} value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>حالة السداد:</label>
                  <select style={inputStyle} value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value})}>
                    <option value="مسودة">مسودة</option>
                    <option value="تم الإرسال">تم الإرسال</option>
                    <option value="تم سداد المقدم">تم سداد المقدم (50%)</option>
                    <option value="تم سداد الفاتورة كاملة">تم سداد الفاتورة كاملة (100%)</option>
                  </select>
                </div>
              </div>
              
              <label style={labelStyle}>إرفاق ملف الفاتورة / إيصال السداد (PDF):</label>
              <input type="file" accept=".pdf" style={{ marginBottom: '15px' }} onChange={(e: any) => setNewInvoice({...newInvoice, file: e.target.files[0]})} />

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
                <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'جاري الإصدار والحفظ...' : 'إصدار سحابياً 🖨️'}</button>
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء ❌</button>
              </div>
            </form>
          </div>
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
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العرض', 'العميل', 'المبلغ الإجمالي', 'تاريخ الإصدار', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((q: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{q.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{q.client}</td>
                      <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(q.total).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#cbd5e1', whiteSpace: 'nowrap' }}>{formatDate(q.date)}</td>
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

            <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
              {filteredQuotes.map((q: any, idx: number) => (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{q.id}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{Number(q.total).toLocaleString()} ر.س</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f8fafc' }}>{q.client}</div>
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

        {activeTab === 'invoices' && (
          <div>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم الفاتورة', 'العميل', 'المبلغ الإجمالي', 'تاريخ الاستحقاق', 'حالة السداد', 'ملف PDF', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#1a2638' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{inv.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{inv.client}</td>
                      <td style={{ ...tdStyle, color: '#4ade80', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(inv.total || (inv.amount * 1.15)).toLocaleString()} ر.س</td>
                      <td style={{ ...tdStyle, color: '#f59e0b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(inv.dueDate)}</td>
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
                            <button onClick={() => handleViewOrPrintPDF(inv)} style={actionBtn}>عرض 📄</button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>بدون ملف</span>
                          )}
                          <label style={{ cursor: 'pointer', background: '#334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', border: '1px solid #475569' }} title="رفع ملف PDF">
                            <FiUpload /> رفع سحابي
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
                        <td style={{ ...tdStyle, color: '#f59e0b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(b.dueDate)}</td>
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
                              <button onClick={() => handleViewOrPrintPDF(b)} style={actionBtn}>عرض 📄</button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>بدون ملف</span>
                            )}
                            <label style={{ cursor: 'pointer', background: '#334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', border: '1px solid #475569' }} title="رفع ملف PDF">
                              <FiUpload /> رفع سحابي
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