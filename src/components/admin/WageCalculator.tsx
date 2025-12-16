import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, Clock, Percent } from 'lucide-react';

export function WageCalculator() {
  const [hours, setHours] = useState('');
  const [rate, setRate] = useState('');
  const [overtime, setOvertime] = useState('');
  const [overtimeMultiplier, setOvertimeMultiplier] = useState('1.5');
  const [deductions, setDeductions] = useState('');

  const regularPay = parseFloat(hours || '0') * parseFloat(rate || '0');
  const overtimePay = parseFloat(overtime || '0') * parseFloat(rate || '0') * parseFloat(overtimeMultiplier || '1.5');
  const grossPay = regularPay + overtimePay;
  const deductionAmount = parseFloat(deductions || '0');
  const netPay = grossPay - deductionAmount;

  const clearAll = () => {
    setHours('');
    setRate('');
    setOvertime('');
    setDeductions('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          Wage Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Regular Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Regular Hours
            </Label>
            <Input
              id="hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
            />
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Hourly Rate
            </Label>
            <Input
              id="rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          {/* Overtime Hours */}
          <div className="space-y-2">
            <Label htmlFor="overtime" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Overtime Hours
            </Label>
            <Input
              id="overtime"
              type="number"
              value={overtime}
              onChange={(e) => setOvertime(e.target.value)}
              placeholder="0"
              min="0"
              step="0.5"
            />
          </div>

          {/* Overtime Multiplier */}
          <div className="space-y-2">
            <Label htmlFor="multiplier" className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              Overtime Multiplier
            </Label>
            <Input
              id="multiplier"
              type="number"
              value={overtimeMultiplier}
              onChange={(e) => setOvertimeMultiplier(e.target.value)}
              placeholder="1.5"
              min="1"
              step="0.1"
            />
          </div>

          {/* Deductions */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="deductions" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-destructive" />
              Deductions (taxes, etc.)
            </Label>
            <Input
              id="deductions"
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Results */}
        <div className="p-4 rounded-xl bg-muted space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Regular Pay</span>
            <span className="font-medium">${regularPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Overtime Pay</span>
            <span className="font-medium text-warning">${overtimePay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-muted-foreground">Gross Pay</span>
            <span className="font-semibold">${grossPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Deductions</span>
            <span className="font-medium text-destructive">-${deductionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-3">
            <span className="font-semibold text-lg">Net Pay</span>
            <span className="font-bold text-2xl text-clockIn">${netPay.toFixed(2)}</span>
          </div>
        </div>

        <Button variant="outline" onClick={clearAll} className="w-full">
          Clear All
        </Button>
      </CardContent>
    </Card>
  );
}
