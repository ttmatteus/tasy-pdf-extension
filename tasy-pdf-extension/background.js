// Injeta o script em todas as abas quando navegam
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['injected.js'],
      world: 'MAIN'  
    }).catch(() => {});
  }
});
