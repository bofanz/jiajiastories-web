export function formatDateRange(fromDate?: string, toDate?: string) {
  if (!fromDate) return toDate ?? "";
  if (!toDate || toDate === fromDate) return fromDate;
  return `${fromDate} – ${toDate}`;
}
