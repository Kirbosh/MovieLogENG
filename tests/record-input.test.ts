import { describe, expect, it } from 'vitest';
import { WatchStatus } from '../src/types';
import { formatLocalDate, validateRecordForm } from '../src/record-input';

describe('Watch record form', () => {
	it('formats dates in local time', () => {
		const date = new Date(2026, 6, 28, 0, 30);
		expect(formatLocalDate(date)).toBe('2026-07-28');
	});

	it('accepts a leap day and a rating of 0', () => {
		expect(validateRecordForm({
			watchDate: '2024-02-29',
			rating: '0',
			platform: 'Cinema',
			status: WatchStatus.COMPLETED
		})).toEqual({
			ok: true,
			value: {
				watchDate: '2024-02-29',
				rating: 0,
				platform: 'Cinema',
				status: WatchStatus.COMPLETED
			}
		});
	});

	it.each(['2023-02-29', '2024-13-01', 'not-a-date'])('rejects an invalid watch date: %s', (watchDate) => {
		expect(validateRecordForm({
			watchDate,
			rating: '',
			platform: '',
			status: WatchStatus.COMPLETED
		})).toEqual({ ok: false, message: 'Enter a valid watch date (YYYY-MM-DD).' });
	});

	it.each(['-1', '10.1', 'abc'])('rejects an invalid rating: %s', (rating) => {
		expect(validateRecordForm({
			watchDate: '2026-07-28',
			rating,
			platform: '',
			status: WatchStatus.COMPLETED
		})).toEqual({ ok: false, message: 'The rating must be a number from 0 to 10.' });
	});
});
