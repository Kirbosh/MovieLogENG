import { App, TFile } from 'obsidian';
import { TMDBMovieDetails, TMDBTVShowDetails, TMDBSeasonDetails, PluginSettings, SubHeadingStyle, WatchStatus, WATCH_STATUS_LABELS } from './types';
import { buildPosterUrl } from './tmdb-api';
import { sortMarkdownRecords } from './sort-records';
import { formatLocalDate, UserRecordInput } from './record-input';

export type { UserRecordInput } from './record-input';

export function generateMovieRecord(
    movie: TMDBMovieDetails,
    settings: PluginSettings,
    userInput?: UserRecordInput
): string {
    const posterUrl = buildPosterUrl(movie.poster_path, 'original') || '';
    const tmdbLink = `https://www.themoviedb.org/movie/${movie.id}`;
    const genres = movie.genres.map(g => g.name);
    const duration = movie.runtime || 0;
	const today = formatLocalDate();
	const watchDate = userInput?.watchDate || today;
	const status = userInput?.status ?? WatchStatus.PLANNED;

    const h = (title: string) => settings.subHeadingStyle === SubHeadingStyle.BOLD ? `> **${title}**` : `### ${title}`;

    return `## 🎬 ${movie.title}

${h('Movie information')}

![Poster|350](${posterUrl})

- **Genres**: ${genres.join(', ') || 'Unknown'}
- **TMDB ID**: ${movie.id}
- **TMDB link**: ${tmdbLink}
- **Rating**: ★ ${movie.vote_average?.toFixed(1) || '?'}/10 (${movie.vote_count || 0} votes)
- **Runtime**: ${duration} minutes
- **Release date**: ${movie.release_date || 'Unknown'}
- **Synopsis**: ${movie.overview || 'No synopsis available.'}

${h('My watch log')}

- **Date added**: ${today}
- **Completion date**: ${status === WatchStatus.COMPLETED ? watchDate : ''}
- **My rating**: ${userInput?.rating ?? ''}
- **Watch platform**: ${userInput?.platform || ''}
- **Watch status**: ${WATCH_STATUS_LABELS[status]}

${h('Review')}

(Write your review here.)

---

`;
}

export function generateTVRecord(
    show: TMDBTVShowDetails,
    season: TMDBSeasonDetails,
    settings: PluginSettings,
    userInput?: UserRecordInput
): string {
    const posterPath = season.poster_path || show.poster_path;
    const posterUrl = buildPosterUrl(posterPath, 'original') || '';
    const tmdbLink = `https://www.themoviedb.org/tv/${show.id}/season/${season.season_number}`;
    const genres = show.genres.map(g => g.name);
    const year = season.air_date ? season.air_date.substring(0, 4) : '';
    const episodeCount = season.episodes.length;
    const seasonRating = season.episodes.length > 0
        ? (season.episodes.reduce((sum, ep) => sum + (ep.vote_average || 0), 0) / season.episodes.length).toFixed(1)
        : '0.0';
	const today = formatLocalDate();
	const watchDate = userInput?.watchDate || today;
	const status = userInput?.status ?? WatchStatus.PLANNED;

    const h = (title: string) => settings.subHeadingStyle === SubHeadingStyle.BOLD ? `> **${title}**` : `### ${title}`;

    return `## 📺 ${show.name} - ${season.name}

${h('Season information')}

![Poster|350](${posterUrl})

- **Genres**: ${genres.join(', ') || 'Unknown'}
- **TMDB ID**: ${show.id}
- **TMDB link**: ${tmdbLink}
- **Show rating**: ★ ${show.vote_average?.toFixed(1) || '?'}/10 (${show.vote_count || 0} votes)
- **Season rating**: ★ ${seasonRating}/10
- **Season name**: ${season.name}
- **Episode count**: ${episodeCount}
- **Air year**: ${year || 'Unknown'}
- **Season overview**: ${season.overview || show.overview || 'No synopsis available.'}

${h('My watch log')}

- **Date added**: ${today}
- **Completion date**: ${status === WatchStatus.COMPLETED ? watchDate : ''}
- **Watch progress**: ${status === WatchStatus.COMPLETED ? episodeCount : 0}/${episodeCount} episodes
- **My rating**: ${userInput?.rating ?? ''}
- **Watch platform**: ${userInput?.platform || ''}
- **Watch status**: ${WATCH_STATUS_LABELS[status]}

${h('Season review')}

(Write your review here.)

---

`;
}

export async function appendToYearFile(
    app: App,
	content: string,
	folder: string,
	watchDate: string,
    contentType: 'movie' | 'tv',
    writingPaths: Set<string>
): Promise<TFile> {
    const folderPath = folder.replace(/^\/|\/$/g, '');
	const year = watchDate.substring(0, 4);
    const filePath = `${folderPath}/${year}.md`;

    await app.vault.createFolder(folderPath).catch(() => {});

	let file = app.vault.getAbstractFileByPath(filePath);
	if (!file) {
		const initialContent = `---
year: ${year}
total_movies: ${contentType === 'movie' ? 1 : 0}
total_tv_shows: ${contentType === 'tv' ? 1 : 0}
---

# ${year} Watch log

${content}
`;
		try {
			writingPaths.add(filePath);
			const created = await app.vault.create(filePath, initialContent);
			return created;
		} finally {
			writingPaths.delete(filePath);
		}
	}

    if (!(file instanceof TFile)) {
        throw new Error(`Path is not a file: ${filePath}`);
    }

    const existingContent = await app.vault.read(file);
    const isMovie = contentType === 'movie';
    const updatedContent = updateYearFileStats(existingContent, isMovie);

    const englishHeader = `# ${year} Watch log\n\n`;
    const legacyHeader = `# ${year}\u5e74\u89c2\u5f71\u8bb0\u5f55\n\n`;
    const insertAfter = updatedContent.includes(englishHeader) ? englishHeader : legacyHeader;
    const insertIndex = updatedContent.indexOf(insertAfter);
    let newContent: string;
    if (insertIndex !== -1) {
        const afterHeader = insertIndex + insertAfter.length;
        newContent = updatedContent.substring(0, afterHeader) + content + '\n\n' + updatedContent.substring(afterHeader);
    } else {
        newContent = updatedContent + '\n\n' + content;
    }

    const sortedContent = sortMarkdownRecords(newContent);

    try {
        writingPaths.add(file.path);
        await app.vault.modify(file, sortedContent);
    } finally {
        writingPaths.delete(file.path);
    }
    return file;
}

function updateYearFileStats(content: string, isMovie: boolean): string {
    const field = isMovie ? 'total_movies' : 'total_tv_shows';
    const regex = new RegExp(`(${field}:\\s*)(\\d+)`);
    const match = content.match(regex);
    if (match && match[2] !== undefined) {
        const current = parseInt(match[2], 10);
        return content.replace(regex, `$1${current + 1}`);
    }
    return content;
}
