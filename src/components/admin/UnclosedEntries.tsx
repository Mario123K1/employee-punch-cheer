import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useClockOut, TimeEntry } from '@/hooks/useTimeEntries';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  role?: string;
}

interface UnclosedEntriesProps {
  employees: Employee[];
  timeEntries: TimeEntry[];
}

export function UnclosedEntries({ employees, timeEntries }: UnclosedEntriesProps) {
  const [closeTimes, setCloseTimes] = useState<Record<string, string>>({});
  const clockOut = useClockOut();

  const today = new Date().toISOString().split('T')[0];

  const unclosedEntries = timeEntries.filter(
    (entry) => entry.date < today && entry.clock_in && !entry.clock_out
  );

  const handleCloseEntry = async (entryId: string) => {
    const time = closeTimes[entryId] || '23:59';
    try {
      await clockOut.mutateAsync({ entryId, time });
      toast.success('Záznam bol uzavretý');
      setCloseTimes((prev) => {
        const newState = { ...prev };
        delete newState[entryId];
        return newState;
      });
    } catch (error) {
      toast.error('Chyba pri uzatváraní záznamu');
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.name || 'Neznámy';
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd. MMMM yyyy (EEEE)', { locale: sk });
    } catch {
      return dateStr;
    }
  };

  if (unclosedEntries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>Žiadne neuzavreté záznamy</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="w-5 h-5" />
          Neuzavreté záznamy ({unclosedEntries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {unclosedEntries
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-orange-500/30 bg-orange-500/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-semibold text-orange-600">
                      {getEmployeeName(entry.employee_id)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-medium">{getEmployeeName(entry.employee_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(entry.date)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Príchod: {entry.clock_in}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={closeTimes[entry.id] || ''}
                    onChange={(e) =>
                      setCloseTimes((prev) => ({
                        ...prev,
                        [entry.id]: e.target.value,
                      }))
                    }
                    placeholder="23:59"
                    className="w-28"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCloseEntry(entry.id)}
                    className="gap-1 border-orange-500 text-orange-600 hover:bg-orange-500/20"
                    disabled={clockOut.isPending}
                  >
                    <Check className="w-4 h-4" />
                    Uzavrieť
                  </Button>
                </div>
              </div>
            ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          * Ak nezadáte čas, použije sa predvolený čas 23:59
        </p>
      </CardContent>
    </Card>
  );
}
