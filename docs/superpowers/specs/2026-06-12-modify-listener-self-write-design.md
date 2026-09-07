# Excluding Plugin Writes from the Modify Listener — Design

> Corresponds to item `02-02` in the `02-stability.md` review document.

## Problem

The `modify` listener in `src/main.ts` does not distinguish edits made by the plugin itself to `{year}.md`. Each call to `vault.modify` in `record-generator.ts` triggers `refreshCardWall`, causing every year file to be parsed again. Adding one record therefore causes an unnecessary full-vault reread.

## Solution: path-set exclusion

The plugin maintains a `Set<string>` containing paths it is currently writing. Add the path before a write, remove it in `finally`, and make the listener skip paths found in the set.

## Scope

Two files and four changes.

### 1. Add a field to the plugin class in `src/main.ts`

```ts
private writingPaths = new Set<string>();
```

### 2. Extend `appendToYearFile` in `src/record-generator.ts`

Add a `writingPaths: Set<string>` parameter and mark the path around `vault.modify`:

```ts
export async function appendToYearFile(
    app: App,
    content: string,
    folder: string,
    watchDate: string,
    contentType: 'movie' | 'tv',
    writingPaths: Set<string>
): Promise<TFile> {
    // Existing logic remains unchanged.
    writingPaths.add(file.path);
    try {
        await app.vault.modify(file, sortedContent);
    } finally {
        writingPaths.delete(file.path);
    }
    return file;
}
```

### 3. Skip self-writes in the listener in `src/main.ts`

```ts
this.app.vault.on('modify', (file) => {
    if (file instanceof TFile && file.extension === 'md') {
        if (this.writingPaths.has(file.path)) return;
        const saveFolder = this.settings.defaultSaveFolder.replace(/^\/|\/$/g, '');
        if (file.path.startsWith(saveFolder + '/')) {
            this.refreshCardWall();
        }
    }
});
```

### 4. Pass the set from the caller

Calls to `appendToYearFile` pass `this.writingPaths`.

## Data flow

```text
Add record → appendToYearFile(writingPaths)
  → writingPaths.add(file.path)
  → vault.modify({year}.md) → modify event fires
    → listener sees writingPaths.has(file.path) === true → skip
  → writingPaths.delete(file.path) in finally
```

When a user edits a year file manually:

```text
User edit → vault saves → modify event fires
  → writingPaths.has(file.path) === false → refreshCardWall
```

## Edge cases

- **Write failure:** `finally` removes the path even if `vault.modify` throws, so the file never remains permanently excluded.
- **Concurrent writes:** The set can track multiple distinct paths independently.
- **Immediate user edit:** The plugin removes the path as soon as its write completes, so a following user edit is not skipped.
