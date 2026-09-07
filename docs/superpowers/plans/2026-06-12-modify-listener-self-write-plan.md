# Excluding Plugin Writes from the Modify Listener — Implementation Plan

> **For AI agents:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task by task. Track progress with `- [ ]` checkboxes.

**Goal:** Prevent the `modify` listener from calling `refreshCardWall` when the plugin writes `{year}.md`, avoiding an unnecessary full reparse.

**Architecture:** The plugin class keeps a `Set<string>` of paths currently being written. Add a path before the write, remove it in `finally`, and skip matching paths in the listener.

**Technology:** TypeScript and the Obsidian Plugin API.

---

### Task 1: Extend record-writing functions

**File:** `src/record-generator.ts`

- [ ] **Step 1: Add `writingPaths` to `appendToYearFile` and wrap `vault.modify`**

Change the function signature from:

```ts
export async function appendToYearFile(
    app: App,
    content: string,
    folder: string,
    watchDate: string | null,
    contentType: 'movie' | 'tv'
): Promise<TFile> {
```

to:

```ts
export async function appendToYearFile(
    app: App,
    content: string,
    folder: string,
    watchDate: string | null,
    contentType: 'movie' | 'tv',
    writingPaths: Set<string>
): Promise<TFile> {
```

Replace the direct write:

```ts
await app.vault.modify(file, sortedContent);
return file;
```

with:

```ts
writingPaths.add(file.path);
try {
    await app.vault.modify(file, sortedContent);
} finally {
    writingPaths.delete(file.path);
}
return file;
```

- [ ] **Step 2: Pass the set through any intermediate record-creation helper**

If `createRecordFile` remains in the implementation, add an optional `writingPaths?: Set<string>` parameter and pass `writingPaths ?? new Set()` to `appendToYearFile`.

---

### Task 2: Update the plugin class and listener

**File:** `src/main.ts`

- [ ] **Step 1: Add the plugin field**

```ts
private writingPaths = new Set<string>();
```

- [ ] **Step 2: Skip paths that the plugin is writing**

Add the guard immediately inside the Markdown-file branch:

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

- [ ] **Step 3: Pass `writingPaths` when creating a movie record**

The movie-record path must pass `this.writingPaths` to `appendToYearFile` or the relevant intermediate helper.

- [ ] **Step 4: Pass `writingPaths` when creating a TV record**

The TV-record path must pass the same set.

---

### Task 3: Verification

- [ ] **Step 1: Build and type-check**

```bash
npm run build
```

Expected: TypeScript reports no errors and esbuild outputs `main.js`.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no ESLint errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts src/record-generator.ts
git commit -m "fix: skip self-writes in the year-file modify listener"
```
