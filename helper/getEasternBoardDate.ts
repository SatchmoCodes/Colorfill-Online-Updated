export function getEasternBoardDate(): string {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = parseInt(get("hour"), 10);

  const target = new Date(`${year}-${month}-${day}T00:00:00`);

  // Before 12 PM ET → use yesterday
  if (hour < 12) target.setDate(target.getDate() - 1);

  return target.toISOString().split("T")[0];
}
