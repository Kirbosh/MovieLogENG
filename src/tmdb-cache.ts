export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CACHE_MAX_ENTRIES = 200;

export interface TmdbCacheEntry {
	data: unknown;
	timestamp: number;
}

function isValidCacheEntry(value: unknown, now: number): value is TmdbCacheEntry {
	if (!value || typeof value !== 'object') return false;
	const timestamp = (value as { timestamp?: unknown }).timestamp;
	return typeof timestamp === 'number'
		&& Number.isFinite(timestamp)
		&& timestamp <= now
		&& now - timestamp < CACHE_TTL_MS;
}

export function pruneTmdbCacheEntries(
	entries: Record<string, unknown>,
	now: number = Date.now()
): Record<string, TmdbCacheEntry> {
	const validEntries: Array<[string, TmdbCacheEntry]> = [];
	for (const key of Object.keys(entries)) {
		const entry = entries[key];
		if (isValidCacheEntry(entry, now)) {
			validEntries.push([key, entry]);
		}
	}

	validEntries.sort(([, left], [, right]) => right.timestamp - left.timestamp);
	const result: Record<string, TmdbCacheEntry> = {};
	for (const [key, entry] of validEntries.slice(0, CACHE_MAX_ENTRIES)) {
		result[key] = entry;
	}
	return result;
}
