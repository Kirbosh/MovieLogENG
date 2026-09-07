# Poster Wall Year Filter — Design

> Date: 2026-05-31 | Status: Approved

## Overview

Add a year dropdown in the upper-right corner of the MovieLog card-wall header so users can filter watch records by year.

## Requirements

- **Position:** Upper-right side of the header, on the same row as the “Watch history” title
- **Filter dimension:** Year only
- **UI:** Native HTML `<select>` element
- **Style:** Warm colors and rounded corners matching the card wall

## Scope

| File | Change |
|------|--------|
| `src/card-wall-view.ts` | Add the `<select>` to the header, a `selectedYear` field, and filtered re-rendering |
| `styles.css` | Add `.movielog-year-filter` styles |
| No other files | No changes required in `types.ts`, `main.ts`, or `settings.ts` |

## DOM structure

Insert the year filter on the right side of `.movielog-poster-header`:

```text
.movielog-poster-header
├── .movielog-header-left
│   ├── .movielog-stats-title     ← for example, “Watch history (2025)”
│   └── .movielog-stats-sub       ← statistics
└── .movielog-year-filter
    └── <select>
        ├── <option value="">All years</option>
        ├── <option value="2025">2025 (8)</option>
        └── <option value="2024">2024 (4)</option>
```

## Data flow

```text
parseAllYearFiles()
  ├── Parse all year files → records[]
  └── Extract the available years → populate <select>

User selects a year → onchange
  ├── Filter records where year === selectedYear
  ├── sortRecords(filtered)
  └── Re-render the header, statistics, and card list
```

## Behavior

1. **Default:** `All years` is selected and all records are displayed.
2. **Option labels:** Each year includes its record count, for example `2025 (8)`.
3. **Filtering and sorting:** Filtered records still follow `settings.sortBy`.
4. **Dynamic title:** A selected year produces `Watch history (2025)`; `All years` omits the year.
5. **Dynamic statistics:** Counts update to describe the filtered result.
6. **State:** `selectedYear` belongs only to the `MovieLogView` instance and is not persisted in settings.
7. **Year source:** Years are derived from the records rather than a fixed list or setting.

## Implementation notes

### `card-wall-view.ts`

Add view state:

```typescript
private selectedYear: string | null = null;
```

After parsing, collect the years and their record counts. Use a flex header with the title group on the left and the filter on the right. Bind the dropdown’s `change` event to update `selectedYear`, then filter, sort, and render again without re-reading the files.

An optional helper can isolate the filtering:

```typescript
private getFilteredRecords(records: ParsedRecord[]): ParsedRecord[] {
    if (!this.selectedYear) return records;
    return records.filter(record => record.year === this.selectedYear);
}
```

### `styles.css`

```css
.movielog-poster-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}

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

The header must use flex layout so the title group and filter occupy separate columns.

## Explicitly out of scope

- Do not add a setting; the year filter is view-local state.
- Do not change `types.ts`; no new interface or enum is required.
- Do not change `main.ts`; no new command or event is required.
- Do not change the add-record flow in `search-modal.ts` or `record-generator.ts`.
