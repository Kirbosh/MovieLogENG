export interface ParsedRecord {
	type: 'movie' | 'tv';
	title: string;
	tmdb_id: number;
	poster: string;
	genres: string[];
	tmdb_rating: number;
	release_date: string;
	tmdb_link: string;
	duration: number;
	season_number?: number;
	season_name?: string;
	episode_count?: number;
	watch_date: string | null;
	watch_status: string;
	personal_rating: number | null;
	year: string;
	overview: string;
	watch_platform: string | null;
	review: string | null;
}

const SECTIONS = {
	movieInformation: ['Movie information', '\u7535\u5f71\u4fe1\u606f'],
	seasonInformation: ['Season information', '\u672c\u5b63\u4fe1\u606f'],
	watchLog: ['My watch log', '\u6211\u7684\u89c2\u770b\u8bb0\u5f55'],
	review: ['Review', '\u89c2\u540e\u611f'],
	seasonReview: ['Season review', '\u672c\u5b63\u89c2\u611f']
} as const;

const FIELDS = {
	genres: ['Genres', '\u7c7b\u578b'],
	tmdbLink: ['TMDB link', 'TMDB\u94fe\u63a5'],
	rating: ['Rating', '\u8bc4\u5206'],
	showRating: ['Show rating', '\u5267\u8bc4\u5206'],
	releaseDate: ['Release date', '\u4e0a\u6620\u65e5\u671f'],
	airYear: ['Air year', '\u64ad\u51fa\u5e74\u4efd'],
	runtime: ['Runtime', '\u7247\u957f'],
	completionDate: ['Completion date', '\u5b8c\u6210\u65e5\u671f'],
	watchStatus: ['Watch status', '\u89c2\u770b\u72b6\u6001'],
	personalRating: ['My rating', '\u6211\u7684\u8bc4\u5206'],
	synopsis: ['Synopsis', '\u5267\u60c5\u7b80\u4ecb'],
	seasonOverview: ['Season overview', '\u672c\u5b63\u7b80\u4ecb'],
	watchPlatform: ['Watch platform', '\u89c2\u770b\u5e73\u53f0'],
	seasonName: ['Season name', '\u5b63\u540d'],
	episodeCount: ['Episode count', '\u96c6\u6570']
} as const;

interface ParsedSection {
	title: string;
	content: string;
}

export function parseYearFileContent(content: string, year: string): ParsedRecord[] {
	const records: ParsedRecord[] = [];
	const recordRegex = /## (.+?)\n\n([\s\S]*?)(?=\n## |$)/g;
	let match: RegExpExecArray | null;

	while ((match = recordRegex.exec(content)) !== null) {
		const rawTitle = match[1] || '';
		const title = rawTitle.replace(/^[🎬📺]\s*/u, '');
		const block = normalizeSectionHeaders(match[2] || '');
		const infoSection = findSection(block, [...SECTIONS.movieInformation, ...SECTIONS.seasonInformation]);
		if (!infoSection) continue;

		const type: 'movie' | 'tv' = matchesLabel(infoSection.title, SECTIONS.movieInformation) ? 'movie' : 'tv';
		const posterMatch = infoSection.content.match(/!\[(?:Poster|\u5ba3\u4f20\u6d77\u62a5)\|\d+\]\((.*?)\)/);
		const fields = parseFields(infoSection.content);
		const tmdbId = parseInt(fields['TMDB ID'] || '0', 10);
		if (!title || tmdbId === 0) continue;

		const watchSection = findSection(block, SECTIONS.watchLog);
		const watchFields = parseFields(watchSection?.content || '');
		const reviewSection = findSection(block, [...SECTIONS.review, ...SECTIONS.seasonReview]);
		const tmdbRatingText = type === 'movie'
			? getField(fields, FIELDS.rating)
			: getField(fields, FIELDS.showRating);

		const record: ParsedRecord = {
			type,
			title: title
				.replace(/\s*\(.*?\)\s*$/, '')
				.replace(/\s*-\s*Season\s+\d+\s*$/i, '')
				.replace(/\s*-\s*\u7b2c\d+\u5b63\s*$/, '')
				.trim(),
			tmdb_id: tmdbId,
			poster: posterMatch?.[1] || '',
			genres: splitGenres(getField(fields, FIELDS.genres)),
			tmdb_rating: parseTmdbRating(tmdbRatingText),
			release_date: type === 'movie'
				? getField(fields, FIELDS.releaseDate)
				: getField(fields, FIELDS.airYear),
			tmdb_link: getField(fields, FIELDS.tmdbLink),
			duration: type === 'movie' ? parseInt(getField(fields, FIELDS.runtime) || '0', 10) : 0,
			watch_date: getField(watchFields, FIELDS.completionDate) || null,
			watch_status: getField(watchFields, FIELDS.watchStatus) || 'Planned',
			personal_rating: parseOptionalRating(getField(watchFields, FIELDS.personalRating)),
			year,
			overview: (getField(fields, FIELDS.synopsis) || getField(fields, FIELDS.seasonOverview)).trim(),
			watch_platform: getField(watchFields, FIELDS.watchPlatform) || null,
			review: reviewSection?.content.trim() || null
		};

		if (type === 'tv') {
			const seasonName = getField(fields, FIELDS.seasonName);
			const seasonNumber = seasonName.match(/(\d+)/);
			record.season_number = seasonNumber ? parseInt(seasonNumber[1] || '0', 10) : 0;
			record.season_name = seasonName;
			record.episode_count = parseInt(getField(fields, FIELDS.episodeCount) || '0', 10);
		}

		records.push(record);
	}

	return records;
}

function parseFields(content: string): Record<string, string> {
	const fields: Record<string, string> = {};
	const fieldRegex = /^- \*\*(.+?)\*\*:[ \t]*(.*)$/gm;
	let match: RegExpExecArray | null;
	while ((match = fieldRegex.exec(content)) !== null) {
		fields[match[1] || ''] = match[2] || '';
	}
	return fields;
}

function getField(fields: Record<string, string>, labels: readonly string[]): string {
	for (const label of labels) {
		if (fields[label] !== undefined) return fields[label];
	}
	return '';
}

function matchesLabel(value: string, labels: readonly string[]): boolean {
	return labels.some(label => label === value);
}

function splitGenres(value: string): string[] {
	return value.split(/,\s*|\u3001/).map(genre => genre.trim()).filter(Boolean);
}

function parseTmdbRating(value: string): number {
	return value ? parseFloat(value.replace(/[★☆\s]/g, '').split('/')[0] || '0') : 0;
}

function parseOptionalRating(value: string | undefined): number | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	const rating = Number(trimmed);
	return Number.isFinite(rating) ? rating : null;
}

function findSection(block: string, titles: readonly string[]): ParsedSection | null {
	const alternatives = titles.map(escapeRegExp).join('|');
	const match = block.match(new RegExp(`### (${alternatives})\\n\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`));
	if (!match) return null;
	return { title: match[1] || '', content: match[2] || '' };
}

function normalizeSectionHeaders(block: string): string {
	const titles = Object.values(SECTIONS).flat();
	const alternatives = titles.map(escapeRegExp).join('|');
	return block.replace(
		new RegExp(`^(?:> )?\\*\\*(${alternatives})\\*\\*$`, 'gm'),
		'### $1'
	);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
