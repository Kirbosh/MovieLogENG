import { App, Modal } from 'obsidian';
import { TMDBSearchResult } from './types';
import { searchMovie, searchMulti, searchTV, getYear, buildPosterUrl } from './tmdb-api';

export class SearchModal extends Modal {
    private query: string = '';
    private results: TMDBSearchResult[] = [];
    private onSelect: (result: TMDBSearchResult) => void;
    private apiKey: string;
    private language: string;
	private mediaType: 'movie' | 'tv' | 'all';
	private resultContainer: HTMLElement;
	private searchRequestId = 0;

    constructor(
        app: App,
        apiKey: string,
        language: string,
        mediaType: 'movie' | 'tv' | 'all',
        onSelect: (result: TMDBSearchResult) => void
    ) {
        super(app);
        this.apiKey = apiKey;
        this.language = language;
        this.mediaType = mediaType;
        this.onSelect = onSelect;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Search movies and TV shows' });

        const inputContainer = contentEl.createDiv({ cls: 'movielog-search-input' });
        const input = inputContainer.createEl('input', {
            type: 'text',
            placeholder: 'Enter a title...',
            cls: 'movielog-search-field'
        });
        input.focus();

        const searchBtn = inputContainer.createEl('button', { text: 'Search', cls: 'movielog-search-btn' });

		const doSearch = async () => {
			this.query = input.value.trim();
			if (!this.query) return;
			const requestId = ++this.searchRequestId;

            this.resultContainer.empty();
            this.resultContainer.createEl('p', { text: 'Searching...', cls: 'movielog-search-status' });

			try {
				const results = this.mediaType === 'movie'
					? await searchMovie(this.query, this.apiKey, this.language)
					: this.mediaType === 'tv'
						? await searchTV(this.query, this.apiKey, this.language)
						: await searchMulti(this.query, this.apiKey, this.language);
				if (requestId !== this.searchRequestId) return;
				this.results = results;
				this.renderResults();
			} catch (error) {
				if (requestId !== this.searchRequestId) return;
                this.resultContainer.empty();
                this.resultContainer.createEl('p', {
                    text: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    cls: 'movielog-search-error'
                });
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') void doSearch();
        });
        searchBtn.addEventListener('click', () => void doSearch());

        this.resultContainer = contentEl.createDiv({ cls: 'movielog-search-results' });
    }

    private renderResults(): void {
        this.resultContainer.empty();

        if (this.results.length === 0) {
            this.resultContainer.createEl('p', { text: 'No results found. Try a different search term.', cls: 'movielog-search-status' });
            return;
        }

        for (const result of this.results) {
            const item = this.resultContainer.createDiv({ cls: 'movielog-search-item' });

            const posterUrl = buildPosterUrl(result.poster_path, 'w92');
            if (posterUrl) {
                const img = item.createEl('img', { cls: 'movielog-search-poster' });
                img.src = posterUrl;
                img.loading = 'lazy';
            }

            const info = item.createDiv({ cls: 'movielog-search-info' });
            const typeIcon = result.media_type === 'movie' ? '🎬' : '📺';
            const year = getYear(result);
            info.createEl('strong', { text: `${typeIcon} ${result.title || result.name} (${year})` });
            info.createEl('span', { text: `⭐ ${(result.vote_average || 0).toFixed(1)}/10` });

            item.addEventListener('click', () => {
                this.close();
                this.onSelect(result);
            });
        }
    }

	onClose(): void {
		this.searchRequestId++;
		const { contentEl } = this;
        contentEl.empty();
    }
}
