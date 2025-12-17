export interface Employee {
  id: string;
  name: string;
  role?: string;
  department?: string;
  hourlyRate: number;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakTaken: boolean;
}

export interface VacationDay {
  id: string;
  employeeId: string;
  date: string;
  type: 'vacation' | 'sick' | 'personal';
}

export interface MonthlyReport {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  totalDays: number;
  vacationDays: number;
  hourlyRate: number;
  calculatedWage: number;
}
