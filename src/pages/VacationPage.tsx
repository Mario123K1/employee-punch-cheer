import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VacationCalendar } from '@/components/vacation/VacationCalendar';
import { mockEmployees, mockVacationDays } from '@/data/mockData';
import { Employee, VacationDay } from '@/types/employee';

const VacationPage = () => {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [vacationDays, setVacationDays] = useState<VacationDay[]>(mockVacationDays);

  const handleAddVacation = (employeeId: string, date: Date, type: VacationDay['type']) => {
    const newVacation: VacationDay = {
      id: Date.now().toString(),
      employeeId,
      date: date.toISOString().split('T')[0],
      type,
    };
    setVacationDays([...vacationDays, newVacation]);
  };

  const handleRemoveVacation = (vacationId: string) => {
    setVacationDays(vacationDays.filter(v => v.id !== vacationId));
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vacation Management</h1>
          <p className="text-muted-foreground">
            Schedule and manage employee time off
          </p>
        </div>

        <VacationCalendar
          employees={employees}
          vacationDays={vacationDays}
          onAddVacation={handleAddVacation}
          onRemoveVacation={handleRemoveVacation}
        />
      </div>
    </AppLayout>
  );
};

export default VacationPage;
