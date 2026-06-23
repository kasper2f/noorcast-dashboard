import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Employee } from '@/types/employee';

export async function fetchEmployeeByUid(uid: string): Promise<Employee | null> {
  const snap = await getDoc(doc(db, 'employees', uid));

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    email: data.email,
    fullName: data.fullName,
    department: data.department,
    role: data.role,
    managerId: data.managerId,
    createdAt: data.createdAt?.toDate?.(),
  };
}
