import { initializeApp, getApps, getApp } from 'firebase/app';

// رابط الـ Web App الخاص بـ Google Sheets
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

// --- نظام السجلات والتدقيق السحابي (Audit Logs) المطور والمربوط بالموظفين ---

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
    return await response.json();
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
};

// --- دوال الشؤون الإدارية وحوكمة الموارد البشرية والتميز الأسبوعي ---

export const getHRActionLogs = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getHRActionLogs&_t=' + Date.now());
    return await response.json();
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

// --- دوال الطلبات (Orders) ---

export const getOrders = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get&_t=' + Date.now());
    return await response.json();
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

// --- دوال المشرفين (Admins) ---

export const getAdmins = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getAdmins&_t=' + Date.now());
    return await response.json();
  } catch (error) {
    console.error("Error fetching admins in dashboard:", error);
    return [];
  }
};

// --- دوال الخدمات والكوبونات ---

export const getServices = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getServices&_t=' + Date.now());
    const data = await response.json();
    
    return Array.isArray(data) ? data.map((s: any) => ({
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
    return await response.json();
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

// --- دوال الحوكمة المالية سحابياً (مع فلتر حجب قاطع لأي قيمة وهمية مثل 5750) ---

export const getExpensesSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getExpenses&_t=' + Date.now());
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.filter((item: any) => {
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
    return await response.json();
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
    return await response.json();
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

export const getInvoicesSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getInvoices&_t=' + Date.now());
    return await response.json();
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
    return await response.json();
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

// --- دوال ورقة أرشيف المستقلين التشغيلي (freelance) ---
export const getFreelanceSheet = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getFreelance&_t=' + Date.now());
    return await response.json();
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
    return await response.json();
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
    return await response.json();
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
    return await response.json();
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