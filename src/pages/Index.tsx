import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeCard } from '@/components/employee/EmployeeCard';
import { TimeEntryModal } from '@/components/employee/TimeEntryModal';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useTimeEntries, useClockIn, useClockOut, TimeEntry, getUnclosedPreviousEntry } from '@/hooks/useTimeEntries';
import { Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Index = () => {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: timeEntries = [], isLoading: loadingEntries } = useTimeEntries();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const getTodayEntry = (employeeId: string): TimeEntry | undefined => {
    return timeEntries.find(e => e.employee_id === employeeId && e.date === today);
  };

  const handleClockIn = async (employeeId: string, time: string) => {
    try {
      await clockIn.mutateAsync({ employeeId, date: today, time });
      toast.success('Príchod zaznamenaný');
    } catch (error) {
      toast.error('Chyba pri zázname príchodu');
    }
  };

  const handleClockOut = async (employeeId: string, time: string) => {
    const entry = getTodayEntry(employeeId);
    if (entry) {
      try {
        await clockOut.mutateAsync({ entryId: entry.id, time });
        toast.success('Odchod zaznamenaný');
      } catch (error) {
        toast.error('Chyba pri zázname odchodu');
      }
    }
  };

  const handleCloseUnclosed = async (entryId: string, time: string) => {
    try {
      await clockOut.mutateAsync({ entryId, time });
      toast.success('Predchádzajúci záznam bol uzavretý');
    } catch (error) {
      toast.error('Chyba pri uzatváraní záznamu');
    }
  };

  const getUnclosedEntry = (employeeId: string) => {
    const unclosed = getUnclosedPreviousEntry(timeEntries, employeeId, today);
    return unclosed ? {
      id: unclosed.id,
      date: unclosed.date,
      clockIn: unclosed.clock_in || '',
    } : undefined;
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clockedInCount = employees.filter(emp => {
    const entry = getTodayEntry(emp.id);
    return entry?.clock_in && !entry?.clock_out;
  }).length;

  const isLoading = loadingEmployees || loadingEntries;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dochádzka</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('sk-SK', { 
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
              <span className="font-medium">{clockedInCount} práve pracuje</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Hľadať zamestnancov..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employee Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Načítavam zamestnancov...</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee, index) => {
              const todayEntry = getTodayEntry(employee.id);
              const unclosedEntry = getUnclosedPreviousEntry(timeEntries, employee.id, today);
              return (
                <div
                  key={employee.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <EmployeeCard
                    employee={{
                      id: employee.id,
                      name: employee.name,
                      role: employee.role,
                      hourlyRate: employee.hourly_rate,
                    }}
                    todayEntry={todayEntry ? {
                      id: todayEntry.id,
                      employeeId: todayEntry.employee_id,
                      date: todayEntry.date,
                      clockIn: todayEntry.clock_in,
                      clockOut: todayEntry.clock_out,
                    } : undefined}
                    hasUnclosedEntry={!!unclosedEntry}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setModalOpen(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Žiadni zamestnanci nenájdení</p>
          </div>
        )}
      </div>

      {/* Time Entry Modal */}
      {selectedEmployee && (
        <TimeEntryModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          employee={{
            id: selectedEmployee.id,
            name: selectedEmployee.name,
            role: selectedEmployee.role,
            hourlyRate: selectedEmployee.hourly_rate,
          }}
          todayEntry={(() => {
            const entry = getTodayEntry(selectedEmployee.id);
            return entry ? {
              id: entry.id,
              employeeId: entry.employee_id,
              date: entry.date,
              clockIn: entry.clock_in,
              clockOut: entry.clock_out,
            } : undefined;
          })()}
          unclosedEntry={getUnclosedEntry(selectedEmployee.id)}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onCloseUnclosed={handleCloseUnclosed}
        />
      )}
    </AppLayout>
  );
};

export default Index;
