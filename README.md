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

The transcript sidebar and codebook sidebar can be resized on wider screens by dragging the vertical handles between panels.

Legacy `.doc` files are not supported. Save them as `.docx` first.

## Codebook Upload

Use the Codebook panel to upload a `.csv` codebook.

The app builds nested dropdowns from the CSV columns:

- The first column becomes the top-level group, such as `Dimension`.
- Each later column becomes the next child level.
- Blank cells inherit the last value above them, which supports codebooks exported from spreadsheets with merged cells.

Each code row has a checkbox. Check a code when it appears in the transcript.

Each code row also has a `Highlight` button for attaching selected transcript text to that specific code as evidence.

## Highlight Evidence

After loading a transcript and codebook:

1. Select the relevant text in the transcript.
2. Find the matching code in the Codebook sidebar.
3. Click `Highlight` on that code row.

The selected excerpt is saved as evidence for that code and highlighted in the transcript reader. Highlights are exported with coding progress under `__highlights`, but they are not used in IRR calculations.

## Save And Restore Coding Progress

After loading a codebook, use the export controls in the Codebook panel:

1. Enter an optional export filename.
2. Click `Save and Export to JSON`.

If no filename is entered, the app uses the codebook filename. The exported JSON contains every code path:

```json
{
  "Dimension: Example > Code: Code A": 1,
  "Dimension: Example > Code: Code B": 0
}
```

`1` means the code was checked. `0` means it was not checked.

Highlighted excerpts are stored separately in the same file:

```json
{
  "__highlights": [
    {
      "docName": "interview-1.txt",
      "codeKey": "Dimension: Example > Code: Code A",
      "text": "selected transcript excerpt"
    }
  ]
}
```

To continue previous work:

1. Load the same codebook CSV.
2. Click `Upload Saved JSON`.
3. Select the saved JSON file.

The app restores checked codes that match the loaded codebook.

If the saved JSON contains highlights, matching highlights are restored as well.

## Calculate IRR

Open the `Calculate IRR` tab.

The tab defaults to 1 interview pair. Use `Number of interviews` to choose how many interview pairs to compare, from 1 to 10.

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

Highlight metadata is ignored by the IRR calculator.

## Checkpoints

A pre-highlight checkpoint was saved in:

```text
checkpoints/20260507-215354
```

If the highlight feature needs to be reverted, restore `index.html`, `app.js`, `styles.css`, and `README.md` from that folder.

## Files

- `index.html`: app markup
- `styles.css`: dashboard styling
- `app.js`: transcript parsing, codebook parsing, coding state, JSON export/import, and IRR logic
- `server.mjs`: local static server
- `package.json`: npm scripts
