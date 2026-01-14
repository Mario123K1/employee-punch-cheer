import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Employee, VacationDay } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palmtree, Plus, Trash2, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { eachDayOfInterval, format } from 'date-fns';

interface VacationCalendarProps {
  employees: Employee[];
  vacationDays: VacationDay[];
  onAddVacation: (employeeId: string, date: Date, type: VacationDay['type']) => void;
  onRemoveVacation: (vacationId: string) => void;
}

export function VacationCalendar({
  employees,
  vacationDays,
  onAddVacation,
  onRemoveVacation,
}: VacationCalendarProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [vacationType, setVacationType] = useState<VacationDay['type']>('vacation');

  // Ensure YYYY-MM-DD dates don't shift because of timezone
  const toLocalDate = (isoDate: string) => new Date(`${isoDate}T00:00:00`);
  const employeeVacations = selectedEmployee
    ? vacationDays.filter(v => v.employeeId === selectedEmployee)
    : vacationDays;

  const vacationDates = employeeVacations.map(v => toLocalDate(v.date));
  const handleAddVacation = async () => {
    if (selectedEmployee && dateRange?.from) {
      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;
      
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      for (const day of days) {
        // Normalize to noon to avoid timezone shifts at midnight
        const normalizedDay = new Date(day);
        normalizedDay.setHours(12, 0, 0, 0);
        await onAddVacation(selectedEmployee, normalizedDay, vacationType);
      }
      
      setDateRange(undefined);
    }
  };

  const getDaysCount = () => {
    if (!dateRange?.from) return 0;
    const endDate = dateRange.to || dateRange.from;
    return eachDayOfInterval({ start: dateRange.from, end: endDate }).length;
  };

  const getVacationTypeColor = (type: VacationDay['type']) => {
    switch (type) {
      case 'vacation': return 'bg-vacation text-vacation-foreground';
      case 'sick': return 'bg-destructive text-destructive-foreground';
      case 'personal': return 'bg-warning text-warning-foreground';
    }
  };

  const getVacationTypeLabel = (type: VacationDay['type']) => {
    switch (type) {
      case 'vacation': return 'Dovolenka';
      case 'sick': return 'PN';
      case 'personal': return 'Osobné voľno';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-vacation" />
            Kalendár dovoleniek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Selector */}
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Vyberte zamestnanca" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              modifiers={{
                vacation: vacationDates,
              }}
              modifiersStyles={{
                vacation: {
                  backgroundColor: 'hsl(var(--vacation))',
                  color: 'white',
                  borderRadius: '50%',
                },
              }}
              className="rounded-lg border"
            />
          </div>

          {/* Add Vacation Form */}
          {selectedEmployee && dateRange?.from && (
            <div className="p-4 rounded-lg bg-muted space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarRange className="w-4 h-4" />
                {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() ? (
                  <span>
                    {format(dateRange.from, 'd.M.yyyy')} - {format(dateRange.to, 'd.M.yyyy')} ({getDaysCount()} dní)
                  </span>
                ) : (
                  <span>Pridať voľno na {format(dateRange.from, 'd.M.yyyy')}</span>
                )}
              </div>
              <Select value={vacationType} onValueChange={(v) => setVacationType(v as VacationDay['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">🏖️ Dovolenka</SelectItem>
                  <SelectItem value="sick">🤒 PN</SelectItem>
                  <SelectItem value="personal">📋 Osobné voľno</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddVacation} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Pridať voľno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vacation List */}
      <Card>
        <CardHeader>
          <CardTitle>Naplánované voľno</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeVacations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palmtree className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Žiadne naplánované voľno</p>
              <p className="text-sm">Vyberte zamestnanca a dátum</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employeeVacations.map((vacation) => {
                const employee = employees.find(e => e.id === vacation.employeeId);
                return (
                  <div
                    key={vacation.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                        "bg-secondary text-secondary-foreground"
                      )}>
                        {employee?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{employee?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {toLocalDate(vacation.date).toLocaleDateString('sk-SK')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "status-badge",
                        getVacationTypeColor(vacation.type)
                      )}>
                        {getVacationTypeLabel(vacation.type)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveVacation(vacation.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
