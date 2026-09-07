import { describe, expect, it } from 'vitest';
import { parseYearFileContent } from '../src/record-parser';

describe('Year-file records', () => {
	it('parses card fields from a movie record', () => {
		const records = parseYearFileContent(`## 🎬 Test Movie

### Movie information

![Poster|350](https://example.com/poster.jpg)

- **Genres**: Drama, Science Fiction
- **TMDB ID**: 1
- **TMDB link**: https://example.com/movie/1
- **Rating**: ★ 8.5/10 (10 votes)
- **Runtime**: 120 minutes
- **Release date**: 2024-01-01
- **Synopsis**: Test synopsis

### My watch log

- **Date added**: 2024-01-02
- **Completion date**: 2024-01-02
- **My rating**: 0
- **Watch platform**: Cinema
- **Watch status**: Completed

### Review

Excellent

---
`, '2024');

		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({
			type: 'movie',
			title: 'Test Movie',
			tmdb_id: 1,
			watch_date: '2024-01-02',
			personal_rating: 0,
			watch_status: 'Completed',
			review: 'Excellent'
		});
	});

	it('parses a TV record with bold blockquote headings', () => {
		const records = parseYearFileContent(`## 📺 Test Show - Season 1

> **Season information**

![Poster|350](poster.jpg)

- **Genres**: Mystery
- **TMDB ID**: 2
- **TMDB link**: https://example.com/tv/2
- **Show rating**: ★ 9.0/10 (20 votes)
- **Season rating**: ★ 9.0/10
- **Season name**: Season 1
- **Episode count**: 8
- **Air year**: 2024
- **Season overview**: Test show synopsis

> **My watch log**

- **Date added**: 2024-02-01
- **Completion date**: 2024-02-01
- **Watch progress**: 8/8 episodes
- **My rating**: 9.5
- **Watch platform**: Streaming
- **Watch status**: Completed

> **Season review**

Great season

---
`, '2024');

		expect(records[0]).toMatchObject({
			type: 'tv',
			title: 'Test Show',
			tmdb_id: 2,
			season_number: 1,
			episode_count: 8,
			personal_rating: 9.5,
			review: 'Great season'
		});
	});

	it('does not consume the platform field when the personal rating is empty', () => {
		const records = parseYearFileContent(`## 🎬 Unrated Movie

### Movie information

![Poster|350](poster.jpg)

- **Genres**: Drama
- **TMDB ID**: 3
- **TMDB link**: https://example.com/movie/3
- **Rating**: ★ 8.5/10 (10 votes)
- **Runtime**: 100 minutes
- **Release date**: 2024-01-01
- **Synopsis**: Synopsis

### My watch log

- **Date added**: 2024-01-02
- **Completion date**: 2024-01-02
- **My rating**:
- **Watch platform**: Cinema
- **Watch status**: Completed

### Review

---
`, '2024');

		expect(records[0]).toMatchObject({
			personal_rating: null,
			watch_platform: 'Cinema'
		});
	});

	it('treats a nonnumeric personal rating as empty', () => {
		const records = parseYearFileContent(`## 🎬 Invalid Rating Movie

### Movie information

![Poster|350](poster.jpg)

- **Genres**: Drama
- **TMDB ID**: 4
- **TMDB link**: https://example.com/movie/4
- **Rating**: ★ 8.5/10 (10 votes)
- **Runtime**: 100 minutes
- **Release date**: 2024-01-01
- **Synopsis**: Synopsis

### My watch log

- **Date added**: 2024-01-02
- **Completion date**: 2024-01-02
- **My rating**: abc
- **Watch platform**: Cinema
- **Watch status**: Completed

### Review

---
`, '2024');

		expect(records[0]?.personal_rating).toBeNull();
	});
});
