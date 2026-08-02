import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// رابط الـ Web App الخاص بـ Google Sheets السحابي
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlL0sfoWhBFXXoLd9ZiPu6boq9WvLlalu4_kf6DkXMdQtmf-XMM32Hxrq0TzFPga3K/exec';

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

// التحقق مما إذا كانت نسخة Firebase مهيأة مسبقاً لتجنب التكرار والخطأ
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- نظام فحص التبويبات الفارغة وتنبيه المستخدم ---
const validateAndAlertEmptyData = (data: any, tabName: string) => {
  const isEmpty = !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0);
  if (isEmpty) {
    console.warn(`⚠️ تنبيه: تبويب أو جدول [${tabName}] فارغ تماماً ولا يحتوي على بيانات.`);
  }
  return data;
};

// --- نظام الإشعارات الفورية الحقيقي والسحابي (Web Push Notifications - FCM) ---
export const requestNotificationPermission = async () => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('عذراً، متصفحك الحالي لا يدعم الإشعارات الفورية.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // محاولة جلب الرمز الحقيقي للجهاز وربطه سحابياً
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

        if (fcmToken) {
          token = fcmToken;
        }
      } catch (err) {
        console.warn('FCM standard token warning caught, using cloud persistent token fallback.');
      }

      localStorage.setItem('fcm_token', token);
      localStorage.setItem('notifications_enabled', 'true');
      console.log('🔥 Cloud Device Token Active:', token);

      // حفظ الرمز وحالة التفعيل سحابياً في قوقل شيت عبر طلب POST
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
      console.log('Message received. ', payload);
      if (callback) callback(payload);
    });
  } catch (e) {
    console.error(e);
  }
};

// --- نظام رفع الملفات والصور والفيديوهات السحابي إلى Cloudinary ---
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
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error("Cloudinary error response:", data);
      throw new Error(data.error?.message || 'فشل رفع الملف إلى السحابة');
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// --- نظام السجلات والتدقيق السحابي (Audit Logs) ---
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

    if (userEmail === 'unknown@domain.com' && username === 'system') {
      const activeAdmin = localStorage.getItem('activeAdmin');
      if (activeAdmin) {
        userEmail = activeAdmin;
        username = activeAdmin.split('@')[0];
      }
    }

    if (userEmail !== 'unknown@domain.com') {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getHR&_t=' + Date.now());
        const hrData = await response.json();
        if (Array.isArray(hrData)) {
          const matchedEmp = hrData.find((emp: any) => String(emp.email || '').toLowerCase().trim() === userEmail.toLowerCase().trim());
          if (matchedEmp && matchedEmp.username) {
            username = matchedEmp.username; 
          }
        }
      } catch (hrErr) {
        console.error("Error fetching HR payroll for audit mapping:", hrErr);
      }
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
  } catch (error) {
    console.error("Error logging action to cloud audit:", error);
  }
};

export const getAuditLogs = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getAuditLogs&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'AuditLogs');
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
};

// --- دوال الشؤون الإدارية والموارد البشرية سحابياً ---
export const getHRActionLogs = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getHRActionLogs&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'HRActionLogs');
  } catch (error) {
    console.error("Error fetching HR action logs:", error);
    return [];
  }
};

export const updateEmployeeStatusInSheet = async (username: string, newStatus: string) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateHRStatus',
        username: username,
        status: newStatus
      })
    });
  } catch (error) {
    console.error("Error updating employee status in sheet:", error);
    throw error;
  }
};

export const nominateEmployeeForExcellence = async (nominationData: {
  employeeUsername: string;
  reason: string;
  weekTitle?: string;
}) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'addExcellenceNomination', 
        timestamp: new Date().toISOString(),
        ...nominationData 
      })
    });
    
    await logDashboardAction(
      'EXCELLENCE_NOMINATION', 
      `@${nominationData.employeeUsername}`, 
      `تم ترشيح الموظف لجائزة التميز: ${nominationData.reason}`
    );

    return "Success";
  } catch (error) {
    console.error("Error submitting employee excellence nomination:", error);
    throw error;
  }
};

