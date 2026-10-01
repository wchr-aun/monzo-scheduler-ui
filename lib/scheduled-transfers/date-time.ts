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

function formatDisplayDate(date: Date, timeZone?: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );

  return `${parts.day} ${parts.month} ${parts.year} - ${parts.hour}:${parts.minute}`;
}

export function formatLocalDateTime(datetime: string) {
  return `${formatDisplayDate(new Date(datetime))} Local`;
}

export function getScheduledDateTimes(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const local = formatDisplayDate(date);
  const uk = formatDisplayDate(date, "Europe/London");

  return {
    local: `${local} Local`,
    uk: `${uk} UK`,
    localMatchesUk: local === uk,
  };
}

export function getTimeUntil(
  value: string,
  now = Date.now(),
  status?: string,
) {
  const scheduledTime = new Date(value).getTime();

  if (Number.isNaN(scheduledTime)) {
    return "Schedule unavailable";
  }

  const difference = scheduledTime - now;
  const isPast = difference < 0;
  const duration = Math.abs(difference);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (status === "pending" && difference < minute) {
    return "Executing soon";
  }

  if (duration < minute) {
    return status === "completed" ? "Just completed" : "Just now";
  }

  const suffix = isPast ? "ago" : "left";

  if (duration >= 2 * day) {
    return `${Math.floor(duration / day)}d ${suffix}`;
  }

  if (duration >= day) {
    const hours = Math.floor((duration - day) / hour);
    return `1d ${hours}h ${suffix}`;
  }

  if (duration >= hour) {
    const hours = Math.floor(duration / hour);
    const minutes = Math.floor((duration % hour) / minute);
    return `${hours}h ${minutes}m ${suffix}`;
  }

  return `${Math.floor(duration / minute)}m ${suffix}`;
}
