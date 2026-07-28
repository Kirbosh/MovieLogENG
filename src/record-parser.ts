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

export function parseYearFileContent(content: string, year: string): ParsedRecord[] {
	const records: ParsedRecord[] = [];
	const recordRegex = /## (.+?)\n\n([\s\S]*?)(?=\n## |$)/g;
	let match: RegExpExecArray | null;

	while ((match = recordRegex.exec(content)) !== null) {
		const rawTitle = match[1] || '';
		const title = rawTitle.replace(/^[🎬📺]\s*/u, '');
		const block = normalizeSectionHeaders(match[2] || '');
		const infoSectionMatch = block.match(/### (电影信息|本季信息)\n\n([\s\S]*?)(?=\n### |$)/);
		if (!infoSectionMatch) continue;

		const infoTitle = infoSectionMatch[1] || '';
		const infoContent = infoSectionMatch[2] || '';
		const type: 'movie' | 'tv' = infoTitle === '电影信息' ? 'movie' : 'tv';
		const posterMatch = infoContent.match(/!\[宣传海报\|\d+\]\((.*?)\)/);
		const fields = parseFields(infoContent);
		const tmdbId = parseInt(fields['TMDB ID'] || '0', 10);
		if (!title || tmdbId === 0) continue;

		const watchSectionMatch = block.match(/### 我的观看记录\n\n([\s\S]*?)(?=\n### |$)/);
		const watchFields = parseFields(watchSectionMatch?.[1] || '');
		const reviewMatch = block.match(/### (?:观后感|本季观感)\n\n([\s\S]*?)(?=\n---|$)/);
		const tmdbRatingText = type === 'movie' ? fields['评分'] : fields['剧评分'];

		const record: ParsedRecord = {
			type,
			title: title.replace(/\s*\(.*?\)\s*$/, '').replace(/\s*-\s*第\d+季\s*$/, '').trim(),
			tmdb_id: tmdbId,
			poster: posterMatch?.[1] || '',
			genres: fields['类型'] ? fields['类型'].split('、').map(genre => genre.trim()).filter(Boolean) : [],
			tmdb_rating: tmdbRatingText ? parseFloat(tmdbRatingText.replace(/[★☆\s]/g, '').split('/')[0] || '0') : 0,
			release_date: type === 'movie' ? (fields['上映日期'] || '') : (fields['播出年份'] || ''),
			tmdb_link: fields['TMDB链接'] || '',
			duration: type === 'movie' ? parseInt(fields['片长'] || '0', 10) : 0,
			watch_date: watchFields['完成日期'] || null,
			watch_status: watchFields['观看状态'] || '计划观看',
			personal_rating: parseOptionalRating(watchFields['我的评分']),
			year,
			overview: (fields['剧情简介'] || fields['本季简介'] || '').trim(),
			watch_platform: watchFields['观看平台'] || null,
			review: reviewMatch?.[1]?.trim() || null
		};

		if (type === 'tv') {
			const seasonName = fields['季名'] || '';
			const seasonNumber = seasonName.match(/(\d+)/);
			record.season_number = seasonNumber ? parseInt(seasonNumber[1] || '0', 10) : 0;
			record.season_name = seasonName;
			record.episode_count = parseInt(fields['集数'] || '0', 10);
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

function parseOptionalRating(value: string | undefined): number | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	const rating = Number(trimmed);
	return Number.isFinite(rating) ? rating : null;
}

function normalizeSectionHeaders(block: string): string {
	return block.replace(
		/^(?:> )?\*\*(电影信息|本季信息|我的观看记录|观后感|本季观感)\*\*$/gm,
		'### $1'
	);
}
