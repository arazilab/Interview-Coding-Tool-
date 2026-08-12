const state = {
  documents: [],
  activeId: null,
  codebook: null,
  checkedCodes: new Set(),
  annotations: [],
  irrPairCount: 1,
  irrPairs: Array.from({ length: 10 }, () => ({ coderA: null, coderB: null })),
  prevalenceFiles: [],
  prevalenceRows: [],
  searchDocuments: [],
  multiSearch: "",
  search: "",
  searchActiveIndex: -1,
  codebookSearch: "",
  codebookSearchActiveIndex: -1,
  codebookSearchMatchKeys: [],
  evidenceIndexByCode: new Map(),
  readerSize: 18,
};

const codebookColumnNames = new Set(["dimension", "dimensions", "code", "codes", "subcode", "subcodes"]);

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const documentList = document.querySelector("#documentList");
const fileCount = document.querySelector("#fileCount");
const searchInput = document.querySelector("#searchInput");
const activeMeta = document.querySelector("#activeMeta");
const activeTitle = document.querySelector("#activeTitle");
const readerStats = document.querySelector("#readerStats");
const transcriptPane = document.querySelector("#transcriptPane");
const highlightStatus = document.querySelector("#highlightStatus");
const increaseText = document.querySelector("#increaseText");
const decreaseText = document.querySelector("#decreaseText");
const appShell = document.querySelector("[data-resizable-shell]");
const leftResizer = document.querySelector("#leftResizer");
const rightResizer = document.querySelector("#rightResizer");
const codebookInput = document.querySelector("#codebookInput");
const codebookDropZone = document.querySelector("#codebookDropZone");
const saveCodesButton = document.querySelector("#saveCodesButton");
const exportFileName = document.querySelector("#exportFileName");
const loadCodesInput = document.querySelector("#loadCodesInput");
const loadCodesLabel = document.querySelector("#loadCodesLabel");
const loadCodesStatus = document.querySelector("#loadCodesStatus");
const codebookPanel = document.querySelector(".codebook-panel");
const codebookSummary = document.querySelector("#codebookSummary");
const codebookSearchInput = document.querySelector("#codebookSearchInput");
const codebookTree = document.querySelector("#codebookTree");
const irrPairCount = document.querySelector("#irrPairCount");
const irrPairGrid = document.querySelector("#irrPairGrid");
const irrResults = document.querySelector("#irrResults");
const prevalenceFilesInput = document.querySelector("#prevalenceFilesInput");
const prevalenceDropZone = document.querySelector("#prevalenceDropZone");
const prevalenceFileStatus = document.querySelector("#prevalenceFileStatus");
const prevalenceResults = document.querySelector("#prevalenceResults");
const exportPrevalenceButton = document.querySelector("#exportPrevalenceButton");
const searchFilesInput = document.querySelector("#searchFilesInput");
const searchDropZone = document.querySelector("#searchDropZone");
const searchFileStatus = document.querySelector("#searchFileStatus");
const multiSearchInput = document.querySelector("#multiSearchInput");
const searchFileCount = document.querySelector("#searchFileCount");
const searchDocumentList = document.querySelector("#searchDocumentList");
const multiSearchResults = document.querySelector("#multiSearchResults");
const contextDialog = document.querySelector("#contextDialog");
const contextDialogMeta = document.querySelector("#contextDialogMeta");
const contextDialogTitle = document.querySelector("#contextDialogTitle");
const contextDialogBody = document.querySelector("#contextDialogBody");
const contextCloseButton = document.querySelector("#contextCloseButton");

const panelLimits = {
  left: { min: 260, max: 520 },
  right: { min: 300, max: 720 },
};

loadPanelSizes();
setupPanelResizer(leftResizer, "left");
setupPanelResizer(rightResizer, "right");
renderIrrPairs();
renderHighlightControls();

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab, button);
  });
});

fileInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
  fileInput.value = "";
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  handleFiles(event.dataTransfer.files);
});

codebookInput.addEventListener("change", (event) => {
  handleCodebookFile(event.target.files[0]);
  codebookInput.value = "";
});

codebookDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  codebookDropZone.classList.add("is-dragging");
});

codebookDropZone.addEventListener("dragleave", () => {
  codebookDropZone.classList.remove("is-dragging");
});

codebookDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  codebookDropZone.classList.remove("is-dragging");
  handleCodebookFile(event.dataTransfer.files[0]);
});

saveCodesButton.addEventListener("click", () => {
  downloadCodeJson();
});

loadCodesInput.addEventListener("change", (event) => {
  handleSavedCodingFiles(event.target.files);
  loadCodesInput.value = "";
});

codebookSearchInput.addEventListener("input", (event) => {
  state.codebookSearch = event.target.value.trim().toLowerCase();
  state.codebookSearchActiveIndex = -1;
  renderCodebook();
});

codebookSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  event.preventDefault();
  moveCodebookSearchMatch(event.shiftKey ? -1 : 1);
});

codebookTree.addEventListener("click", (event) => {
  const evidenceButton = event.target.closest(".code-evidence-button");
  if (evidenceButton) {
    event.preventDefault();
    event.stopPropagation();
    showCodeEvidence(evidenceButton.dataset.codeKey);
    return;
  }

  const highlightButton = event.target.closest(".code-highlight-button");
  if (highlightButton) {
    event.preventDefault();
    event.stopPropagation();
    addHighlightAnnotation(highlightButton.dataset.codeKey);
    return;
  }

  const checkLabel = event.target.closest(".check-label");
  if (!checkLabel) return;
  const checkbox = checkLabel.querySelector(".code-check");
  if (!checkbox) return;

  event.preventDefault();
  event.stopPropagation();
  checkbox.checked = !checkbox.checked;
  toggleCodeCheck(checkbox.dataset.codeKey, checkbox.checked);
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  state.searchActiveIndex = -1;
  renderReader();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  event.preventDefault();
  moveTranscriptSearchMatch(event.shiftKey ? -1 : 1);
});

increaseText.addEventListener("click", () => {
  state.readerSize = Math.min(24, state.readerSize + 1);
  document.documentElement.style.setProperty("--reader-size", `${state.readerSize}px`);
});

decreaseText.addEventListener("click", () => {
  state.readerSize = Math.max(14, state.readerSize - 1);
  document.documentElement.style.setProperty("--reader-size", `${state.readerSize}px`);
});

transcriptPane.addEventListener("click", (event) => {
  const highlight = event.target.closest(".code-highlight");
  if (!highlight) return;

  removeHighlightAnnotation(highlight.dataset.annotationId);
});

transcriptPane.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const highlight = event.target.closest(".code-highlight");
  if (!highlight) return;

  event.preventDefault();
  removeHighlightAnnotation(highlight.dataset.annotationId);
});

irrPairCount.addEventListener("change", (event) => {
  state.irrPairCount = Number(event.target.value);
  renderIrrPairs();
  renderIrrResults();
});

irrPairGrid.addEventListener("change", (event) => {
  const input = event.target.closest('input[type="file"][data-interview][data-coder]');
  if (!input) return;

  handleIrrFile(Number(input.dataset.interview), input.dataset.coder, input.files[0]);
  input.value = "";
});

prevalenceFilesInput.addEventListener("change", (event) => {
  handlePrevalenceFiles(event.target.files);
  prevalenceFilesInput.value = "";
});

prevalenceDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  prevalenceDropZone.classList.add("is-dragging");
});

prevalenceDropZone.addEventListener("dragleave", () => {
  prevalenceDropZone.classList.remove("is-dragging");
});

prevalenceDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  prevalenceDropZone.classList.remove("is-dragging");
  handlePrevalenceFiles(event.dataTransfer.files);
});

exportPrevalenceButton.addEventListener("click", downloadPrevalenceCsv);