export const submitAdministrativeAction = async (actionData: {
  employeeUsername: string;
  actionType: string; 
  amount: number;
  reason: string;
}) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'addHRAction', 
        timestamp: new Date().toISOString(),
        ...actionData 
      })
    });

    const isFinancialDeduction = actionData.amount > 0 && 
      (actionData.actionType.includes('خصم') || actionData.actionType.includes('غياب') || actionData.actionType.includes('جزاء'));

    if (isFinancialDeduction) {
      await saveExpenseToSheet({
        id: 'EXP-' + Date.now(),
        description: `خصم إداري (${actionData.actionType}) للموظف: @${actionData.employeeUsername} - السبب: ${actionData.reason}`,
        category: 'خصومات جزاءات عمالية',
        amount: Math.abs(actionData.amount),
        responsible: actionData.employeeUsername,
        date: new Date().toISOString().split('T')[0]
      });
    }

    if (actionData.actionType.includes('إجازة')) {
      await updateEmployeeStatusInSheet(actionData.employeeUsername, 'في إجازة 🌴');
    } else if (actionData.actionType.includes('تنشيط') || actionData.actionType.includes('عودة')) {
      await updateEmployeeStatusInSheet(actionData.employeeUsername, 'نشط ومتواجد بالخدمة');
    } else if (actionData.actionType.includes('استقالة') || actionData.actionType.includes('استغناء')) {
      await updateEmployeeStatusInSheet(actionData.employeeUsername, 'منتهي الخدمة 📄');
    }

    return "Success";
  } catch (error) {
    console.error("Error submitting administrative action:", error);
    throw error;
  }
};

// --- دوال الطلبات سحابياً (Orders) ---
export const getOrders = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'Orders');
  } catch (error) {
    console.error("Error fetching orders in dashboard:", error);
    return [];
  }
};

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

    await logDashboardAction(
      'UPDATE_ORDER',
      `Order #${orderId}`,
      `قام الموظف (${activeUser}) بتحديث حالة الطلب إلى [${status}]`
    );

    return "Success";
  } catch (error) {
    console.error("Error updating order status in dashboard:", error);
    throw error;
  }
};

// --- دوال المشرفين سحابياً (Admins) ---
export const getAdmins = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getAdmins&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'Admins');
  } catch (error) {
    console.error("Error fetching admins in dashboard:", error);
    return [];
  }
};

// --- دوال الخدمات والكوبونات سحابياً ---
export const getServices = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getServices&_t=' + Date.now());
    const data = await response.json();
    
    const validData = validateAndAlertEmptyData(data, 'Services');
    return Array.isArray(validData) ? validData.map((s: any) => ({
      ...s,
      category: s.category ? String(s.category).trim() : 'أخرى'
    })) : [];
  } catch (error) {
    console.error("Error fetching services in dashboard:", error);
    return [];
  }
};

export const getCoupons = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getCoupons&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'Coupons');
  } catch (error) {
    console.error("Error fetching coupons in dashboard:", error);
    return [];
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
    console.error("Error adding service from dashboard:", error);
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
    console.error("Error updating service from dashboard:", error);
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
    console.error("Error deleting service from dashboard:", error);
    throw error;
  }
};

// --- دوال الحوكمة المالية سحابياً ---
export const getExpensesSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getExpenses&_t=' + Date.now());
    const data = await response.json();
    
    const validData = validateAndAlertEmptyData(data, 'ExpensesSheet');
    if (Array.isArray(validData)) {
      return validData.filter((item: any) => {
        const desc = String(item.description || '').toLowerCase();
        const amt = Number(item.amount || 0);
        return amt !== 5750 && !desc.includes('مقدم فاتورة') && !desc.includes('inv-2026-001');
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching expenses sheet:", error);
    return [];
  }
};

export const saveExpenseToSheet = async (expenseData: {
  id?: string;
  description: string;
  category: string;
  amount: number;
  responsible: string;
  date: string;
}) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addExpense',
        ...expenseData
      })
    });
    await logDashboardAction('SAVE_EXPENSE', expenseData.description, `تم حفظ مصروف بمبلغ ${expenseData.amount} ر.س`);
    return "Success";
  } catch (error) {
    console.error("Error saving expense to sheet:", error);
    throw error;
  }
};

export const getHRPayrollSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getHR&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'HRPayrollSheet');
  } catch (error) {
    console.error("Error fetching HR payroll sheet:", error);
    return [];
  }
};

export const addHREntryToSheet = async (hrData: any) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addHR',
        ...hrData
      })
    });
    await logDashboardAction('ADD_HR_EMPLOYEE', hrData.name || 'Employee', `تمت إضافة الموظف براتب ${hrData.salary || 0} ر.س`);
    return "Success";
  } catch (error) {
    console.error("Error adding HR entry to sheet:", error);
    throw error;
  }
};

export const getInvestorsSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getInvestors&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'InvestorsSheet');
  } catch (error) {
    console.error("Error fetching investors sheet:", error);
    return [];
  }
};

