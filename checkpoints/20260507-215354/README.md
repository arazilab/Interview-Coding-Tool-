# Interview Transcript Coding Dashboard

A local browser dashboard for reading interview transcripts, applying codebook codes, saving coding progress as JSON, restoring prior coding work, and calculating inter-rater reliability across multiple interviews.

## Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The app is static and runs from the local Node server in `server.mjs`.

## Transcript Reading

Use the left panel to upload transcript files:

- `.txt`
- `.docx`

Uploaded transcripts appear in the file list. Select a transcript to read it in the center pane. The reader includes search highlighting and text size controls.

Legacy `.doc` files are not supported. Save them as `.docx` first.

## Codebook Upload

Use the Codebook panel to upload a `.csv` codebook.

The app builds nested dropdowns from the CSV columns:

- The first column becomes the top-level group, such as `Dimension`.
- Each later column becomes the next child level.
- Blank cells inherit the last value above them, which supports codebooks exported from spreadsheets with merged cells.

Each code row has a checkbox. Check a code when it appears in the transcript.

## Save And Restore Coding Progress

After loading a codebook, use the export controls in the Codebook panel:

1. Enter an optional export filename.
2. Click `Save and Export to JSON`.

The exported JSON contains every code path:

```json
{
  "Dimension: Example > Code: Code A": 1,
  "Dimension: Example > Code: Code B": 0
}
```

`1` means the code was checked. `0` means it was not checked.

To continue previous work:

1. Load the same codebook CSV.
2. Click `Upload Saved JSON`.
3. Select the saved JSON file.

The app restores checked codes that match the loaded codebook.

## Calculate IRR

Open the `Calculate IRR` tab.

Use `Number of interviews` to choose how many interview pairs to compare, from 1 to 10.

For each interview, upload:

- Coder A JSON
- Coder B JSON

The app calculates:

- Overall percent agreement
- Overall Cohen's kappa
- Completed interview count
- Per-interview agreement
- Per-interview kappa
- Coder A only counts
- Coder B only counts

JSON keys are matched by exact code path, so duplicate code names under different dimensions remain distinct.

## Files

- `index.html`: app markup
- `styles.css`: dashboard styling
- `app.js`: transcript parsing, codebook parsing, coding state, JSON export/import, and IRR logic
- `server.mjs`: local static server
- `package.json`: npm scripts
