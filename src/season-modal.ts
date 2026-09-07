import { App, Modal } from 'obsidian';
import { TMDBTVShowDetails } from './types';

export class SeasonModal extends Modal {
    private show: TMDBTVShowDetails;
    private onSelect: (seasonNumber: number) => void;

    constructor(app: App, show: TMDBTVShowDetails, onSelect: (seasonNumber: number) => void) {
        super(app);
        this.show = show;
        this.onSelect = onSelect;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: `${this.show.name} - Select a season` });

        const seasons = this.show.seasons.filter(s => s.season_number > 0);

        if (seasons.length === 0) {
            contentEl.createEl('p', { text: 'No season information is available for this show.' });
            return;
        }

        const list = contentEl.createDiv({ cls: 'movielog-season-list' });

        for (const season of seasons) {
            const item = list.createDiv({ cls: 'movielog-season-item' });

            const info = item.createDiv({ cls: 'movielog-season-info' });
            info.createEl('strong', { text: `Season ${season.season_number}: ${season.name}` });
            info.createEl('span', { text: `${season.episode_count} ${season.episode_count === 1 ? 'episode' : 'episodes'}` });
            if (season.vote_average) {
                info.createEl('span', { text: `⭐ ${season.vote_average.toFixed(1)}` });
            }
            if (season.air_date) {
                info.createEl('span', { text: season.air_date.substring(0, 4) });
            }

            item.addEventListener('click', () => {
                this.close();
                this.onSelect(season.season_number);
            });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
