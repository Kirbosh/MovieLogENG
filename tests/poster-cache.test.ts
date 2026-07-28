import { describe, expect, it } from 'vitest';
import { getPosterCacheFileName } from '../src/poster-cache';

describe('本地海报缓存文件名', () => {
	it('区分电影和电视剧的相同 TMDB id', () => {
		expect(getPosterCacheFileName('movie', 603, '/movie-poster.jpg'))
			.not.toBe(getPosterCacheFileName('tv', 603, '/tv-poster.jpg'));
	});

	it('区分同一电视剧的不同季', () => {
		expect(getPosterCacheFileName('tv', 1396, '/season-one.jpg', 1))
			.not.toBe(getPosterCacheFileName('tv', 1396, '/season-two.jpg', 2));
	});

	it('相同输入生成稳定文件名', () => {
		expect(getPosterCacheFileName('tv', 1396, '/season-one.jpg', 1))
			.toBe(getPosterCacheFileName('tv', 1396, '/season-one.jpg', 1));
	});
});
