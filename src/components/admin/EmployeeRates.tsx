import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
}

interface EmployeeRatesProps {
  employees: Employee[];
}

export const EmployeeRates = ({ employees }: EmployeeRatesProps) => {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    employees.forEach(emp => {
      initial[emp.id] = emp.hourlyRate;
    });
    return initial;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
          {employees.map(employee => (
            <div
              key={employee.id}
              className="flex items-center gap-4 p-4 border rounded-lg bg-card"
            >
              <div className="flex-1">
                <p className="font-medium">{employee.name}</p>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
