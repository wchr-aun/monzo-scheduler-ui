const ukRecurrenceFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getTransferRecurrence(scheduledFor: string, interval: string) {
  const date = new Date(scheduledFor);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = Object.fromEntries(
    ukRecurrenceFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const day = Number(parts.day);
  const isMonthly = interval === "monthly";
  let frequency: string;

  switch (interval) {
    case "monthly": {
      const suffix = day >= 11 && day <= 13
        ? "th"
        : (["th", "st", "nd", "rd"][day % 10] ?? "th");
      frequency = `${day}${suffix}`;
      break;
    }
    case "weekly":
      frequency = `Every ${parts.weekday}`;
      break;
    case "daily":
      frequency = "Everyday";
      break;
    default:
      return null;
  }

  return {
    frequency,
    time: `${parts.hour}:${parts.minute} UK`,
    isMonthly,
  };
}
