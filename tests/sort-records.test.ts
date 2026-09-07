import { describe, expect, it } from 'vitest';
import { sortMarkdownRecords } from '../src/sort-records';

describe('Year-file record sorting', () => {
	it('sorts completed records by date descending and places incomplete records last', () => {
		const sorted = sortMarkdownRecords(`---
year: 2024
---

# 2024 Watch log

## First Movie

- **Completion date**: 2024-01-01

## Watchlist Movie

- **Completion date**:

## Second Movie

- **Completion date**: 2024-02-01
`);

		expect(sorted.indexOf('## Second Movie')).toBeLessThan(sorted.indexOf('## First Movie'));
		expect(sorted.indexOf('## First Movie')).toBeLessThan(sorted.indexOf('## Watchlist Movie'));
	});
});
