# MovieLog

An Obsidian plugin for tracking your movie and TV series watching history. Fetches media information via TMDB API, generates structured watch records, and displays them in a card wall view.

## Features

- **TMDB Search**: Search movies and TV series via command palette, automatically fetch metadata
- **Templated Records**: Auto-generate Markdown files with posters, ratings, synopsis, etc.
- **Series Support**: Track TV series by season, including episode lists and watch progress
- **Card Wall View**: Browse all watch records in a visual card grid
- **Personal Fields**: Fill in your thoughts, personal rating, watch platform, watch status, etc.

## Installation

### Method 1: Install Release Files (Recommended)

Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Kirbosh/MovieLogENG/releases/latest), copy them to `{your vault}/.obsidian/plugins/movielog/`, restart Obsidian, and enable MovieLog under Community Plugins.

### Method 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/Kirbosh/MovieLogENG.git
cd MovieLogENG

# Install dependencies
npm ci

# Build
npm run build

# Copy to your Obsidian vault
cp main.js manifest.json styles.css /path/to/your/vault/.obsidian/plugins/movielog/
```

Restart Obsidian, then open Settings → Community Plugins and enable MovieLog.

## Configuration

1. Open Obsidian → Settings → Community Plugins → MovieLog
2. Enter your TMDB API Key:
   - Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
   - Get your API Key from [API Settings](https://www.themoviedb.org/settings/api)
3. Configure other options:
   - **Default Save Folder**: Directory for watch records (default: `MovieLog`)
   - **TMDB Language**: Metadata language (default: English)
   - **Sort By**: Sort by watch date, title, rating, or release date
   - **Sub-Heading Style**: Display format for section headings in records — either `> **bold blockquote**` (default) or `### heading`
   - **Cache Posters Locally**: Download poster images into your vault for offline viewing (disabled by default)

MovieLog currently supports Obsidian desktop only. Mobile has not been tested and is not supported.

## Usage

### Add Movie Record

1. Press `Ctrl+P` (`Cmd+P` on macOS) to open the command palette
2. Type `MovieLog: Add movie record`
3. Enter the movie name and search
4. Select the movie from the result list
5. A Markdown file with complete information is auto-generated
6. Fill in your thoughts, rating, and other personal fields

### Add TV Series Record

1. Open the command palette, type `MovieLog: Add TV show record`
2. Search for the TV series name
3. After selecting the series, choose the season to record
4. A file with series information and episode list is auto-generated
5. Update watch progress and your thoughts

### View Card Wall

1. Click the movie icon in the left sidebar
2. Or use the command palette and type `MovieLog: Open card wall`
3. Browse all watch records, click a card to jump to the corresponding file

## License

MIT License

