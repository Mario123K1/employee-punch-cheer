import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeCard } from '@/components/employee/EmployeeCard';
import { TimeEntryModal } from '@/components/employee/TimeEntryModal';
import { mockEmployees } from '@/data/mockData';
import { Employee, TimeEntry } from '@/types/employee';
import { Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const getTodayEntry = (employeeId: string) => {
    return timeEntries.find(e => e.employeeId === employeeId && e.date === today);
  };

  const handleClockIn = (employeeId: string, time: string) => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      employeeId,
      date: today,
      clockIn: time,
      clockOut: null,
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  const handleClockOut = (employeeId: string, time: string) => {
    setTimeEntries(entries =>
      entries.map(entry =>
        entry.employeeId === employeeId && entry.date === today
          ? { ...entry, clockOut: time }
          : entry
      )
    );
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clockedInCount = employees.filter(emp => {
    const entry = getTodayEntry(emp.id);
    return entry?.clockIn && !entry?.clockOut;
  }).length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Time Clock</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-clockIn/10 text-clockIn">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{clockedInCount} currently working</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employee Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee, index) => (
            <div
              key={employee.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <EmployeeCard
                employee={employee}
                todayEntry={getTodayEntry(employee.id)}
                onClick={() => {
                  setSelectedEmployee(employee);
                  setModalOpen(true);
                }}
              />
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No employees found</p>
          </div>
        )}
      </div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employee={selectedEmployee}
        todayEntry={selectedEmployee ? getTodayEntry(selectedEmployee.id) : undefined}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
      />
    </AppLayout>
  );
};

export default Index;
