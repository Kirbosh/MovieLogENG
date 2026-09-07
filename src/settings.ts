import { App, PluginSettingTab, Setting, SettingDefinitionItem } from 'obsidian';
import MovieLogPlugin from './main';
import { SortBy, SubHeadingStyle } from './types';

export class MovieLogSettingTab extends PluginSettingTab {
    plugin: MovieLogPlugin;

    constructor(app: App, plugin: MovieLogPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        return [{
            type: 'group',
            heading: 'Records and display',
            items: [
                {
                    name: 'TMDB API key',
                    desc: 'Create a themoviedb.org account to get a free API key',
                    aliases: ['TMDB', 'API', 'key'],
                    render: (setting) => this.renderApiKeySetting(setting)
                },
                {
                    name: 'Default save folder',
                    desc: 'Folder path where new records are saved',
                    control: {
                        type: 'text',
                        key: 'defaultSaveFolder',
                        placeholder: 'MovieLog'
                    }
                },
                {
                    name: 'TMDB language',
                    desc: 'Language used for metadata from TMDB',
                    control: {
                        type: 'dropdown',
                        key: 'tmdbLanguage',
                        options: {
                            'zh-CN': 'Simplified Chinese',
                            'zh-TW': 'Traditional Chinese',
                            'en-US': 'English',
                            'ja-JP': 'Japanese',
                            'ko-KR': 'Korean'
                        }
                    }
                },
                {
                    name: 'Sort by',
                    desc: 'Default sort order in the card wall',
                    control: {
                        type: 'dropdown',
                        key: 'sortBy',
                        options: {
                            [SortBy.WATCH_DATE]: 'Watch date',
                            [SortBy.TITLE]: 'Title',
                            [SortBy.RATING]: 'Rating',
                            [SortBy.RELEASE_DATE]: 'Release date'
                        }
                    }
                },
                {
                    name: 'Subheading style',
                    desc: 'How section headings are formatted in records',
                    control: {
                        type: 'dropdown',
                        key: 'subHeadingStyle',
                        options: {
                            [SubHeadingStyle.BOLD]: '> **Bold blockquote**',
                            [SubHeadingStyle.HEADING]: '### Heading'
                        }
                    }
                },
                {
                    name: 'Cache posters locally',
                    desc: 'Download posters for offline viewing. Disabled by default.',
                    control: {
                        type: 'toggle',
                        key: 'posterCacheEnabled'
                    }
                }
            ]
        }];
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        if (key === 'defaultSaveFolder' && typeof value === 'string') {
            this.plugin.settings.defaultSaveFolder = value.trim() || 'MovieLog';
        } else if (key === 'tmdbLanguage' && typeof value === 'string') {
            this.plugin.settings.tmdbLanguage = value;
        } else if (key === 'sortBy' && Object.values(SortBy).includes(value as SortBy)) {
            this.plugin.settings.sortBy = value as SortBy;
        } else if (key === 'subHeadingStyle' && Object.values(SubHeadingStyle).includes(value as SubHeadingStyle)) {
            this.plugin.settings.subHeadingStyle = value as SubHeadingStyle;
        } else if (key === 'posterCacheEnabled' && typeof value === 'boolean') {
            this.plugin.settings.posterCacheEnabled = value;
        } else {
            return;
        }

        await this.plugin.saveSettings();
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('Records and display').setHeading();

        this.renderApiKeySetting(new Setting(containerEl));

        new Setting(containerEl)
            .setName('Default save folder')
            .setDesc('Folder path where new records are saved')
            .addText(text => text
                .setPlaceholder('MovieLog')
                .setValue(this.plugin.settings.defaultSaveFolder)
                .onChange(async (value) => {
                    await this.setControlValue('defaultSaveFolder', value);
                }));

        new Setting(containerEl)
            .setName('TMDB language')
            .setDesc('Language used for metadata from TMDB')
            .addDropdown(dropdown => dropdown
                .addOption('zh-CN', 'Simplified Chinese')
                .addOption('zh-TW', 'Traditional Chinese')
                .addOption('en-US', 'English')
                .addOption('ja-JP', 'Japanese')
                .addOption('ko-KR', 'Korean')
                .setValue(this.plugin.settings.tmdbLanguage)
                .onChange(async (value) => {
                    await this.setControlValue('tmdbLanguage', value);
                }));

        new Setting(containerEl)
            .setName('Sort by')
            .setDesc('Default sort order in the card wall')
            .addDropdown(dropdown => dropdown
                .addOption(SortBy.WATCH_DATE, 'Watch date')
                .addOption(SortBy.TITLE, 'Title')
                .addOption(SortBy.RATING, 'Rating')
                .addOption(SortBy.RELEASE_DATE, 'Release date')
                .setValue(this.plugin.settings.sortBy)
                .onChange(async (value) => {
                    await this.setControlValue('sortBy', value);
                }));

        new Setting(containerEl)
            .setName('Subheading style')
            .setDesc('How section headings are formatted in records')
            .addDropdown(dropdown => dropdown
                .addOption(SubHeadingStyle.BOLD, '> **Bold blockquote**')
                .addOption(SubHeadingStyle.HEADING, '### Heading')
                .setValue(this.plugin.settings.subHeadingStyle)
                .onChange(async (value) => {
                    await this.setControlValue('subHeadingStyle', value);
                }));

        new Setting(containerEl)
            .setName('Cache posters locally')
            .setDesc('Download posters for offline viewing. Disabled by default.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.posterCacheEnabled)
                .onChange(async (value) => {
                    await this.setControlValue('posterCacheEnabled', value);
                }));
    }

    private renderApiKeySetting(setting: Setting): void {
        setting
            .setName('TMDB API key')
            .setDesc('Create a themoviedb.org account to get a free API key')
            .addText(text => {
                text
                    .setPlaceholder('Enter your TMDB API key')
                    .setValue(this.plugin.settings.tmdbApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.tmdbApiKey = value.trim();
                        await this.plugin.saveSettings();
                    });
                text.inputEl.type = 'password';
            })
            .addExtraButton(btn => {
                btn
                    .setIcon('eye')
                    .setTooltip('Show or hide the API key')
                    .onClick(() => {
                        const inputEl = btn.extraSettingsEl
                            .closest('.setting-item')
                            ?.querySelector('input') as HTMLInputElement;
                        if (inputEl) {
                            const isHidden = inputEl.type === 'password';
                            inputEl.type = isHidden ? 'text' : 'password';
                            btn.setIcon(isHidden ? 'eye-off' : 'eye');
                        }
                    });
			});
    }
}
