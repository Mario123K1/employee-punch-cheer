import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MonthlyReport } from '@/components/admin/MonthlyReport';
import { WageCalculator } from '@/components/admin/WageCalculator';
import { EmployeeRates } from '@/components/admin/EmployeeRates';
import { VacationManagement } from '@/components/admin/VacationManagement';
import { UnclosedEntries } from '@/components/admin/UnclosedEntries';
import { useEmployees } from '@/hooks/useEmployees';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useVacationDays } from '@/hooks/useVacationDays';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Calculator, LogOut, Users, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const AdminPage = () => {
  useRealtimeSubscription();
  
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: timeEntries = [], isLoading: loadingEntries } = useTimeEntries();
  const { data: vacationDays = [], isLoading: loadingVacations } = useVacationDays();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Chyba pri odhlasovaní');
    } else {
      toast.success('Úspešne odhlásený');
      navigate('/auth');
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Načítavam...</p>
        </div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Správa</h1>
            <p className="text-muted-foreground">
              Zobraziť reporty a vypočítať mzdy
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Odhlásiť
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Načítavam...</p>
          </div>
        ) : (
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Reporty</span>
              </TabsTrigger>
              <TabsTrigger value="unclosed" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Neuzavreté</span>
              </TabsTrigger>
              <TabsTrigger value="vacations" className="gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Dovolenky</span>
              </TabsTrigger>
              <TabsTrigger value="rates" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Sadzby</span>
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Kalkulačka</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="mt-6">
              <MonthlyReport
                employees={transformedEmployees}
                timeEntries={transformedTimeEntries}
                vacationDays={transformedVacations}
              />
            </TabsContent>

            <TabsContent value="unclosed" className="mt-6">
              <UnclosedEntries
                employees={transformedEmployees}
                timeEntries={timeEntries}
              />
            </TabsContent>

            <TabsContent value="vacations" className="mt-6">
              <VacationManagement 
                vacationDays={transformedVacations}
                employees={transformedEmployees}
              />
            </TabsContent>

            <TabsContent value="rates" className="mt-6">
              <EmployeeRates employees={transformedEmployees} timeEntries={transformedTimeEntries} />
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
