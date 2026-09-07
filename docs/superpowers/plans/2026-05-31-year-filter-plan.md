# Poster Wall Year Filter — Implementation Plan

> **For AI agents:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task by task. Track progress with `- [ ]` checkboxes.

**Goal:** Add a native `<select>` year filter to the upper-right corner of the poster-wall header.

**Architecture:** Add an `allRecords` cache and `selectedYear` state to `MovieLogView`. Separate one-time file parsing from repeatable view rendering so a filter change does not re-read files.

**Technology:** TypeScript with the Obsidian Plugin API, plus CSS for the native select.

---

### Task 1: CSS — flex header and filter styling

**Files:**

- Modify `.movielog-poster-header` in `styles.css`.
- Add `.movielog-year-filter` and `.movielog-header-left` styles to `styles.css`.

- [ ] **Step 1: Convert the header to flex layout and add the left-side title wrapper**

```css
.movielog-poster-header {
    padding: 16px 16px 0;
    margin-bottom: 24px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.movielog-header-left {
    flex: 1;
    min-width: 0;
}
```

- [ ] **Step 2: Add the year-filter styles**

```css
/* ===== Year Filter ===== */
.movielog-year-filter select {
    background: #faf8f5;
    border: 1.5px solid #d9cdc0;
    border-radius: 8px;
    padding: 6px 28px 6px 10px;
    font-size: 13px;
    color: #3d3229;
    cursor: pointer;
    font-family: inherit;
    appearance: auto;
    flex-shrink: 0;
}

.movielog-year-filter select:hover {
    border-color: #c4a88c;
}

.movielog-year-filter select:focus {
    outline: none;
    border-color: #a08060;
    box-shadow: 0 0 0 2px rgba(160, 128, 96, 0.15);
}
```

- [ ] **Step 3: Verify the CSS**

Run `npm run build` and confirm there are no compilation errors.

---

### Task 2: TypeScript — core filtering behavior

**File:** `src/card-wall-view.ts`

- [ ] **Step 1: Add `allRecords` and `selectedYear` fields**

```typescript
private allRecords: ParsedRecord[] = [];
private selectedYear: string | null = null;
```

- [ ] **Step 2: Refactor record loading to cache the result and delegate rendering**

```typescript
private async renderCards(container: HTMLElement): Promise<void> {
    this.allRecords = await this.parseAllYearFiles();
    this.renderFilteredView(container);
}
```

- [ ] **Step 3: Add `renderFilteredView()`**

The method should:

1. Clear the container.
2. Filter `allRecords` by `selectedYear` when a year is selected.
3. Render an English empty state when there are no results.
4. Sort the filtered records with the existing sort behavior.
5. Render the dynamic title and movie/TV counts.
6. Build an `All years` option followed by descending year options with counts.
7. Update `selectedYear` and re-render on `change`.
8. Render the filtered card grid.

Representative UI strings:

```typescript
emptyState.createEl('p', { text: 'No watch records yet' });
emptyState.createEl('p', { text: 'Use the command palette to add your first movie or TV show.' });

const title = this.selectedYear
    ? `Watch history (${this.selectedYear})`
    : 'Watch history';

select.createEl('option', { text: 'All years', attr: { value: '' } });
```

- [ ] **Step 4: Reset filter state when required by the refresh behavior**

The original design reset `selectedYear` during a full refresh. If refreshes should preserve the current filter, keep the state and only replace `allRecords`; document the selected behavior.

- [ ] **Step 5: Remove superseded single-year title logic**

Delete the old `yearSet` / `yearText` logic after the dynamic header is in place. Run `npm run build`.

---

### Task 3: Verification

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: TypeScript completes without errors and esbuild outputs `main.js`.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no ESLint errors.

- [ ] **Step 3: Commit**

```bash
git add styles.css src/card-wall-view.ts
git commit -m "feat: add a year filter to the poster wall"
```
