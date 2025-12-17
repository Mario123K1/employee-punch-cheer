import { useState, useMemo } from 'react';
import { Employee, TimeEntry, VacationDay, MonthlyReport as MonthlyReportType } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, Clock, Calendar, DollarSign, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface MonthlyReportProps {
  employees: Employee[];
  timeEntries: TimeEntry[];
  vacationDays: VacationDay[];
}

const months = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

export function MonthlyReport({ employees, timeEntries, vacationDays }: MonthlyReportProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    return Math.max(0, totalMinutes / 60);
  };

  const reports = useMemo<MonthlyReportType[]>(() => {
    const monthNum = parseInt(selectedMonth) + 1;
    const yearNum = parseInt(selectedYear);
    const monthPrefix = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;

    return employees.map(employee => {
      const employeeEntries = timeEntries.filter(
        e => e.employeeId === employee.id && e.date.startsWith(monthPrefix) && e.clockIn && e.clockOut
      );

      const totalHours = employeeEntries.reduce((sum, entry) => {
        if (entry.clockIn && entry.clockOut) {
          return sum + calculateHours(entry.clockIn, entry.clockOut);
        }
        return sum;
      }, 0);

      const employeeVacations = vacationDays.filter(
        v => v.employeeId === employee.id && v.date.startsWith(monthPrefix)
      );

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalHours: Math.round(totalHours * 100) / 100,
        totalDays: employeeEntries.length,
        vacationDays: employeeVacations.length,
        hourlyRate: employee.hourlyRate,
        calculatedWage: Math.round(totalHours * employee.hourlyRate * 100) / 100,
      };
    });
  }, [employees, timeEntries, vacationDays, selectedMonth, selectedYear]);

  const totalWages = reports.reduce((sum, r) => sum + r.calculatedWage, 0);
  const totalHours = reports.reduce((sum, r) => sum + r.totalHours, 0);

  const handleExport = () => {
    const exportData = reports.map(report => ({
      'Zamestnanec': report.employeeName,
      'Odpracované dni': report.totalDays,
      'Odpracované hodiny': report.totalHours,
      'Dni voľna': report.vacationDays,
      'Hodinová sadzba (€)': report.hourlyRate,
      'Celková mzda (€)': report.calculatedWage,
    }));

    // Add summary row
    exportData.push({
      'Zamestnanec': 'CELKOM',
      'Odpracované dni': reports.reduce((sum, r) => sum + r.totalDays, 0),
      'Odpracované hodiny': totalHours,
      'Dni voľna': reports.reduce((sum, r) => sum + r.vacationDays, 0),
      'Hodinová sadzba (€)': 0,
      'Celková mzda (€)': totalWages,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Výplaty');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Zamestnanec
      { wch: 15 }, // Odpracované dni
      { wch: 18 }, // Odpracované hodiny
      { wch: 12 }, // Dni voľna
      { wch: 18 }, // Hodinová sadzba
      { wch: 16 }, // Celková mzda
    ];

    const monthName = months[parseInt(selectedMonth)];
    const fileName = `vyplaty_${monthName}_${selectedYear}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success(`Export "${fileName}" bol stiahnutý`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export do Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Celkom hodín</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-clockIn/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-clockIn" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Celkom mzdy</p>
                <p className="text-2xl font-bold">{totalWages.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zamestnanci</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-vacation/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-vacation" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dni voľna</p>
                <p className="text-2xl font-bold">{reports.reduce((sum, r) => sum + r.vacationDays, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hodiny zamestnancov - {months[parseInt(selectedMonth)]} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Zamestnanec</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Odprac. dní</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Hodiny</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Voľno</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sadzba/hod</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Celková mzda</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.employeeId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                          {report.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium">{report.employeeName}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{report.totalDays}</td>
                    <td className="text-right py-3 px-4 font-medium">{report.totalHours}h</td>
                    <td className="text-right py-3 px-4">
                      {report.vacationDays > 0 && (
                        <span className="status-badge bg-vacation/20 text-vacation">
                          {report.vacationDays} dní
                        </span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{report.hourlyRate} €</td>
                    <td className="text-right py-3 px-4 font-bold text-clockIn">{report.calculatedWage.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
