export type Department = 'finance' | 'operations' | 'hr';
export type Role = 'employee' | 'manager' | 'admin';

export interface Employee {
  id: string;
  email: string;
  fullName: string;
  department: Department;
  role: Role;
  managerId?: string;
  createdAt?: Date;
}
