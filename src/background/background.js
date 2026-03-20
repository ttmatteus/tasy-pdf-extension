
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.storage.local.get({
      extEnabled: true,
      doubleBuffer: true,
      prefetch: true,
      spotlightSearch: true
    }, (prefs) => {
      // Se a extensão estiver desativada pelo menu, não injeta nada
      if (!prefs.extEnabled) return;

      // Injeta as preferências no escopo da página antes de rodar a lógica oficial
      chrome.scripting.executeScript({
        target: { tabId },
        func: (preferences) => { window.__tasyPdfPrefs = preferences; },
        args: [prefs],
        world: 'MAIN'
      }).then(() => {
        chrome.scripting.executeScript({
          target: { tabId },
          files: [
            'src/injected/pdfService.js',
            'src/injected/uiManager.js',
            'src/injected/httpInterceptor.js',
            'src/injected/core.js'
          ],
          world: 'MAIN'
        }).catch(() => { });
      }).catch(() => { });
    });
  }
});
