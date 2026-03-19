// Injeta o script em todas as abas quando navegam
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.storage.local.get({
      extEnabled: true,
      doubleBuffer: true,
      prefetch: true
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
          files: ['injected.js'],
          world: 'MAIN'  
        }).catch(() => {});
      }).catch(() => {});
    });
  }
});
