document.addEventListener('DOMContentLoaded', () => {
  const extEnabled = document.getElementById('extEnabled');
  const doubleBuffer = document.getElementById('doubleBuffer');
  const prefetch = document.getElementById('prefetch');
  const reloadWarning = document.getElementById('reload-warning');

  // Load existing settings
  chrome.storage.local.get({
    extEnabled: true,
    doubleBuffer: true,
    prefetch: true
  }, (prefs) => {
    extEnabled.checked = prefs.extEnabled;
    doubleBuffer.checked = prefs.doubleBuffer;
    prefetch.checked = prefs.prefetch;
  });

  // Function to save and show warning
  function saveOnChange(e) {
    const key = e.target.id;
    const value = e.target.checked;
    chrome.storage.local.set({ [key]: value }, () => {
      reloadWarning.style.display = 'block';
    });
  }

  // Attach listeners
  extEnabled.addEventListener('change', saveOnChange);
  doubleBuffer.addEventListener('change', saveOnChange);
  prefetch.addEventListener('change', saveOnChange);
});
