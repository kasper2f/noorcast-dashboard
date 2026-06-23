export type FinanceType = 'salary' | 'bonus' | 'expense' | 'invoice';

export interface FinanceRecord {
  id: string;
  employeeEmail: string;
  type: FinanceType;
  amount: number;
  description: string;
  date: Date;
}
