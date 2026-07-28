export type PosterMediaType = 'movie' | 'tv';

function hashPosterPath(posterPath: string): string {
	let hash = 2166136261;
	for (let index = 0; index < posterPath.length; index++) {
		hash ^= posterPath.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(36);
}

export function getPosterCacheFileName(
	mediaType: PosterMediaType,
	tmdbId: number,
	posterPath: string,
	seasonNumber?: number
): string {
	const seasonPart = mediaType === 'tv' && seasonNumber !== undefined
		? `-s${seasonNumber}`
		: '';
	return `${mediaType}-${tmdbId}${seasonPart}-${hashPosterPath(posterPath)}.jpg`;
}
