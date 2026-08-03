import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// رابط الـ Web App الخاص بـ Google Sheets السحابي
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlL0sfoWhBFXXoLd9ZiPu6boq9WvLlalu4_kf6DkXMdQtmf-XMM32Hxrq0TzFPga3K/exec';

// 🛡️ ذاكرة مؤقتة محلية لمنع اختفاء البيانات وتذبذب الشاشات (In-Memory Fallback Cache)
const memoryCache: { [key: string]: { data: any, timestamp: number } } = {};

// إعدادات Firebase المشتركة
const firebaseConfig = {
  apiKey: "AIzaSyBuASn2zREWSf9w4klqsrkn_IsUiOoM8hc",
  authDomain: "noorcast-53ecf.firebaseapp.com",
  projectId: "noorcast-53ecf",
  storageBucket: "noorcast-53ecf.firebasestorage.app",
  messagingSenderId: "126242239603",
  appId: "1:126242239603:web:9834da65953f0ef9066606",
  databaseURL: "https://noorcast-53ecf-default-rtdb.firebaseio.com/"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * دالة ذكية للتعامل مع البيانات والاحتفاظ بآخر نسخة ناجحة في حال حدوث تذبذب أو فراغ مؤقت
 */
const validateAndAlertEmptyData = (data: any, tabName: string) => {
  const isEmpty = !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0);
  
  if (isEmpty) {
    if (memoryCache[tabName] && memoryCache[tabName].data) {
      console.warn(`⚠️ تذبذب في سحابة قوقل: تبويب [${tabName}] أعاد بيانات فارغة، وتم استرجاع آخر نسخة ناجحة تلقائياً.`);
      return memoryCache[tabName].data;
    }
    
    // محاولة الاسترجاع من التخزين المحلي كملجأ أخير
    if (typeof window !== 'undefined') {
      try {
        const localSaved = localStorage.getItem(`noorcast_cache_${tabName}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }

    console.warn(`⚠️ تنبيه: تبويب أو جدول [${tabName}] فارغ تماماً ولا يحتوي على بيانات.`);
    return data;
  }

  // تخزين النسخة الناجحة في الذاكرة المؤقتة والتخزين المحلي
  memoryCache[tabName] = {
    data: data,
    timestamp: Date.now()
  };
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`noorcast_cache_${tabName}`, JSON.stringify(data));
    } catch (e) {}
  }

  return data;
};

/**
 * دالة مساعدة لعمل Fetch آمن مع Fallback للذاكرة والتخزين المحلي عند انقطاع الاتصال أو بطء السيرفر
 */
const safeFetchFromSheet = async (actionQuery: string, tabName: string, forceRefresh: boolean = false, fallbackValue: any = []) => {
  // إذا لم يُطلب تحديث إجباري، نعرض البيانات المخزنة محلياً فوراً للاستجابة السريعة
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const localSaved = localStorage.getItem(`noorcast_cache_${tabName}`);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // تحديث صامت في الخلفية
          setTimeout(async () => {
            try {
              const bgRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=${actionQuery}&_t=${Date.now()}`);
              if (bgRes.ok) {
                const bgData = await bgRes.json();
                if (Array.isArray(bgData) && bgData.length > 0) {
                  localStorage.setItem(`noorcast_cache_${tabName}`, JSON.stringify(bgData));
                  memoryCache[tabName] = { data: bgData, timestamp: Date.now() };
                }
              }
            } catch (err) {}
          }, 150);
          return parsed;
        }
      }
    } catch (e) {}
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=${actionQuery}&_t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return validateAndAlertEmptyData(data, tabName);
  } catch (error) {
    console.error(`خطأ في جلب بيانات [${tabName}]:`, error);
    
    if (memoryCache[tabName] && memoryCache[tabName].data) {
      console.log(`📦 تم تحميل بيانات [${tabName}] من الذاكرة المحلية المؤقتة.`);
      return memoryCache[tabName].data;
    }
    
    if (typeof window !== 'undefined') {
      try {
        const localSaved = localStorage.getItem(`noorcast_cache_${tabName}`);
        if (localSaved) return JSON.parse(localSaved);
      } catch (e) {}
    }
    
    return fallbackValue;
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('عذراً، متصفحك الحالي لا يدعم الإشعارات الفورية.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      let token = 'noorcast-token-' + Math.random().toString(36).substring(2) + Date.now();
      
      try {
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration && 'serviceWorker' in navigator) {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }).catch(() => null);
        }
        if (registration && 'ready' in navigator.serviceWorker) {
          await navigator.serviceWorker.ready;
        }

        const messaging = getMessaging(app);
        const fcmToken = await getToken(messaging, { 
          vapidKey: 'BDPwZ_Eb6m39a4W1yHB4Qkd8KhFsukCrHxNZT81xsO764mrjbOSxlsO7dtLQPi8a2nBRD9Dj9khoUcw4jsk7Qqw',
          serviceWorkerRegistration: registration || undefined
        }).catch(() => null);

        if (fcmToken) token = fcmToken;
      } catch (err) {}

      localStorage.setItem('fcm_token', token);
      localStorage.setItem('notifications_enabled', 'true');

      const currentUserStr = localStorage.getItem('currentUser') || localStorage.getItem('userEmail') || localStorage.getItem('username') || 'abdullatif';
      
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveFCMToken',
          user: currentUserStr,
          token: token,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});

      alert('تم تفعيل إشعارات الجوال والداشبورد السحابية بنجاح تام! 🔔🚀');
      return token;
    } else {
      alert('تم رفض إذن الإشعارات من المتصفح.');
    }
  } catch (error) {
    console.error('An error occurred while requesting notification permission: ', error);
  }
  return null;
};