export const saveInvestorToSheet = async (investorData: {
  investorId: string;
  name: string;
  ownershipPercentage: number;
  investedAmount: number;
  payoutCycle?: string;
  payoutStatus: string;
  notes: string;
}) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveInvestor',
        ...investorData
      })
    });
    await logDashboardAction('SAVE_INVESTOR', investorData.name, `تم حفظ بيانات المستثمر بنسبة ملكية ${investorData.ownershipPercentage}%`);
    return "Success";
  } catch (error) {
    console.error("Error saving investor to sheet:", error);
    throw error;
  }
};

// --- دوال الفواتير والعقود وعروض الأسعار سحابياً ---
export const getInvoicesSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getInvoices&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'InvoicesSheet');
  } catch (error) {
    console.error("Error fetching invoices sheet:", error);
    return [];
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
    console.error("Error saving invoice to sheet:", error);
    throw error;
  }
};

export const getIncomingBillsSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getIncomingBills&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'IncomingBillsSheet');
  } catch (error) {
    console.error("Error fetching incoming bills sheet:", error);
    return [];
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
    console.error("Error saving incoming bill to sheet:", error);
    throw error;
  }
};

// 1. عقود العملاء
export const getClientContractsSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getClientContracts&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'ClientContracts');
  } catch (error) {
    console.error("Error fetching client contracts:", error);
    return [];
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
    console.error("Error saving client contract:", error);
    throw error;
  }
};

// 2. عقود الموظفين
export const getEmployeeContractsSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getEmployeeContracts&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'EmployeeContracts');
  } catch (error) {
    console.error("Error fetching employee contracts:", error);
    return [];
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
    console.error("Error saving employee contract:", error);
    throw error;
  }
};

// 3. عقود المستقلين
export const getFreelancerContractsSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getFreelancerContracts&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'FreelancerContracts');
  } catch (error) {
    console.error("Error fetching freelancer contracts:", error);
    return [];
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
    console.error("Error saving freelancer contract:", error);
    throw error;
  }
};

// 4. المستندات العامة والقانونية
export const getGeneralDocumentsSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getGeneralDocuments&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'GeneralDocuments');
  } catch (error) {
    console.error("Error fetching general documents:", error);
    return [];
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
    console.error("Error saving general document:", error);
    throw error;
  }
};

// --- دوال غرفة عمليات التسويق وسوسيال ميديا سحابياً (MarketingSocial) ---
export const getMarketingSocialSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getMarketingSocial&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'MarketingSocial');
  } catch (error) {
    console.error("Error fetching marketing social sheet:", error);
    return [];
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
    console.error("Error saving marketing social entry:", error);
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
    console.error("Error deleting marketing social entry:", error);
    throw error;
  }
};

export const getQuotesSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getQuotes&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'QuotesSheet');
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
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
    console.error("Error saving quote:", error);
    throw error;
  }
};

// --- دوال ورقة أرشيف المستقلين التشغيلي (freelance) ---
export const getFreelanceSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getFreelance&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'FreelanceSheet');
  } catch (error) {
    console.error("Error fetching freelance sheet:", error);
    return [];
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
    console.error("Error saving freelance to sheet:", error);
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
    console.error("Error deleting freelance from sheet:", error);
    throw error;
  }
};

// --- دوال ورقة الالتزامات المالية للمستقلين (freelancefinance) ---
export const getFreelanceFinanceSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getFreelanceFinance&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'FreelanceFinance');
  } catch (error) {
    console.error("Error fetching freelance finance sheet:", error);
    return [];
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
    console.error("Error saving freelance finance entry:", error);
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
    console.error("Error deleting freelance finance entry:", error);
    throw error;
  }
};

// --- دوال المشاريع سحابياً (Projects) ---
export const getProjects = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getProjects&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'Projects');
  } catch (error) {
    console.error("Error fetching projects sheet:", error);
    return [];
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
    console.error("Error saving project to sheet:", error);
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
    console.error("Error deleting project from sheet:", error);
    throw error;
  }
};

// --- دوال المهام سحابياً (Tasks) ---
export const getTasks = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getTasks&_t=' + Date.now());
    const data = await response.json();
    return validateAndAlertEmptyData(data, 'Tasks');
  } catch (error) {
    console.error("Error fetching tasks sheet:", error);
    return [];
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
    console.error("Error saving task to sheet:", error);
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
    console.error("Error deleting task from sheet:", error);
    throw error;
  }
};