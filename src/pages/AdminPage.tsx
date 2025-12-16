import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MonthlyReport } from '@/components/admin/MonthlyReport';
import { WageCalculator } from '@/components/admin/WageCalculator';
import { mockEmployees, mockTimeEntries, mockVacationDays } from '@/data/mockData';
import { Employee, TimeEntry, VacationDay } from '@/types/employee';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calculator } from 'lucide-react';

const AdminPage = () => {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [timeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [vacationDays] = useState<VacationDay[]>(mockVacationDays);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            View reports and calculate wages
          </p>
        </div>

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
              employees={employees}
              timeEntries={timeEntries}
              vacationDays={vacationDays}
            />
          </TabsContent>
          
          <TabsContent value="calculator" className="mt-6">
            <div className="max-w-xl">
              <WageCalculator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
