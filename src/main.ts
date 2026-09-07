import { App, Modal, Notice, Plugin, Setting, TFile, requestUrl } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, WatchStatus } from './types';
import { MovieLogSettingTab } from './settings';
import { SearchModal } from './search-modal';
import { getMovieDetails, getTVShowDetails, getSeasonDetails, initTmdbCache, getTmdbCacheForPersist, setTmdbCachePersistCallback, TmdbCacheEntry } from './tmdb-api';
import {
	generateMovieRecord,
	generateTVRecord,
	appendToYearFile,
	UserRecordInput
} from './record-generator';
import { MovieLogView, VIEW_TYPE_MOVIELOG } from './card-wall-view';
import { reportError } from './utils';
import { formatLocalDate, RecordFormInput, validateRecordForm } from './record-input';
import { getPosterCacheFileName } from './poster-cache';

class AddRecordModal extends Modal {
	private result: RecordFormInput;
    private onSubmit: (result: UserRecordInput) => void;

    constructor(app: App, onSubmit: (result: UserRecordInput) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.result = {
			watchDate: formatLocalDate(),
			rating: '',
			platform: '',
			status: WatchStatus.COMPLETED
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Add watch record' });

        new Setting(contentEl)
            .setName('Watch date')
            .setDesc('Date watched (YYYY-MM-DD)')
            .addText(text => text
                .setValue(this.result.watchDate || '')
                .onChange(value => this.result.watchDate = value));

        new Setting(contentEl)
            .setName('My rating')
            .setDesc('Rating from 0 to 10')
            .addText(text => text
                .setValue(this.result.rating || '')
                .onChange(value => this.result.rating = value));

        new Setting(contentEl)
            .setName('Watch platform')
            .setDesc('Where you watched it (for example, Netflix or a cinema)')
            .addText(text => text
                .setValue(this.result.platform || '')
                .onChange(value => this.result.platform = value));

        new Setting(contentEl)
            .setName('Watch status')
            .setDesc('Current watch status')
            .addDropdown(dropdown => dropdown
				.addOption(WatchStatus.PLANNED, 'Planned')
				.addOption(WatchStatus.WATCHING, 'Watching')
				.addOption(WatchStatus.COMPLETED, 'Completed')
				.addOption(WatchStatus.DROPPED, 'Dropped')
				.setValue(this.result.status)
				.onChange(value => this.result.status = value as WatchStatus));

        new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Add record')
				.setCta()
				.onClick(() => {
					const validation = validateRecordForm(this.result);
					if (!validation.ok) {
						new Notice(validation.message);
						return;
					}
					this.close();
					this.onSubmit(validation.value);
				}));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export default class MovieLogPlugin extends Plugin {
    settings: PluginSettings;
    private writingPaths = new Set<string>();

    async onload() {
        await this.loadSettings();

        this.registerView(VIEW_TYPE_MOVIELOG, (leaf) => new MovieLogView(leaf, this.settings));

		this.addRibbonIcon('film', 'MovieLog', () => {
			void this.activateCardWall();
		});

        this.addSettingTab(new MovieLogSettingTab(this.app, this));

		setTmdbCachePersistCallback(() => {
			const data = { ...this.settings, _tmdbCache: getTmdbCacheForPersist() };
			void this.saveData(data).catch((error) => {
				console.error('[MovieLog] Failed to save the TMDB cache:', error);
			});
		});

        this.addCommand({
            id: 'open-wall',
            name: 'Open card wall',
            callback: () => {
                void this.activateCardWall();
            }
        });

        this.addCommand({
            id: 'add-movie',
            name: 'Add movie record',
            callback: () => {
                if (!this.settings.tmdbApiKey) {
                    new Notice('Configure your TMDB API key in MovieLog settings first.');
                    return;
                }
                new SearchModal(this.app, this.settings.tmdbApiKey, this.settings.tmdbLanguage, 'movie', (result) => {
                    void (async () => {
                        try {
                            new Notice('Fetching movie details...');
                            const details = await getMovieDetails(result.id, this.settings.tmdbApiKey, this.settings.tmdbLanguage);
                            new AddRecordModal(this.app, (userInput) => {
                                void (async () => {
                                    try {
                                        const content = generateMovieRecord(details, this.settings, userInput);
                                        let finalContent = content;
                                        if (this.settings.posterCacheEnabled && details.poster_path) {
											const localPath = await this.downloadPoster(
												getPosterCacheFileName('movie', details.id, details.poster_path),
												details.poster_path
											);
                                            if (localPath) {
                                                finalContent = content.replace(
                                                    /!\[Poster\|\d+\]\(https:\/\/image\.tmdb\.org\/[^)]+\)/,
                                                    `![Poster|350](${localPath})`
                                                );
                                            }
                                        }
										const file = await appendToYearFile(this.app, finalContent, this.settings.defaultSaveFolder, userInput.watchDate, 'movie', this.writingPaths);
                                        this.refreshCardWall();
                                        await this.app.workspace.openLinkText(file.path, '', true);
                                        new Notice(`Created: ${file.basename}`);
                                    } catch (error) {
                                        reportError('Failed to create the record', error);
                                    }
                                })();
                            }).open();
                        } catch (error) {
                            reportError('Failed to fetch movie details', error);
                        }
                    })();
                }).open();
            }
        });

        this.addCommand({
            id: 'add-tv',
            name: 'Add TV show record',
            callback: () => {
                if (!this.settings.tmdbApiKey) {
                    new Notice('Configure your TMDB API key in MovieLog settings first.');
                    return;
                }
                new SearchModal(this.app, this.settings.tmdbApiKey, this.settings.tmdbLanguage, 'tv', (result) => {
                    void (async () => {
                        try {
                            new Notice('Fetching TV show details...');
                            const showDetails = await getTVShowDetails(result.id, this.settings.tmdbApiKey, this.settings.tmdbLanguage);
                            const { SeasonModal } = await import('./season-modal');
                            new SeasonModal(this.app, showDetails, (seasonNumber) => {
                                void (async () => {
                                    try {
                                        new Notice('Fetching season details...');
                                        const seasonDetails = await getSeasonDetails(showDetails.id, seasonNumber, this.settings.tmdbApiKey, this.settings.tmdbLanguage);
                                        new AddRecordModal(this.app, (userInput) => {
                                            void (async () => {
                                                try {
                                                    const content = generateTVRecord(showDetails, seasonDetails, this.settings, userInput);
                                                    let finalContent = content;
                                                    if (this.settings.posterCacheEnabled) {
                                                        const posterPath = seasonDetails.poster_path || showDetails.poster_path;
                                                        if (posterPath) {
											const localPath = await this.downloadPoster(
												getPosterCacheFileName('tv', showDetails.id, posterPath, seasonNumber),
												posterPath
											);
                                                            if (localPath) {
                                                                finalContent = content.replace(
                                                                    /!\[Poster\|\d+\]\(https:\/\/image\.tmdb\.org\/[^)]+\)/,
                                                                    `![Poster|350](${localPath})`
                                                                );
                                                            }
                                                        }
                                                    }
											const file = await appendToYearFile(this.app, finalContent, this.settings.defaultSaveFolder, userInput.watchDate, 'tv', this.writingPaths);
                                                    this.refreshCardWall();
                                                    await this.app.workspace.openLinkText(file.path, '', true);
                                                    new Notice(`Created: ${file.basename}`);
                                                } catch (error) {
                                                    reportError('Failed to create the record', error);
                                                }
                                            })();
                                        }).open();
                                    } catch (error) {
                                        reportError('Failed to fetch season details', error);
                                    }
                                })();
                            }).open();
                        } catch (error) {
                            reportError('Failed to fetch TV show details', error);
                        }
                    })();
                }).open();
            }
        });
        this.app.workspace.onLayoutReady(() => {
            const isInSaveFolder = (path: string): boolean => {
                const saveFolder = this.settings.defaultSaveFolder.replace(/^\/|\/$/g, '');
                return path.startsWith(saveFolder + '/');
            };

            this.registerEvent(
                this.app.vault.on('modify', (file) => {
                    if (file instanceof TFile && file.extension === 'md') {
                        if (this.writingPaths.has(file.path)) return;
                        if (isInSaveFolder(file.path)) {
                            this.refreshCardWall();
                        }
                    }
                })
            );

            this.registerEvent(
                this.app.vault.on('create', (file) => {
                    if (file instanceof TFile && file.extension === 'md') {
                        if (this.writingPaths.has(file.path)) return;
                        if (isInSaveFolder(file.path)) {
                            this.refreshCardWall();
                        }
                    }
                })
            );
        });
    }

