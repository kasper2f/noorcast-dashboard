import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { HRRecord } from '@/types/hr';

function mapHRDoc(id: string, data: DocumentData): HRRecord {
  return {
    id,
    employeeEmail: data.employeeEmail,
    leaveType: data.leaveType,
    leaveBalance: data.leaveBalance,
    contractType: data.contractType,
    startDate: data.startDate?.toDate?.() ?? new Date(),
  };
}

export async function fetchHRByEmail(email: string): Promise<HRRecord[]> {
  const q = query(collection(db, 'hr'), where('employeeEmail', '==', email));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => mapHRDoc(doc.id, doc.data()));
}

export async function fetchAllHR(): Promise<HRRecord[]> {
  const snap = await getDocs(collection(db, 'hr'));
  return snap.docs.map((doc) => mapHRDoc(doc.id, doc.data()));
}
