export function isDisplayableRating(value: unknown): value is number {
	return typeof value === 'number'
		&& Number.isFinite(value)
		&& value >= 0
		&& value <= 10;
}

export function getDisplayRating(personalRating: number | null, tmdbRating: number): number | null {
	if (isDisplayableRating(personalRating)) return personalRating;
	if (isDisplayableRating(tmdbRating)) return tmdbRating;
	return null;
}

export function renderRatingStars(rating: number | null): string {
	if (!isDisplayableRating(rating)) return '';
	const fullStars = Math.floor(rating / 2);
	const halfStar = (rating / 2) - fullStars >= 0.5;
	const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
	return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}
