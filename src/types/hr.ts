export type LeaveType = 'annual' | 'sick' | 'unpaid';

export interface HRRecord {
  id: string;
  employeeEmail: string;
  leaveType: LeaveType;
  leaveBalance: number;
  contractType: string;
  startDate: Date;
}
