import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { getHRPayrollSheet } from '@/services/dbService';
import { ar } from '@/i18n/ar';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { verifyAdminCredentials } = useAuthContext();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    console.log("1. تم الضغط على زر تسجيل الدخول");
    setError('');
    setLoading(true);

    try {
      console.log("2. جاري التحقق من بيانات المشرف من Google Sheets...");
      const isValidAdmin = await verifyAdminCredentials(email, password);
      console.log("3. نتيجة التحقق من الشيت:", isValidAdmin);

      if (isValidAdmin) {
        console.log("4. البيانات صحيحة، جاري جلب ملف الموظف وربط الجلسة...");
        
        let employeeUsername = email.split('@')[0];
        let employeeName = 'مستخدم نظام';
        let employeeRole = 'مشرف';

        try {
          // جلب بيانات مسير الرواتب لمطابقة الـ Username والاسم الحقيقي للإيميل المُسجل
          const hrEmployees = await getHRPayrollSheet();
          if (Array.isArray(hrEmployees)) {
            const matchedEmp = hrEmployees.find(
              (emp: any) => String(emp.email || '').toLowerCase().trim() === email.toLowerCase().trim()
            );
            if (matchedEmp) {
              employeeUsername = matchedEmp.username || matchedEmp.name?.split(' ')[0] || employeeUsername;
              employeeName = matchedEmp.name || employeeName;
              employeeRole = matchedEmp.position || matchedEmp.role || employeeRole;
            }
          }
        } catch (fetchErr) {
          console.error("لم يتم جلب بيانات الـ HR بنجاح، سيتم الاعتماد على اسم المستخدم الافتراضي:", fetchErr);
        }

        // حفظ تفاصيل الجلسة كاملة في التخزين المحلي لضمان ربط الـ AuditLog والـ CRM بدقة متناهية
        const sessionData = {
          email: email.toLowerCase().trim(),
          username: employeeUsername,
          name: employeeName,
          role: employeeRole,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionData));
        localStorage.setItem('adminUser', JSON.stringify(sessionData));
        localStorage.setItem('userEmail', email.toLowerCase().trim());

        console.log("5. تم حفظ الجلسة بنجاح للموظف:", employeeUsername);
        navigate('/');
      } else {
        console.log("6. البيانات غير مطابقة في الشيت");
        setError(ar.auth.loginError || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      console.log("7. حدث استثناء (Catch Error):", err);
      setError(ar.auth.loginError || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      console.log("8. انتهت عملية الـ Submit وتم إعادة تعيين حالة التحميل");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>{ar.app.name}</h1>
          <p>{ar.app.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{ar.auth.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{ar.auth.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              dir="ltr"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? ar.common.loading : ar.auth.login}
          </button>
        </form>
      </div>
    </div>
  );
}