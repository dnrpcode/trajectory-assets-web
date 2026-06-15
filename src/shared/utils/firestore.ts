/**
 * Strips fields with undefined values before writing to Firestore.
 * Firestore throws on undefined values; use null instead if you need
 * an explicit "no value" in the database.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
