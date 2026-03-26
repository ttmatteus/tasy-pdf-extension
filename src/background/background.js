
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.storage.local.get({
      extEnabled: true,
      doubleBuffer: true,
      prefetch: true,
      spotlightSearch: true,
      reportTypes: ['CMCZ', 'WCTB', 'WMAN', 'W', 'WFIN', 'WPLS']
    }, (prefs) => {
      // Filtro básico de URL para evitar injetar em sites como Google, Facebook, GitHub, etc.
      // Se a extensão estiver desativada pelo menu, não injeta nada
      const url = tab.url.toLowerCase();
      const isPotentialTasy = url.includes('tasy') || url.includes('philips') || url.includes(':80') || url.includes(':443') || url.includes('localhost') || url.includes('127.0.0.1');
      
      if (!prefs.extEnabled || !isPotentialTasy) return;

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
            'src/injected/ui/constants/icons.js',
            'src/injected/ui/state.js',
            'src/injected/ui/styles.js',
            'src/injected/ui/components/toasts.js',
            'src/injected/ui/services/previewService.js',
            'src/injected/ui/services/exportService.js',
            'src/injected/ui/components/navbar.js',
            'src/injected/ui/components/spotlight.js',
            'src/injected/ui/components/bands.js',
            'src/injected/ui/components/fields.js',
            'src/injected/ui/components/fieldForm.js',
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
