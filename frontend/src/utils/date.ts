/** Converts an <input type="date"> value ("YYYY-MM-DD") to the API's "MM/DD/YY" format. */
export function isoToMmDdYy(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${month}/${day}/${year.slice(2)}`
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
