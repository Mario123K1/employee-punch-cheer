import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeCard } from '@/components/employee/EmployeeCard';
import { TimeEntryModal } from '@/components/employee/TimeEntryModal';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useTimeEntries, useClockIn, useClockOut, TimeEntry, getUnclosedPreviousEntry, useToggleBreak } from '@/hooks/useTimeEntries';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Clock, Search, WifiOff, CloudOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Index = () => {
  useRealtimeSubscription();
  const { isOnline, pendingCount, addOfflineClockIn, addOfflineClockOut } = useOfflineSync();
  
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: timeEntries = [], isLoading: loadingEntries } = useTimeEntries();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const toggleBreak = useToggleBreak();
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const getTodayEntry = (employeeId: string): TimeEntry | undefined => {
    return timeEntries.find(e => e.employee_id === employeeId && e.date === today);
  };

  const handleClockIn = async (employeeId: string, time: string) => {
    if (!isOnline) {
      addOfflineClockIn(employeeId, today, time);
      toast.info('Príchod uložený offline - synchronizuje sa keď bude internet');
      return;
    }
    
    try {
      await clockIn.mutateAsync({ employeeId, date: today, time });
      toast.success('Príchod zaznamenaný');
    } catch (error) {
      // Save offline if online request fails
      addOfflineClockIn(employeeId, today, time);
      toast.warning('Príchod uložený offline - synchronizuje sa neskôr');
    }
  };

  const handleClockOut = async (employeeId: string, time: string) => {
    const entry = getTodayEntry(employeeId);
    if (entry) {
      if (!isOnline) {
        addOfflineClockOut(employeeId, today, time, entry.id);
        toast.info('Odchod uložený offline - synchronizuje sa keď bude internet');
        return;
      }
      
      try {
        await clockOut.mutateAsync({ entryId: entry.id, time });
        toast.success('Odchod zaznamenaný');
      } catch (error) {
        addOfflineClockOut(employeeId, today, time, entry.id);
        toast.warning('Odchod uložený offline - synchronizuje sa neskôr');
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

  const handleToggleBreak = async (entryId: string, breakTaken: boolean) => {
    try {
      await toggleBreak.mutateAsync({ entryId, breakTaken });
      toast.success(breakTaken ? 'Prestávka označená' : 'Prestávka zrušená');
    } catch (error) {
      toast.error('Chyba pri označovaní prestávky');
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
            {!isOnline && (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="w-3 h-3" />
                Offline
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <CloudOff className="w-3 h-3" />
                {pendingCount} čaká
              </Badge>
            )}
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
                      breakTaken: todayEntry.break_taken,
                    } : undefined}
                    hasUnclosedEntry={!!unclosedEntry}
                    onToggleBreak={handleToggleBreak}
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
              breakTaken: entry.break_taken,
            } : undefined;
          })()}
          unclosedEntry={getUnclosedEntry(selectedEmployee.id)}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onCloseUnclosed={handleCloseUnclosed}
          onToggleBreak={handleToggleBreak}
        />
      )}
    </AppLayout>
  );
};

export default Index;
