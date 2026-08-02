import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { 
  getClientContractsSheet,
  saveClientContractToSheet,
  getEmployeeContractsSheet,
  saveEmployeeContractToSheet,
  getFreelancerContractsSheet,
  saveFreelancerContractToSheet,
  getGeneralDocumentsSheet,
  saveGeneralDocumentToSheet,
  uploadFileToCloudinary
} from '@/services/dbService';

export default function ContractsArchivePage() {
  const [activeTab, setActiveTab] = useState<'clients' | 'employees' | 'freelancers' | 'general'>('clients');

  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCloud, setLoadingCloud] = useState(false);

  const [companyInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('noorcast_company_profile');
      return saved ? JSON.parse(saved) : {
        name: 'شركة نوركاست للإعلام والإنتاج',
        city: 'الرياض، المملكة العربية السعودية'
      };
    } catch {
      return { name: 'شركة نوركاست للإعلام والإنتاج', city: 'الرياض' };
    }
  });

  const [clientContracts, setClientContracts] = useState<any[]>([]);
  const [employeeContracts, setEmployeeContracts] = useState<any[]>([]);
  const [freelancerContracts, setFreelancerContracts] = useState<any[]>([]);
  const [generalDocs, setGeneralDocs] = useState<any[]>([]);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);

  const [newClient, setNewClient] = useState({ title: '', party: '', value: '', file: null as File | null });
  const [newEmployee, setNewEmployee] = useState({ title: '', party: '', value: '', file: null as File | null });
  const [newFreelancer, setNewFreelancer] = useState({ freelancerName: '', projectTask: '', amount: 0, duration: 'أسبوع واحد', file: null as File | null });
  const [newGeneral, setNewGeneral] = useState({ title: '', party: '', value: '', file: null as File | null });

  useEffect(() => {
    loadAllContracts();
  }, []);

  // دالة الفحص الذكي للبيانات الفارغة والتنبيه عنها
  const validateAndAlertEmpty = (data: any[], tabName: string) => {
    if (!data || data.length === 0) {
      console.warn(`⚠️ تنبيه: جدول أو تبويب الأرشيف [${tabName}] فارغ تماماً ولا يحتوي على سجلات.`);
    }
    return Array.isArray(data) ? data : [];
  };

  const loadAllContracts = async () => {
    try {
      setLoadingCloud(true);
      const [rawClients, rawEmployees, rawFreelancers, rawGeneral] = await Promise.all([
        getClientContractsSheet().catch(() => []),
        getEmployeeContractsSheet().catch(() => []),
        getFreelancerContractsSheet().catch(() => []),
        getGeneralDocumentsSheet().catch(() => [])
      ]);

      const clients = validateAndAlertEmpty(rawClients, 'عقود العملاء');
      const employees = validateAndAlertEmpty(rawEmployees, 'عقود الموظفين');
      const freelancers = validateAndAlertEmpty(rawFreelancers, 'عقود المستقلين');
      const general = validateAndAlertEmpty(rawGeneral, 'المستندات العامة');

      setClientContracts(clients.map(c => ({ ...c, date: formatDate(c.date) })));
      setEmployeeContracts(employees.map(e => ({ ...e, date: formatDate(e.date) })));
      setFreelancerContracts(freelancers.map(f => ({ ...f, date: formatDate(f.date) })));
      setGeneralDocs(general.map(g => ({ ...g, date: formatDate(g.date) })));
    } catch (err) {
      console.error("خطأ في جلب بيانات الأرشيف:", err);
    } finally {
      setLoadingCloud(false);
    }
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

  // 1. إضافة عقد عميل سحابياً
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.title || !newClient.party) { alert("يرجى إدخال العنوان واسم العميل."); return; }
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (newClient.file) fileUrl = await uploadFileToCloudinary(newClient.file);

      const data = {
        id: `CON-C-${Math.floor(100 + Math.random() * 900)}`,
        title: newClient.title,
        party: newClient.party,
        type: 'عميل',
        value: newClient.value || 'حسب الاتفاق',
        fileName: newClient.file ? newClient.file.name : 'عقد_عميل.pdf',
        fileUrl,
        date: new Date().toISOString().split('T')[0]
      };

      await saveClientContractToSheet(data);
      setClientContracts([{ ...data, date: formatDate(data.date) }, ...clientContracts]);
      setIsClientModalOpen(false);
      setNewClient({ title: '', party: '', value: '', file: null });
      alert("تم رفع عقد العميل وترحيله سحابياً بنجاح! 📁☁️");
    } catch (err) {
      console.error(err);
      alert("فشل الرفع للسحابة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. إضافة عقد موظف سحابياً
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.title || !newEmployee.party) { alert("يرجى إدخال المسمى واسم الموظف."); return; }
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (newEmployee.file) fileUrl = await uploadFileToCloudinary(newEmployee.file);

      const data = {
        id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        title: newEmployee.title,
        party: newEmployee.party,
        type: 'موظف',
        value: newEmployee.value || 'حسب الراتب',
        fileName: newEmployee.file ? newEmployee.file.name : 'عقد_موظف.pdf',
        fileUrl,
        date: new Date().toISOString().split('T')[0]
      };

      await saveEmployeeContractToSheet(data);
      setEmployeeContracts([{ ...data, date: formatDate(data.date) }, ...employeeContracts]);
      setIsEmployeeModalOpen(false);
      setNewEmployee({ title: '', party: '', value: '', file: null });
      alert("تم رفع عقد الموظف وترحيله سحابياً بنجاح! 👥☁️");
    } catch (err) {
      console.error(err);
      alert("فشل الرفع للسحابة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. إضافة عقد مستقل سحابياً
  const handleSaveFreelancer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFreelancer.freelancerName || !newFreelancer.amount) { alert("يرجى إدخال اسم المستقل والمبلغ."); return; }
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (newFreelancer.file) fileUrl = await uploadFileToCloudinary(newFreelancer.file);

      const data = {
        id: `CON-F-${Math.floor(100 + Math.random() * 900)}`,
        freelancerName: newFreelancer.freelancerName,
        projectTask: newFreelancer.projectTask,
        amount: Number(newFreelancer.amount),
        duration: newFreelancer.duration,
        fileName: newFreelancer.file ? newFreelancer.file.name : 'عقد_مستقل.pdf',
        fileUrl,
        date: new Date().toISOString().split('T')[0]
      };

      await saveFreelancerContractToSheet(data);
      setFreelancerContracts([{ ...data, date: formatDate(data.date) }, ...freelancerContracts]);
      setIsFreelancerModalOpen(false);
      setNewFreelancer({ freelancerName: '', projectTask: '', amount: 0, duration: 'أسبوع واحد', file: null });
      alert("تم حفظ عقد المستقل وترحيله سحابياً بنجاح! 📄☁️");
    } catch (err) {
      console.error(err);
      alert("فشل الحفظ سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. إضافة مستند عام سحابياً
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeneral.title) { alert("يرجى إدخال عنوان المستند."); return; }
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (newGeneral.file) fileUrl = await uploadFileToCloudinary(newGeneral.file);

      const data = {
        id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        title: newGeneral.title,
        party: newGeneral.party || 'جهة رسمية',
        type: 'عام',
        value: newGeneral.value || '-',
        fileName: newGeneral.file ? newGeneral.file.name : 'مستند_عام.pdf',
        fileUrl,
        date: new Date().toISOString().split('T')[0]
      };

      await saveGeneralDocumentToSheet(data);
      setGeneralDocs([{ ...data, date: formatDate(data.date) }, ...generalDocs]);
      setIsGeneralModalOpen(false);
      setNewGeneral({ title: '', party: '', value: '', file: null });
      alert("تم أرشفة المستند العام وترحيله سحابياً بنجاح! 📑☁️");
    } catch (err) {
      console.error(err);
      alert("فشل الرفع سحابياً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewFile = (item: any) => {
    if (item.fileUrl) window.open(item.fileUrl, '_blank');
    else alert("لا يوجد ملف مرفق للعرض.");
  };

  const handlePrintFreelancerContract = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <title>عقد مستقل - ${item.freelancerName}</title>
          <style>
            body { font-family: 'Cairo', Tahoma, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.8; font-size: 0.95rem; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            h1 { text-align: center; font-size: 1.3rem; color: #0f172a; margin: 0 0 5px 0; }
            .section-title { font-weight: bold; color: #2563eb; margin-top: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><strong>${companyInfo.name}</strong></div>
            <div>رقم العقد: ${item.id}</div>
          </div>
          <h1>عقد تقديم خدمات (مستقل)</h1>
          <p><strong>الطرف الأول:</strong> ${companyInfo.name}</p>
          <p><strong>الطرف الثاني:</strong> ${item.freelancerName}</p>
          <div class="section-title">نطاق العمل</div>
          <p>${item.projectTask}</p>
          <div class="section-title">المقابل المالي والمدة</div>
          <p>المبلغ: <strong>${Number(item.amount).toLocaleString()} ر.س</strong> | المدة: <strong>${item.duration}</strong></p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ padding: '32px', color: 'white', minHeight: '100vh', background: '#0f172a', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 'bold' }}>📁 العقود والأرشيف القانوني</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '6px 0 0 0' }}>
            إدارة وأرشفة عقود العملاء، عقود الموظفين، عقود المستقلين، والمستندات القانونية الرسمية سحابياً
          </p>
        </div>

        <button onClick={loadAllContracts} style={secondaryBtn} disabled={loadingCloud}>
          <FiRefreshCw /> {loadingCloud ? 'جاري المزامنة...' : 'مزامنة سحابياً 🔄'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <FiSearch style={{ position: 'absolute', right: '12px', top: '12px', color: '#94a3b8' }} />
          <input type="text" placeholder="بحث في السجلات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={searchInputStyle} />
        </div>

        <div>
          {activeTab === 'clients' && <button onClick={() => setIsClientModalOpen(true)} style={primaryBtn}><FiPlus /> رفع عقد عميل 📥</button>}
          {activeTab === 'employees' && <button onClick={() => setIsEmployeeModalOpen(true)} style={primaryBtn}><FiPlus /> رفع عقد موظف 📥</button>}
          {activeTab === 'freelancers' && <button onClick={() => setIsFreelancerModalOpen(true)} style={primaryBtn}><FiPlus /> إضافة عقد مستقل 📄</button>}
          {activeTab === 'general' && <button onClick={() => setIsGeneralModalOpen(true)} style={primaryBtn}><FiPlus /> رفع مستند عام 📥</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('clients')} style={activeTab === 'clients' ? activeTabBtn : tabBtn}>📁 عقود العملاء</button>
        <button onClick={() => setActiveTab('employees')} style={activeTab === 'employees' ? activeTabBtn : tabBtn}>👥 عقود الموظفين</button>
        <button onClick={() => setActiveTab('freelancers')} style={activeTab === 'freelancers' ? activeTabBtn : tabBtn}>💼 عقود المستقلين</button>
        <button onClick={() => setActiveTab('general')} style={activeTab === 'general' ? activeTabBtn : tabBtn}>📑 مستندات عامة وقانونية</button>
      </div>

      {/* نافذة رفع عقد عميل */}
      {isClientModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveClient} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>📁 رفع عقد عميل جديد</h3>
            <label style={labelStyle}>عنوان العقد / المشروع:</label>
            <input style={inputStyle} value={newClient.title} onChange={e => setNewClient({...newClient, title: e.target.value})} required />
            <label style={labelStyle}>اسم العميل:</label>
            <input style={inputStyle} value={newClient.party} onChange={e => setNewClient({...newClient, party: e.target.value})} required />
            <label style={labelStyle}>القيمة المالية (اختياري):</label>
            <input style={inputStyle} value={newClient.value} onChange={e => setNewClient({...newClient, value: e.target.value})} />
            
            <label style={labelStyle}>ملف العقد (PDF أو صورة JPEG):</label>
            <div style={uploadBoxStyle}>
              <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>📥</span>
              <input type="file" accept="image/*,.pdf" style={{ fontSize: '0.85rem', color: '#1e293b', width: '100%', cursor: 'pointer' }} onChange={(e: any) => setNewClient({...newClient, file: e.target.files[0]})} required />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? '⏳ جاري الرفع والحفظ...' : 'حفظ 📥'}</button>
              <button type="button" onClick={() => setIsClientModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* نافذة رفع عقد موظف */}
      {isEmployeeModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveEmployee} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>👥 رفع عقد موظف جديد</h3>
            <label style={labelStyle}>المسمى الوظيفي / نوع العقد:</label>
            <input style={inputStyle} value={newEmployee.title} onChange={e => setNewEmployee({...newEmployee, title: e.target.value})} required />
            <label style={labelStyle}>اسم الموظف:</label>
            <input style={inputStyle} value={newEmployee.party} onChange={e => setNewEmployee({...newEmployee, party: e.target.value})} required />
            <label style={labelStyle}>الراتب أو الأجر:</label>
            <input style={inputStyle} value={newEmployee.value} onChange={e => setNewEmployee({...newEmployee, value: e.target.value})} />
            
            <label style={labelStyle}>ملف عقد الموظف (PDF أو صورة JPEG):</label>
            <div style={uploadBoxStyle}>
              <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>📥</span>
              <input type="file" accept="image/*,.pdf" style={{ fontSize: '0.85rem', color: '#1e293b', width: '100%', cursor: 'pointer' }} onChange={(e: any) => setNewEmployee({...newEmployee, file: e.target.files[0]})} required />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? '⏳ جاري الرفع والحفظ...' : 'حفظ 📥'}</button>
              <button type="button" onClick={() => setIsEmployeeModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* نافذة إضافة عقد مستقل */}
      {isFreelancerModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveFreelancer} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>📄 إصدار عقد مستقل</h3>
            <label style={labelStyle}>اسم المستقل:</label>
            <input style={inputStyle} value={newFreelancer.freelancerName} onChange={e => setNewFreelancer({...newFreelancer, freelancerName: e.target.value})} required />
            <label style={labelStyle}>المهمة / المشروع:</label>
            <input style={inputStyle} value={newFreelancer.projectTask} onChange={e => setNewFreelancer({...newFreelancer, projectTask: e.target.value})} required />
            <label style={labelStyle}>المبلغ (ر.س):</label>
            <input type="number" style={inputStyle} value={newFreelancer.amount} onChange={e => setNewFreelancer({...newFreelancer, amount: Number(e.target.value)})} required />
            <label style={labelStyle}>المدة:</label>
            <input style={inputStyle} value={newFreelancer.duration} onChange={e => setNewFreelancer({...newFreelancer, duration: e.target.value})} required />
            
            <label style={labelStyle}>ملف العقد (اختياري - PDF أو صورة JPEG):</label>
            <div style={uploadBoxStyle}>
              <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>📥</span>
              <input type="file" accept="image/*,.pdf" style={{ fontSize: '0.85rem', color: '#1e293b', width: '100%', cursor: 'pointer' }} onChange={(e: any) => setNewFreelancer({...newFreelancer, file: e.target.files[0]})} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? '⏳ جاري الرفع والحفظ...' : 'إصدار ✅'}</button>
              <button type="button" onClick={() => setIsFreelancerModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* نافذة رفع مستند عام */}
      {isGeneralModalOpen && (
        <div style={modalOverlay}>
          <form onSubmit={handleSaveGeneral} style={modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>📑 أرشفة مستند عام أو رسمي</h3>
            <label style={labelStyle}>عنوان المستند:</label>
            <input style={inputStyle} value={newGeneral.title} onChange={e => setNewGeneral({...newGeneral, title: e.target.value})} required />
            <label style={labelStyle}>الجهة المصدرة أو ذات الصلة:</label>
            <input style={inputStyle} value={newGeneral.party} onChange={e => setNewGeneral({...newGeneral, party: e.target.value})} required />
            <label style={labelStyle}>ملاحظات أو رقم مرجعي:</label>
            <input style={inputStyle} value={newGeneral.value} onChange={e => setNewGeneral({...newGeneral, value: e.target.value})} />
            
            <label style={labelStyle}>ملف المستند (PDF أو صورة JPEG):</label>
            <div style={uploadBoxStyle}>
              <span style={{ fontSize: '1.3rem', color: '#2563eb' }}>📥</span>
              <input type="file" accept="image/*,.pdf" style={{ fontSize: '0.85rem', color: '#1e293b', width: '100%', cursor: 'pointer' }} onChange={(e: any) => setNewGeneral({...newGeneral, file: e.target.files[0]})} required />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button type="submit" style={primaryBtn} disabled={isSubmitting}>{isSubmitting ? '⏳ جاري الرفع والحفظ...' : 'أرشفة 📥'}</button>
              <button type="button" onClick={() => setIsGeneralModalOpen(false)} style={cancelBtn} disabled={isSubmitting}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* الجداول النشطة */}
      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '25px' }}>
        
        {activeTab === 'clients' && (
          <div style={{ overflowX: 'auto' }}>
            {clientContracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>📁 لا توجد عقود عملاء مسجلة حالياً في الأرشيف السحابي.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العقد', 'عنوان المشروع', 'اسم العميل', 'القيمة', 'تاريخ الأرشفة', 'الملف', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {clientContracts.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.party.toLowerCase().includes(searchTerm.toLowerCase())).map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{c.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{c.title}</td>
                      <td style={tdStyle}>{c.party}</td>
                      <td style={{ ...tdStyle, color: '#4ade80' }}>{c.value}</td>
                      <td style={{ ...tdStyle, color: '#cbd5e1' }}>{c.date}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{c.fileName}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleViewFile(c)} style={actionBtn}>معاينة الملف</button>
                          <button onClick={() => setClientContracts(clientContracts.filter(x => x.id !== c.id))} style={iconDeleteBtn}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'employees' && (
          <div style={{ overflowX: 'auto' }}>
            {employeeContracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>👥 لا توجد عقود موظفين مسجلة حالياً في الأرشيف السحابي.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العقد', 'المسمى الوظيفي', 'اسم الموظف', 'الراتب', 'تاريخ الأرشفة', 'الملف', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {employeeContracts.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.party.toLowerCase().includes(searchTerm.toLowerCase())).map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{e.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{e.title}</td>
                      <td style={tdStyle}>{e.party}</td>
                      <td style={{ ...tdStyle, color: '#4ade80' }}>{e.value}</td>
                      <td style={{ ...tdStyle, color: '#cbd5e1' }}>{e.date}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{e.fileName}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleViewFile(e)} style={actionBtn}>معاينة الملف</button>
                          <button onClick={() => setEmployeeContracts(employeeContracts.filter(x => x.id !== e.id))} style={iconDeleteBtn}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'freelancers' && (
          <div style={{ overflowX: 'auto' }}>
            {freelancerContracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>💼 لا توجد عقود مستقلين مسجلة حالياً في الأرشيف السحابي.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم العقد', 'اسم المستقل', 'المهمة', 'المبلغ', 'المدة', 'تاريخ الإصدار', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {freelancerContracts.filter(f => f.freelancerName.toLowerCase().includes(searchTerm.toLowerCase())).map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{f.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{f.freelancerName}</td>
                      <td style={tdStyle}>{f.projectTask}</td>
                      <td style={{ ...tdStyle, color: '#4ade80' }}>{Number(f.amount).toLocaleString()} ر.س</td>
                      <td style={tdStyle}>{f.duration}</td>
                      <td style={{ ...tdStyle, color: '#cbd5e1' }}>{f.date}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {f.fileUrl ? <button onClick={() => handleViewFile(f)} style={actionBtn}>معاينة</button> : <button onClick={() => handlePrintFreelancerContract(f)} style={actionBtn}>طباعة</button>}
                          <button onClick={() => setFreelancerContracts(freelancerContracts.filter(x => x.id !== f.id))} style={iconDeleteBtn}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'general' && (
          <div style={{ overflowX: 'auto' }}>
            {generalDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>📑 لا توجد مستندات عامة مسجلة حالياً في الأرشيف السحابي.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    {['رقم المستند', 'عنوان المستند', 'الجهة', 'ملاحظات / مرجع', 'تاريخ الأرشفة', 'الملف', 'الإجراءات'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {generalDocs.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase())).map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ ...tdStyle, color: '#38bdf8', fontWeight: 'bold' }}>{g.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{g.title}</td>
                      <td style={tdStyle}>{g.party}</td>
                      <td style={tdStyle}>{g.value}</td>
                      <td style={{ ...tdStyle, color: '#cbd5e1' }}>{g.date}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{g.fileName}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleViewFile(g)} style={actionBtn}>معاينة الملف</button>
                          <button onClick={() => setGeneralDocs(generalDocs.filter(x => x.id !== g.id))} style={iconDeleteBtn}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'right' as const, fontWeight: 'bold' };
const tdStyle = { padding: '14px 16px', textAlign: 'right' as const, verticalAlign: 'middle' as const };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' as const, color: '#1e293b', fontSize: '0.9rem', outline: 'none' };
const labelStyle = { fontSize: '0.85rem', color: '#1e293b', fontWeight: 'bold', display: 'block', marginBottom: '5px' };
const uploadBoxStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1' };
const primaryBtn = { padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };
const secondaryBtn = { padding: '8px 16px', background: '#334155', border: '1px solid #475569', borderRadius: '8px', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' };
const cancelBtn = { padding: '10px 18px', background: '#64748b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', whiteSpace: 'nowrap' as const };
const iconDeleteBtn = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const tabBtn = { padding: '10px 18px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' as const };
const activeTabBtn = { padding: '10px 18px', background: '#2563eb', border: '1px solid #2563eb', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' as const };
const searchInputStyle = { width: '100%', padding: '10px 35px 10px 15px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: 'white', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px', boxSizing: 'border-box' as const };
const modalContent = { background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '480px', color: '#1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const, boxSizing: 'border-box' as const };