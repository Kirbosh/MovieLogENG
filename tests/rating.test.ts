import { describe, expect, it } from 'vitest';
import { getDisplayRating, renderRatingStars } from '../src/rating';

describe('Card wall rating display', () => {
	it.each([
		{ name: 'falls back to the TMDB rating when the personal rating is empty', personal: null, tmdb: 8.5, expected: 8.5, stars: '★★★★☆' },
		{ name: 'preserves a personal rating of 0', personal: 0, tmdb: 8.5, expected: 0, stars: '☆☆☆☆☆' },
		{ name: 'preserves a personal rating of 10', personal: 10, tmdb: 8.5, expected: 10, stars: '★★★★★' },
		{ name: 'falls back from a legacy personal rating of 20', personal: 20, tmdb: 8.5, expected: 8.5, stars: '★★★★☆' },
		{ name: 'falls back from a legacy negative personal rating', personal: -10, tmdb: 8.5, expected: 8.5, stars: '★★★★☆' },
		{ name: 'shows no score when both ratings are invalid', personal: Number.NaN, tmdb: Number.NaN, expected: null, stars: '' }
	])('$name', ({ personal, tmdb, expected, stars }) => {
		const score = getDisplayRating(personal, tmdb);
		expect(score).toBe(expected);
		expect(renderRatingStars(score)).toBe(stars);
	});
});
