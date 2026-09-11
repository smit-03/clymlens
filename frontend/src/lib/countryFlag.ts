/** ISO 3166-1 alpha-2 country code → flag emoji (regional indicator symbols). */
export function countryFlag(code: string | undefined): string {
  if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return "";
  const base = 0x1f1e6;
  const chars = code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(base + (c.charCodeAt(0) - 65)));
  return chars.join("");
}
