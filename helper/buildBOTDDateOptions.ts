export const buildBOTDDateOptions = () => {
  const firstGeneratedDate = new Date("2025-12-12");
  const today = new Date();

  const botdDateOptions: Record<
    string, // year
    { month: string; dates: string[] }[]
  > = {};

  // Loop backward to build data
  for (
    let d = new Date(today);
    d >= firstGeneratedDate;
    d.setDate(d.getDate() - 1)
  ) {
    const year = d.getFullYear().toString();
    const month = (d.getMonth() + 1).toString();
    // const formattedDate = d.toISOString().split("T")[0];
    const formattedDate = d.getDate().toString();

    if (!botdDateOptions[year]) botdDateOptions[year] = [];

    let monthEntry = botdDateOptions[year].find((m) => m.month === month);
    if (!monthEntry) {
      monthEntry = { month, dates: [] };
      botdDateOptions[year].push(monthEntry);
    }

    monthEntry.dates.push(formattedDate);
  }

  // ✅ Sort by year (ascending), month (ascending), and date (ascending)
  const sortedBotdDateOptions: Record<
    string,
    { month: string; dates: string[] }[]
  > = {};

  Object.keys(botdDateOptions)
    .sort((a, b) => Number(a) - Number(b)) // sort years ascending
    .forEach((year) => {
      const sortedMonths = botdDateOptions[year]
        .sort((a, b) => Number(a.month) - Number(b.month)) // month ascending
        .map((m) => ({
          ...m,
          dates: m.dates.sort((a, b) => (a < b ? -1 : 1)), // date ascending
        }));

      sortedBotdDateOptions[year] = sortedMonths;
    });

  console.log(sortedBotdDateOptions);
  return sortedBotdDateOptions;
};

export const monthMap: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};
