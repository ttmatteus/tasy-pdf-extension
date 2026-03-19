document.addEventListener('DOMContentLoaded', () => {
  const extEnabled = document.getElementById('extEnabled');
  const doubleBuffer = document.getElementById('doubleBuffer');
  const prefetch = document.getElementById('prefetch');
  const reloadWarning = document.getElementById('reload-warning');

  // Carrega as configurações existentes
  chrome.storage.local.get({
    extEnabled: true,
    doubleBuffer: true,
    prefetch: true
  }, (prefs) => {
    extEnabled.checked = prefs.extEnabled;
    doubleBuffer.checked = prefs.doubleBuffer;
    prefetch.checked = prefs.prefetch;
  });

  // Função para salvar e exibir aviso de recarregamento
  function saveOnChange(e) {
    const key = e.target.id;
    const value = e.target.checked;
    chrome.storage.local.set({ [key]: value }, () => {
      reloadWarning.style.display = 'block';
    });
  }

  // Adiciona os ouvintes de eventos
  extEnabled.addEventListener('change', saveOnChange);
  doubleBuffer.addEventListener('change', saveOnChange);
  prefetch.addEventListener('change', saveOnChange);
});