searchFilesInput.addEventListener("change", (event) => {
  handleSearchFiles(event.target.files);
  searchFilesInput.value = "";
});

searchDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  searchDropZone.classList.add("is-dragging");
});

searchDropZone.addEventListener("dragleave", () => {
  searchDropZone.classList.remove("is-dragging");
});

searchDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  searchDropZone.classList.remove("is-dragging");
  handleSearchFiles(event.dataTransfer.files);
});

multiSearchInput.addEventListener("input", (event) => {
  state.multiSearch = event.target.value.trim();
  renderMultiSearchResults();
});

multiSearchResults.addEventListener("click", (event) => {
  const snippetButton = event.target.closest(".search-snippet-button");
  if (!snippetButton) return;

  openTranscriptContext(snippetButton.dataset.docId, Number(snippetButton.dataset.matchIndex));
});

searchDocumentList.addEventListener("click", (event) => {
  const fileButton = event.target.closest(".search-file-open-button");
  if (!fileButton) return;

  openFullTranscriptContext(fileButton.dataset.docId);
});

contextCloseButton.addEventListener("click", () => {
  contextDialog.close();
});

contextDialog.addEventListener("click", (event) => {
  if (event.target === contextDialog) contextDialog.close();
});

function switchTab(panelId, selectedButton) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button === selectedButton);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === panelId);
  });

  const reviewMode = panelId === "codingPanel" && selectedButton?.dataset.workspaceMode === "review";
  appShell.classList.toggle("is-review-mode", reviewMode);
  appShell.setAttribute("data-workspace-mode", reviewMode ? "review" : "coding");
}

async function handleIrrFile(interviewIndex, coder, file) {
  if (!file) return;

  const status = document.querySelector(`#${coder === "coderA" ? "coderAStatus" : "coderBStatus"}${interviewIndex + 1}`);

  try {
    const contents = await file.text();
    const parsed = JSON.parse(contents);

    state.irrPairs[interviewIndex][coder] = {
      name: file.name,
      codes: normalizeCodeJson(parsed),
    };
    status.textContent = file.name;
    status.classList.remove("file-error");
  } catch (error) {
    state.irrPairs[interviewIndex][coder] = null;
    status.textContent = "Invalid JSON file";
    status.classList.add("file-error");
  }

  renderIrrResults();
}

function renderIrrPairs() {
  irrPairGrid.innerHTML = Array.from({ length: state.irrPairCount }, (_, index) => renderIrrPair(index)).join("");
}

function renderIrrPair(index) {
  const pair = state.irrPairs[index];
  const number = index + 1;
  const coderAStatus = pair.coderA?.name || "Upload exported codes";
  const coderBStatus = pair.coderB?.name || "Upload exported codes";

  return `
    <article class="irr-pair" data-interview="${index}">
      <h2>Interview ${number}</h2>
      <div class="irr-pair-files">
        <label class="drop-zone irr-drop" for="coderAInput${number}">
          <input id="coderAInput${number}" data-interview="${index}" data-coder="coderA" type="file" accept=".json,application/json">
          <span class="upload-icon" aria-hidden="true">+</span>
          <span class="drop-title">Coder A JSON</span>
          <span class="drop-detail" id="coderAStatus${number}">${escapeHtml(coderAStatus)}</span>
        </label>
        <label class="drop-zone irr-drop" for="coderBInput${number}">
          <input id="coderBInput${number}" data-interview="${index}" data-coder="coderB" type="file" accept=".json,application/json">
          <span class="upload-icon" aria-hidden="true">+</span>
          <span class="drop-title">Coder B JSON</span>
          <span class="drop-detail" id="coderBStatus${number}">${escapeHtml(coderBStatus)}</span>
        </label>
      </div>
    </article>
  `;
}

function normalizeCodeJson(value) {
  const source = value?.codes && typeof value.codes === "object" ? value.codes : value;

  if (!source || Array.isArray(source) || typeof source !== "object") {
    throw new Error("Expected a JSON object.");
  }

  return Object.entries(source).reduce((codes, [codeName, codeValue]) => {
    if (codeName.startsWith("__")) return codes;
    codes[codeName] = Number(codeValue) === 1 ? 1 : 0;
    return codes;
  }, {});
}

async function handlePrevalenceFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;

  const valid = [];
  const invalid = [];
  for (const file of files) {
    try {
      const parsed = JSON.parse(await file.text());
      const codes = normalizeCodeJson(parsed);
      if (!Object.keys(codes).length) throw new Error("No code values found.");
      const transcriptNamesByCode = new Map();
      const highlights = Array.isArray(parsed?.__highlights) ? parsed.__highlights : [];
      highlights.forEach((highlight) => {
        if (!highlight?.codeKey) return;
        if (!transcriptNamesByCode.has(highlight.codeKey)) {
          transcriptNamesByCode.set(highlight.codeKey, new Set());
        }
        transcriptNamesByCode.get(highlight.codeKey).add(transcriptNameFromCodedJson(file.name));
      });
      valid.push({ name: file.name, codes, transcriptNamesByCode });
    } catch {
      invalid.push(file.name);
    }
  }

  state.prevalenceFiles = valid;
  const allCodes = [...new Set(valid.flatMap((file) => Object.keys(file.codes)))];
  state.prevalenceRows = allCodes.map((code) => {
    const matchingFiles = valid.filter((file) => file.codes[code] === 1);
    const transcripts = [...new Set(matchingFiles.flatMap((file) => {
      const storedNames = [...(file.transcriptNamesByCode.get(code) || [])];
      return storedNames.length ? storedNames : [transcriptNameFromCodedJson(file.name)];
    }))].sort((a, b) => a.localeCompare(b));
    const count = matchingFiles.length;
    return { code, count, transcripts, prevalence: valid.length ? count / valid.length : 0 };
  }).sort((a, b) => b.prevalence - a.prevalence || a.code.localeCompare(b.code));

  prevalenceFileStatus.textContent = invalid.length
    ? `${valid.length} loaded · ${invalid.length} invalid`
    : `${valid.length} interview${valid.length === 1 ? "" : "s"} loaded`;
  prevalenceFileStatus.classList.toggle("file-error", !valid.length);
  exportPrevalenceButton.disabled = !valid.length;
  renderPrevalenceResults();
}

