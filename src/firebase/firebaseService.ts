import { db } from './config'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const CLIENTS_COL = 'crm_clients';
const INVOICES_COL = 'invoices';

export const getClients = async () => {
  const querySnapshot = await getDocs(collection(db, CLIENTS_COL));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addClient = async (data: any) => {
  return await addDoc(collection(db, CLIENTS_COL), data);
};

export const updateClient = async (id: string, data: any) => {
  await updateDoc(doc(db, CLIENTS_COL, id), data);
};

export const deleteClient = async (id: string) => {
  await deleteDoc(doc(db, CLIENTS_COL, id));
};

// دالة الأتمتة لإنشاء فاتورة
export const addInvoice = async (data: any) => {
  return await addDoc(collection(db, INVOICES_COL), data);
};