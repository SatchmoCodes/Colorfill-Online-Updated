export function getEasternBoardDate(): string {
  const now = new Date();

  // Get the current time in America/New_York
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format parts to extract date and hour cleanly
  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = parseInt(get("hour"), 10);

  // If it's before 8 AM ET → still use yesterday's board
  const target = new Date(`${year}-${month}-${day}T00:00:00-05:00`);
  if (hour < 8) target.setDate(target.getDate() - 1);

  const yyyyMMdd = target.toISOString().split("T")[0];
  return yyyyMMdd;
}
