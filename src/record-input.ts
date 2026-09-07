import { WatchStatus } from './types';

export interface RecordFormInput {
	watchDate: string;
	rating: string;
	platform: string;
	status: WatchStatus;
}

export interface UserRecordInput {
	watchDate: string;
	rating: number | null;
	platform: string;
	status: WatchStatus;
}

export type RecordFormValidation =
	| { ok: true; value: UserRecordInput }
	| { ok: false; message: string };

export function formatLocalDate(date: Date = new Date()): string {
	const year = date.getFullYear();
	const month = padDatePart(date.getMonth() + 1);
	const day = padDatePart(date.getDate());
	return `${year}-${month}-${day}`;
}

function padDatePart(value: number): string {
	return value < 10 ? `0${value}` : `${value}`;
}

export function parseLocalDate(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year
		|| date.getMonth() !== month - 1
		|| date.getDate() !== day
	) {
		return null;
	}
	return date;
}

export function validateRecordForm(form: RecordFormInput): RecordFormValidation {
	const watchDate = form.watchDate.trim();
	if (!parseLocalDate(watchDate)) {
		return { ok: false, message: 'Enter a valid watch date (YYYY-MM-DD).' };
	}

	const ratingValue = form.rating.trim();
	let rating: number | null = null;
	if (ratingValue) {
		const parsed = Number(ratingValue);
		if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
			return { ok: false, message: 'The rating must be a number from 0 to 10.' };
		}
		rating = Math.round(parsed * 10) / 10;
	}

	return {
		ok: true,
		value: {
			watchDate,
			rating,
			platform: form.platform.trim(),
			status: form.status
		}
	};
}
