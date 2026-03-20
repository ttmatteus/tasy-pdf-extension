document.addEventListener('DOMContentLoaded', () => {
  const extEnabled = document.getElementById('extEnabled');
  const doubleBuffer = document.getElementById('doubleBuffer');
  const prefetch = document.getElementById('prefetch');
  const spotlightSearch = document.getElementById('spotlightSearch');
  const reloadWarning = document.getElementById('reload-warning');
  const historyList = document.getElementById('historyList');

  chrome.storage.local.get({
    extEnabled: true,
    doubleBuffer: true,
    prefetch: true,
    spotlightSearch: true,
    pdfHistory: []
  }, (prefs) => {
    if (extEnabled) extEnabled.checked = prefs.extEnabled;
    if (doubleBuffer) doubleBuffer.checked = prefs.doubleBuffer;
    if (prefetch) prefetch.checked = prefs.prefetch;
    if (spotlightSearch) spotlightSearch.checked = prefs.spotlightSearch;

    if (historyList) {
      if (!prefs.pdfHistory || prefs.pdfHistory.length === 0) {
        historyList.innerHTML = '<li style="color:var(--text-muted); font-size:12px; text-align:center;">Nenhum relatório na sessão.</li>';
      } else {
        historyList.innerHTML = prefs.pdfHistory.map(item => `
          <li>
            <a href="${item.url}" target="_blank">
              <span>${item.code || 'DOC'}</span>
              <span class="hist-date">${item.date}</span>
            </a>
          </li>
        `).join('');
      }
    }
  });

  function saveOnChange(e) {
    if (!e.target) return;
    const key = e.target.id;
    const value = e.target.checked;
    chrome.storage.local.set({ [key]: value }, () => {
      if (reloadWarning) reloadWarning.style.display = 'block';
    });
  }

  if (extEnabled) extEnabled.addEventListener('change', saveOnChange);
  if (doubleBuffer) doubleBuffer.addEventListener('change', saveOnChange);
  if (prefetch) prefetch.addEventListener('change', saveOnChange);
  if (spotlightSearch) spotlightSearch.addEventListener('change', saveOnChange);
});
