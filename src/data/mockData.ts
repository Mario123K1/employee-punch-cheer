import { Employee, TimeEntry, VacationDay } from '@/types/employee';

export const mockEmployees: Employee[] = [
  { id: '1', name: 'Ahmed Hassan', department: 'Engineering', hourlyRate: 25 },
  { id: '2', name: 'Sara Mohamed', department: 'Design', hourlyRate: 22 },
  { id: '3', name: 'Omar Ali', department: 'Marketing', hourlyRate: 20 },
  { id: '4', name: 'Fatima Ibrahim', department: 'HR', hourlyRate: 23 },
  { id: '5', name: 'Youssef Ahmed', department: 'Engineering', hourlyRate: 28 },
  { id: '6', name: 'Nour Mahmoud', department: 'Sales', hourlyRate: 21 },
];

export const mockTimeEntries: TimeEntry[] = [
  { id: '1', employeeId: '1', date: '2024-01-15', clockIn: '09:00', clockOut: '17:30', breakTaken: true },
  { id: '2', employeeId: '1', date: '2024-01-16', clockIn: '08:45', clockOut: '17:00', breakTaken: true },
  { id: '3', employeeId: '2', date: '2024-01-15', clockIn: '09:30', clockOut: '18:00', breakTaken: false },
  { id: '4', employeeId: '3', date: '2024-01-15', clockIn: '08:00', clockOut: '16:30', breakTaken: true },
];

export const mockVacationDays: VacationDay[] = [
  { id: '1', employeeId: '1', date: '2024-01-20', type: 'vacation' },
  { id: '2', employeeId: '2', date: '2024-01-22', type: 'sick' },
];
