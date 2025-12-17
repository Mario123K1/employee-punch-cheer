import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, User } from 'lucide-react';
import { useRemoveVacation } from '@/hooks/useVacationDays';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface VacationDay {
  id: string;
  employeeId: string;
  date: string;
  type: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
}

interface VacationManagementProps {
  vacationDays: VacationDay[];
  employees: Employee[];
}

const typeLabels: Record<string, string> = {
  vacation: 'Dovolenka',
  sick: 'PN',
  personal: 'Osobné voľno',
};

const typeColors: Record<string, string> = {
  vacation: 'bg-blue-500',
  sick: 'bg-red-500',
  personal: 'bg-purple-500',
};

export const VacationManagement = ({ vacationDays, employees }: VacationManagementProps) => {
  const removeVacation = useRemoveVacation();

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Neznámy';
  };

  const handleRemove = async (vacationId: string) => {
    try {
      await removeVacation.mutateAsync(vacationId);
      toast.success('Dovolenka bola odstránená');
    } catch (error) {
      toast.error('Chyba pri odstraňovaní dovolenky');
    }
  };

  const sortedVacations = [...vacationDays].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Správa dovoleniek
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedVacations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Žiadne nahlásené dovolenky
          </p>
        ) : (
          <div className="space-y-3">
            {sortedVacations.map(vacation => (
              <div
                key={vacation.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{getEmployeeName(vacation.employeeId)}</span>
                  </div>
                  <Badge className={typeColors[vacation.type] || 'bg-gray-500'}>
                    {typeLabels[vacation.type] || vacation.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    {format(new Date(vacation.date), 'd. MMMM yyyy', { locale: sk })}
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(vacation.id)}
                    disabled={removeVacation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
