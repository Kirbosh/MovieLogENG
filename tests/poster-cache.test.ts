import { describe, expect, it } from 'vitest';
import { getPosterCacheFileName } from '../src/poster-cache';

describe('Local poster cache file names', () => {
	it('distinguishes the same TMDB ID for a movie and a TV show', () => {
		expect(getPosterCacheFileName('movie', 603, '/movie-poster.jpg'))
			.not.toBe(getPosterCacheFileName('tv', 603, '/tv-poster.jpg'));
	});

	it('distinguishes different seasons of the same TV show', () => {
		expect(getPosterCacheFileName('tv', 1396, '/season-one.jpg', 1))
			.not.toBe(getPosterCacheFileName('tv', 1396, '/season-two.jpg', 2));
	});

	it('generates a stable file name for the same input', () => {
		expect(getPosterCacheFileName('tv', 1396, '/season-one.jpg', 1))
			.toBe(getPosterCacheFileName('tv', 1396, '/season-one.jpg', 1));
	});
});
