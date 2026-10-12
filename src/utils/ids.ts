/**
 * Generates a collision-resistant unique identifier.
 * Uses crypto.randomUUID if available, with a resilient fallback.
 */
export function generateUniqueId(prefix = 'resp'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

