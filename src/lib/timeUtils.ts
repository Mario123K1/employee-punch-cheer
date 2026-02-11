/**
 * Calculate worked hours between clock-in and clock-out times.
 * Supports overnight (night) shifts where clock_out < clock_in (e.g., 14:00 → 01:00).
 */
export function calculateWorkedHours(
  clockIn: string,
  clockOut: string,
  breakTaken: boolean = false
): number {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  
  // If negative, the shift crossed midnight
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }
  
  let hours = totalMinutes / 60;
  if (breakTaken) {
    hours = Math.max(0, hours - 0.5);
  }
  return hours;
}
