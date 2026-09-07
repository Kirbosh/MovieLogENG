import { describe, expect, it } from 'vitest';
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, pruneTmdbCacheEntries } from '../src/tmdb-cache';

describe('Persistent TMDB cache', () => {
	it('discards expired and malformed cache entries', () => {
		const now = 1_000_000;
		expect(pruneTmdbCacheEntries({
			valid: { data: { id: 1 }, timestamp: now - 1 },
			expired: { data: { id: 2 }, timestamp: now - CACHE_TTL_MS - 1 },
			invalid: { data: { id: 3 }, timestamp: 'not-a-time' }
		}, now)).toEqual({
			valid: { data: { id: 1 }, timestamp: now - 1 }
		});
	});

	it('keeps only the newest cache entries', () => {
		const now = 10_000_000;
		const entries: Record<string, unknown> = {};
		for (let index = 0; index <= CACHE_MAX_ENTRIES; index++) {
			entries[`entry-${index}`] = { data: index, timestamp: now - index };
		}

		const pruned = pruneTmdbCacheEntries(entries, now);
		expect(Object.keys(pruned)).toHaveLength(CACHE_MAX_ENTRIES);
		expect(pruned['entry-0']).toEqual({ data: 0, timestamp: now });
		expect(pruned[`entry-${CACHE_MAX_ENTRIES}`]).toBeUndefined();
	});
});
