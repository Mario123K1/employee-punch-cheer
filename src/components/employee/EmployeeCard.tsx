import { Employee, TimeEntry } from "@/types/employee";
import { AlertTriangle, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmployeeCardProps {
  employee: Employee;
  todayEntry?: TimeEntry;
  hasUnclosedEntry?: boolean;
  onClick: () => void;
  onToggleBreak?: (entryId: string, breakTaken: boolean) => void | Promise<void>;
}

export function EmployeeCard({
  employee,
  todayEntry,
  hasUnclosedEntry,
  onClick,
  onToggleBreak,
}: EmployeeCardProps) {
  const isClockedIn = !!todayEntry?.clockIn && !todayEntry?.clockOut;
  const hasCompleted = !!todayEntry?.clockIn && !!todayEntry?.clockOut;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full p-4 rounded-xl border transition-all duration-200 text-left",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "bg-card border-border",
        isClockedIn && "ring-2 ring-clockIn border-clockIn/30",
        hasCompleted && "border-muted",
        hasUnclosedEntry && !isClockedIn && "ring-2 ring-orange-500 border-orange-500/30"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold relative",
            isClockedIn
              ? "bg-clockIn/20 text-clockIn"
              : hasUnclosedEntry
                ? "bg-orange-500/20 text-orange-600"
                : "bg-secondary text-secondary-foreground"
          )}
        >
          {employee.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
          {hasUnclosedEntry && !isClockedIn && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{employee.name}</h3>
          <p className="text-sm text-muted-foreground">{employee.role || employee.department}</p>
        </div>

        {/* Status */}
        <div className="flex flex-col items-end gap-1">
          {hasUnclosedEntry && !isClockedIn ? (
            <span className="status-badge bg-orange-500/20 text-orange-600">
              <AlertTriangle className="w-3 h-3" />
              Neuzavretý
            </span>
          ) : isClockedIn ? (
            <>
              <span className="status-badge bg-clockIn/20 text-clockIn">
                <span className="w-1.5 h-1.5 rounded-full bg-clockIn animate-pulse-soft" />
                Pracuje
              </span>
              <span className="text-xs text-muted-foreground">Od {todayEntry?.clockIn}</span>
            </>
          ) : hasCompleted ? (
            <>
              <span className="status-badge bg-muted text-muted-foreground">Dokončené</span>
              <span className="text-xs text-muted-foreground">
                {todayEntry?.clockIn} - {todayEntry?.clockOut}
              </span>
            </>
          ) : (
            <span className="status-badge bg-secondary text-secondary-foreground">Neprítomný</span>
          )}
        </div>
      </div>

      {/* Quick break toggle (visible while working) */}
      {isClockedIn && todayEntry && onToggleBreak && (
        <div className="mt-3">
          <Button
            type="button"
            size="sm"
            variant={todayEntry.breakTaken ? "secondary" : "outline"}
            className="gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBreak(todayEntry.id, !todayEntry.breakTaken);
            }}
          >
            <Coffee className="h-4 w-4" />
            {todayEntry.breakTaken
              ? "Prestávka označená (−30 min)"
              : "Idem na prestávku (−30 min)"}
          </Button>
        </div>
      )}
    </div>
  );
}

