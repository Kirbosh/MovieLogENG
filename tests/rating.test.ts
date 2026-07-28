import { describe, expect, it } from 'vitest';
import { getDisplayRating, renderRatingStars } from '../src/rating';

describe('卡片墙评分显示', () => {
	it.each([
		{ name: '空个人评分回退 TMDB 评分', personal: null, tmdb: 8.5, expected: 8.5, stars: '★★★★☆' },
		{ name: '保留 0 分个人评分', personal: 0, tmdb: 8.5, expected: 0, stars: '☆☆☆☆☆' },
		{ name: '保留 10 分个人评分', personal: 10, tmdb: 8.5, expected: 10, stars: '★★★★★' },
		{ name: '历史 20 分回退 TMDB 评分', personal: 20, tmdb: 8.5, expected: 8.5, stars: '★★★★☆' },
		{ name: '历史负分回退 TMDB 评分', personal: -10, tmdb: 8.5, expected: 8.5, stars: '★★★★☆' },
		{ name: '双方评分无效时不显示分数', personal: Number.NaN, tmdb: Number.NaN, expected: null, stars: '' }
	])('$name', ({ personal, tmdb, expected, stars }) => {
		const score = getDisplayRating(personal, tmdb);
		expect(score).toBe(expected);
		expect(renderRatingStars(score)).toBe(stars);
	});
});
