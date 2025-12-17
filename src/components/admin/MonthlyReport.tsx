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
import { BarChart3, Clock, Calendar, DollarSign, Download, FileSpreadsheet, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { useHolidays, isHoliday } from '@/hooks/useHolidays';

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
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const { data: holidays = [] } = useHolidays();

  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    return Math.max(0, totalMinutes / 60);
  };

  const reports = useMemo(() => {
    const monthNum = parseInt(selectedMonth) + 1;
    const yearNum = parseInt(selectedYear);
    const monthPrefix = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;

    return employees.map(employee => {
      const employeeEntries = timeEntries.filter(
        e => e.employeeId === employee.id && e.date.startsWith(monthPrefix) && e.clockIn && e.clockOut
      );

      let regularHours = 0;
      let holidayHours = 0;

      employeeEntries.forEach(entry => {
        if (entry.clockIn && entry.clockOut) {
          const hours = calculateHours(entry.clockIn, entry.clockOut);
          if (isHoliday(entry.date, holidays)) {
            holidayHours += hours;
          } else {
            regularHours += hours;
          }
        }
      });

      const totalHours = regularHours + holidayHours;
      const employeeVacations = vacationDays.filter(
        v => v.employeeId === employee.id && v.date.startsWith(monthPrefix)
      );

      // Regular pay + 100% bonus for holiday hours
      const regularWage = regularHours * employee.hourlyRate;
      const holidayWage = holidayHours * employee.hourlyRate * 2; // 100% príplatok = 2x sadzba
      const calculatedWage = regularWage + holidayWage;

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalHours: Math.round(totalHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        holidayHours: Math.round(holidayHours * 100) / 100,
        totalDays: employeeEntries.length,
        vacationDays: employeeVacations.length,
        hourlyRate: employee.hourlyRate,
        calculatedWage: Math.round(calculatedWage * 100) / 100,
        holidayBonus: Math.round(holidayHours * employee.hourlyRate * 100) / 100,
      };
    });
  }, [employees, timeEntries, vacationDays, selectedMonth, selectedYear, holidays]);

  const totalWages = reports.reduce((sum, r) => sum + r.calculatedWage, 0);
  const totalHours = reports.reduce((sum, r) => sum + r.totalHours, 0);

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const isAtWork = (employeeId: string) => {
    const todayEntry = timeEntries.find(
      t => t.employeeId === employeeId && t.date === today && t.clockIn && !t.clockOut
    );
    return !!todayEntry;
  };

  const handleExport = () => {
    const exportData = reports.map(report => ({
      'Zamestnanec': report.employeeName,
      'Odpracované dni': report.totalDays,
      'Odpracované hodiny': report.totalHours,
      'Hodiny cez sviatok': report.holidayHours,
      'Príplatok za sviatky (€)': report.holidayBonus,
      'Dni voľna': report.vacationDays,
      'Hodinová sadzba (€)': report.hourlyRate,
      'Celková mzda (€)': report.calculatedWage,
    }));

    // Add summary row
    exportData.push({
      'Zamestnanec': 'CELKOM',
      'Odpracované dni': reports.reduce((sum, r) => sum + r.totalDays, 0),
      'Odpracované hodiny': totalHours,
      'Hodiny cez sviatok': reports.reduce((sum, r) => sum + r.holidayHours, 0),
      'Príplatok za sviatky (€)': reports.reduce((sum, r) => sum + r.holidayBonus, 0),
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
      { wch: 18 }, // Hodiny cez sviatok
      { wch: 20 }, // Príplatok za sviatky
      { wch: 12 }, // Dni voľna
      { wch: 18 }, // Hodinová sadzba
      { wch: 16 }, // Celková mzda
    ];

    const monthName = months[parseInt(selectedMonth)];
    const fileName = `vyplaty_${monthName}_${selectedYear}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success(`Export "${fileName}" bol stiahnutý`);
  };

  const handleEmployeeExport = (employeeId: string, employeeName: string) => {
    const monthNum = parseInt(selectedMonth) + 1;
    const yearNum = parseInt(selectedYear);
    const monthPrefix = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;

    const employeeEntries = timeEntries
      .filter(e => e.employeeId === employeeId && e.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    const employee = employees.find(e => e.id === employeeId);
    const hourlyRate = employee?.hourlyRate || 0;

    const exportData = employeeEntries.map(entry => {
      const hours = entry.clockIn && entry.clockOut 
        ? Math.round(calculateHours(entry.clockIn, entry.clockOut) * 100) / 100 
        : 0;
      const holiday = isHoliday(entry.date, holidays);
      const multiplier = holiday ? 2 : 1;
      return {
        'Dátum': format(new Date(entry.date), 'd.M.yyyy (EEEE)', { locale: sk }),
        'Sviatok': holiday ? holiday.name : '',
        'Príchod': entry.clockIn || '-',
        'Odchod': entry.clockOut || '-',
        'Hodiny': hours,
        'Mzda (€)': Math.round(hours * hourlyRate * multiplier * 100) / 100,
      };
    });

    const totalHrs = exportData.reduce((sum, row) => sum + (row['Hodiny'] as number), 0);
    const totalWage = exportData.reduce((sum, row) => sum + (row['Mzda (€)'] as number), 0);

    // Add empty row and totals
    exportData.push({
      'Dátum': '',
      'Sviatok': '',
      'Príchod': '',
      'Odchod': '',
      'Hodiny': 0,
      'Mzda (€)': 0,
    });
    exportData.push({
      'Dátum': 'CELKOM',
      'Sviatok': '',
      'Príchod': '',
      'Odchod': '',
      'Hodiny': Math.round(totalHrs * 100) / 100,
      'Mzda (€)': Math.round(totalWage * 100) / 100,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];

    const monthName = months[parseInt(selectedMonth)];
    const sheetName = employeeName.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const safeName = employeeName.replace(/[^a-zA-Z0-9áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/g, '_');
    const fileName = `${safeName}_${monthName}_${selectedYear}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success(`Export pre ${employeeName} bol stiahnutý`);
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
              {[2023, 2024, 2025, 2026].map(year => (
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
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sviatok</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Voľno</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sadzba/hod</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Celková mzda</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Export</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.employeeId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        className="flex items-center gap-3 hover:text-primary transition-colors text-left"
                        onClick={() => setSelectedEmployee({ id: report.employeeId, name: report.employeeName })}
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                          {report.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium underline-offset-2 hover:underline">{report.employeeName}</span>
                        {isAtWork(report.employeeId) && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white gap-1 ml-1">
                            <Clock className="w-3 h-3" />
                            V práci
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="text-right py-3 px-4">{report.totalDays}</td>
                    <td className="text-right py-3 px-4 font-medium">{report.totalHours}h</td>
                    <td className="text-right py-3 px-4">
                      {report.holidayHours > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-600">
                          <Star className="w-3 h-3" />
                          {report.holidayHours}h (+{report.holidayBonus}€)
                        </span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">
                      {report.vacationDays > 0 && (
                        <span className="status-badge bg-vacation/20 text-vacation">
                          {report.vacationDays} dní
                        </span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{report.hourlyRate} €</td>
                    <td className="text-right py-3 px-4 font-bold text-clockIn">{report.calculatedWage.toFixed(2)} €</td>
                    <td className="text-right py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmployeeExport(report.employeeId, report.employeeName)}
                        title="Exportovať detailný výkaz"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <EmployeeDetailModal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          employeeName={selectedEmployee.name}
          timeEntries={timeEntries.filter(e => e.employeeId === selectedEmployee.id)}
        />
      )}
    </div>
  );
}
