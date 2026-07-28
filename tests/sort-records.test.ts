import { describe, expect, it } from 'vitest';
import { sortMarkdownRecords } from '../src/sort-records';

describe('年度记录排序', () => {
	it('按完成日期倒序排列，未完成记录排在最后', () => {
		const sorted = sortMarkdownRecords(`---
year: 2024
---

# 2024年观影记录

## 第一部

- **完成日期**: 2024-01-01

## 想看

- **完成日期**:

## 第二部

- **完成日期**: 2024-02-01
`);

		expect(sorted.indexOf('## 第二部')).toBeLessThan(sorted.indexOf('## 第一部'));
		expect(sorted.indexOf('## 第一部')).toBeLessThan(sorted.indexOf('## 想看'));
	});
});
