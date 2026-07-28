import { describe, expect, it } from 'vitest';
import { parseYearFileContent } from '../src/record-parser';

describe('固定格式年度记录', () => {
	it('解析电影记录的卡片字段', () => {
		const records = parseYearFileContent(`## 🎬 测试电影

### 电影信息

![宣传海报|350](https://example.com/poster.jpg)

- **类型**: 剧情、科幻
- **TMDB ID**: 1
- **TMDB链接**: https://example.com/movie/1
- **评分**: ★ 8.5/10（10人）
- **片长**: 120分钟
- **上映日期**: 2024-01-01
- **剧情简介**: 测试简介

### 我的观看记录

- **记录日期**: 2024-01-02
- **完成日期**: 2024-01-02
- **我的评分**: 0
- **观看平台**: 影院
- **观看状态**: 已看完

### 观后感

很好

---
`, '2024');

		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({
			type: 'movie',
			title: '测试电影',
			tmdb_id: 1,
			watch_date: '2024-01-02',
			personal_rating: 0,
			watch_status: '已看完'
		});
	});

	it('解析引用加粗标题的剧集记录', () => {
		const records = parseYearFileContent(`## 📺 测试剧 - 第一季

> **本季信息**

![宣传海报|350](poster.jpg)

- **类型**: 悬疑
- **TMDB ID**: 2
- **TMDB链接**: https://example.com/tv/2
- **剧评分**: ★ 9.0/10（20人）
- **季评分**: ★ 9.0/10
- **季名**: 第 1 季
- **集数**: 8集
- **播出年份**: 2024
- **本季简介**: 剧集简介

> **我的观看记录**

- **记录日期**: 2024-02-01
- **完成日期**: 2024-02-01
- **观看进度**: 8/8集
- **我的评分**: 9.5
- **观看平台**: 流媒体
- **观看状态**: 已看完

> **本季观感**

精彩

---
`, '2024');

		expect(records[0]).toMatchObject({
			type: 'tv',
		title: '测试剧 - 第一季',
		tmdb_id: 2,
			season_number: 1,
			episode_count: 8,
			personal_rating: 9.5
		});
	});

	it('空个人评分不会吞掉下一行观看平台', () => {
		const records = parseYearFileContent(`## 🎬 空评分电影

### 电影信息

![宣传海报|350](poster.jpg)

- **类型**: 剧情
- **TMDB ID**: 3
- **TMDB链接**: https://example.com/movie/3
- **评分**: ★ 8.5/10（10人）
- **片长**: 100分钟
- **上映日期**: 2024-01-01
- **剧情简介**: 简介

### 我的观看记录

- **记录日期**: 2024-01-02
- **完成日期**: 2024-01-02
- **我的评分**: 
- **观看平台**: 影院
- **观看状态**: 已看完

### 观后感

---
`, '2024');

		expect(records[0]).toMatchObject({
			personal_rating: null,
			watch_platform: '影院'
		});
	});

	it('非数字个人评分按空评分处理', () => {
		const records = parseYearFileContent(`## 🎬 脏评分电影

### 电影信息

![宣传海报|350](poster.jpg)

- **类型**: 剧情
- **TMDB ID**: 4
- **TMDB链接**: https://example.com/movie/4
- **评分**: ★ 8.5/10（10人）
- **片长**: 100分钟
- **上映日期**: 2024-01-01
- **剧情简介**: 简介

### 我的观看记录

- **记录日期**: 2024-01-02
- **完成日期**: 2024-01-02
- **我的评分**: abc
- **观看平台**: 影院
- **观看状态**: 已看完

### 观后感

---
`, '2024');

		expect(records[0]?.personal_rating).toBeNull();
	});
});
