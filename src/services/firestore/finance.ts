import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { FinanceRecord } from '@/types/finance';

function mapFinanceDoc(id: string, data: DocumentData): FinanceRecord {
  return {
    id,
    employeeEmail: data.employeeEmail,
    type: data.type,
    amount: data.amount,
    description: data.description,
    date: data.date?.toDate?.() ?? new Date(),
  };
}

export async function fetchFinanceByEmail(email: string): Promise<FinanceRecord[]> {
  const q = query(collection(db, 'finance'), where('employeeEmail', '==', email));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => mapFinanceDoc(doc.id, doc.data()));
}

export async function fetchAllFinance(): Promise<FinanceRecord[]> {
  const snap = await getDocs(collection(db, 'finance'));
  return snap.docs.map((doc) => mapFinanceDoc(doc.id, doc.data()));
}
