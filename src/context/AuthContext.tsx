import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { fetchEmployeeByUid } from '@/services/firestore/employees';
import { getAdmins } from '@/services/dbService';
import type { Employee } from '@/types/employee';

interface AuthContextValue {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  adminData: any | null;
  verifyAdminCredentials: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [adminData, setAdminData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. فحص وجود جلسة مشرف محفوظة في localStorage أولاً
    const savedAdmin = localStorage.getItem('noorcast_admin_session');
    if (savedAdmin) {
      try {
        setAdminData(JSON.parse(savedAdmin));
      } catch {
        localStorage.removeItem('noorcast_admin_session');
      }
    }

    // 2. الاستماع لحالة Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const employeeData = await fetchEmployeeByUid(firebaseUser.uid);
        setEmployee(employeeData);
      } else {
        setEmployee(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // دالة التحقق من بيانات المشرف من قوقل شيت وحفظ الجلسة
  const verifyAdminCredentials = async (email: string, pass: string): Promise<boolean> => {
    try {
      const admins = await getAdmins();
      if (!Array.isArray(admins)) return false;

      const matchedAdmin = admins.find((admin: any) => {
        const adminEmail = (admin.email || admin.Email || '').toString().trim().toLowerCase();
        const adminPass = (admin.password || admin.Password || '').toString().trim();
        return adminEmail === email.trim().toLowerCase() && adminPass === pass.trim();
      });

      if (matchedAdmin) {
        setAdminData(matchedAdmin);
        // حفظ جلسة المشرف محلياً لضمان عدم الخروج عند الانتقال بين الصفحات
        localStorage.setItem('noorcast_admin_session', JSON.stringify(matchedAdmin));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error verifying admin credentials:", error);
      return false;
    }
  };

  // دالة تسجيل الخروج للمشرف
  const logoutAdmin = () => {
    setAdminData(null);
    localStorage.removeItem('noorcast_admin_session');
  };

  return (
    <AuthContext.Provider value={{ user, employee, loading, adminData, verifyAdminCredentials, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}