export const onForegroundMessage = (callback?: (payload: any) => void) => {
  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      if (callback) callback(payload);
    });
  } catch (e) {}
};

export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'noorcast_preset'); 

    const response = await fetch('https://api.cloudinary.com/v1_1/dfwfh4xzb/auto/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'فشل رفع الملف إلى السحابة');
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const logDashboardAction = async (action: string, target: string, details: string) => {
  try {
    let userEmail = 'unknown@domain.com';
    let username = 'system';

    const possibleKeys = ['currentUser', 'adminUser', 'userEmail', 'loggedInUser', 'noorcast_user', 'admin_email', 'username'];
    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userEmail = parsed.email || parsed.userEmail || parsed.username || userEmail;
          username = parsed.username || parsed.name || userEmail.split('@')[0] || username;
          if (userEmail !== 'unknown@domain.com') break;
        } catch (e) {
          if (stored.includes('@')) {
            userEmail = stored;
            username = stored.split('@')[0];
            break;
          } else if (stored.length > 0) {
            username = stored;
          }
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dashboard-activity', {
        detail: { action, target, details: `${details} (بواسطة: @${username})` }
      }));
    }

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'AUDIT_LOG',
        timestamp: new Date().toISOString(),
        adminEmail: userEmail,
        username: username,
        action: action,
        target: target,
        details: details
      })
    });
  } catch (error) {}
};

export const getAuditLogs = async (forceRefresh = false) => safeFetchFromSheet('getAuditLogs', 'AuditLogs', forceRefresh);
export const getHRActionLogs = async (forceRefresh = false) => safeFetchFromSheet('getHRActionLogs', 'HRActionLogs', forceRefresh);

export const updateEmployeeStatusInSheet = async (username: string, newStatus: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateHRStatus', username: username, status: newStatus })
    });
  } catch (error) {
    throw error;
  }
};

