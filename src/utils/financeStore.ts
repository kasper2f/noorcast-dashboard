// src/utils/financeStore.ts

// دالة لجلب البيانات
export const getFinanceData = <T>(key: string): T[] => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

// دالة لحفظ البيانات
export const saveFinanceData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};