import { useState } from 'react';
import { Employee, TimeEntry } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, LogIn, LogOut, AlertTriangle, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface UnclosedEntry {
  id: string;
  date: string;
  clockIn: string;
}

interface TimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  todayEntry?: TimeEntry;
  unclosedEntry?: UnclosedEntry;
  onClockIn: (employeeId: string, time: string) => void;
  onClockOut: (employeeId: string, time: string) => void;
  onCloseUnclosed: (entryId: string, time: string) => void;
  onToggleBreak?: (entryId: string, breakTaken: boolean) => void;
}

export function TimeEntryModal({
  open,
  onOpenChange,
  employee,
  todayEntry,
  unclosedEntry,
  onClockIn,
  onClockOut,
  onCloseUnclosed,
  onToggleBreak,
}: TimeEntryModalProps) {
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [unclosedCloseTime, setUnclosedCloseTime] = useState('');

  const isClockedIn = todayEntry?.clockIn && !todayEntry?.clockOut;
  const hasCompleted = todayEntry?.clockIn && todayEntry?.clockOut;

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    if (employee) {
      const time = clockInTime || getCurrentTime();
      onClockIn(employee.id, time);
      setClockInTime('');
      onOpenChange(false);
    }
  };

  const handleClockOut = () => {
    if (employee) {
      const time = clockOutTime || getCurrentTime();
      onClockOut(employee.id, time);
      setClockOutTime('');
      onOpenChange(false);
    }
  };

  const handleCloseUnclosed = () => {
    if (unclosedEntry) {
      const time = unclosedCloseTime || '23:59';
      onCloseUnclosed(unclosedEntry.id, time);
      setUnclosedCloseTime('');
    }
  };

  const handleToggleBreak = () => {
    if (todayEntry && onToggleBreak) {
      onToggleBreak(todayEntry.id, !todayEntry.breakTaken);
    }
  };

  const formatUnclosedDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd. MMMM yyyy (EEEE)', { locale: sk });
    } catch {
      return dateStr;
    }
  };

  // Calculate displayed hours
  const calculateHours = () => {
    if (!todayEntry?.clockIn || !todayEntry?.clockOut) return null;
    const [inH, inM] = todayEntry.clockIn.split(':').map(Number);
    const [outH, outM] = todayEntry.clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    let hours = Math.max(0, totalMinutes / 60);
    if (todayEntry.breakTaken) {
      hours = Math.max(0, hours - 0.5);
    }
    return Math.round(hours * 100) / 100;
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
              isClockedIn 
                ? "bg-clockIn/20 text-clockIn" 
                : "bg-secondary text-secondary-foreground"
            )}>
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span>{employee.name}</span>
              <p className="text-sm font-normal text-muted-foreground">{employee.role || employee.department}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            {hasCompleted 
              ? `Dnes už dokončené (${todayEntry?.clockIn} - ${todayEntry?.clockOut})`
              : isClockedIn 
                ? `Pracuje od ${todayEntry?.clockIn}`
                : 'Zaznamenajte dochádzku na dnešný deň'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Unclosed Entry Warning */}
          {unclosedEntry && (
            <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Neuzavretý záznam</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>
                  Zamestnanec má neuzavretý záznam z <strong>{formatUnclosedDate(unclosedEntry.date)}</strong> (príchod: {unclosedEntry.clockIn})
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={unclosedCloseTime}
                    onChange={(e) => setUnclosedCloseTime(e.target.value)}
                    placeholder="HH:MM"
                    className="flex-1 bg-background"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseUnclosed}
                    className="gap-1 border-orange-500 text-orange-700 hover:bg-orange-500/20"
                  >
                    <LogOut className="w-3 h-3" />
                    Uzavrieť (23:59)
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Clock In Section */}
          {!isClockedIn && !hasCompleted && (
            <div className="space-y-3">
              <Label htmlFor="clockIn" className="text-sm font-medium">
                Čas príchodu
              </Label>
              <div className="flex gap-2">
                <Input
                  id="clockIn"
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                  placeholder="HH:MM"
                  className="flex-1"
                />
                <Button
                  variant="clockIn"
                  size="lg"
                  onClick={handleClockIn}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Príchod
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nechajte prázdne pre aktuálny čas ({getCurrentTime()})
              </p>
            </div>
          )}

          {/* Clock Out Section */}
          {isClockedIn && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-clockIn/10 border border-clockIn/20">
                <p className="text-sm font-medium text-clockIn">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Príchod o {todayEntry?.clockIn}
                </p>
              </div>
              
              {/* Break Toggle Button - available while working */}
              {onToggleBreak && (
                <Button
                  variant={todayEntry?.breakTaken ? "default" : "outline"}
                  className={cn(
                    "w-full gap-2",
                    todayEntry?.breakTaken 
                      ? "bg-amber-500 hover:bg-amber-600 text-white" 
                      : "border-amber-500 text-amber-600 hover:bg-amber-500/10"
                  )}
                  onClick={handleToggleBreak}
                >
                  <Coffee className="w-4 h-4" />
                  {todayEntry?.breakTaken 
                    ? "Prestávka označená (−30 min)" 
                    : "Označiť prestávku (−30 min)"
                  }
                </Button>
              )}
              
              <Label htmlFor="clockOut" className="text-sm font-medium">
                Čas odchodu
              </Label>
              <div className="flex gap-2">
                <Input
                  id="clockOut"
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                  placeholder="HH:MM"
                  className="flex-1"
                />
                <Button
                  variant="clockOut"
                  size="lg"
                  onClick={handleClockOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Odchod
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nechajte prázdne pre aktuálny čas ({getCurrentTime()})
              </p>
            </div>
          )}

          {/* Completed Status with Break Toggle */}
          {hasCompleted && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">
                  Dochádzka na dnešok dokončená
                </p>
                <p className="font-semibold mt-1">
                  {todayEntry?.clockIn} → {todayEntry?.clockOut}
                </p>
                {calculateHours() !== null && (
                  <p className="text-lg font-bold mt-2 text-primary">
                    {calculateHours()}h {todayEntry?.breakTaken && <span className="text-sm font-normal text-muted-foreground">(po odrátaní prestávky)</span>}
                  </p>
                )}
              </div>
              
              {/* Break Toggle Button */}
              {onToggleBreak && (
                <Button
                  variant={todayEntry?.breakTaken ? "default" : "outline"}
                  className={cn(
                    "w-full gap-2",
                    todayEntry?.breakTaken 
                      ? "bg-amber-500 hover:bg-amber-600 text-white" 
                      : "border-amber-500 text-amber-600 hover:bg-amber-500/10"
                  )}
                  onClick={handleToggleBreak}
                >
                  <Coffee className="w-4 h-4" />
                  {todayEntry?.breakTaken 
                    ? "Prestávka označená (−30 min)" 
                    : "Označiť prestávku (−30 min)"
                  }
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Prestávka 30 minút sa automaticky odpočíta z odpracovaných hodín
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}