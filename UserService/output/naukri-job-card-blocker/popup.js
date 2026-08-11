const STORAGE_KEY = "naukriJobCardBlocker.items";
const ENABLED_KEY = "naukriJobCardBlocker.enabled";
const STATS_KEY = "naukriJobCardBlocker.stats";

const input = document.getElementById("blockText");
const addButton = document.getElementById("addButton");
const list = document.getElementById("blockList");
const emptyState = document.getElementById("emptyState");
const enabledToggle = document.getElementById("enabled");
const rescanButton = document.getElementById("rescanButton");
const clearButton = document.getElementById("clearButton");
const status = document.getElementById("status");

let items = [];
let enabled = true;
let stats = null;

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function displayValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueItems(values) {
  const seen = new Set();
  return values
    .map(displayValue)
    .filter(Boolean)
    .filter((value) => {
      const key = normalize(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function save() {
  chrome.storage.local.set({
    [STORAGE_KEY]: items,
    [ENABLED_KEY]: enabled
  });
}

function requestScan() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id || !/https?:\/\/(www\.)?naukri\.com\//i.test(tab.url || "")) {
      updateStatus();
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "NAUKRI_BLOCKER_SCAN" }, () => {
      chrome.runtime.lastError;
    });
  });
}

function addItem() {
  const next = displayValue(input.value);
  if (!next) return;

  items = uniqueItems([...items, next]);
  input.value = "";
  save();
  render();
  requestScan();
  input.focus();
}

function removeItem(index) {
  items = items.filter((_, currentIndex) => currentIndex !== index);
  save();
  render();
  requestScan();
}

function clearItems() {
  items = [];
  save();
  render();
  requestScan();
}

function render() {
  enabledToggle.checked = enabled;
  list.innerHTML = "";

  items.forEach((item, index) => {
    const row = document.createElement("li");
    const label = document.createElement("span");
    const remove = document.createElement("button");

    label.textContent = item;
    label.title = item;
    remove.className = "remove";
    remove.type = "button";
    remove.title = `Remove ${item}`;
    remove.textContent = "×";
    remove.addEventListener("click", () => removeItem(index));

    row.append(label, remove);
    list.appendChild(row);
  });

  emptyState.classList.toggle("visible", items.length === 0);
  updateStatus();
}

function updateStatus() {
  if (!enabled) {
    status.textContent = "Paused. Cards are visible.";
    return;
  }

  if (stats && Number.isFinite(stats.hidden) && Number.isFinite(stats.total)) {
    status.textContent = `Hidden ${stats.hidden}/${stats.total} visible job cards.`;
    return;
  }

  status.textContent = items.length
    ? "Filters saved. Open or refresh a Naukri search page."
    : "Open a Naukri search page and add keywords.";
}

addButton.addEventListener("click", addItem);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addItem();
});

enabledToggle.addEventListener("change", () => {
  enabled = enabledToggle.checked;
  save();
  render();
  requestScan();
});

rescanButton.addEventListener("click", requestScan);
clearButton.addEventListener("click", clearItems);

chrome.storage.local.get([STORAGE_KEY, ENABLED_KEY, STATS_KEY], (result) => {
  items = uniqueItems(Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []);
  enabled = typeof result[ENABLED_KEY] === "boolean" ? result[ENABLED_KEY] : true;
  stats = result[STATS_KEY] || null;
  render();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STATS_KEY]) return;
  stats = changes[STATS_KEY].newValue || null;
  updateStatus();
});
