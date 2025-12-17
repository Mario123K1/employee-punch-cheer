import { AppLayout } from '@/components/layout/AppLayout';
import { MonthlyReport } from '@/components/admin/MonthlyReport';
import { WageCalculator } from '@/components/admin/WageCalculator';
import { useEmployees } from '@/hooks/useEmployees';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useVacationDays } from '@/hooks/useVacationDays';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calculator } from 'lucide-react';

const AdminPage = () => {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: timeEntries = [], isLoading: loadingEntries } = useTimeEntries();
  const { data: vacationDays = [], isLoading: loadingVacations } = useVacationDays();

  const isLoading = loadingEmployees || loadingEntries || loadingVacations;

  // Transform data for components
  const transformedEmployees = employees.map(e => ({
    id: e.id,
    name: e.name,
    role: e.role,
    hourlyRate: e.hourly_rate,
  }));

  const transformedTimeEntries = timeEntries.map(t => ({
    id: t.id,
    employeeId: t.employee_id,
    date: t.date,
    clockIn: t.clock_in,
    clockOut: t.clock_out,
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
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            View reports and calculate wages
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Monthly Reports
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-2">
                <Calculator className="w-4 h-4" />
                Wage Calculator
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="mt-6">
              <MonthlyReport
                employees={transformedEmployees}
                timeEntries={transformedTimeEntries}
                vacationDays={transformedVacations}
              />
            </TabsContent>
            
            <TabsContent value="calculator" className="mt-6">
              <div className="max-w-xl">
                <WageCalculator />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminPage;
