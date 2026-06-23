export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface OperationTask {
  id: string;
  employeeEmail: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date;
}
