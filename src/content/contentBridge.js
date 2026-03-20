
window.addEventListener('message', (event) => {

  if (event.source !== window) return;

  if (event.data && event.data.type === 'TASY_PDF_HISTORY_ADD') {
    const payload = event.data.payload;

    // Converte URL relativa do Tasy para absoluta
    if (payload.url && payload.url.startsWith('/')) {
      payload.url = window.location.origin + payload.url;
    }

    chrome.storage.local.get({ pdfHistory: [] }, (res) => {
      let history = res.pdfHistory;
      history.unshift(payload);

      // Mantém os top 8 mais recentes
      if (history.length > 8) {
        history = history.slice(0, 8);
      }

      chrome.storage.local.set({ pdfHistory: history });
    });
  }

  if (event.data && event.data.type === 'TASY_PDF_HISTORY_GET') {
    chrome.storage.local.get({ pdfHistory: [] }, (res) => {
      window.postMessage({
        type: 'TASY_PDF_HISTORY_DATA',
        payload: res.pdfHistory
      }, '*');
    });
  }

  if (event.data && event.data.type === 'TASY_PDF_HISTORY_CLEAR') {
    chrome.storage.local.set({ pdfHistory: [] });
  }
});

// Listen to Extension Popup commands
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TASY_REQUEST_MANUAL_PREVIEW') {
      window.postMessage({ type: 'TASY_MANUAL_PREVIEW', code: request.code }, '*');
    }
  });
}
