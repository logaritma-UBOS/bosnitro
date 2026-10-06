export function getBusinessTime(timezone: string, date: Date = new Date()): Date {
  const tzString = date.toLocaleString("en-US", { timeZone: timezone })
  return new Date(tzString)
}

export function getStartOfDayUTC(timezone: string, dateUTC: Date = new Date()): Date {
  // To get the start of the day in UTC for a specific timezone:
  // 1. Get the local time string in that timezone
  const tzString = dateUTC.toLocaleString("en-US", { timeZone: timezone })
  const localDate = new Date(tzString)
  
  // 2. We want the start of the day in that local time.
  localDate.setHours(0, 0, 0, 0)
  
  // 3. Now we need to convert this back to UTC.
  // Actually, standard Date API in JS doesn't easily convert "midnight in Asia/Jakarta" back to UTC.
  // A robust trick: find the offset.
  const offsetString = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" }).format(dateUTC)
  // offsetString looks like "GMT+7" or "GMT-4" or "GMT"
  const match = offsetString.match(/GMT([+-]\d+)/)
  const offsetHours = match ? parseInt(match[1], 10) : 0

  // If local midnight is 2026-08-20 00:00:00, and offset is +7, then UTC time is 2026-08-19 17:00:00.
  // To compute this safely without library:
  // Create a UTC date representing the local date's year/month/day at 00:00, then subtract offset.
  const utcMidnight = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0))
  utcMidnight.setUTCHours(utcMidnight.getUTCHours() - offsetHours)
  return utcMidnight
}

export function getEquivalentPreviousPeriod(
  timezone: string, 
  currentStartUTC: Date, 
  currentEndUTC: Date, 
  type: "7_DAYS" | "30_DAYS" | "TODAY"
): { prevStartUTC: Date, prevEndUTC: Date } {
  
  const prevStartUTC = new Date(currentStartUTC)
  const prevEndUTC = new Date(currentEndUTC)
  
  if (type === "TODAY") {
    prevStartUTC.setUTCDate(prevStartUTC.getUTCDate() - 1)
    prevEndUTC.setUTCDate(prevEndUTC.getUTCDate() - 1)
  } else if (type === "7_DAYS") {
    prevStartUTC.setUTCDate(prevStartUTC.getUTCDate() - 7)
    prevEndUTC.setUTCDate(prevEndUTC.getUTCDate() - 7)
  } else if (type === "30_DAYS") {
    prevStartUTC.setUTCDate(prevStartUTC.getUTCDate() - 30)
    prevEndUTC.setUTCDate(prevEndUTC.getUTCDate() - 30)
  }

  return { prevStartUTC, prevEndUTC }
}
