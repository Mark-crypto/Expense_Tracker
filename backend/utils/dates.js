const DAY = 86400000;

export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
export const toTime = (date) => new Date(`${date}T00:00:00Z`).getTime();
export const daysBetween = (from, to) => Math.round((toTime(to) - toTime(from)) / DAY);
export const addDays = (date, days) => new Date(toTime(date) + days * DAY).toISOString().slice(0, 10);

export const lastDayOf = (month) =>
  new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
