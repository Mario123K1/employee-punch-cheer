import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, User, Clock, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakTaken?: boolean;
}

interface EmployeeRatesProps {
  employees: Employee[];
  timeEntries?: TimeEntry[];
}

export const EmployeeRates = ({ employees, timeEntries = [] }: EmployeeRatesProps) => {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    employees.forEach(emp => {
      initial[emp.id] = emp.hourlyRate;
    });
    return initial;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [togglingBreak, setTogglingBreak] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const getTodayEntry = (employeeId: string) => {
    return timeEntries.find(
      t => t.employeeId === employeeId && t.date === today && t.clockIn && !t.clockOut
    );
  };

  const isAtWork = (employeeId: string) => {
    return !!getTodayEntry(employeeId);
  };

  const handleRateChange = (employeeId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setRates(prev => ({ ...prev, [employeeId]: numValue }));
  };

  const handleSave = async (employeeId: string) => {
    setSaving(employeeId);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ hourly_rate: rates[employeeId] })
        .eq('id', employeeId);

      if (error) throw error;

      toast.success('Hodinová sadzba bola uložená');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error) {
      toast.error('Chyba pri ukladaní sadzby');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleBreak = async (employeeId: string) => {
    const entry = getTodayEntry(employeeId);
    if (!entry) return;

    setTogglingBreak(employeeId);
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ break_taken: !entry.breakTaken })
        .eq('id', entry.id);

      if (error) throw error;

      toast.success(entry.breakTaken ? 'Prestávka zrušená' : 'Prestávka označená');
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    } catch (error) {
      toast.error('Chyba pri označovaní prestávky');
    } finally {
      setTogglingBreak(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Hodinové sadzby zamestnancov
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map(employee => {
            const todayEntry = getTodayEntry(employee.id);
            const atWork = isAtWork(employee.id);
            
            return (
              <div
                key={employee.id}
                className="flex items-center gap-4 p-4 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{employee.name}</p>
                    {atWork && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white gap-1">
                        <Clock className="w-3 h-3" />
                        V práci
                      </Badge>
                    )}
                    {atWork && (
                      <Button
                        size="sm"
                        variant={todayEntry?.breakTaken ? "secondary" : "outline"}
                        onClick={() => handleToggleBreak(employee.id)}
                        disabled={togglingBreak === employee.id}
                        className="gap-1 h-7"
                      >
                        <Coffee className="w-3 h-3" />
                        {todayEntry?.breakTaken ? 'Prestávka ✓' : 'Prestávka'}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{employee.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`rate-${employee.id}`} className="sr-only">
                    Hodinová sadzba
                  </Label>
                  <Input
                    id={`rate-${employee.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[employee.id] || 0}
                    onChange={(e) => handleRateChange(employee.id, e.target.value)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">€/hod</span>
                  <Button
                    size="sm"
                    onClick={() => handleSave(employee.id)}
                    disabled={saving === employee.id}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
