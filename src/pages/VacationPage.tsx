import { AppLayout } from '@/components/layout/AppLayout';
import { VacationCalendar } from '@/components/vacation/VacationCalendar';
import { useEmployees } from '@/hooks/useEmployees';
import { useVacationDays, useAddVacation, useRemoveVacation } from '@/hooks/useVacationDays';
import { toast } from 'sonner';
import { format } from 'date-fns';

const VacationPage = () => {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: vacationDays = [], isLoading: loadingVacations } = useVacationDays();
  const addVacation = useAddVacation();
  const removeVacation = useRemoveVacation();

  const handleAddVacation = async (employeeId: string, date: Date, type: 'vacation' | 'sick' | 'personal') => {
    try {
      await addVacation.mutateAsync({
        employeeId,
        date: format(date, 'yyyy-MM-dd'),
        type,
      });
      toast.success('Voľno naplánované');
    } catch (error) {
      toast.error('Chyba pri plánovaní voľna');
    }
  };

  const handleRemoveVacation = async (vacationId: string) => {
    try {
      await removeVacation.mutateAsync(vacationId);
      toast.success('Voľno zrušené');
    } catch (error) {
      toast.error('Chyba pri rušení voľna');
    }
  };

  const isLoading = loadingEmployees || loadingVacations;

  // Transform data for component
  const transformedEmployees = employees.map(e => ({
    id: e.id,
    name: e.name,
    role: e.role,
    hourlyRate: e.hourly_rate,
  }));

  const transformedVacations = vacationDays.map(v => ({
    id: v.id,
    employeeId: v.employee_id,
    date: v.date,
    type: v.type,
  }));

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Správa dovoleniek</h1>
          <p className="text-muted-foreground">
            Plánujte a spravujte voľno zamestnancov
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Načítavam...</p>
          </div>
        ) : (
          <VacationCalendar
            employees={transformedEmployees}
            vacationDays={transformedVacations}
            onAddVacation={handleAddVacation}
            onRemoveVacation={handleRemoveVacation}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default VacationPage;