    refreshCardWall(): void {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MOVIELOG);
        for (const leaf of leaves) {
            const view = leaf.view as MovieLogView;
            if (view) {
                view.refreshCards();
            }
        }
    }

    private async activateCardWall(): Promise<void> {
        const { workspace } = this.app;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_MOVIELOG);

        if (leaves.length > 0) {
            const leaf = leaves[0]!;
            const activeView = workspace.getActiveViewOfType(MovieLogView);
            if (activeView && activeView.leaf === leaf) {
                leaf.detach();
                return;
            }
            await workspace.revealLeaf(leaf);
            return;
        }

        const leaf = workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE_MOVIELOG, active: true });
            await workspace.revealLeaf(leaf);
        }
    }

    onunload() {
    }

    async loadSettings() {
        const data = (await this.loadData()) as Record<string, unknown> | null;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
        initTmdbCache((data?._tmdbCache as Record<string, TmdbCacheEntry>) || {});
    }

    async saveSettings() {
        const data = { ...this.settings, _tmdbCache: getTmdbCacheForPersist() };
        await this.saveData(data);
        this.refreshCardWall();
    }

	private async downloadPoster(fileName: string, posterPath: string): Promise<string | null> {
        const url = `https://image.tmdb.org/t/p/original${posterPath}`;
        try {
            const response = await requestUrl({ url });
            const folderPath = `${this.settings.defaultSaveFolder.replace(/^\/|\/$/g, '')}/_posters`;
			const filePath = `${folderPath}/${fileName}`;

            await this.app.vault.createFolder(folderPath).catch(() => {});

            const existing = this.app.vault.getAbstractFileByPath(filePath);
            if (existing) return filePath;

            await this.app.vault.createBinary(filePath, response.arrayBuffer);
            return filePath;
		} catch (error) {
			reportError('Failed to download the poster', error);
            return null;
        }
    }
}
