export function generateCalendarLink(params: {
  title: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  description?: string;
}): string {
  const { title, startDate, location, description } = params;

  // Default to startDate + 3 hours if no endDate provided
  const endDate =
    params.endDate ?? new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatDateForCalendar = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const startStr = formatDateForCalendar(startDate);
  const endStr = formatDateForCalendar(endDate);

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${startStr}/${endStr}`);
  url.searchParams.set("location", location);
  if (description) {
    url.searchParams.set("details", description);
  }

  return url.toString();
}
