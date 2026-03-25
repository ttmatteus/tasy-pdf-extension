document.addEventListener('DOMContentLoaded', () => {
  const extEnabled = document.getElementById('extEnabled');
  const doubleBuffer = document.getElementById('doubleBuffer');
  const prefetch = document.getElementById('prefetch');
  const spotlightSearch = document.getElementById('spotlightSearch');
  const reloadWarning = document.getElementById('reload-warning');
  const historyList = document.getElementById('historyList');
  const pillsContainer = document.getElementById('pillsContainer');
  const newFlagInput = document.getElementById('newFlagInput');
  const addFlagBtn = document.getElementById('addFlagBtn');

  const DEFAULT_TYPES = ['CMCZ', 'WCTB', 'WMAN', 'W', 'WFIN', 'WPLS'];

  function showReload() {
    if (reloadWarning) reloadWarning.style.display = 'block';
  }

  function saveReportTypes(types) {
    chrome.storage.local.set({ reportTypes: types }, showReload);
  }

  function renderPills(types) {
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';
    if (types.length === 0) {
      pillsContainer.innerHTML = '<span style="color:var(--text-muted);font-size:12px;font-style:italic;">Nenhuma flag ativa</span>';
      return;
    }
    types.forEach((t, idx) => {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.title = idx === 0 ? 'Tipo padrão (primeiro da lista)' : '';
      pill.innerHTML = `${idx === 0 ? '★ ' : ''}${t}<button class="pill-remove" data-type="${t}" title="Remover ${t}">✕</button>`;
      pillsContainer.appendChild(pill);
    });
    pillsContainer.querySelectorAll('.pill-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        chrome.storage.local.get({ reportTypes: DEFAULT_TYPES }, (prefs) => {
          const updated = prefs.reportTypes.filter(t => t !== type);
          saveReportTypes(updated);
          renderPills(updated);
        });
      });
    });
  }

  function addFlag() {
    const val = (newFlagInput.value || '').trim().toUpperCase();
    if (!val) return;
    chrome.storage.local.get({ reportTypes: DEFAULT_TYPES }, (prefs) => {
      if (prefs.reportTypes.includes(val)) {
        newFlagInput.value = '';
        newFlagInput.style.borderColor = 'rgba(245,158,11,0.6)';
        setTimeout(() => { newFlagInput.style.borderColor = ''; }, 1200);
        return;
      }
      const updated = [...prefs.reportTypes, val];
      saveReportTypes(updated);
      renderPills(updated);
      newFlagInput.value = '';
    });
  }

  chrome.storage.local.get({
    extEnabled: true,
    doubleBuffer: true,
    prefetch: true,
    spotlightSearch: true,
    reportTypes: DEFAULT_TYPES,
    pdfHistory: []
  }, (prefs) => {
    if (extEnabled) extEnabled.checked = prefs.extEnabled;
    if (doubleBuffer) doubleBuffer.checked = prefs.doubleBuffer;
    if (prefetch) prefetch.checked = prefs.prefetch;
    if (spotlightSearch) spotlightSearch.checked = prefs.spotlightSearch;

    renderPills(prefs.reportTypes);

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
    chrome.storage.local.set({ [key]: value }, showReload);
  }

  if (extEnabled) extEnabled.addEventListener('change', saveOnChange);
  if (doubleBuffer) doubleBuffer.addEventListener('change', saveOnChange);
  if (prefetch) prefetch.addEventListener('change', saveOnChange);
  if (spotlightSearch) spotlightSearch.addEventListener('change', saveOnChange);

  if (addFlagBtn) addFlagBtn.addEventListener('click', addFlag);
  if (newFlagInput) {
    newFlagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addFlag(); });
    newFlagInput.addEventListener('input', () => {
      newFlagInput.value = newFlagInput.value.toUpperCase();
    });
  }
});

