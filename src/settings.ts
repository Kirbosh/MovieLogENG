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
            heading: '设置',
            items: [
                {
                    name: 'TMDB API key',
                    desc: '在 themoviedb.org 注册获取免费 API key',
                    aliases: ['TMDB', 'API', '密钥'],
                    render: (setting) => this.renderApiKeySetting(setting)
                },
                {
                    name: '默认保存文件夹',
                    desc: '新记录保存到的文件夹路径',
                    control: {
                        type: 'text',
                        key: 'defaultSaveFolder',
                        placeholder: 'MovieLog'
                    }
                },
                {
                    name: 'TMDB 语言',
                    desc: '从 TMDB 获取元数据的语言',
                    control: {
                        type: 'dropdown',
                        key: 'tmdbLanguage',
                        options: {
                            'zh-CN': '简体中文',
                            'zh-TW': '繁體中文',
                            'en-US': 'English',
                            'ja-JP': '日本語',
                            'ko-KR': '한국어'
                        }
                    }
                },
                {
                    name: '排序方式',
                    desc: '卡片墙中的默认排序方式',
                    control: {
                        type: 'dropdown',
                        key: 'sortBy',
                        options: {
                            [SortBy.WATCH_DATE]: '观看日期',
                            [SortBy.TITLE]: '标题',
                            [SortBy.RATING]: '评分',
                            [SortBy.RELEASE_DATE]: '上映日期'
                        }
                    }
                },
                {
                    name: '子标题样式',
                    desc: '记录中各区块标题的显示格式',
                    control: {
                        type: 'dropdown',
                        key: 'subHeadingStyle',
                        options: {
                            [SubHeadingStyle.BOLD]: '> **引用加粗格式**',
                            [SubHeadingStyle.HEADING]: '### 标题格式'
                        }
                    }
                },
                {
                    name: '海报本地缓存',
                    desc: '启用后将海报图片下载到本地，离线也能查看。默认关闭。',
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

        new Setting(containerEl).setName('设置').setHeading();

        this.renderApiKeySetting(new Setting(containerEl));

        new Setting(containerEl)
            .setName('默认保存文件夹')
            .setDesc('新记录保存到的文件夹路径')
            .addText(text => text
                .setPlaceholder('MovieLog')
                .setValue(this.plugin.settings.defaultSaveFolder)
                .onChange(async (value) => {
                    await this.setControlValue('defaultSaveFolder', value);
                }));

        new Setting(containerEl)
            .setName('TMDB 语言')
            .setDesc('从 TMDB 获取元数据的语言')
            .addDropdown(dropdown => dropdown
                .addOption('zh-CN', '简体中文')
                .addOption('zh-TW', '繁體中文')
                .addOption('en-US', 'English')
                .addOption('ja-JP', '日本語')
                .addOption('ko-KR', '한국어')
                .setValue(this.plugin.settings.tmdbLanguage)
                .onChange(async (value) => {
                    await this.setControlValue('tmdbLanguage', value);
                }));

        new Setting(containerEl)
            .setName('排序方式')
            .setDesc('卡片墙中的默认排序方式')
            .addDropdown(dropdown => dropdown
                .addOption(SortBy.WATCH_DATE, '观看日期')
                .addOption(SortBy.TITLE, '标题')
                .addOption(SortBy.RATING, '评分')
                .addOption(SortBy.RELEASE_DATE, '上映日期')
                .setValue(this.plugin.settings.sortBy)
                .onChange(async (value) => {
                    await this.setControlValue('sortBy', value);
                }));

        new Setting(containerEl)
            .setName('子标题样式')
            .setDesc('记录中各区块标题的显示格式')
            .addDropdown(dropdown => dropdown
                .addOption(SubHeadingStyle.BOLD, '> **引用加粗格式**')
                .addOption(SubHeadingStyle.HEADING, '### 标题格式')
                .setValue(this.plugin.settings.subHeadingStyle)
                .onChange(async (value) => {
                    await this.setControlValue('subHeadingStyle', value);
                }));

        new Setting(containerEl)
            .setName('海报本地缓存')
            .setDesc('启用后将海报图片下载到本地，离线也能查看。默认关闭。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.posterCacheEnabled)
                .onChange(async (value) => {
                    await this.setControlValue('posterCacheEnabled', value);
                }));
    }

    private renderApiKeySetting(setting: Setting): void {
        setting
            .setName('TMDB API key')
            .setDesc('在 themoviedb.org 注册获取免费 API key')
            .addText(text => {
                text
                    .setPlaceholder('输入你的 TMDB API key')
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
                    .setTooltip('显示/隐藏 API key')
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
