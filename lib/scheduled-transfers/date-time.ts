const ukDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatInUk(date: Date) {
  const parts = Object.fromEntries(
    ukDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function getEarliestUkDateTime(date: Date) {
  const nextMinute = new Date(Math.ceil(date.getTime() / 60_000) * 60_000);
  return formatInUk(nextMinute);
}

export function getUkDateTime(value: string) {
  if (!/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.test(value)) {
    return null;
  }

  for (const offset of ["+00:00", "+01:00"]) {
    const datetime = `${value}:00${offset}`;
    const instant = new Date(datetime);

    if (!Number.isNaN(instant.getTime()) && formatInUk(instant) === value) {
      return datetime;
    }
  }

  return null;
}

export function formatLocalDateTime(datetime: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(datetime));
}

function formatScheduledDate(
  date: Date,
  timeZone?: string,
  includeTimeZoneName = true,
) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  if (includeTimeZoneName) {
    options.timeZoneName = "short";
  }

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function getScheduledDateTimes(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    local: formatScheduledDate(date),
    uk: formatScheduledDate(date, "Europe/London", false),
  };
}