function renderPrevalenceResults() {
  if (!state.prevalenceFiles.length) {
    prevalenceResults.innerHTML = `
      <div class="empty-state small">
        <h3>No valid coded interviews loaded</h3>
        <p>Use JSON files exported from the Code Transcript tab.</p>
      </div>
    `;
    return;
  }

  const observed = state.prevalenceRows.filter((row) => row.count > 0).length;
  prevalenceResults.innerHTML = `
    <div class="irr-score-grid">
      <div class="score-card"><span>Interviews</span><strong>${state.prevalenceFiles.length}</strong></div>
      <div class="score-card"><span>Unique codes</span><strong>${state.prevalenceRows.length}</strong></div>
      <div class="score-card"><span>Codes observed</span><strong>${observed}</strong></div>
    </div>
    <div class="irr-table-wrap">
      <table class="irr-table prevalence-table">
        <thead><tr><th>Code</th><th>Interviews</th><th>Associated transcripts</th><th>Prevalence</th></tr></thead>
        <tbody>
          ${state.prevalenceRows.map((row) => `
            <tr>
              <td>${escapeHtml(row.code)}</td>
              <td>${row.count} of ${state.prevalenceFiles.length}</td>
              <td>
                ${row.transcripts.length
                  ? `<details class="transcript-associations">
                      <summary>${row.transcripts.length} transcript${row.transcripts.length === 1 ? "" : "s"}</summary>
                      <ul>${row.transcripts.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul>
                    </details>`
                  : `<span class="file-meta">None</span>`}
              </td>
              <td>
                <div class="prevalence-value">
                  <strong>${formatPercent(row.prevalence)}</strong>
                  <span><i style="width:${row.prevalence * 100}%"></i></span>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function downloadPrevalenceCsv() {
  if (!state.prevalenceRows.length) return;
  const csvValue = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["Code", "Interview count", "Total interviews", "Associated transcripts", "Prevalence"]]
    .concat(state.prevalenceRows.map((row) => [
      row.code,
      row.count,
      state.prevalenceFiles.length,
      row.transcripts.join("; "),
      formatPercent(row.prevalence),
    ]));
  const blob = new Blob([rows.map((row) => row.map(csvValue).join(",")).join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "code-prevalence.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

async function handleSearchFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;

  const parsedDocuments = await Promise.all(files.map(parseFile));
  state.searchDocuments = [...parsedDocuments, ...state.searchDocuments];
  multiSearchInput.disabled = !state.searchDocuments.some((doc) => doc.text && !doc.error);
  searchFileStatus.textContent = `${state.searchDocuments.length.toLocaleString()} transcript${state.searchDocuments.length === 1 ? "" : "s"} loaded`;
  searchFileStatus.classList.remove("file-error");
  renderSearchDocumentList();
  renderMultiSearchResults();
}

function renderSearchDocumentList() {
  searchFileCount.textContent = state.searchDocuments.length.toLocaleString();

  if (!state.searchDocuments.length) {
    searchDocumentList.innerHTML = "";
    return;
  }

  searchDocumentList.innerHTML = state.searchDocuments
    .map((doc) => `
      <li>
        <${doc.error ? "div" : "button type=\"button\""} class="search-file-card${doc.error ? " has-error" : " search-file-open-button"}"${doc.error ? "" : ` data-doc-id="${escapeHtml(doc.id)}"`}>
          <span class="file-name">${escapeHtml(doc.name)}</span>
          <span class="file-meta${doc.error ? " file-error" : ""}">
            ${doc.error ? escapeHtml(doc.error) : `${doc.type} · ${formatBytes(doc.size)} · ${doc.wordCount.toLocaleString()} words`}
          </span>
        </${doc.error ? "div" : "button"}>
      </li>
    `)
    .join("");
}

function renderMultiSearchResults() {
  const searchableDocs = state.searchDocuments.filter((doc) => doc.text && !doc.error);
  const query = state.multiSearch.trim();

  if (!state.searchDocuments.length) {
    multiSearchResults.innerHTML = `
      <div class="empty-state small">
        <h3>No interviews uploaded</h3>
        <p>Upload multiple transcripts, then search across every file at once.</p>
      </div>
    `;
    return;
  }

  if (!searchableDocs.length) {
    multiSearchResults.innerHTML = `
      <div class="empty-state small">
        <h3>No readable transcripts</h3>
        <p>The uploaded files could not be searched. Use TXT or DOCX transcripts.</p>
      </div>
    `;
    return;
  }

  if (!query) {
    multiSearchResults.innerHTML = `
      <div class="multi-search-summary">
        <div class="score-card"><span>Searchable interviews</span><strong>${searchableDocs.length.toLocaleString()}</strong></div>
        <div class="score-card"><span>Total words</span><strong>${searchableDocs.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()}</strong></div>
      </div>
      <div class="empty-state small">
        <h3>Enter a search term</h3>
        <p>Results will be grouped by interview with matching excerpts.</p>
      </div>
    `;
    return;
  }

  const results = searchableDocs
    .map((doc) => ({ doc, matches: buildDocumentSearchMatches(doc, query) }))
    .filter((result) => result.matches.length);
  const totalMatches = results.reduce((sum, result) => sum + result.matches.length, 0);

  if (!results.length) {
    multiSearchResults.innerHTML = `
      <div class="multi-search-summary">
        <div class="score-card"><span>Searchable interviews</span><strong>${searchableDocs.length.toLocaleString()}</strong></div>
        <div class="score-card"><span>Matches</span><strong>0</strong></div>
      </div>
      <div class="empty-state small">
        <h3>No matches</h3>
        <p>No uploaded interviews contain "${escapeHtml(query)}".</p>
      </div>
    `;
    return;
  }

  multiSearchResults.innerHTML = `
    <div class="multi-search-summary">
      <div class="score-card"><span>Interviews with matches</span><strong>${results.length.toLocaleString()}</strong></div>
      <div class="score-card"><span>Total matches</span><strong>${totalMatches.toLocaleString()}</strong></div>
      <div class="score-card"><span>Searched interviews</span><strong>${searchableDocs.length.toLocaleString()}</strong></div>
    </div>
    <div class="search-results-list">
      ${results.map((result) => `
        <article class="search-result-group">
          <header>
            <div>
              <h2>${escapeHtml(result.doc.name)}</h2>
              <span class="file-meta">${result.doc.type} · ${result.doc.wordCount.toLocaleString()} words</span>
            </div>
            <span class="checked-total">${result.matches.length.toLocaleString()} match${result.matches.length === 1 ? "" : "es"}</span>
          </header>
          <ol>
            ${result.matches.slice(0, 25).map((match) => `
              <li>
                <button type="button" class="search-snippet-button" data-doc-id="${escapeHtml(result.doc.id)}" data-match-index="${match.index}">
                  ${match.snippet}
                </button>
              </li>
            `).join("")}
          </ol>
          ${result.matches.length > 25 ? `<p class="file-meta">Showing first 25 matches.</p>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function buildDocumentSearchMatches(doc, query) {
  const pattern = new RegExp(escapeRegExp(query), "gi");
  const matches = [];
  let match;

  while ((match = pattern.exec(doc.text)) && matches.length < 100) {
    matches.push(renderSearchSnippet(doc.text, match.index, query));
    if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
  }

  return matches;
}

function renderSearchSnippet(text, index, query) {
  const context = 90;
  const start = Math.max(0, index - context);
  const end = Math.min(text.length, index + query.length + context);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  const snippet = `${prefix}${text.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
  return {
    index,
    snippet: highlight(escapeHtml(snippet), { query, seen: 0, activeIndex: 0 }),
  };
}

function openTranscriptContext(docId, matchIndex) {
  const doc = state.searchDocuments.find((item) => item.id === docId);
  const query = state.multiSearch.trim();

  if (!doc || !Number.isFinite(matchIndex)) return;

  contextDialogTitle.textContent = doc.name;
  contextDialogMeta.textContent = `${doc.type} transcript · ${doc.wordCount.toLocaleString()} words`;
  contextDialogBody.innerHTML = renderTranscriptContext(doc.text, matchIndex, query);
  contextDialog.showModal();
}

function openFullTranscriptContext(docId) {
  const doc = state.searchDocuments.find((item) => item.id === docId);
  if (!doc) return;

  contextDialogTitle.textContent = doc.name;
  contextDialogMeta.textContent = `${doc.type} transcript · ${doc.wordCount.toLocaleString()} words`;
  contextDialogBody.innerHTML = renderFullTranscriptContext(doc.text, state.multiSearch.trim());
  contextDialog.showModal();
}

function renderTranscriptContext(text, index, query) {
  const context = 900;
  const start = Math.max(0, index - context);
  const end = Math.min(text.length, index + query.length + context);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  const excerpt = `${prefix}${text.slice(start, end).trim()}${suffix}`;

  return highlight(escapeHtml(excerpt), { query, seen: 0, activeIndex: 0 }).replace(/\n/g, "<br>");
}

function renderFullTranscriptContext(text, query) {
  return highlight(escapeHtml(text.trim()), { query, seen: 0, activeIndex: 0 }).replace(/\n/g, "<br>");
}

function renderIrrResults() {
  const completePairs = state.irrPairs
    .slice(0, state.irrPairCount)
    .map((pair, index) => ({ ...pair, index }))
    .filter((pair) => pair.coderA && pair.coderB);

  if (!completePairs.length) {
    irrResults.innerHTML = `
      <div class="empty-state small">
        <h3>Upload Coder A and Coder B JSON files</h3>
        <p>Each completed interview pair is included in the overall IRR calculation.</p>
      </div>
    `;
    return;
  }

  const pairResults = completePairs.map((pair) => ({
    interview: pair.index + 1,
    coderAName: pair.coderA.name,
    coderBName: pair.coderB.name,
    metrics: calculateIrr(pair.coderA.codes, pair.coderB.codes),
  }));
  const overall = combineIrrMetrics(pairResults.map((result) => result.metrics));

  irrResults.innerHTML = `
    <div class="irr-score-grid">
      <div class="score-card">
        <span>Overall agreement</span>
        <strong>${formatPercent(overall.percentAgreement)}</strong>
      </div>
      <div class="score-card">
        <span>Overall kappa</span>
        <strong>${formatDecimal(overall.kappa)}</strong>
      </div>
      <div class="score-card">
        <span>Completed interviews</span>
        <strong>${completePairs.length.toLocaleString()}</strong>
      </div>
    </div>

    <div class="irr-table-wrap">
      <table class="irr-table">
        <thead>
          <tr>
            <th>Interview</th>
            <th>Agreement</th>
            <th>Kappa</th>
            <th>Codes</th>
            <th>A only</th>
            <th>B only</th>
          </tr>
        </thead>
        <tbody>
          ${pairResults
            .map((result) => `
              <tr>
                <td>Interview ${result.interview}</td>
                <td>${formatPercent(result.metrics.percentAgreement)}</td>
                <td>${formatDecimal(result.metrics.kappa)}</td>
                <td>${result.metrics.total.toLocaleString()}</td>
                <td>${result.metrics.coderAOnly.toLocaleString()}</td>
                <td>${result.metrics.coderBOnly.toLocaleString()}</td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="codebook-file">
      <span class="file-name">Overall comparison</span>
      <span class="file-meta">
        ${overall.total.toLocaleString()} code decisions •
        ${overall.bothPresent.toLocaleString()} both present •
        ${overall.bothAbsent.toLocaleString()} both absent
      </span>
    </div>
  `;
}

function calculateIrr(coderA, coderB) {
  const codeNames = [...new Set([...Object.keys(coderA), ...Object.keys(coderB)])];
  const total = codeNames.length;
  let bothPresent = 0;
  let bothAbsent = 0;
  let coderAOnly = 0;
  let coderBOnly = 0;

  codeNames.forEach((codeName) => {
    const a = coderA[codeName] === 1 ? 1 : 0;
    const b = coderB[codeName] === 1 ? 1 : 0;

    if (a === 1 && b === 1) bothPresent += 1;
    if (a === 0 && b === 0) bothAbsent += 1;
    if (a === 1 && b === 0) coderAOnly += 1;
    if (a === 0 && b === 1) coderBOnly += 1;
  });

  const agreement = bothPresent + bothAbsent;
  const percentAgreement = total ? agreement / total : 0;
  const coderAPresent = bothPresent + coderAOnly;
  const coderBPresent = bothPresent + coderBOnly;
  const coderAAbsent = bothAbsent + coderBOnly;
  const coderBAbsent = bothAbsent + coderAOnly;
  const expectedAgreement = total
    ? (coderAPresent / total) * (coderBPresent / total) + (coderAAbsent / total) * (coderBAbsent / total)
    : 0;
  const denominator = 1 - expectedAgreement;
  const kappa = denominator === 0 ? (percentAgreement === 1 ? 1 : 0) : (percentAgreement - expectedAgreement) / denominator;

  return {
    total,
    bothPresent,
    bothAbsent,
    coderAOnly,
    coderBOnly,
    percentAgreement,
    kappa,
  };
}

function combineIrrMetrics(metricsList) {
  const combined = metricsList.reduce(
    (total, metrics) => {
      total.bothPresent += metrics.bothPresent;
      total.bothAbsent += metrics.bothAbsent;
      total.coderAOnly += metrics.coderAOnly;
      total.coderBOnly += metrics.coderBOnly;
      return total;
    },
    { bothPresent: 0, bothAbsent: 0, coderAOnly: 0, coderBOnly: 0 }
  );

  return calculateKappaFromCounts(combined);
}

function calculateKappaFromCounts(counts) {
  const total = counts.bothPresent + counts.bothAbsent + counts.coderAOnly + counts.coderBOnly;
  const agreement = counts.bothPresent + counts.bothAbsent;
  const percentAgreement = total ? agreement / total : 0;
  const coderAPresent = counts.bothPresent + counts.coderAOnly;
  const coderBPresent = counts.bothPresent + counts.coderBOnly;
  const coderAAbsent = counts.bothAbsent + counts.coderBOnly;
  const coderBAbsent = counts.bothAbsent + counts.coderAOnly;
  const expectedAgreement = total
    ? (coderAPresent / total) * (coderBPresent / total) + (coderAAbsent / total) * (coderBAbsent / total)
    : 0;
  const denominator = 1 - expectedAgreement;
  const kappa = denominator === 0 ? (percentAgreement === 1 ? 1 : 0) : (percentAgreement - expectedAgreement) / denominator;

  return {
    ...counts,
    total,
    percentAgreement,
    kappa,
  };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "0.000";
}

function setupPanelResizer(handle, side) {
  if (!handle || !appShell) return;

  handle.addEventListener("pointerdown", (event) => {
    if (window.matchMedia("(max-width: 860px)").matches) return;

    const startX = event.clientX;
    const startWidth = getPanelSize(side);
    handle.setPointerCapture(event.pointerId);
    appShell.classList.add("is-resizing");

    const onPointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = side === "left" ? startWidth + delta : startWidth - delta;
      setPanelSize(side, nextWidth);
    };

    const onPointerUp = () => {
      appShell.classList.remove("is-resizing");
      savePanelSizes();
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
    };

    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);
  });

  handle.addEventListener("keydown", (event) => {
    const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!direction) return;

    event.preventDefault();
    const step = event.shiftKey ? 40 : 16;
    const nextWidth = side === "left" ? getPanelSize(side) + direction * step : getPanelSize(side) - direction * step;
    setPanelSize(side, nextWidth);
    savePanelSizes();
  });
}

function getPanelSize(side) {
  const variableName = side === "left" ? "--left-panel" : "--right-panel";
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName);
  return Number.parseFloat(value);
}

function setPanelSize(side, width) {
  const variableName = side === "left" ? "--left-panel" : "--right-panel";
  const limits = panelLimits[side];
  const availableWidth = Math.max(0, window.innerWidth - 440);
  const maxWidth = Math.min(limits.max, Math.max(limits.min, availableWidth));
  const clampedWidth = Math.min(Math.max(width, limits.min), maxWidth);

  document.documentElement.style.setProperty(variableName, `${clampedWidth}px`);
}

function savePanelSizes() {
  localStorage.setItem(
    "transcriptDashboardPanels",
    JSON.stringify({
      left: getPanelSize("left"),
      right: getPanelSize("right"),
    })
  );
}

function loadPanelSizes() {
  try {
    const saved = JSON.parse(localStorage.getItem("transcriptDashboardPanels") || "{}");
    if (Number.isFinite(saved.left)) {
      setPanelSize("left", saved.left);
    }
    if (Number.isFinite(saved.right)) {
      setPanelSize("right", saved.right);
    }
  } catch (error) {
    localStorage.removeItem("transcriptDashboardPanels");
  }
}

async function handleFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;

  const parsedDocuments = await Promise.all(files.map(parseFile));
  state.documents = [...parsedDocuments, ...state.documents];
  state.activeId = parsedDocuments[0]?.id ?? state.activeId;
  renderDocumentList();
  renderReader();
}

async function parseFile(file) {
  const id = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
  const extension = file.name.split(".").pop().toLowerCase();

  try {
    if (extension === "txt" || extension === "text") {
      const text = await file.text();
      return buildDocument({ id, file, text, type: "Text" });
    }

    if (extension === "docx") {
      if (!window.mammoth) {
        throw new Error("The Word document parser did not load. Check your internet connection and refresh.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return buildDocument({ id, file, text: result.value, type: "Word" });
    }

    return buildDocument({
      id,
      file,
      text: "",
      type: "Unsupported",
      error: "Legacy .doc files are binary Word files and cannot be read safely in this browser-only dashboard. Save it as .docx and upload again.",
    });
  } catch (error) {
    return buildDocument({
      id,
      file,
      text: "",
      type: extension.toUpperCase(),
      error: error.message || "This file could not be read.",
    });
  }
}

async function handleCodebookFile(file) {
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".csv")) {
    state.codebook = {
      name: file.name,
      error: "Upload a CSV file for the codebook.",
    };
    saveCodesButton.disabled = true;
    setSavedCodingImportEnabled(false);
    renderHighlightControls();
    renderCodebook();
    return;
  }

  try {
    const text = await file.text();
    state.codebook = parseCodebookCsv(text, file.name);
    state.checkedCodes.clear();
    state.annotations = [];
    state.codebookSearch = "";
    state.codebookSearchActiveIndex = -1;
    state.codebookSearchMatchKeys = [];
    codebookSearchInput.value = "";
    saveCodesButton.disabled = Boolean(state.codebook.error);
    setSavedCodingImportEnabled(!state.codebook.error);
    loadCodesStatus.textContent = state.codebook.error ? "Load a valid codebook first" : "Upload coded transcript JSON to restore codes and highlights";
    renderHighlightControls();
  } catch (error) {
    state.codebook = {
      name: file.name,
      error: error.message || "This CSV could not be read.",
    };
    saveCodesButton.disabled = true;
    setSavedCodingImportEnabled(false);
    renderHighlightControls();
  }

  renderCodebook();
  revealCodebookContent();
}

async function handleSavedCodingFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length || !state.codebook || state.codebook.error) return;

  const validCodes = new Set(collectCodeEntries(state.codebook.tree).map((code) => code.key));
  const mergedCodes = new Set(state.checkedCodes);
  const mergedAnnotations = [...state.annotations];
  const annotationKeys = new Set(mergedAnnotations.map(getAnnotationIdentity));
  const failedFiles = [];
  let addedExcerptCount = 0;

  for (const file of files) {
    try {
      const contents = await file.text();
      const savedProgress = JSON.parse(contents);
      const savedCodes = normalizeCodeJson(savedProgress);

      Object.entries(savedCodes)
        .filter(([codeName, value]) => value === 1 && validCodes.has(codeName))
        .forEach(([codeName]) => mergedCodes.add(codeName));

      parseSavedAnnotations(savedProgress, validCodes, file.name).forEach((annotation) => {
        const identity = getAnnotationIdentity(annotation);
        if (annotationKeys.has(identity)) return;
        annotationKeys.add(identity);
        mergedAnnotations.push(annotation);
        addedExcerptCount += 1;
      });
    } catch (error) {
      failedFiles.push(file.name);
    }
  }

  state.checkedCodes = mergedCodes;
  state.annotations = mergedAnnotations;
  state.evidenceIndexByCode.clear();
  const loadedCount = files.length - failedFiles.length;
  loadCodesStatus.textContent = failedFiles.length
    ? `Loaded ${loadedCount} of ${files.length} files; could not read: ${failedFiles.join(", ")}`
    : `Loaded ${loadedCount} coded transcript${loadedCount === 1 ? "" : "s"}; ${mergedCodes.size.toLocaleString()} codes and ${mergedAnnotations.length.toLocaleString()} highlighted excerpts (${addedExcerptCount.toLocaleString()} new)`;
  loadCodesStatus.classList.toggle("file-error", failedFiles.length > 0);
  renderCodebook();
  renderReader();
  renderHighlightControls();
}

function getAnnotationIdentity(annotation) {
  return [
    annotation.docName || annotation.docId || "",
    annotation.codeKey || "",
    annotation.text || "",
    annotation.occurrenceIndex ?? 0,
  ].join("\u001f");
}

function transcriptNameFromCodedJson(jsonFilename) {
  const base = String(jsonFilename)
    .split(/[\\/]/)
    .pop()
    .replace(/\.json$/i, "")
    .replace(/[-_ ](?:coded|codes|coding[-_ ]?progress)$/i, "");
  return `${base || "transcript"}.docx`;
}

function parseSavedAnnotations(savedProgress, validCodes, jsonFilename = "") {
  const highlights = Array.isArray(savedProgress?.__highlights)
    ? savedProgress.__highlights
    : Array.isArray(savedProgress?.highlights)
      ? savedProgress.highlights
      : [];

  return highlights
    .filter((annotation) => annotation?.text && annotation?.codeKey && validCodes.has(annotation.codeKey))
    .map((annotation) => ({
      id: annotation.id || crypto.randomUUID(),
      docId: annotation.docId || "",
      docName: jsonFilename ? transcriptNameFromCodedJson(jsonFilename) : annotation.docName || "",
      codeKey: annotation.codeKey,
      text: annotation.text,
      occurrenceIndex: Number.isInteger(annotation.occurrenceIndex) ? annotation.occurrenceIndex : 0,
      createdAt: annotation.createdAt || new Date().toISOString(),
    }));
}

function setSavedCodingImportEnabled(enabled) {
  loadCodesInput.disabled = !enabled;
  loadCodesLabel.classList.toggle("is-disabled", !enabled);
  loadCodesLabel.setAttribute("aria-disabled", String(!enabled));
  if (!enabled) {
    loadCodesStatus.textContent = "Load a codebook first";
  }
}

function parseCodebookCsv(text, name) {
  const parsedRows = parseCsv(text);
  const headers = (parsedRows[0] || []).map((header, index) => header.trim() || `Column ${index + 1}`);
  const displayColumns = getCodebookDisplayColumns(headers);
  const rawRows = parsedRows
    .slice(1)
    .map((row) => normalizeCsvRow(row, headers.length))
    .filter((row) => row.some((cell) => cell.trim()));
  const rows = inheritMergedCsvCells(rawRows);

  if (!headers.length || !rows.length) {
    return {
      name,
      headers,
      rows,
      tree: null,
      error: "This CSV needs a header row and at least one data row.",
    };
  }

  return {
    name,
    headers,
    displayHeaders: displayColumns.map((column) => column.header),
    displayColumnIndexes: displayColumns.map((column) => column.index),
    rows,
    tree: buildCodebookTree(rows, displayColumns),
    error: "",
  };
}

function getCodebookDisplayColumns(headers) {
  const columns = headers
    .map((header, index) => ({ header, index, key: normalizeHeaderName(header) }))
    .filter((column) => codebookColumnNames.has(column.key));

  return columns.length ? columns : headers.slice(0, 3).map((header, index) => ({ header, index }));
}

function normalizeHeaderName(header) {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  row.push(field.trim());
  if (row.some((cell) => cell)) {
    rows.push(row);
  }

  return rows;
}

function normalizeCsvRow(row, length) {
  return Array.from({ length }, (_, index) => row[index]?.trim() || "");
}

function inheritMergedCsvCells(rows) {
  const carriedValues = [];

  return rows.map((row) => {
    const filledRow = [...row];

    row.forEach((cell, columnIndex) => {
      const value = cell.trim();

      if (value) {
        if (carriedValues[columnIndex] && carriedValues[columnIndex] !== value) {
          carriedValues.fill("", columnIndex + 1);
        }

        carriedValues[columnIndex] = value;
        filledRow[columnIndex] = value;
        return;
      }

      filledRow[columnIndex] = carriedValues[columnIndex] || "";
    });

    return filledRow;
  });
}

function buildCodebookTree(rows, columns) {
  const root = { label: "Codebook", column: "", rows: [], children: new Map() };

  rows.forEach((row) => {
    let node = root;
    node.rows.push(row);

    columns.forEach(({ header, index }) => {
      const value = (row[index] || "").trim();

      if (!value) {
        return;
      }

      if (!node.children.has(value)) {
        node.children.set(value, {
          label: value,
          column: header,
          path: [...(node.path || []), `${header}: ${value}`],
          rows: [],
          children: new Map(),
        });
      }

      node = node.children.get(value);
      node.rows.push(row);
    });
  });

  sortTree(root);
  return root;
}

function collectCodeEntries(node, entries = []) {
  node.children.forEach((child) => {
    const key = encodeCodeKey(child.path || [child.label]);
    entries.push({
      key,
      name: child.label,
      column: child.column,
      path: child.path || [child.label],
    });
    collectCodeEntries(child, entries);
  });

  return entries;
}

function toggleCodeCheck(key, checked) {
  if (!key) return;

  if (checked) {
    markCodeChecked(key);
  } else {
    state.checkedCodes.delete(key);
  }

  renderCodebook();
}

function markCodeChecked(key) {
  state.checkedCodes.add(key);
  getParentCodeKeys(key).forEach((parentKey) => state.checkedCodes.add(parentKey));
}

function unmarkCodeChecked(key) {
  state.checkedCodes.delete(key);

  getParentCodeKeys(key)
    .filter((parentKey) => !hasCheckedChildCode(parentKey))
    .forEach((parentKey) => state.checkedCodes.delete(parentKey));
}

function hasCheckedChildCode(parentKey) {
  return [...state.checkedCodes].some((checkedKey) => checkedKey.startsWith(`${parentKey} > `));
}

function getParentCodeKeys(key) {
  const parts = key.split(" > ");
  if (parts.length <= 2) return [];

  return Array.from({ length: parts.length - 2 }, (_, index) => parts.slice(0, index + 2).join(" > "));
}

function sortTree(node) {
  node.children = new Map(
    [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
  );

  node.children.forEach(sortTree);
}

function buildDocument({ id, file, text, type, error = "" }) {
  const normalizedText = normalizeText(text);
  return {
    id,
    name: file.name,
    type,
    size: file.size,
    text: normalizedText,
    error,
    uploadedAt: new Date(),
    wordCount: countWords(normalizedText),
    lineCount: normalizedText ? normalizedText.split("\n").length : 0,
  };
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderDocumentList() {
  fileCount.textContent = state.documents.length;
  documentList.innerHTML = "";

  state.documents.forEach((doc) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `file-button${doc.id === state.activeId ? " is-active" : ""}`;
    button.addEventListener("click", () => {
      state.activeId = doc.id;
      renderDocumentList();
      renderReader();
      renderHighlightControls();
    });

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = doc.name;

    const meta = document.createElement("span");
    meta.className = `file-meta${doc.error ? " file-error" : ""}`;
    meta.textContent = doc.error ? "Needs attention" : `${doc.type} • ${formatBytes(doc.size)} • ${doc.wordCount.toLocaleString()} words`;

    button.append(name, meta);
    item.append(button);
    documentList.append(item);
  });
}

function renderReader() {
  const doc = state.documents.find((item) => item.id === state.activeId);

  if (!doc) {
    activeMeta.textContent = "No document selected";
    activeTitle.textContent = "Upload a transcript to begin";
    readerStats.innerHTML = "";
    transcriptPane.innerHTML = `
      <div class="empty-state">
        <h3>Readable transcript workspace</h3>
        <p>Uploaded files appear in the left rail. Select one to scroll through the transcript in this pane.</p>
      </div>
    `;
    return;
  }

  activeMeta.textContent = `${doc.type} transcript • ${formatBytes(doc.size)}`;
  activeTitle.textContent = doc.name;
  readerStats.innerHTML = `
    <span class="stat">${doc.wordCount.toLocaleString()} words</span>
    <span class="stat">${doc.lineCount.toLocaleString()} lines</span>
    <span class="stat">${formatTime(doc.uploadedAt)}</span>
  `;

  if (doc.error) {
    transcriptPane.innerHTML = `<div class="notice">${escapeHtml(doc.error)}</div>`;
    return;
  }

  if (!doc.text) {
    transcriptPane.innerHTML = `<div class="notice">This file did not contain readable text.</div>`;
    return;
  }

  const docAnnotations = getActiveDocumentAnnotations();
  const annotationTrackers = docAnnotations
    .map((annotation) => ({
      ...annotation,
      occurrenceIndex: Number.isInteger(annotation.occurrenceIndex) ? annotation.occurrenceIndex : 0,
      seen: 0,
      done: false,
    }))
    .sort((a, b) => b.text.length - a.text.length);
  const searchTracker = {
    query: state.search,
    seen: 0,
    activeIndex: state.searchActiveIndex,
  };
  const blocks = splitTranscript(doc.text)
    .map((block) => renderBlock(block, searchTracker, annotationTrackers))
    .join("");

  transcriptPane.innerHTML = `<div class="transcript">${blocks}</div>`;
  normalizeTranscriptSearchActiveIndex();
  renderHighlightControls();
}

function getActiveDocumentAnnotations() {
  const doc = state.documents.find((item) => item.id === state.activeId);
  if (!doc) return [];

  return state.annotations.filter((annotation) =>
    annotation.docId === doc.id || transcriptNamesMatch(annotation.docName, doc.name)
  );
}

function transcriptNamesMatch(savedName, uploadedName) {
  if (!savedName || !uploadedName) return false;
  const normalizedFilename = (name) => String(name)
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (normalizedFilename(savedName) === normalizedFilename(uploadedName)) return true;

  const interviewNumber = (name) => {
    const base = String(name).split(/[\\/]/).pop().replace(/\.[^.]+$/, "").toLowerCase();
    const labeled = base.match(/(?:participant|interviewee|interview|transcript|respondent|case|int|p|r)[\s_-]*(\d+)/i);
    if (labeled) return Number(labeled[1]);
    const numericOnly = base.match(/^0*(\d+)$/);
    return numericOnly ? Number(numericOnly[1]) : null;
  };
  const savedInterview = interviewNumber(savedName);
  const uploadedInterview = interviewNumber(uploadedName);
  return savedInterview !== null && savedInterview === uploadedInterview;
}

function moveTranscriptSearchMatch(direction) {
  if (!state.search) return;

  const matchCount = transcriptPane.querySelectorAll(".highlight").length;
  if (!matchCount) return;

  const currentIndex = state.searchActiveIndex < 0 ? (direction > 0 ? -1 : 0) : state.searchActiveIndex;
  state.searchActiveIndex = (currentIndex + direction + matchCount) % matchCount;
  renderReader();
  scrollActiveTranscriptSearchMatch();
}

function normalizeTranscriptSearchActiveIndex() {
  const matchCount = transcriptPane.querySelectorAll(".highlight").length;

  if (!matchCount) {
    state.searchActiveIndex = -1;
    return;
  }

  if (state.searchActiveIndex >= matchCount) {
    state.searchActiveIndex = matchCount - 1;
    renderReader();
  }
}

function scrollActiveTranscriptSearchMatch() {
  requestAnimationFrame(() => {
    transcriptPane.querySelector(".highlight.is-search-active")?.scrollIntoView({ block: "center" });
  });
}

function renderHighlightControls() {
  const hasCodebook = Boolean(state.codebook && !state.codebook.error);
  const hasDocument = Boolean(state.documents.find((item) => item.id === state.activeId));

  const count = getActiveDocumentAnnotations().length;
  highlightStatus.textContent = hasCodebook && hasDocument
    ? `${count.toLocaleString()} highlighted excerpts for this transcript`
    : "Select transcript text, then click Highlight on a code in the sidebar.";
}

function addHighlightAnnotation(codeKey) {
  const doc = state.documents.find((item) => item.id === state.activeId);
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || "";

  if (!doc || !codeKey) {
    highlightStatus.textContent = "Choose a transcript and code first.";
    highlightStatus.classList.add("file-error");
    return;
  }

  if (!selectedText || !transcriptPane.contains(selection.anchorNode) || !transcriptPane.contains(selection.focusNode)) {
    highlightStatus.textContent = "Select text inside the transcript first.";
    highlightStatus.classList.add("file-error");
    return;
  }

  const occurrenceIndex = getSelectedTextOccurrenceIndex(selectedText, selection);
  state.annotations.push({
    id: crypto.randomUUID(),
    docId: doc.id,
    docName: doc.name,
    codeKey,
    text: selectedText,
    occurrenceIndex,
    createdAt: new Date().toISOString(),
  });
  markCodeChecked(codeKey);
  selection.removeAllRanges();
  highlightStatus.classList.remove("file-error");
  highlightStatus.textContent = `Highlighted selected text and checked ${codeKey}`;
  renderCodebook();
  renderReader();
}

function removeHighlightAnnotation(annotationId) {
  if (!annotationId) return;

  const annotation = state.annotations.find((item) => item.id === annotationId);
  if (!annotation) return;

  state.annotations = state.annotations.filter((item) => item.id !== annotationId);
  unmarkCodeChecked(annotation.codeKey);
  highlightStatus.classList.remove("file-error");
  highlightStatus.textContent = `Removed highlight and unchecked ${annotation.codeKey}`;
  renderCodebook();
  renderReader();
}

function showCodeEvidence(codeKey) {
  const evidence = state.annotations.filter((annotation) => annotation.codeKey === codeKey);
  if (!evidence.length) return;

  const previousIndex = state.evidenceIndexByCode.get(codeKey) ?? -1;
  const index = (previousIndex + 1) % evidence.length;
  const annotation = evidence[index];
  const documentMatch = state.documents.find((doc) =>
    (annotation.docId && doc.id === annotation.docId) ||
    transcriptNamesMatch(annotation.docName, doc.name)
  );

  if (!documentMatch) {
    highlightStatus.textContent = annotation.docName
      ? `Upload ${annotation.docName} to view this highlighted excerpt.`
      : "Upload the matching transcript to view this highlighted excerpt.";
    highlightStatus.classList.add("file-error");
    return;
  }

  state.evidenceIndexByCode.set(codeKey, index);
  state.activeId = documentMatch.id;
  state.search = "";
  state.searchActiveIndex = -1;
  searchInput.value = "";
  renderDocumentList();
  renderReader();
  highlightStatus.classList.remove("file-error");
  highlightStatus.textContent = `Showing excerpt ${index + 1} of ${evidence.length} for ${codeKey}`;

  requestAnimationFrame(() => {
    const target = transcriptPane.querySelector(`[data-annotation-id="${CSS.escape(annotation.id)}"]`);
    target?.classList.add("is-evidence-active");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  });
}

function getSelectedTextOccurrenceIndex(selectedText, selection) {
  const range = selection.getRangeAt(0).cloneRange();
  const beforeRange = range.cloneRange();
  beforeRange.selectNodeContents(transcriptPane);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  return countWholeTextOccurrences(beforeRange.toString(), selectedText);
}

function countWholeTextOccurrences(text, phrase) {
  if (!phrase) return 0;

  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegExp(phrase)})(?=$|[^\\p{L}\\p{N}_])`, "gu");
  let count = 0;

  while (pattern.exec(text)) {
    count += 1;
  }

  return count;
}

function renderCodebook() {
  const codebook = state.codebook;
  codebookPanel?.classList.toggle("has-codebook", Boolean(codebook && !codebook.error));

  if (!codebook) {
    codebookSummary.innerHTML = "";
    codebookSearchInput.disabled = true;
    codebookSearchInput.value = "";
    state.codebookSearch = "";
    state.codebookSearchActiveIndex = -1;
    state.codebookSearchMatchKeys = [];
    codebookTree.innerHTML = `
      <div class="empty-state small">
        <h3>No codebook loaded</h3>
        <p>Upload a CSV to browse each column as nested dropdowns.</p>
      </div>
    `;
    return;
  }

  if (codebook.error) {
    codebookSummary.innerHTML = `<p class="file-meta file-error">${escapeHtml(codebook.name)}</p>`;
    codebookSearchInput.disabled = true;
    codebookTree.innerHTML = `<div class="notice">${escapeHtml(codebook.error)}</div>`;
    return;
  }

  codebookSearchInput.disabled = false;
  renderCodebookSummary();

  const rootColumn = codebook.displayHeaders[0] || "Dimensions";
  const search = state.codebookSearch;
  state.codebookSearchMatchKeys = search ? collectCodebookSearchMatches(codebook.tree, search).map((node) => encodeCodeKey(node.path || [node.label])) : [];
  if (state.codebookSearchActiveIndex >= state.codebookSearchMatchKeys.length) {
    state.codebookSearchActiveIndex = state.codebookSearchMatchKeys.length - 1;
  }
  const groups = [...codebook.tree.children.values()]
    .filter((node) => !search || nodeMatchesTree(node, search))
    .map((node) => renderTreeNode(node, 0, search))
    .join("");

  codebookTree.innerHTML = `
    <div class="tree-heading">${escapeHtml(rootColumn)}</div>
    <div class="tree-list">${groups || renderNoCodebookMatches(search)}</div>
  `;
}

function revealCodebookContent() {
  if (!codebookPanel) return;

  requestAnimationFrame(() => {
    const target = state.codebook && !state.codebook.error ? codebookTree : codebookPanel;
    target.scrollIntoView({ block: "start" });
  });
}

function renderCodebookSummary() {
  const codebook = state.codebook;
  if (!codebook || codebook.error) return;

  codebookSummary.innerHTML = `
    <div class="codebook-file">
      <span class="file-name">${escapeHtml(codebook.name)}</span>
      <span class="file-meta">${codebook.rows.length.toLocaleString()} rows • ${codebook.displayHeaders.length.toLocaleString()} displayed columns</span>
      <span class="checked-total">${state.checkedCodes.size.toLocaleString()} checked</span>
    </div>
    <div class="column-chain">${codebook.displayHeaders.map((header) => `<span>${escapeHtml(header)}</span>`).join("")}</div>
  `;
}

function downloadCodeJson() {
  const codebook = state.codebook;
  if (!codebook || codebook.error) return;

  const codeStatus = collectCodeEntries(codebook.tree).reduce((status, code) => {
    status[code.key] = state.checkedCodes.has(code.key) ? 1 : 0;
    return status;
  }, {});
  codeStatus.__highlights = state.annotations.map((annotation) => ({
    id: annotation.id,
    docId: annotation.docId,
    docName: annotation.docName,
    codeKey: annotation.codeKey,
    text: annotation.text,
    occurrenceIndex: annotation.occurrenceIndex ?? 0,
    createdAt: annotation.createdAt,
  }));
  const json = JSON.stringify(codeStatus, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  const requestedName = exportFileName.value.trim();
  const fallbackName = codebook.name.replace(/\.csv$/i, "");
  const fileName = slugify(requestedName || fallbackName) || "codebook";

  link.download = `${fileName}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderTreeNode(node, depth, search = "") {
  const childNodes = [...node.children.values()];
  const nodeMatches = Boolean(search && nodeMatchesQuery(node, search));
  const visibleChildren = search && !nodeMatches ? childNodes.filter((child) => nodeMatchesTree(child, search)) : childNodes;
  const isLeaf = childNodes.length === 0;
  const leafContent = isLeaf ? renderLeafRows(node.rows) : visibleChildren.map((child) => renderTreeNode(child, depth + 1, search)).join("");
  const codeKey = encodeCodeKey(node.path || [node.label]);
  const checked = state.checkedCodes.has(codeKey) ? " checked" : "";
  const evidenceCount = state.annotations.filter((annotation) => annotation.codeKey === codeKey).length;
  const open = search || depth <= 1 ? " open" : "";
  const activeKey = state.codebookSearchMatchKeys[state.codebookSearchActiveIndex];
  const searchClass = nodeMatches ? " is-search-match" : "";
  const activeClass = search && codeKey === activeKey ? " is-search-active" : "";
  const searchMatchAttribute = nodeMatches ? ' data-search-match="true"' : "";
  const labelMarkup = depth === 0
    ? `
          <span class="check-label is-static">
            <span class="code-label-text">
              <strong>${highlightSearchMatch(node.label, search)}</strong>
              <small>${highlightSearchMatch(node.column, search)}</small>
            </span>
          </span>
        `
    : `
          <label class="check-label" title="Mark this code as appearing in the transcript">
            <input class="code-check" type="checkbox" data-code-key="${escapeHtml(codeKey)}"${checked}>
            <span class="checkmark" aria-hidden="true"></span>
            <span class="code-label-text">
              <strong>${highlightSearchMatch(node.label, search)}</strong>
              <small>${highlightSearchMatch(node.column, search)}</small>
            </span>
          </label>
        `;

  return `
    <details class="tree-node depth-${Math.min(depth, 4)}${searchClass}${activeClass}"${searchMatchAttribute}${open}>
      <summary>
        ${labelMarkup}
        <span class="tree-summary-actions">
          ${evidenceCount ? `<button type="button" class="code-evidence-button" data-code-key="${escapeHtml(codeKey)}" title="Show this code's highlighted transcript evidence">View ${evidenceCount}</button>` : ""}
          <button type="button" class="code-highlight-button" data-code-key="${escapeHtml(codeKey)}" title="Attach selected transcript text to this code">Highlight</button>
          <em>${node.rows.length.toLocaleString()}</em>
          <span class="chevron" aria-hidden="true"></span>
        </span>
      </summary>
      <div class="tree-children">${leafContent}</div>
    </details>
  `;
}

function nodeMatchesTree(node, search) {
  return nodeMatchesQuery(node, search) || [...node.children.values()].some((child) => nodeMatchesTree(child, search));
}

function nodeMatchesQuery(node, search) {
  return [node.label, node.column, ...(node.path || [])].some((value) => value.toLowerCase().includes(search));
}

function collectCodebookSearchMatches(node, search, matches = []) {
  node.children.forEach((child) => {
    if (nodeMatchesQuery(child, search)) {
      matches.push(child);
    }
    collectCodebookSearchMatches(child, search, matches);
  });

  return matches;
}

function moveCodebookSearchMatch(direction) {
  if (!state.codebook || !state.codebookSearch) return;

  const matches = collectCodebookSearchMatches(state.codebook.tree, state.codebookSearch);
  state.codebookSearchMatchKeys = matches.map((node) => encodeCodeKey(node.path || [node.label]));
  if (!state.codebookSearchMatchKeys.length) return;

  const currentIndex = state.codebookSearchActiveIndex < 0 ? (direction > 0 ? -1 : 0) : state.codebookSearchActiveIndex;
  state.codebookSearchActiveIndex = (currentIndex + direction + state.codebookSearchMatchKeys.length) % state.codebookSearchMatchKeys.length;
  renderCodebook();
  scrollActiveCodebookSearchMatch();
}

function scrollActiveCodebookSearchMatch() {
  requestAnimationFrame(() => {
    codebookTree.querySelector(".tree-node.is-search-active")?.scrollIntoView({ block: "center" });
  });
}

function highlightSearchMatch(value, search) {
  const escapedValue = escapeHtml(value);
  if (!search) return escapedValue;

  const pattern = new RegExp(escapeRegExp(search), "gi");
  return escapedValue.replace(pattern, (match) => `<mark class="search-hit">${match}</mark>`);
}

function renderNoCodebookMatches(search) {
  return `
    <div class="empty-state small">
      <h3>No matching codes</h3>
      <p>No dimensions, codes, or subcodes match "${escapeHtml(search)}".</p>
    </div>
  `;
}

function renderLeafRows(rows) {
  if (!rows.length || !state.codebook?.displayHeaders) return "";

  return rows
    .map((row) => `
      <dl class="codebook-record">
        ${state.codebook.displayHeaders
          .map((header, index) => ({ header, value: row[state.codebook.displayColumnIndexes[index]] || "" }))
          .filter((item) => item.value.trim())
          .map((header, index) => `
            <div>
              <dt>${escapeHtml(header.header)}</dt>
              <dd>${escapeHtml(header.value)}</dd>
            </div>
          `)
          .join("")}
      </dl>
    `)
    .join("");
}

function encodeCodeKey(path) {
  return path.join(" > ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitTranscript(text) {
  const blocks = [];
  const paragraphLines = [];

  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    const speakerMatch = trimmed.match(/^([A-Z][A-Za-z0-9 .'-]{0,42}):\s*(.*)$/);

    if (!trimmed) {
      flushParagraph(paragraphLines, blocks);
      return;
    }

    if (speakerMatch) {
      flushParagraph(paragraphLines, blocks);
      blocks.push({ speaker: speakerMatch[1], text: speakerMatch[2].trim() });
      return;
    }

    paragraphLines.push(trimmed);
  });

  flushParagraph(paragraphLines, blocks);
  return blocks.filter((block) => block.text || block.speaker);
}

function flushParagraph(lines, blocks) {
  if (!lines.length) return;
  blocks.push({ speaker: "", text: lines.join(" ") });
  lines.length = 0;
}

function renderBlock(block, searchTracker, annotations = []) {
  const annotatedBody = applyAnnotationHighlights(escapeHtml(block.text), annotations);
  const body = highlight(annotatedBody, searchTracker);

  if (block.speaker) {
    return `<p class="speaker">${escapeHtml(block.speaker)}</p><p>${body}</p>`;
  }

  return `<p>${body.replace(/\n/g, "<br>")}</p>`;
}

function applyAnnotationHighlights(text, annotations) {
  return annotations
    .filter((annotation) => annotation.text)
    .reduce((html, annotation) => {
      if (annotation.done) return html;

      const escapedText = escapeRegExp(escapeHtml(annotation.text));
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapedText})(?=$|[^\\p{L}\\p{N}_])`, "gu");
      const title = escapeHtml(annotation.codeKey);
      const annotationId = escapeHtml(annotation.id);
      return html.replace(pattern, (match, prefix, phrase) => {
        if (annotation.done) return match;

        if (annotation.seen === annotation.occurrenceIndex) {
          annotation.done = true;
          return `${prefix}<mark class="code-highlight" data-annotation-id="${annotationId}" role="button" tabindex="0" title="Click to unhighlight ${title}">${phrase}</mark>`;
        }

        annotation.seen += 1;
        return match;
      });
    }, text);
}

function highlight(text, searchTracker) {
  if (!searchTracker?.query) return text;

  const escapedQuery = escapeRegExp(searchTracker.query);
  const pattern = new RegExp(`(${escapedQuery})`, "gi");
  return text.replace(pattern, (match) => {
    const activeClass = searchTracker.seen === searchTracker.activeIndex ? " is-search-active" : "";
    searchTracker.seen += 1;
    return `<mark class="highlight${activeClass}">${match}</mark>`;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function countWords(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