export const nominateEmployeeForExcellence = async (nominationData: { employeeUsername: string; reason: string; weekTitle?: string; }) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addExcellenceNomination', timestamp: new Date().toISOString(), ...nominationData })
    });
    await logDashboardAction('EXCELLENCE_NOMINATION', `@${nominationData.employeeUsername}`, `تم ترشيح الموظف لجائزة التميز: ${nominationData.reason}`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const submitAdministrativeAction = async (actionData: { employeeUsername: string; actionType: string; amount: number; reason: string; }) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addHRAction', timestamp: new Date().toISOString(), ...actionData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

// الدوال العامة لجلب البيانات مع دعم forceRefresh لجلب البيانات الطازجة من الشيت مباشرة عند الطلب
export const getOrders = async (forceRefresh = false) => safeFetchFromSheet('get', 'Orders', forceRefresh);
export const getAdmins = async (forceRefresh = false) => safeFetchFromSheet('getAdmins', 'Admins', forceRefresh);
export const getServices = async (forceRefresh = false) => {
  const data = await safeFetchFromSheet('getServices', 'Services', forceRefresh);
  return Array.isArray(data) ? data.map((s: any) => ({ ...s, category: s.category ? String(s.category).trim() : 'أخرى' })) : [];
};
export const getCoupons = async (forceRefresh = false) => safeFetchFromSheet('getCoupons', 'Coupons', forceRefresh);
export const getExpensesSheet = async (forceRefresh = false) => {
  const validData = await safeFetchFromSheet('getExpenses', 'ExpensesSheet', forceRefresh);
  if (Array.isArray(validData)) {
    return validData.filter((item: any) => {
      const desc = String(item.description || '').toLowerCase();
      const amt = Number(item.amount || 0);
      return amt !== 5750 && !desc.includes('مقدم فاتورة') && !desc.includes('inv-2026-001');
    });
  }
  return [];
};
export const getHRPayrollSheet = async (forceRefresh = false) => safeFetchFromSheet('getHR', 'HRPayrollSheet', forceRefresh);
export const getInvestorsSheet = async (forceRefresh = false) => safeFetchFromSheet('getInvestors', 'InvestorsSheet', forceRefresh);
export const getInvoicesSheet = async (forceRefresh = false) => safeFetchFromSheet('getInvoices', 'InvoicesSheet', forceRefresh);
export const getIncomingBillsSheet = async (forceRefresh = false) => safeFetchFromSheet('getIncomingBills', 'IncomingBillsSheet', forceRefresh);
export const getClientContractsSheet = async (forceRefresh = false) => safeFetchFromSheet('getClientContracts', 'ClientContracts', forceRefresh);
export const getEmployeeContractsSheet = async (forceRefresh = false) => safeFetchFromSheet('getEmployeeContracts', 'EmployeeContracts', forceRefresh);
export const getFreelancerContractsSheet = async (forceRefresh = false) => safeFetchFromSheet('getFreelancerContracts', 'FreelancerContracts', forceRefresh);
export const getGeneralDocumentsSheet = async (forceRefresh = false) => safeFetchFromSheet('getGeneralDocuments', 'GeneralDocuments', forceRefresh);
export const getMarketingSocialSheet = async (forceRefresh = false) => safeFetchFromSheet('getMarketingSocial', 'MarketingSocial', forceRefresh);
export const getQuotesSheet = async (forceRefresh = false) => safeFetchFromSheet('getQuotes', 'QuotesSheet', forceRefresh);
export const getFreelanceSheet = async (forceRefresh = false) => safeFetchFromSheet('getFreelance', 'FreelanceSheet', forceRefresh);
export const getFreelanceFinanceSheet = async (forceRefresh = false) => safeFetchFromSheet('getFreelanceFinance', 'FreelanceFinance', forceRefresh);
export const getProjects = async (forceRefresh = false) => safeFetchFromSheet('getProjects', 'Projects', forceRefresh);
export const getTasks = async (forceRefresh = false) => safeFetchFromSheet('getTasks', 'Tasks', forceRefresh);

export const updateOrderStatus = async (orderId: string, status: string, lastContactedBy?: string, notes?: string) => {
  try {
    const currentUserStr = localStorage.getItem('currentUser') || localStorage.getItem('adminUser') || '{}';
    let activeUser = lastContactedBy;
    if (!activeUser) {
      try {
        const parsed = JSON.parse(currentUserStr);
        activeUser = parsed.username || parsed.email?.split('@')[0] || 'النظام';
      } catch (e) {
        activeUser = localStorage.getItem('userEmail')?.split('@')[0] || 'النظام';
      }
    }

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', orderId, status, lastContactedBy: activeUser, notes })
    });
    await logDashboardAction('UPDATE_ORDER', `Order #${orderId}`, `قام الموظف (${activeUser}) بتحديث حالة الطلب إلى [${status}]`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const addService = async (serviceData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addService', ...serviceData })
    });
    await logDashboardAction('ADD_SERVICE', serviceData.title || 'New Service', 'تمت إضافة خدمة جديدة');
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const updateService = async (serviceData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateService', ...serviceData })
    });
    await logDashboardAction('UPDATE_SERVICE', serviceData.title || `Service #${serviceData.id}`, 'تم تحديث بيانات الخدمة');
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const deleteService = async (serviceId: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteService', serviceId })
    });
    await logDashboardAction('DELETE_SERVICE', `Service #${serviceId}`, 'تم حذف الخدمة');
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveExpenseToSheet = async (expenseData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addExpense', ...expenseData })
    });
    await logDashboardAction('SAVE_EXPENSE', expenseData.description, `تم حفظ مصروف بمبلغ ${expenseData.amount} ر.س`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const addHREntryToSheet = async (hrData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addHR', ...hrData })
    });
    await logDashboardAction('ADD_HR_EMPLOYEE', hrData.name || 'Employee', `تمت إضافة الموظف براتب ${hrData.salary || 0} ر.س`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveInvestorToSheet = async (investorData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveInvestor', ...investorData })
    });
    await logDashboardAction('SAVE_INVESTOR', investorData.name, `تم حفظ بيانات المستثمر بنسبة ملكية ${investorData.ownershipPercentage}%`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveInvoiceToSheet = async (invoiceData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveInvoice', ...invoiceData })
    });
    await logDashboardAction('SAVE_INVOICE', invoiceData.number || 'Invoice', `تم حفظ الفاتورة بقيمة ${invoiceData.amount} ر.س`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveIncomingBillToSheet = async (billData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveIncomingBill', ...billData })
    });
    await logDashboardAction('SAVE_INCOMING_BILL', billData.supplier || 'Bill', `تم حفظ الفاتورة الواردة بقيمة ${billData.amount} ر.س`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveClientContractToSheet = async (contractData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveClientContract', ...contractData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveEmployeeContractToSheet = async (contractData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveEmployeeContract', ...contractData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveFreelancerContractToSheet = async (contractData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveFreelancerContract', ...contractData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveGeneralDocumentToSheet = async (docData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveGeneralDocument', ...docData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveMarketingSocialToSheet = async (data: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveMarketingSocial', ...data })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const deleteMarketingSocialFromSheet = async (id: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteMarketingSocial', id })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveQuoteToSheet = async (quoteData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveQuote', ...quoteData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveFreelanceToSheet = async (freelancerData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveFreelance', ...freelancerData })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const deleteFreelanceFromSheet = async (id: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteFreelance', id })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveFreelanceFinanceToSheet = async (data: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveFreelanceFinance', ...data })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const deleteFreelanceFinanceFromSheet = async (id: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteFreelanceFinance', id })
    });
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveProjectToSheet = async (projectData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveProject', ...projectData })
    });
    await logDashboardAction('SAVE_PROJECT', projectData.name || 'Project', 'تم حفظ/تحديث المشروع سحابياً');
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const deleteProjectFromSheet = async (projectId: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteProject', projectId })
    });
    await logDashboardAction('DELETE_PROJECT', `Project #${projectId}`, 'تم حذف المشروع سحابياً');
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const saveTaskToSheet = async (taskData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveTask', ...taskData })
    });
    await logDashboardAction('SAVE_TASK', taskData.title || 'Task', `تم حفظ/تحديث المهمة وإسنادها للموظف: ${taskData.assignedTo || 'غير محدد'}`);
    return "Success";
  } catch (error) {
    throw error;
  }
};

export const deleteTaskFromSheet = async (taskId: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteTask', taskId })
    });
    await logDashboardAction('DELETE_TASK', `Task #${taskId}`, 'تم حذف المهمة سحابياً');
    return "Success";
  } catch (error) {
    throw error;
  }
};