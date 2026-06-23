import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { OperationTask } from '@/types/operations';

function mapOperationDoc(id: string, data: DocumentData): OperationTask {
  return {
    id,
    employeeEmail: data.employeeEmail,
    title: data.title,
    description: data.description,
    status: data.status,
    dueDate: data.dueDate?.toDate?.() ?? new Date(),
  };
}

export async function fetchTasksByEmail(email: string): Promise<OperationTask[]> {
  const q = query(collection(db, 'operations'), where('employeeEmail', '==', email));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => mapOperationDoc(doc.id, doc.data()));
}

export async function fetchAllOperations(): Promise<OperationTask[]> {
  const snap = await getDocs(collection(db, 'operations'));
  return snap.docs.map((doc) => mapOperationDoc(doc.id, doc.data()));
}
