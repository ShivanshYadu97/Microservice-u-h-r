const CLOSE_REASON_KEY = "naukriCompanySiteTabCloser.lastClose";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "NAUKRI_CLOSE_COMPANY_SITE_TAB") return false;

  const tab = sender.tab;
  if (!tab || !tab.id || !/^https:\/\/(www\.)?naukri\.com\//i.test(tab.url || "")) {
    sendResponse({ ok: false, reason: "not-a-naukri-tab" });
    return false;
  }

  chrome.storage.local.set({
    [CLOSE_REASON_KEY]: {
      url: tab.url,
      matchedText: message.matchedText || "Apply on company site",
      closedAt: Date.now()
    }
  });

  chrome.tabs.remove(tab.id, () => {
    sendResponse({
      ok: !chrome.runtime.lastError,
      reason: chrome.runtime.lastError ? chrome.runtime.lastError.message : "closed"
    });
  });

  return true;
});
