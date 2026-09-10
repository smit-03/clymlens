/** Minimal className joiner — keeps only truthy string parts. */
export function cx(...parts: unknown[]): string {
  return parts.filter((part): part is string => typeof part === "string" && part.length > 0).join(" ");
}
