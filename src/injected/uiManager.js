window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
   let previewWindow = null;
   let ghostField = null;
   let ghostScale = 1.2;

   ctx.updateGhostField = () => { };
   ctx.removeGhostField = () => { };

   ctx.updateOrOpenPreview = function (pdfUrl) {
      const iframeA = document.getElementById('tasy-pdf-iframe-A');
      const iframeB = document.getElementById('tasy-pdf-iframe-B');

      if (iframeA && iframeB && iframeA.offsetParent !== null) {
         const isAVisible = iframeA.style.opacity !== '0';
         const activeIframe = isAVisible ? iframeA : iframeB;
         const hiddenIframe = isAVisible ? iframeB : iframeA;

         const loader = document.getElementById('tasy-pdf-loading');
         const badge = document.getElementById('tasy-sync-badge');

         if (badge && (!loader || loader.style.display === 'none')) {
            badge.style.opacity = '1';
            badge.style.transform = 'translateY(0)';
         }

         hiddenIframe.onload = () => {
            hiddenIframe.style.opacity = '1';
            hiddenIframe.style.zIndex = '2';
            activeIframe.style.opacity = '0';
            activeIframe.style.zIndex = '1';

            if (loader) loader.style.display = 'none';
            if (badge) {
               badge.style.opacity = '0';
               badge.style.transform = 'translateY(-10px)';
            }
         };
         hiddenIframe.src = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
         return;
      }

      const windowName = '__pdf_preview__';

      const isWindowUsable = () => {
         try {
            return previewWindow && !previewWindow.closed && previewWindow.document;
         } catch (e) {
            return false;
         }
      };

      if (!ctx.prefs.doubleBuffer) {
         if (!isWindowUsable()) {
            previewWindow = window.open(pdfUrl, windowName, 'width=1100,height=900');
         } else {
            try {
               previewWindow.location.replace(pdfUrl);
               previewWindow.focus();
            } catch (e) {
               previewWindow = window.open(pdfUrl, windowName, 'width=1100,height=900');
            }
         }
         return;
      }

      if (!isWindowUsable()) {
         previewWindow = window.open('', windowName, 'width=1100,height=900');

         const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Live Preview Tasy</title>
          <style>
            body { margin: 0; overflow: hidden; background: #525659; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe id="frame1" style="z-index: 2;" src="${pdfUrl}"></iframe>
          <iframe id="frame2" style="z-index: 1;"></iframe>
        </body>
        </html>
      `;

         try {
            previewWindow.document.open();
            previewWindow.document.write(html);
            previewWindow.document.close();
            previewWindow.activeFrame = 1;
         } catch (e) {
            previewWindow.location.replace(pdfUrl);
         }
         return;
      }

      try {
         const doc = previewWindow.document;
         const nextFrameNo = previewWindow.activeFrame === 1 ? 2 : 1;
         const currentFrameNo = previewWindow.activeFrame;

         const nextFrame = doc.getElementById('frame' + nextFrameNo);
         const currentFrame = doc.getElementById('frame' + currentFrameNo);

         if (!nextFrame || !currentFrame) {
            previewWindow.location.replace(pdfUrl);
            return;
         }

         nextFrame.onload = function () {
            nextFrame.style.zIndex = 2;
            currentFrame.style.zIndex = 1;
            previewWindow.activeFrame = nextFrameNo;
            nextFrame.onload = null;
         };

         nextFrame.src = pdfUrl;
         previewWindow.focus();
      } catch (e) {
         previewWindow.location.replace(pdfUrl);
      }
   };

   ctx.injectFloatingActionButton = () => { /* Removido a pedido do usuário */ };

   ctx.showToast = function (msg, type = 'info') {
      let container = document.getElementById('tasy-pdf-toasts');
      if (!container) {
         container = document.createElement('div');
         container.id = 'tasy-pdf-toasts';
         Object.assign(container.style, {
            position: 'fixed', bottom: '90px', right: '24px', zIndex: '9999999', display: 'flex', flexDirection: 'column', gap: '8px'
         });
         document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      const bg = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#3b82f6');
      Object.assign(toast.style, {
         background: bg, color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'sans-serif',
         boxShadow: '0 4px 12px rgba(0,0,0,0.15)', opacity: '0', transform: 'translateX(20px)', transition: 'all 0.3s ease-out'
      });
      toast.innerText = msg;
      container.appendChild(toast);

      requestAnimationFrame(() => {
         toast.style.opacity = '1';
         toast.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
         toast.style.opacity = '0';
         toast.style.transform = 'translateX(20px)';
         setTimeout(() => toast.remove(), 300);
      }, 4000);
   };

   ctx.injectSpotlightSearch = function () {
      if (document.getElementById('tasy-pdf-navbar')) return;

      const nav = document.createElement('div');
      nav.id = 'tasy-pdf-navbar';
      Object.assign(nav.style, {
         position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '700px',
         backgroundColor: 'rgba(43, 43, 54, 0.8)', zIndex: '999999', borderRadius: '12px', border: '1px solid rgba(63, 63, 90, 0.5)',
         backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
         boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      });

      const icons = {
         search: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
         refresh: '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>',
         edit: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
         print: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
         band: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
         field: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
         save: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
         arrowLeft: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
         history: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
         trash: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
         undo: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M3 13C5 7 10 4 16 5.5a9 9 0 0 1 5 7.5"/></svg>',
         redo: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 7v6h-6"/><path d="M21 13C19 7 14 4 8 5.5a9 9 0 0 0-5 7.5"/></svg>',
         exportIcon: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
         clone: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
         add: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>'
      };

      nav.innerHTML = `
      <div id="tasy-nav-header" style="position: relative; width: 100%; display: flex; align-items: center;">
        <div style="position: absolute; left: 16px; color: #3b82f6; display: flex;">${icons.search}</div>
        <input type="text" id="tasy-nav-search" placeholder="Buscar Relatórios..." autocomplete="off" style="width: 100%; padding: 14px 44px; border-radius: 12px; border: none; background: transparent; color: white; font-size: 15px; outline: none; font-family: 'Inter', system-ui, sans-serif;">
        <div style="position:absolute;right:44px;display:flex;align-items:center;">
          <button id="tasy-spotlight-import-btn" title="Importar XML" style="border:none;background:rgba(34,197,94,0.12);color:#22c55e;padding:4px 9px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;transition:all 0.2s;">↑ Importar</button>
        </div>
        <div id="tasy-nav-refresh" title="Atualizar Cache" style="position: absolute; right: 16px; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex;">${icons.refresh}</div>
      </div>
      <div id="tasy-nav-results" style="display: none; border-top: 1px solid rgba(63, 63, 90, 0.5); max-height: 350px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; background: rgba(34, 34, 43, 0.7); border-radius: 0 0 12px 12px;"></div>

      <div id="tasy-nav-editor" style="display: none; padding: 16px; border-top: 1px solid #3f3f5a; background: #22222b; border-radius: 0 0 12px 12px; flex-direction: column;">
         <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <button id="tasy-ed-btn-back" style="border:1px solid #3f3f5a; background:transparent; color:#e2e8f0; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:4px;">${icons.arrowLeft} Voltar</span></button>
              <span id="tasy-ed-title" style="color:#e2e8f0; font-weight:600; font-size:14px; letter-spacing: 0.3px; display:flex; align-items:center; gap:6px;">Studio</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button id="tasy-studio-import-btn" style="border:none;background:rgba(34,197,94,0.12);color:#22c55e;padding:6px 12px;border-radius:6px;font-weight:600;font-size:12px;transition:all 0.2s;" title="Importar relatório XML"><span style="display:flex;align-items:center;gap:4px;">↑ Importar</span></button>
              <button id="tasy-ed-btn-export" style="border:none; background:rgba(59,130,246,0.15); color:#60a5fa; padding:6px 12px; border-radius:6px; font-weight:600; font-size:12px; transition: all 0.2s;" title="Exportar relatório como XML"><span style="display:flex;align-items:center;gap:6px;">${icons.exportIcon} Exportar</span></button>
              <button id="tasy-ed-btn-preview" style="border:none; background:rgba(16, 185, 129, 0.15); color:#34d399; padding:6px 12px; border-radius:6px; font-weight:600; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${icons.print} PDF Preview</span></button>
            </div>
         </div>
         <div id="tasy-editor-body" style="max-height: 520px; overflow-y: auto; scrollbar-width: thin; padding-right: 4px;"></div>
      </div>
    `;

      document.body.appendChild(nav);

      // [HIDE TOGGLE] Pill flutuante para esconder/mostrar o spotlight
      const pill = document.createElement('div');
      pill.id = 'tasy-pdf-pill';
      pill.title = 'Minimizar / Reabrir Studio';
      pill.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
      Object.assign(pill.style, {
         position: 'fixed', top: '22px', left: 'calc(50% + 368px)',
         width: '28px', height: '28px',
         background: 'rgba(43,43,54,0.75)', border: '1px solid rgba(63,63,90,0.5)',
         backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
         color: '#475569', borderRadius: '50%', cursor: 'pointer',
         zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center',
         boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
         transition: 'all 0.2s', fontFamily: 'system-ui,sans-serif'
      });
      pill.addEventListener('mouseenter', () => {
         pill.style.color = '#f1f5f9';
         pill.style.borderColor = 'rgba(96,165,250,0.5)';
         pill.style.background = 'rgba(59,130,246,0.15)';
      });
      pill.addEventListener('mouseleave', () => {
         const isHidden = nav.style.display === 'none';
         pill.style.color = isHidden ? '#60a5fa' : '#475569';
         pill.style.borderColor = isHidden ? 'rgba(96,165,250,0.4)' : 'rgba(63,63,90,0.5)';
         pill.style.background = isHidden ? 'rgba(59,130,246,0.1)' : 'rgba(43,43,54,0.75)';
      });
      pill.addEventListener('click', () => {
         const isHidden = nav.style.display === 'none';
         if (isHidden) {
            nav.style.display = '';
            nav.style.opacity = '0';
            nav.style.transform = 'translateX(-50%) scale(0.96)';
            requestAnimationFrame(() => {
               nav.style.transition = 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275)';
               nav.style.opacity = '0.7';
               nav.style.transform = 'translateX(-50%) scale(0.98)';
            });
            pill.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
            pill.style.color = '#475569';
            pill.style.borderColor = 'rgba(63,63,90,0.5)';
            pill.style.background = 'rgba(43,43,54,0.75)';
         } else {
            nav.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
            nav.style.opacity = '0';
            nav.style.transform = 'translateX(-50%) scale(0.95)';
            setTimeout(() => { nav.style.display = 'none'; }, 150);
            pill.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
            pill.style.color = '#60a5fa';
            pill.style.borderColor = 'rgba(96,165,250,0.4)';
            pill.style.background = 'rgba(59,130,246,0.1)';
         }
      });
      document.body.appendChild(pill);

      // [DRAG] Torna o pill arrastável
      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let hasMoved = false;

      pill.addEventListener('mousedown', (e) => {
         isDragging = true;
         hasMoved = false;
         dragOffsetX = e.clientX - pill.getBoundingClientRect().left;
         dragOffsetY = e.clientY - pill.getBoundingClientRect().top;
         pill.style.transition = 'none';
         pill.style.cursor = 'grabbing';
         e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
         if (!isDragging) return;
         hasMoved = true;
         const x = e.clientX - dragOffsetX;
         const y = e.clientY - dragOffsetY;
         const maxX = window.innerWidth  - pill.offsetWidth;
         const maxY = window.innerHeight - pill.offsetHeight;
         pill.style.left      = Math.max(0, Math.min(x, maxX)) + 'px';
         pill.style.top       = Math.max(0, Math.min(y, maxY)) + 'px';
         pill.style.transform = 'none';
      });

      document.addEventListener('mouseup', () => {
         if (!isDragging) return;
         isDragging = false;
         pill.style.cursor = 'pointer';
         pill.style.transition = 'all 0.2s';
      });

      pill.addEventListener('click', (e) => {
         if (hasMoved) { hasMoved = false; e.stopImmediatePropagation(); }
      }, true);

      const input = document.getElementById('tasy-nav-search');
      const refresh = document.getElementById('tasy-nav-refresh');
      const results = document.getElementById('tasy-nav-results');

      refresh.addEventListener('click', async (e) => {
         e.stopPropagation();
         refresh.style.transform = 'rotate(360deg)';
         refresh.style.color = '#3b82f6';
         if (ctx.prefetchAllReports) await ctx.prefetchAllReports(true);
         setTimeout(() => {
            refresh.style.transform = 'rotate(0deg)';
            refresh.style.color = '#64748b';
            if (ctx.showToast) ctx.showToast('Lista de relatórios atualizada!', 'success');
         }, 600);
      });

      const editor = document.getElementById('tasy-nav-editor');
      const edBody = document.getElementById('tasy-editor-body');
      const edTitle = document.getElementById('tasy-ed-title');
      const edBack = document.getElementById('tasy-ed-btn-back');
      const edPreview = document.getElementById('tasy-ed-btn-preview');
      const edExport = document.getElementById('tasy-ed-btn-export');

      let historyData = [];

      window.addEventListener('message', (e) => {
         if (e.data && e.data.type === 'TASY_PDF_HISTORY_DATA') {
            historyData = e.data.payload || [];
            if (input.value.trim() === '' && edState.level === 0) {
               renderHistory();
            }
         }
      });

      const requestHistory = () => {
         window.postMessage({ type: 'TASY_PDF_HISTORY_GET' }, '*');
      };

      requestHistory();

      const collapseSearch = () => {
         ctx.removeGhostField();
         results.style.display = 'none';
         editor.style.display = 'none';
         document.getElementById('tasy-nav-header').style.display = 'flex';
         nav.style.opacity = '0.7';
         nav.style.transform = 'translateX(-50%) scale(0.98)';
      };

      const expandSearch = () => {
         const isSearchOpen = nav.style.opacity === '1';
         const isNavIdle = edState.level === 0 && input.value.trim() === '';

         if (isSearchOpen) {
             nav.style.transform = 'translateX(-50%) scale(1)';
             if (isNavIdle && results.innerHTML === '') {
                 renderHistory();
             }
             return;
         }

         console.log('[Tasy PDF] Spotlight Expanding...');
         nav.style.opacity = '1';
         nav.style.transform = 'translateX(-50%) scale(1)';
         if (edState.level > 0) {
            editor.style.display = 'flex';
            results.style.display = 'none';
            document.getElementById('tasy-nav-header').style.display = 'none';
         } else if (input.value.trim() !== '') {
            results.style.display = 'block';
            document.getElementById('tasy-nav-header').style.display = 'flex';
         } else {
            requestHistory();
            renderHistory();
         }
      };

      document.addEventListener('mousedown', (e) => {
         if (edState.level === 3) return;
         if (!nav.contains(e.target)) collapseSearch();
         else expandSearch();
      });

      window.addEventListener('keydown', (e) => {
         if (e.key === 'Escape') {
            if (edState.level === 3) return;
            collapseSearch();
         }
      });

      input.addEventListener('focus', expandSearch);

      let debounceTimer;

      let edState = {
         level: 0,
         reportCode: null, reportSeq: null,
         bandSeq: null, bandName: null,
         activeField: null,
         rawBands: [], rawFields: [],
         fullReportData: null
      };

      // [JANELA SEPARADA] Referência para a janela do editor de campo
      let editorWindow = null;

      ctx.fetchFullReport = async function (reportSeq) {
         if (edState.fullReportData && edState.fullReportData.reportSeq === reportSeq) return edState.fullReportData;
         const bands = await ctx.fetchBands(reportSeq);
         const fullData = { reportSeq, bands: [] };
         await Promise.all(bands.map(async (band) => {
            const fields = await ctx.fetchFields(band.NR_SEQUENCIA);
            fullData.bands.push({ ...band, fields });
         }));
         fullData.bands.sort((a, b) => (a.NR_ORDEM || 0) - (b.NR_ORDEM || 0));
         edState.fullReportData = fullData;
         return fullData;
      };

      function switchView(mode) {
         const nav = document.getElementById('tasy-pdf-navbar');
         if (!nav) return;
         if (mode === 'search') {
            Object.assign(nav.style, {
               width: '550px', height: 'auto', top: '20px', left: '50%',
               transform: 'translateX(-50%)', borderRadius: '12px',
               position: 'fixed', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            });
            document.getElementById('tasy-nav-header').style.display = 'flex';
            editor.style.display = 'none';
            if (input.value.trim() !== '') results.style.display = 'block';
         } else {
            // level 3 agora abre em janela separada — o nav permanece no tamanho normal
            Object.assign(nav.style, {
               width: '550px', height: 'auto', top: '20px', left: '50%',
               transform: 'translateX(-50%)', borderRadius: '12px',
               position: 'fixed', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            });
            editor.style.padding = '16px';
            edBody.style.maxHeight = '420px';
            edBody.style.height = 'auto';
            document.getElementById('tasy-nav-header').style.display = 'none';
            results.style.display = 'none';
            editor.style.display = 'flex';
         }
      }

      function renderLoading(target, msg) {
         target.innerHTML = `<div style="padding: 14px; color: #a0a0b0; font-size: 14px; text-align: center;">${msg}... aguarde</div>`;
      }

      function renderResults(list) {
         if (!list || list.length === 0) {
            results.style.display = 'block';
            results.innerHTML = `<div style="padding: 14px; color: #ef4444; font-size: 14px; text-align: center;">Nenhum relatório encontrado.</div>`;
            return;
         }
         results.style.display = 'block';
         results.innerHTML = list.map(r => `
         <div class="tasy-res-item" data-code="${r.CD_RELATORIO}" data-seq="${r.NR_SEQUENCIA}" style="padding: 12px 16px; border-bottom: 1px solid #3f3f5a; display: flex; align-items: center; justify-content: space-between; transition: background 0.1s;">
            <div style="display: flex; flex-direction: column;">
              <span style="color: #f8fafc; font-size: 14px; font-weight: 500;">${r.CD_RELATORIO}</span>
              <span style="color: #94a3b8; font-size: 12px; font-weight: 400;">${r.DS_TITULO || 'Relatório S/N'}</span>
            </div>
            <div style="display: flex; gap: 8px;">
               <button class="tasy-btn-edit" style="border:none; background:rgba(245, 158, 11, 0.1); color:#f59e0b; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; transition:all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${icons.edit} Editor UI</span></button>
               <button class="tasy-btn-gen" style="border:none; background:rgba(59, 130, 246, 0.1); color:#3b82f6; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; transition:all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${icons.print} Gerar Pdf</span></button>
            </div>
         </div>
       `).join('');
      }

      async function resumeFromHistory(h) {
         edState.reportCode = h.code;
         edState.reportSeq  = h.seq;
         edState.bandSeq    = h.bandSeq;
         edState.bandName   = h.bandName;

         results.style.display = 'none';
         document.getElementById('tasy-nav-header').style.display = 'none';

         try {
            const fields = await ctx.fetchFields(h.bandSeq);
            edState.rawFields = fields;
            const field = fields.find(f => String(f.NR_SEQUENCIA) === String(h.fieldSeq));
            if (!field) {
               ctx.showToast('Campo não encontrado — pode ter sido deletado.', 'error');
               edState.level = 2;
               loadFieldsUI();
               return;
            }
            edState.activeField = field;
            edState.level = 3;
            loadEditFormUI();
         } catch(err) {
            ctx.showToast('Erro ao retomar edição: ' + err.message, 'error');
         }
      }

      function renderHistory() {
         results.style.display = 'block';

         let timeline = [];
         try { timeline = JSON.parse(localStorage.getItem('tasy_edit_timeline') || '[]'); } catch(e) {}

         let timelineHtml = '';
         if (timeline.length > 0) {
            const timelineItems = timeline.map(t => `
              <div class="tasy-timeline-item"
                   data-code="${t.code}" data-seq="${t.seq || ''}"
                   data-band-seq="${t.bandSeq}" data-band-name="${t.bandName}"
                   data-field-seq="${t.fieldSeq}" data-field-name="${t.fieldName}"
                   style="padding:9px 16px; border-bottom:1px solid #1e1e2a; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.1s;"
                   onmouseover="this.style.background='rgba(96,165,250,0.05)'"
                   onmouseout="this.style.background='transparent'">
                <div style="display:flex; flex-direction:column; gap:2px; min-width:0; overflow:hidden;">
                  <div style="display:flex; align-items:center; gap:5px; font-size:12px;">
                    <span style="color:#94a3b8; font-weight:600; flex-shrink:0;">${t.code}</span>
                    <span style="color:#334155;">›</span>
                    <span style="color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.bandName}</span>
                    <span style="color:#334155;">›</span>
                    <span style="color:#60a5fa; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.fieldName}</span>
                  </div>
                  <span style="color:#334155; font-size:10px;">${t.date}</span>
                </div>
                <button class="tasy-btn-resume" style="border:none; background:rgba(96,165,250,0.12); color:#60a5fa; padding:5px 12px; border-radius:6px; font-weight:600; font-size:11px; cursor:pointer; flex-shrink:0; margin-left:10px; transition:all 0.2s;"
                  onmouseover="this.style.background='rgba(96,165,250,0.22)'"
                  onmouseout="this.style.background='rgba(96,165,250,0.12)'">
                  Continuar →
                </button>
              </div>`).join('');

            timelineHtml = `
              <div style="border-bottom:1px solid #2a2a38;">
                <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 16px;">
                  <span style="color:#475569; font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;">Onde você parou</span>
                  <button id="tasy-btn-timeline-clear" style="background:none; border:none; color:#334155; font-size:10px; cursor:pointer; padding:2px 4px;">limpar</button>
                </div>
                ${timelineItems}
              </div>`;
         }

         if (!historyData || historyData.length === 0) {
            if (!timelineHtml) {
               results.innerHTML = `
                 <div style="padding:20px 16px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                   <div style="color:#475569; font-size:13px; text-align:center;">${icons.history} Nenhuma atividade recente</div>
                   <div style="color:#334155; font-size:11px;">Abra um relatório para editar</div>
                 </div>`;
            } else {
               results.innerHTML = timelineHtml;
            }
            return;
         }

         const headerHtml = `
           <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 16px; border-bottom:1px solid #2a2a38;">
             <span style="color:#475569; font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;">${icons.history} PDFs Gerados</span>
             <button id="tasy-btn-hist-clear" style="background:none; border:none; color:#334155; font-size:10px; cursor:pointer; padding:2px 4px;">limpar</button>
           </div>`;

         const itemsHtml = historyData.slice(0, 8).map(h => `
           <div class="tasy-res-item tasy-hist-item" data-code="${h.code}" data-seq="${h.seq || ''}"
                style="padding:9px 16px; border-bottom:1px solid #1e1e2a; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.1s;"
                onmouseover="this.style.background='rgba(255,255,255,0.02)'"
                onmouseout="this.style.background='transparent'">
             <div style="display:flex; flex-direction:column; gap:2px;">
               <span style="color:#f1f5f9; font-size:13px; font-weight:500;">${h.code}</span>
               <span style="color:#334155; font-size:10px;">${h.date || ''}</span>
             </div>
             <div style="display:flex; gap:5px;">
               <button class="tasy-btn-edit" style="border:none; background:rgba(245,158,11,0.08); color:#f59e0b; padding:5px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">${icons.edit}</button>
               <button class="tasy-btn-gen" style="border:none; background:rgba(59,130,246,0.08); color:#3b82f6; padding:5px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">${icons.print}</button>
             </div>
           </div>`).join('');

         results.innerHTML = timelineHtml + headerHtml + itemsHtml;
      }

      function renderClearConfirm() {
         results.style.display = 'block';
         results.innerHTML = `
           <div style="padding: 20px 16px; display: flex; flex-direction: column; align-items: center; gap: 14px;">
             <div style="color: #f1f5f9; font-size: 13px; font-weight: 500; text-align: center;">
               Limpar todo o histórico?
             </div>
             <div style="display: flex; gap: 10px;">
               <button id="tasy-btn-confirm-clear-yes" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 7px 18px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                 Sim, limpar
               </button>
               <button id="tasy-btn-confirm-clear-no" style="background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 7px 18px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                 Cancelar
               </button>
             </div>
           </div>`;
      }

      input.addEventListener('input', (e) => {
         e.target.value = e.target.value.replace(/\D/g, '');
         const val = e.target.value.trim().toLowerCase();
         if (!val) { results.style.display = 'none'; return; }
         if (ctx.allReports && ctx.allReports.length > 0) {
            const matches = ctx.allReports.filter(r =>
               String(r.CD_RELATORIO).includes(val) ||
               (r.DS_TITULO && String(r.DS_TITULO).toLowerCase().includes(val))
            ).slice(0, 15);
            renderResults(matches);
            return;
         }
         clearTimeout(debounceTimer);
         debounceTimer = setTimeout(() => {
            results.style.display = 'block';
            renderLoading(results, "Buscando na rede");
            ctx.checkExactReportFallback(val).then(res => renderResults(res));
         }, 500);
      });

      results.addEventListener('click', (e) => {
         const item = e.target.closest('.tasy-res-item');

         if (e.target.closest('.tasy-btn-resume')) {
            const el = e.target.closest('.tasy-timeline-item') || e.target.closest('.tasy-res-item');
            resumeFromHistory({
               code:      el.getAttribute('data-code'),
               seq:       el.getAttribute('data-seq'),
               bandSeq:   el.getAttribute('data-band-seq'),
               bandName:  el.getAttribute('data-band-name'),
               fieldSeq:  el.getAttribute('data-field-seq'),
               fieldName: el.getAttribute('data-field-name'),
            });
            return;
         }

         if (e.target.closest('#tasy-btn-timeline-clear')) {
            localStorage.removeItem('tasy_edit_timeline');
            renderHistory();
            return;
         }

         if (e.target.closest('.tasy-timeline-item') && !e.target.closest('.tasy-btn-resume')) {
            const el = e.target.closest('.tasy-timeline-item');
            resumeFromHistory({
               code:      el.getAttribute('data-code'),
               seq:       el.getAttribute('data-seq'),
               bandSeq:   el.getAttribute('data-band-seq'),
               bandName:  el.getAttribute('data-band-name'),
               fieldSeq:  el.getAttribute('data-field-seq'),
               fieldName: el.getAttribute('data-field-name'),
            });
            return;
         }

         if (e.target.closest('#tasy-btn-hist-clear')) {
            renderClearConfirm();
            return;
         }

         if (e.target.closest('#tasy-btn-confirm-clear-yes')) {
            window.postMessage({ type: 'TASY_PDF_HISTORY_CLEAR' }, '*');
            historyData = [];
            renderHistory();
            return;
         }

         if (e.target.closest('#tasy-btn-confirm-clear-no')) {
            renderHistory();
            return;
         }

         if (!item) return;

         const code = item.getAttribute('data-code');
         const seq = item.getAttribute('data-seq');
         if (e.target.closest('.tasy-btn-gen')) {
            input.value = ''; results.style.display = 'none'; input.blur();
            if (ctx.generateManualPdf) ctx.generateManualPdf(code);
         } else if (e.target.closest('.tasy-btn-edit')) {
            edState.level = 1; edState.reportCode = code; edState.reportSeq = seq;
            loadBandsUI();
            return;
         }

         if (e.target.closest('.tasy-btn-gen') || item.classList.contains('tasy-hist-item')) {
            closeNav();
            console.log('[Tasy PDF] Generating PDF for:', code);
            if (ctx.generateManualPdf) ctx.generateManualPdf(code);
            return;
         }
      });

      // -------- LEVEL 1: BANDAS --------
      let bandClipboard = null;
      let fieldClipboard = null;

      function setBandClipboard(bandObj, fieldCount) {
         bandClipboard = { bandObj, fieldCount };
         renderBandsUI();
      }

      async function loadBandsUI() {
         const bands = await ctx.fetchBands(edState.reportSeq).catch(() => null);
         edState.rawBands = bands || [];
         renderBandsUI();
      }

      function renderBandsUI() {
         switchView('editor');
         edTitle.innerHTML = `<span style="color:#cbd5e1">${icons.band}</span> Bandas <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${edState.reportCode}</span>`;

         const bands = edState.rawBands;
         if (!bands) { renderLoading(edBody, "Carregando Bandas"); return; }
         if (bands.length === 0) { edBody.innerHTML = `<div style="color:#ef4444; padding:10px;">Nenhuma banda encontrada.</div>`; return; }

         const pasteBtn = bandClipboard ? `
           <button id="ed-btn-paste-band"
             style="width:100%; padding:10px; background:rgba(167,139,250,0.1); color:#a78bfa; border:1px dashed rgba(167,139,250,0.4); border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:10px; transition:all 0.2s;"
             onmouseover="this.style.background='rgba(167,139,250,0.2)'" onmouseout="this.style.background='rgba(167,139,250,0.1)'">
             ${icons.clone} Colar "${bandClipboard.bandObj.DS_BANDA}" (${bandClipboard.fieldCount} campo${bandClipboard.fieldCount !== 1 ? 's' : ''}) &nbsp;<kbd style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;font-size:10px;">Ctrl+V</kbd>
           </button>` : '';

         const bandTypeMap = {
            'C': { label:'Cabeçalho', color:'#60a5fa', bg:'rgba(96,165,250,0.10)', dot:'#3b82f6' },
            'R': { label:'Rodapé',    color:'#f97316', bg:'rgba(249,115,22,0.10)', dot:'#f97316' },
            'S': { label:'Detalhe',   color:'#34d399', bg:'rgba(52,211,153,0.10)', dot:'#10b981' },
            'T': { label:'Título',    color:'#a78bfa', bg:'rgba(167,139,250,0.10)', dot:'#8b5cf6' },
         };
         const getBandStyle = (tipo) => bandTypeMap[tipo] || { label: tipo || '?', color:'#94a3b8', bg:'rgba(148,163,184,0.08)', dot:'#64748b' };

         edBody.innerHTML = pasteBtn + `<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">` +
            bands.map((b, i) => {
               const isCopied = bandClipboard?.bandObj?.NR_SEQUENCIA === b.NR_SEQUENCIA;
               const bs = getBandStyle(b.IE_TIPO_BANDA);
               const fundo = b.DS_COR_FUNDO && b.DS_COR_FUNDO !== 'clWhite' ? b.DS_COR_FUNDO : null;
               return `
                <div class="tasy-band-item" draggable="true" data-index="${i}" data-seq="${b.NR_SEQUENCIA}" data-name="${b.DS_BANDA}"
                     style="background:${isCopied ? 'rgba(167,139,250,0.10)' : bs.bg};
                            border:1px solid ${isCopied ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.07)'};
                            border-radius:10px; cursor:pointer; transition:all 0.18s;
                            display:flex; flex-direction:column; gap:0; position:relative; overflow:hidden;">
                   <div style="height:3px; background:${isCopied ? '#a78bfa' : bs.dot}; border-radius:10px 10px 0 0; opacity:0.7;"></div>
                   <div style="padding:10px 12px 10px 12px;">
                     <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:6px; margin-bottom:8px;">
                       <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                         <span style="width:6px;height:6px;border-radius:50%;background:${isCopied ? '#a78bfa' : bs.dot};flex-shrink:0;margin-top:2px;"></span>
                         <span style="color:#f1f5f9; font-weight:600; font-size:12px; line-height:1.3; word-break:break-word;">${b.DS_BANDA}</span>
                       </div>
                       ${isCopied ? `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;font-size:8px;font-weight:700;padding:2px 5px;border-radius:3px;letter-spacing:0.5px;flex-shrink:0;">COPIADA</span>` : ''}
                     </div>
                     <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
                       <span style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:2px 6px;font-size:9px;color:${bs.color};font-weight:600;">${bs.label}</span>
                       <span style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px;font-size:9px;color:#64748b;">${b.QT_ALTURA || 0}px</span>
                       ${fundo ? `<span style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px;font-size:9px;color:#64748b;display:flex;align-items:center;gap:3px;"><span style="width:7px;height:7px;border-radius:2px;background:${fundo};border:1px solid rgba(255,255,255,0.15);"></span>${fundo}</span>` : ''}
                       <span style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px;font-size:9px;color:#475569;">#${i+1}</span>
                     </div>
                     <div style="display:flex; align-items:center; justify-content:space-between;">
                       <kbd class="tasy-band-copy-hint" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:1px 5px;font-size:9px;color:#475569;opacity:0;transition:opacity 0.2s;">Ctrl+C</kbd>
                       <button class="tasy-btn-delete-band" data-seq="${b.NR_SEQUENCIA}"
                         style="border:none; background:transparent; color:#334155; padding:3px 5px; border-radius:5px; cursor:pointer; font-size:11px; display:flex; align-items:center; transition:all 0.2s; opacity:0;"
                         onmouseover="this.style.background='rgba(239,68,68,0.15)';this.style.color='#ef4444';this.style.opacity='1'"
                         onmouseout="this.style.background='transparent';this.style.color='#334155';this.style.opacity='0'"
                         title="Deletar banda e todos os campos">
                         ${icons.trash}
                       </button>
                     </div>
                   </div>
                </div>`;
            }).join('') + `</div>`;

         let dragSourceIndex = null;
         edBody.querySelectorAll('.tasy-band-item').forEach(el => {
            const hint = el.querySelector('.tasy-band-copy-hint');
            const delBtn = el.querySelector('.tasy-btn-delete-band');
            el.addEventListener('mouseenter', () => {
               if (hint) hint.style.opacity = '1';
               if (delBtn) delBtn.style.opacity = '1';
            });
            el.addEventListener('mouseleave', () => {
               if (hint) hint.style.opacity = '0';
               if (delBtn) { delBtn.style.opacity = '0'; delBtn.style.background = 'rgba(239,68,68,0)'; delBtn.style.color = '#475569'; }
            });

            // Drag and Drop Logic
            el.addEventListener('dragstart', (e) => {
               window._tasyIsDragging = true;
               e.dataTransfer.effectAllowed = 'move';
               dragSourceIndex = parseInt(el.getAttribute('data-index'));
               el.style.opacity = '0.5';
            });
            el.addEventListener('dragover', (e) => {
               e.preventDefault();
               e.dataTransfer.dropEffect = 'move';
               el.style.border = '1px dashed #3b82f6';
               el.style.transform = 'scale(0.98)';
            });
            el.addEventListener('dragleave', (e) => {
               const isCopied = String(bandClipboard?.bandObj?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
               el.style.border = isCopied ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.07)';
               el.style.transform = 'none';
            });
            el.addEventListener('drop', (e) => {
               e.stopPropagation();
               const dropTargetIndex = parseInt(el.getAttribute('data-index'));
               const isCopied = String(bandClipboard?.bandObj?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
               el.style.border = isCopied ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.07)';
               el.style.transform = 'none';
               
               if (dragSourceIndex !== null && dragSourceIndex !== dropTargetIndex) {
                  handleBandReorder(dragSourceIndex, dropTargetIndex);
               }
               setTimeout(() => { window._tasyIsDragging = false; }, 100);
               return false;
            });
            el.addEventListener('dragend', () => {
               el.style.opacity = '1';
               setTimeout(() => { window._tasyIsDragging = false; }, 100);
            });
         });
      }

      async function handleBandReorder(fromIdx, toIdx) {
         const bands = [...edState.rawBands];
         // Mapeia os valores atuais de NR_SEQ_APRESENTACAO e os ordena
         const seqValues = bands.map((b, i) => b.NR_SEQ_APRESENTACAO || (i + 1)).sort((a, b) => a - b);
         
         const [movedItem] = bands.splice(fromIdx, 1);
         bands.splice(toIdx, 0, movedItem);

         const updates = [];
         bands.forEach((b, i) => {
             const oldSeq = b.NR_SEQ_APRESENTACAO;
             const newSeq = seqValues[i];
             if (oldSeq !== newSeq) {
                 const oldObjOriginal = { ...b };
                 b.NR_SEQ_APRESENTACAO = newSeq;
                 updates.push({ oldBand: oldObjOriginal, newBand: { ...b } });
             }
         });

         edState.rawBands = bands;
         renderBandsUI(); // Update UI optimistically

         if (updates.length > 0) {
             try {
                 for (let u of updates) {
                     await ctx.updateBandObj(u.oldBand, u.newBand);
                 }
                 ctx.showToast('Ordem das bandas atualizada com sucesso!', 'success');
             } catch (err) {
                 ctx.showToast('Erro ao atualizar ordem. Recarregando...', 'error');
                 loadBandsUI();
             }
         }
      }

      window._tasyIsDragging = false;
      edBody.addEventListener('mousedown', () => { window._tasyIsDragging = false; });

      edBody.addEventListener('click', (e) => {
         if (window._tasyIsDragging) {
             e.preventDefault();
             e.stopPropagation();
             return;
         }

         if (e.target.closest('#ed-btn-add-field')) {
            openCreateFieldModal();
            return;
         }

         if (e.target.closest('.tasy-btn-clone-field')) {
            e.stopPropagation();
            if (!ctx.cloneFieldObj) { ctx.showToast('cloneFieldObj não disponível.', 'error'); return; }
            const btn = e.target.closest('.tasy-btn-clone-field');
            const seq = btn.getAttribute('data-seq');
            const fieldObj = edState.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
            if (!fieldObj) return;
            btn.style.opacity = '0.5';
            btn.disabled = true;
            ctx.cloneFieldObj(fieldObj)
               .then(() => {
                  ctx.showToast(`"${fieldObj.DS_CAMPO || 'Campo'}" clonado!`, 'success');
                  loadFieldsUI();
               })
               .catch(err => {
                  ctx.showToast('Erro ao clonar: ' + err.message, 'error');
                  console.error('[Studio] cloneFieldObj error:', err);
                  loadFieldsUI();
               });
            return;
         }

         if (e.target.closest('.tasy-btn-delete-field')) {
            e.stopPropagation();
            const btn = e.target.closest('.tasy-btn-delete-field');
            const seq = btn.getAttribute('data-seq');
            const fieldObj = edState.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
            if (!fieldObj) { ctx.showToast('Campo não encontrado no estado.', 'error'); return; }
            openDeleteConfirmModal(fieldObj);
            return;
         }

         if (e.target.closest('.tasy-btn-delete-band')) {
            e.stopPropagation();
            const btn = e.target.closest('.tasy-btn-delete-band');
            const seq = btn.getAttribute('data-seq');
            const bandObj = edState.rawBands.find(b => String(b.NR_SEQUENCIA) === String(seq));
            if (!bandObj) return;
            openDeleteBandModal(bandObj);
            return;
         }

         if (e.target.closest('#ed-btn-paste-band')) {
            pasteBand();
            return;
         }

         if (e.target.closest('#ed-btn-paste-field')) {
            pasteField();
            return;
         }

         const band = e.target.closest('.tasy-band-item');
         if (band) {
            edState.level = 2;
            edState.bandSeq = band.getAttribute('data-seq');
            edState.bandName = band.getAttribute('data-name');
            loadFieldsUI();
         }
         const field = e.target.closest('.tasy-field-item');
         if (field) {
            edState.level = 3;
            const seq = field.getAttribute('data-seq');
            edState.activeField = edState.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
            try {
               const editCtx = {
                  code: edState.reportCode,
                  seq: edState.reportSeq,
                  bandSeq: edState.bandSeq,
                  bandName: edState.bandName,
                  fieldSeq: String(seq),
                  fieldName: edState.activeField?.DS_CAMPO || 'Campo',
                  date: new Date().toLocaleString('pt-BR')
               };
               const raw = localStorage.getItem('tasy_edit_timeline');
               let timeline = raw ? JSON.parse(raw) : [];
               timeline = timeline.filter(t => !(t.code === editCtx.code && t.fieldSeq === editCtx.fieldSeq));
               timeline.unshift(editCtx);
               timeline = timeline.slice(0, 10);
               localStorage.setItem('tasy_edit_timeline', JSON.stringify(timeline));
            } catch(e) {}
            loadEditFormUI();
         }
      });

      // ══════════════════════════════════════════════════════════════════
      // MODAL: Deletar Banda
      // ══════════════════════════════════════════════════════════════════
      function openDeleteBandModal(bandObj) {
         document.getElementById('tasy-modal-delete-band')?.remove();
         const modal = document.createElement('div');
         modal.id = 'tasy-modal-delete-band';
         Object.assign(modal.style, {
            position:'fixed', inset:'0', zIndex:'2000000000',
            background:'rgba(0,0,0,0.72)', display:'flex',
            alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)'
         });
         const nome = bandObj.DS_BANDA || `Banda #${bandObj.NR_SEQUENCIA}`;
         modal.innerHTML = `
           <div style="background:#1e1e2e;border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:28px;width:360px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;text-align:center;">
             <div style="color:#f1f5f9;font-size:16px;font-weight:700;margin-bottom:8px;">Deletar banda?</div>
             <div style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Você está prestes a deletar permanentemente:</div>
             <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 14px;margin-bottom:8px;color:#fca5a5;font-size:13px;font-weight:600;font-family:monospace;">${nome}</div>
             <div style="color:#ef4444;font-size:12px;font-weight:500;margin-bottom:4px;">⚠️ Todos os campos dentro dela também serão deletados.</div>
             <div style="color:#475569;font-size:11px;margin-bottom:20px;">Esta ação não pode ser desfeita.</div>
             <div id="mdb-progress" style="display:none;margin-bottom:16px;">
               <div style="color:#94a3b8;font-size:12px;margin-bottom:6px;" id="mdb-progress-text">Deletando campos...</div>
               <div style="background:#2b2b3e;border-radius:4px;height:4px;overflow:hidden;">
                 <div id="mdb-progress-bar" style="background:#ef4444;height:100%;width:0%;transition:width 0.2s;"></div>
               </div>
             </div>
             <div style="display:flex;gap:10px;" id="mdb-buttons">
               <button id="mdb-cancel" style="flex:1;padding:12px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Cancelar</button>
               <button id="mdb-confirm" style="flex:1;padding:12px;background:#ef4444;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.3);">${icons.trash} Deletar</button>
             </div>
           </div>`;
         document.body.appendChild(modal);

         const closeModal = () => modal.remove();
         document.getElementById('mdb-cancel').addEventListener('click', closeModal);
         modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

         document.getElementById('mdb-confirm').addEventListener('click', async () => {
            if (!ctx.deleteBandWithFields) { ctx.showToast('deleteBandWithFields não disponível.', 'error'); return; }
            document.getElementById('mdb-buttons').style.display = 'none';
            document.getElementById('mdb-progress').style.display = 'block';
            const progressText = document.getElementById('mdb-progress-text');
            const progressBar  = document.getElementById('mdb-progress-bar');
            try {
               await ctx.deleteBandWithFields(bandObj, (done, total) => {
                  progressText.textContent = `Deletando campos... ${done}/${total}`;
                  progressBar.style.width = Math.round((done / total) * 100) + '%';
               });
               ctx.showToast(`Banda "${nome}" deletada.`, 'success');
               closeModal();
               if (bandClipboard?.bandObj?.NR_SEQUENCIA === bandObj.NR_SEQUENCIA) bandClipboard = null;
               const bands = await ctx.fetchBands(edState.reportSeq);
               edState.rawBands = bands;
               renderBandsUI();
            } catch(err) {
               ctx.showToast('Erro ao deletar banda: ' + err.message, 'error');
               console.error('[Studio] deleteBandWithFields error:', err);
               closeModal();
               renderBandsUI();
            }
         });
      }

      // ══════════════════════════════════════════════════════════════════
      // MODAL: Criar Campo
      // ══════════════════════════════════════════════════════════════════
      function openCreateFieldModal() {
         document.getElementById('tasy-modal-create')?.remove();
         const modal = document.createElement('div');
         modal.id = 'tasy-modal-create';
         Object.assign(modal.style, {
            position:'fixed', inset:'0', zIndex:'2000000000',
            background:'rgba(0,0,0,0.72)', display:'flex',
            alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)'
         });
         modal.innerHTML = `
           <div style="background:#1e1e2e;border:1px solid rgba(167,139,250,0.3);border-radius:14px;padding:24px;width:420px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;">
             <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
               <span style="color:#f1f5f9;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;">${icons.add} Novo Campo</span>
               <button id="mc-close" style="background:none;border:none;color:#475569;cursor:pointer;font-size:20px;line-height:1;padding:2px 6px;">✕</button>
             </div>
             <div style="display:flex;flex-direction:column;gap:14px;">
               <div>
                 <label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">NOME DO CAMPO</label>
                 <input id="mc-nome" type="text" value="NOVO_CAMPO" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" />
               </div>
               <div>
                 <label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">CONTEÚDO / TEXTO FIXO</label>
                 <input id="mc-conteudo" type="text" placeholder="Ex: Relatório de Atendimento" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" />
               </div>
               <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">X (Esquerda)</label>
                 <input id="mc-x" type="number" value="5" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" /></div>
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Y (Topo)</label>
                 <input id="mc-y" type="number" value="1" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" /></div>
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Largura (W)</label>
                 <input id="mc-w" type="number" value="50" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" /></div>
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Altura (H)</label>
                 <input id="mc-h" type="number" value="17" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" /></div>
               </div>
               <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Tamanho Fonte</label>
                 <input id="mc-fontsize" type="number" value="8" style="width:100%;box-sizing:border-box;padding:10px 12px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:13px;outline:none;" /></div>
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Estilo</label>
                 <select id="mc-fontstyle" style="width:100%;height:42px;padding:0 10px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:12px;outline:none;color-scheme:dark;">
                   <option value="">Normal</option><option value="N">Negrito</option>
                   <option value="I">Itálico</option><option value="NI">Negrito + Itálico</option>
                   <option value="S">Sublinhado</option>
                 </select></div>
               </div>
               <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Cor da Fonte</label>
                 <div style="display:flex;gap:6px;align-items:center;">
                   <input type="color" id="mc-fontcolor-picker" value="#000000" style="width:36px;height:36px;padding:0;border:none;background:transparent;cursor:pointer;border-radius:6px;flex-shrink:0;" />
                   <input id="mc-fontcolor" type="text" value="clBlack" style="flex:1;min-width:0;padding:10px 8px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:12px;outline:none;" />
                 </div></div>
                 <div><label style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:0.5px;display:block;margin-bottom:6px;">Alinhamento</label>
                 <select id="mc-align" style="width:100%;height:42px;padding:0 10px;background:#2b2b3e;border:1px solid #3f3f5a;color:#f1f5f9;border-radius:8px;font-size:12px;outline:none;color-scheme:dark;">
                   <option value="E">Esquerda</option><option value="C">Centro</option><option value="D">Direita</option>
                 </select></div>
               </div>
             </div>
             <div style="display:flex;gap:10px;margin-top:22px;">
               <button id="mc-cancel" style="flex:1;padding:12px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Cancelar</button>
               <button id="mc-confirm" style="flex:2;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(59,130,246,0.3);">${icons.add} Criar Campo</button>
             </div>
           </div>`;
         document.body.appendChild(modal);

         const closeModal = () => modal.remove();
         document.getElementById('mc-close').addEventListener('click', closeModal);
         document.getElementById('mc-cancel').addEventListener('click', closeModal);
         modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

         const picker = document.getElementById('mc-fontcolor-picker');
         const txt    = document.getElementById('mc-fontcolor');
         picker.addEventListener('input', () => { txt.value = ctx.hexToTasy ? ctx.hexToTasy(picker.value) : picker.value.toUpperCase(); });
         txt.addEventListener('blur',    () => { picker.value = ctx.tasyToHex ? ctx.tasyToHex(txt.value) : '#000000'; });

         document.getElementById('mc-confirm').addEventListener('click', async () => {
            if (!ctx.insertFieldObj) { ctx.showToast('insertFieldObj não disponível.', 'error'); return; }
            const btn = document.getElementById('mc-confirm');
            btn.textContent = 'Criando...';
            btn.disabled = true;
            const overrides = {
               DS_CAMPO:       document.getElementById('mc-nome').value.trim() || 'NOVO_CAMPO',
               DS_CONTEUDO:    document.getElementById('mc-conteudo').value || null,
               QT_ESQUERDA:    Number(document.getElementById('mc-x').value) || 5,
               QT_TOPO:        Number(document.getElementById('mc-y').value) || 1,
               QT_TAMANHO:     Number(document.getElementById('mc-w').value) || 50,
               QT_ALTURA:      Number(document.getElementById('mc-h').value) || 17,
               QT_TAM_FONTE:   Number(document.getElementById('mc-fontsize').value) || 8,
               DS_ESTILO_FONTE: document.getElementById('mc-fontstyle').value || null,
               DS_COR_FONTE:   ctx.hexToTasy ? ctx.hexToTasy(txt.value) : txt.value,
               IE_ALINHAMENTO: document.getElementById('mc-align').value || 'E',
            };
            try {
               await ctx.insertFieldObj(edState.bandSeq, overrides);
               ctx.showToast(`Campo "${overrides.DS_CAMPO}" criado!`, 'success');
               closeModal();
               loadFieldsUI();
            } catch(err) {
               ctx.showToast('Erro ao criar: ' + err.message, 'error');
               console.error('[Studio] insertFieldObj error:', err);
               btn.innerHTML = `${icons.add} Tentar novamente`;
               btn.disabled = false;
            }
         });

         setTimeout(() => document.getElementById('mc-nome')?.select(), 60);
      }

      // ══════════════════════════════════════════════════════════════════
      // MODAL: Confirmar Delete
      // ══════════════════════════════════════════════════════════════════
      function openDeleteConfirmModal(fieldObj) {
         document.getElementById('tasy-modal-delete')?.remove();
         const modal = document.createElement('div');
         modal.id = 'tasy-modal-delete';
         Object.assign(modal.style, {
            position:'fixed', inset:'0', zIndex:'2000000000',
            background:'rgba(0,0,0,0.72)', display:'flex',
            alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)'
         });
         const nome = fieldObj.DS_CAMPO || `Campo #${fieldObj.NR_SEQUENCIA}`;
         modal.innerHTML = `
           <div style="background:#1e1e2e;border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:28px;width:340px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;text-align:center;">
             <div style="color:#f1f5f9;font-size:16px;font-weight:700;margin-bottom:8px;">Deletar campo?</div>
             <div style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Você está prestes a deletar permanentemente:</div>
             <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 14px;margin-bottom:12px;color:#fca5a5;font-size:13px;font-weight:600;font-family:monospace;">${nome}</div>
             <div style="color:#475569;font-size:11px;margin-bottom:20px;">Esta ação não pode ser desfeita.</div>
             <div style="display:flex;gap:10px;">
               <button id="md-cancel" style="flex:1;padding:12px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Cancelar</button>
               <button id="md-confirm" style="flex:1;padding:12px;background:#ef4444;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.3);">${icons.trash} Deletar</button>
             </div>
           </div>`;
         document.body.appendChild(modal);

         const closeModal = () => modal.remove();
         document.getElementById('md-cancel').addEventListener('click', closeModal);
         modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

         document.getElementById('md-confirm').addEventListener('click', async () => {
            if (!ctx.deleteFieldObj) { ctx.showToast('deleteFieldObj não disponível.', 'error'); return; }
            const btn = document.getElementById('md-confirm');
            btn.textContent = 'Deletando...';
            btn.disabled = true;
            try {
               await ctx.deleteFieldObj(fieldObj);
               ctx.showToast(`"${nome}" deletado.`, 'success');
               closeModal();
               loadFieldsUI();
            } catch(err) {
               ctx.showToast('Erro ao deletar: ' + err.message, 'error');
               console.error('[Studio] deleteFieldObj — payload enviado:', JSON.stringify(fieldObj, null, 2));
               console.error('[Studio] deleteFieldObj error:', err);
               btn.innerHTML = `${icons.trash} Tentar novamente`;
               btn.disabled = false;
            }
         });
      }

      // -------- LEVEL 2: CAMPOS --------
      async function loadFieldsUI() {
         renderLoading(edBody, "Analisando Componentes");
         const fields = await ctx.fetchFields(edState.bandSeq).catch(err => { edBody.innerHTML = `<div style="color:#ef4444;">Erro DB: ${err.message}</div>`; return null; });
         if (!fields) return;
         edState.rawFields = fields;
         renderFieldsUI();
      }

      function renderFieldsUI() {
         switchView('editor');
         edTitle.innerHTML = `<span style="color:#cbd5e1">${icons.field}</span> Estrutura <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${edState.bandName}</span>`;
         const fields = edState.rawFields;

         const addBtn = `
           <button id="ed-btn-add-field"
             style="width:100%; padding:10px; background:rgba(16,185,129,0.1); color:#34d399; border:1px dashed rgba(16,185,129,0.4); border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; margin-bottom:8px;"
             onmouseover="this.style.background='rgba(16,185,129,0.18)'" onmouseout="this.style.background='rgba(16,185,129,0.1)'">
             ${icons.add} Novo Campo
           </button>`;

         const pasteBtn = fieldClipboard ? `
           <button id="ed-btn-paste-field"
             style="width:100%; padding:10px; background:rgba(167,139,250,0.1); color:#a78bfa; border:1px dashed rgba(167,139,250,0.4); border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px; transition:all 0.2s;"
             onmouseover="this.style.background='rgba(167,139,250,0.2)'" onmouseout="this.style.background='rgba(167,139,250,0.1)'">
             ${icons.clone} Colar "${fieldClipboard.DS_CAMPO || 'Campo'}" &nbsp;<kbd style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;font-size:10px;">Ctrl+V</kbd>
           </button>` : '';

         if (fields.length === 0) {
            edBody.innerHTML = addBtn + pasteBtn + `<div style="color:#a0a0b0; padding:10px; text-align:center; font-size:12px;">Banda vazia — clique em Novo Campo para começar.</div>`;
            return;
         }

         const fieldTypeLabel = {
            '1': { label:'Texto',     color:'#60a5fa', bg:'rgba(96,165,250,0.12)'  },
            '0': { label:'Atributo',  color:'#34d399', bg:'rgba(52,211,153,0.12)'  },
            '11':{ label:'HTML',      color:'#f97316', bg:'rgba(249,115,22,0.12)'  },
            '28':{ label:'Imagem',    color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
            '21':{ label:'Pág.',      color:'#fbbf24', bg:'rgba(251,191,36,0.12)'  },
         };
         const getFT = (t) => fieldTypeLabel[String(t)] || { label: 'Tipo '+t, color:'#94a3b8', bg:'rgba(148,163,184,0.08)' };

         edBody.innerHTML = addBtn + pasteBtn + `<div style="display:flex; flex-direction:column; gap:5px;">` + fields.map((f, i) => {
            const isCopied = fieldClipboard?.NR_SEQUENCIA === f.NR_SEQUENCIA;
            const ft = getFT(f.IE_TIPO_CAMPO);
            const inactive = f.IE_SITUACAO === 'I';
            const hasColor = f.DS_COR_FONTE && f.DS_COR_FONTE !== 'clBlack' && f.DS_COR_FONTE !== '#000000';
            const fontColor = hasColor ? f.DS_COR_FONTE : null;
            const hasBg = f.DS_COR_FUNDO && f.DS_COR_FUNDO !== 'clWhite' && f.IE_TRANSPARENTE !== 'S';
            const bgColor = hasBg ? f.DS_COR_FUNDO : null;
            return `
             <div class="tasy-field-item" data-seq="${f.NR_SEQUENCIA}" data-index="${i}" draggable="true"
                  style="display:flex; align-items:stretch; border-radius:9px; overflow:hidden;
                         background:${isCopied ? 'rgba(167,139,250,0.07)' : 'rgba(43,43,54,0.9)'};
                         border:1px solid ${isCopied ? 'rgba(167,139,250,0.45)' : inactive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'};
                         cursor:pointer; transition:all 0.15s; position:relative;
                         opacity:${inactive ? '0.45' : '1'};"
                  onmouseover="this.style.borderColor='rgba(96,165,250,0.45)';this.style.background='rgba(59,130,246,0.05)';this.style.transform='translateX(2px)';"
                  onmouseout="this.style.borderColor='${isCopied ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.06)'}';this.style.background='${isCopied ? 'rgba(167,139,250,0.07)' : 'rgba(43,43,54,0.9)'}';this.style.transform='translateX(0)';">
               <div style="width:3px; background:${ft.color}; flex-shrink:0; opacity:0.7;"></div>
               <div style="width:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.04);">
                 <span style="color:#334155; font-size:9px; font-weight:600;">${i+1}</span>
               </div>
               <div style="flex:1; padding:8px 10px; display:flex; flex-direction:column; gap:5px; min-width:0;">
                 <div style="display:flex; align-items:center; gap:6px;">
                   <span style="color:#e2e8f0; font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${f.DS_CAMPO || '—'}</span>
                   ${isCopied ? `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;">COPIADO</span>` : ''}
                   ${inactive ? `<span style="background:rgba(239,68,68,0.12);color:#ef4444;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;">INATIVO</span>` : ''}
                 </div>
                 <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                   <span style="background:${ft.bg};color:${ft.color};border-radius:4px;padding:1px 6px;font-size:9px;font-weight:600;">${ft.label}</span>
                   <span style="background:rgba(129,140,248,0.08);color:#818cf8;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">X:${f.QT_ESQUERDA||0}</span>
                   <span style="background:rgba(52,211,153,0.08);color:#34d399;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">Y:${f.QT_TOPO||0}</span>
                   <span style="background:rgba(251,191,36,0.08);color:#fbbf24;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">W:${f.QT_TAMANHO||0}</span>
                   <span style="background:rgba(248,113,113,0.08);color:#f87171;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">H:${f.QT_ALTURA||0}</span>
                   ${fontColor ? `<span style="display:flex;align-items:center;gap:3px;background:rgba(255,255,255,0.04);border-radius:4px;padding:1px 5px;"><span style="width:8px;height:8px;border-radius:50%;background:${fontColor};border:1px solid rgba(255,255,255,0.2);flex-shrink:0;"></span><span style="color:#64748b;font-size:9px;">fonte</span></span>` : ''}
                   ${bgColor ? `<span style="display:flex;align-items:center;gap:3px;background:rgba(255,255,255,0.04);border-radius:4px;padding:1px 5px;"><span style="width:8px;height:8px;border-radius:2px;background:${bgColor};border:1px solid rgba(255,255,255,0.2);flex-shrink:0;"></span><span style="color:#64748b;font-size:9px;">fundo</span></span>` : ''}
                   ${f.QT_TAM_FONTE ? `<span style="color:#475569;font-size:9px;font-family:monospace;">${f.QT_TAM_FONTE}pt</span>` : ''}
                 </div>
               </div>
               <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:6px 8px; border-left:1px solid rgba(255,255,255,0.04);">
                 <button class="tasy-btn-clone-field" data-seq="${f.NR_SEQUENCIA}" title="Clonar campo"
                   style="border:none;background:rgba(167,139,250,0.08);color:#7c6cbb;width:26px;height:26px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s;flex-shrink:0;"
                   onmouseover="this.style.background='rgba(167,139,250,0.22)';this.style.color='#a78bfa'"
                   onmouseout="this.style.background='rgba(167,139,250,0.08)';this.style.color='#7c6cbb'">
                   ${icons.clone}
                 </button>
                 <button class="tasy-btn-delete-field" data-seq="${f.NR_SEQUENCIA}" title="Deletar campo"
                   style="border:none;background:rgba(239,68,68,0.06);color:#7f3f3f;width:26px;height:26px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s;flex-shrink:0;"
                   onmouseover="this.style.background='rgba(239,68,68,0.22)';this.style.color='#ef4444'"
                   onmouseout="this.style.background='rgba(239,68,68,0.06)';this.style.color='#7f3f3f'">
                   ${icons.trash}
                 </button>
               </div>
             </div>`;
         }).join('') + `</div>`;

         let dragSourceFieldIndex = null;
         edBody.querySelectorAll('.tasy-field-item').forEach(el => {
            el.addEventListener('dragstart', (e) => {
               window._tasyIsDragging = true;
               e.dataTransfer.effectAllowed = 'move';
               dragSourceFieldIndex = parseInt(el.getAttribute('data-index'));
               el.style.opacity = '0.5';
            });
            el.addEventListener('dragover', (e) => {
               e.preventDefault();
               e.dataTransfer.dropEffect = 'move';
               el.style.border = '1px dashed #3b82f6';
               el.style.transform = 'translateX(2px)';
            });
            el.addEventListener('dragleave', (e) => {
               const inactive = el.style.opacity === '0.45';
               const isCopied = String(fieldClipboard?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
               el.style.border = isCopied ? '1px solid rgba(167,139,250,0.45)' : inactive ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.06)';
               el.style.transform = 'none';
            });
            el.addEventListener('drop', (e) => {
               e.stopPropagation();
               const dropTargetIndex = parseInt(el.getAttribute('data-index'));
               const inactive = el.style.opacity === '0.45';
               const isCopied = String(fieldClipboard?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
               el.style.border = isCopied ? '1px solid rgba(167,139,250,0.45)' : inactive ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.06)';
               el.style.transform = 'none';
               
               if (dragSourceFieldIndex !== null && dragSourceFieldIndex !== dropTargetIndex) {
                  handleFieldReorder(dragSourceFieldIndex, dropTargetIndex);
               }
               setTimeout(() => { window._tasyIsDragging = false; }, 100);
               return false;
            });
            el.addEventListener('dragend', () => {
               const inactive = el.getAttribute('data-inactive') === 'true'; // will be fixed in next line if needed. We already set it in template inline
               el.style.opacity = el.innerHTML.includes('INATIVO') ? '0.45' : '1';
               setTimeout(() => { window._tasyIsDragging = false; }, 100);
            });
         });
      }

      function handleFieldReorder(fromIdx, toIdx) {
         const fields = [...edState.rawFields];
         const [movedItem] = fields.splice(fromIdx, 1);
         fields.splice(toIdx, 0, movedItem);
         edState.rawFields = fields;
         renderFieldsUI(); // Updates UI locally
      }

      async function pasteField() {
         if (!fieldClipboard) return;
         const btn = document.getElementById('ed-btn-paste-field');
         if (btn) { btn.textContent = 'Colando...'; btn.disabled = true; }
         try {
            await ctx.cloneFieldObj(fieldClipboard);
            ctx.showToast(`"${fieldClipboard.DS_CAMPO || 'Campo'}" colado!`, 'success');
            const fields = await ctx.fetchFields(edState.bandSeq);
            edState.rawFields = fields;
            renderFieldsUI();
         } catch(err) {
            ctx.showToast('Erro ao colar campo: ' + err.message, 'error');
            renderFieldsUI();
         }
      }

      document.addEventListener('keydown', (e) => {
         if (edState.level !== 2) return;
         const isCopy  = (e.ctrlKey || e.metaKey) && e.key === 'c';
         const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
         if (!isCopy && !isPaste) return;

         if (isCopy) {
            e.preventDefault();
            const hovered = edBody.querySelector('.tasy-field-item:hover');
            if (!hovered) { ctx.showToast('Passe o mouse sobre um campo e aperte Ctrl+C', 'info'); return; }
            const seq = hovered.getAttribute('data-seq');
            const fieldObj = edState.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
            if (!fieldObj) return;
            fieldClipboard = fieldObj;
            renderFieldsUI();
            ctx.showToast(`Campo "${fieldObj.DS_CAMPO || 'Campo'}" copiado! Ctrl+V para colar.`, 'success');
         }

         if (isPaste) {
            e.preventDefault();
            pasteField();
         }
      });

      async function pasteBand() {
         if (!bandClipboard) return;
         const btn = document.getElementById('ed-btn-paste-band');
         if (btn) { btn.textContent = 'Colando...'; btn.disabled = true; }
         try {
            const newBand = await ctx.cloneBandObj(bandClipboard.bandObj);
            ctx.showToast(`"${bandClipboard.bandObj.DS_BANDA}" colada com ${bandClipboard.fieldCount} campo(s)!`, 'success');
            const bands = await ctx.fetchBands(edState.reportSeq);
            edState.rawBands = bands;
            renderBandsUI();
         } catch(err) {
            ctx.showToast('Erro ao colar banda: ' + err.message, 'error');
            console.error('[Studio] pasteBand error:', err);
            renderBandsUI();
         }
      }

      document.addEventListener('keydown', async (e) => {
         if (edState.level !== 1) return;
         const isCopy  = (e.ctrlKey || e.metaKey) && e.key === 'c';
         const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
         if (!isCopy && !isPaste) return;

         const hovered = edBody.querySelector('.tasy-band-item:hover');

         if (isCopy) {
            e.preventDefault();
            const target = hovered;
            if (!target) { ctx.showToast('Passe o mouse sobre uma banda e aperte Ctrl+C', 'info'); return; }
            const seq = target.getAttribute('data-seq');
            const bandObj = edState.rawBands.find(b => String(b.NR_SEQUENCIA) === String(seq));
            if (!bandObj) return;
            let fieldCount = 0;
            try { const f = await ctx.fetchFields(seq); fieldCount = f.length; } catch(_) {}
            setBandClipboard(bandObj, fieldCount);
            ctx.showToast(`Banda "${bandObj.DS_BANDA}" copiada! Ctrl+V para colar.`, 'success');
         }

         if (isPaste) {
            e.preventDefault();
            pasteBand();
         }
      });

      // -------- LEVEL 3: FORMULÁRIO DE EDIÇÃO — abre em janela separada --------
      async function loadEditFormUI() {
         const f = edState.activeField;
         edState.fieldSnapshot = { ...f };

         // [JANELA SEPARADA] Fecha/reutiliza janela do editor
         const winName = '__tasy_studio_editor__';
         const isWinUsable = () => {
            try { return editorWindow && !editorWindow.closed && editorWindow.document; } catch(e) { return false; }
         };

         if (!isWinUsable()) {
            editorWindow = window.open('', winName, 'width=1200,height=800,resizable=yes,scrollbars=no');
         }

         if (!editorWindow) {
            ctx.showToast('Popup bloqueado — permita popups para este site.', 'error');
            edState.level = 2;
            return;
         }

         // Monta o HTML da janela com os ícones e estilos necessários
         const iconsSerialized = JSON.stringify(icons);
         editorWindow.document.open();
         editorWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Studio — ${f.DS_CAMPO || 'Campo'} [${edState.reportCode}]</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111116; font-family: system-ui, sans-serif; overflow: hidden; }
    input, select { color-scheme: dark; }
    input:focus, select:focus { border-color: #3b82f6 !important; background: rgba(59,130,246,0.05) !important; outline: none; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3f3f5a; border-radius: 3px; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  </style>
</head>
<body>
  <div id="root" style="width:100vw;height:100vh;display:flex;flex-direction:column;"></div>
</body>
</html>`);
         editorWindow.document.close();

         // Aguarda DOM estar pronto
         await new Promise(res => setTimeout(res, 80));

         const wd = editorWindow.document;
         const root = wd.getElementById('root');
         if (!root) { ctx.showToast('Erro ao montar janela do editor.', 'error'); return; }

         // Ícones disponíveis na janela filha
         const ic = icons;

         // Cabeçalho da janela
         const header = wd.createElement('div');
         header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#1a1a22;border-bottom:1px solid #2b2b36;flex-shrink:0;gap:12px;';
         header.innerHTML = `
           <div style="display:flex;align-items:center;gap:10px;">
             <span style="color:#64748b;font-size:12px;">Studio</span>
             <span style="color:#334155;">›</span>
             <span style="color:#94a3b8;font-size:12px;">${edState.reportCode}</span>
             <span style="color:#334155;">›</span>
             <span style="color:#60a5fa;font-size:12px;font-weight:600;">${f.DS_CAMPO || 'Campo'}</span>
           </div>
           <div style="display:flex;gap:8px;">
             <button id="win-btn-preview" style="border:none;background:rgba(16,185,129,0.15);color:#34d399;padding:6px 12px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;">${ic.print} PDF Preview</button>
             <button id="win-btn-close" style="border:none;background:rgba(239,68,68,0.12);color:#ef4444;padding:6px 12px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;">✕ Fechar</button>
           </div>`;
         root.appendChild(header);

         // Corpo principal
         const body = wd.createElement('div');
         body.style.cssText = 'display:flex;flex:1;overflow:hidden;';
         body.innerHTML = `
           <div id="win-form-panel" style="width:380px;min-width:380px;background:#1e1e24;border-right:1px solid #2b2b36;display:flex;flex-direction:column;gap:16px;padding:20px;overflow-y:auto;scrollbar-width:thin;">
             <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
               <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição X</label>
               <input type="number" id="ed-inp-left" value="${f.QT_ESQUERDA||0}" style="width:100%;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;"></div>
               <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição Y</label>
               <input type="number" id="ed-inp-top" value="${f.QT_TOPO||0}" style="width:100%;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;"></div>
               <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Largura</label>
               <input type="number" id="ed-inp-width" value="${f.QT_TAMANHO||0}" style="width:100%;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;"></div>
               <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Altura</label>
               <input type="number" id="ed-inp-height" value="${f.QT_ALTURA||0}" style="width:100%;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;"></div>
             </div>
             <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">String de Conteúdo (DS_CONTEUDO)</label>
             <input type="text" id="ed-inp-text" value="${f.DS_CONTEUDO||''}" style="width:100%;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;"></div>
             <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;">
               <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Fonte</label>
               <input type="number" id="ed-inp-fontsize" value="${f.QT_TAM_FONTE||0}" style="width:100%;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;"></div>
               <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Fonte</label>
               <div style="display:flex;gap:8px;">
                 <input type="color" id="ed-inp-colorpicker" value="#ffffff" style="width:38px;height:38px;padding:0;background:transparent;border:none;border-radius:6px;cursor:pointer;">
                 <input type="text" id="ed-inp-fontcolor" value="${f.DS_COR_FONTE||''}" style="flex:1;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;" placeholder="clBlack">
               </div></div>
             </div>
             <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Label</label>
             <div style="display:flex;gap:8px;">
               <input type="color" id="ed-inp-labelcolorpicker" value="#ffffff" style="width:38px;height:38px;padding:0;background:transparent;border:none;border-radius:6px;cursor:pointer;">
               <input type="text" id="ed-inp-labelcolor" value="${f.DS_COR_LABEL||''}" style="flex:1;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;" placeholder="clBlack">
             </div></div>
             <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
               <select id="ed-inp-align" style="width:100%;height:38px;padding:0 10px;background:#2b2b36;border:1px solid #3f3f5a;color:#f8fafc;border-radius:6px;font-size:12px;outline:none;color-scheme:dark;">
                 <option value="" ${!f.IE_ALINHAMENTO?'selected':''}>Alinh. Padrão</option>
                 <option value="E" ${f.IE_ALINHAMENTO==='E'?'selected':''}>Esquerda</option>
                 <option value="C" ${f.IE_ALINHAMENTO==='C'?'selected':''}>Centro</option>
                 <option value="D" ${f.IE_ALINHAMENTO==='D'?'selected':''}>Direita</option>
               </select>
               <select id="ed-inp-fontstyle" style="width:100%;height:38px;padding:0 10px;background:#2b2b36;border:1px solid #3f3f5a;color:#f8fafc;border-radius:6px;font-size:12px;outline:none;color-scheme:dark;">
                 <option value="">---</option>
                 <option value="N">Negrito</option>
                 <option value="I">Itálico</option>
                 <option value="NI">Negrito e Itálico</option>
                 <option value="S">Sublinhado</option>
                 <option value="NS">Negrito e Sublinhado</option>
                 <option value="IS">Itálico e sublinhado</option>
                 <option value="NIS">Negrito, Itálico e Sublinhado</option>
               </select>
             </div>
             <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
               <label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:8px;display:block;">Fundo</label>
               <div style="display:flex;gap:8px;margin-bottom:10px;">
                 <input type="color" id="ed-inp-bgcolorpicker" value="#ffffff" style="width:38px;height:38px;padding:0;background:transparent;border:none;border-radius:6px;cursor:pointer;">
                 <input type="text" id="ed-inp-bgcolor" value="${f.DS_COR_FUNDO||''}" style="flex:1;padding:10px;background:#2b2b36;border:1px solid #3f3f5a;color:white;border-radius:6px;font-size:13px;outline:none;" placeholder="clWhite">
               </div>
               <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:#f8fafc;font-size:12px;padding:8px 10px;background:#2b2b36;border:1px solid #3f3f5a;border-radius:6px;">
                 <input type="checkbox" id="ed-chk-transp" ${f.IE_TRANSPARENTE==='S'?'checked':''}> Fundo Transparente
               </label>
             </div>
             <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
               <label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:8px;display:block;">Bordas</label>
               <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                 <label style="color:white;font-size:11px;border:1px solid #3f3f5a;padding:6px;border-radius:4px;background:#2b2b36;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="ed-chk-borda-sup" ${f.IE_BORDA_SUP==='S'?'checked':''}> Topo</label>
                 <label style="color:white;font-size:11px;border:1px solid #3f3f5a;padding:6px;border-radius:4px;background:#2b2b36;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="ed-chk-borda-inf" ${f.IE_BORDA_INF==='S'?'checked':''}> Base</label>
                 <label style="color:white;font-size:11px;border:1px solid #3f3f5a;padding:6px;border-radius:4px;background:#2b2b36;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="ed-chk-borda-esq" ${f.IE_BORDA_ESQ==='S'?'checked':''}> Esq.</label>
                 <label style="color:white;font-size:11px;border:1px solid #3f3f5a;padding:6px;border-radius:4px;background:#2b2b36;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="ed-chk-borda-dir" ${f.IE_BORDA_DIR==='S'?'checked':''}> Dir.</label>
               </div>
             </div>
             <div style="display:flex;gap:8px;margin-top:auto;">
               <button id="ed-btn-undo" title="Desfazer (Ctrl+Z)" style="padding:14px 10px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;opacity:0.4;" disabled>${ic.undo}</button>
               <button id="ed-btn-redo" title="Refazer (Ctrl+Y)" style="padding:14px 10px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;display:flex;align-items:center;transition:all 0.2s;opacity:0.4;" disabled>${ic.redo}</button>
               <button id="ed-btn-save" style="flex:1;padding:14px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px rgba(59,130,246,0.3);transition:all 0.2s;">${ic.save} Aplicar Alterações</button>
             </div>
           </div>
           <div style="flex:1;background:#525659;display:flex;flex-direction:column;position:relative;overflow:hidden;">
             <div id="tasy-pdf-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#525659;color:white;z-index:10;">
               <div style="text-align:center;">
                 <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Gerando PDF Real...</div>
                 <div style="color:#94a3b8;font-size:13px;">Aguardando resposta do Tasy</div>
               </div>
             </div>
             <div id="tasy-sync-badge" style="position:absolute;top:20px;right:20px;background:rgba(59,130,246,0.9);color:white;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:600;z-index:20;opacity:0;transform:translateY(-10px);transition:all 0.3s;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
               <span style="display:inline-block;width:8px;height:8px;background:white;border-radius:50%;margin-right:6px;animation:pulse 1s infinite;box-shadow:0 0 4px white;"></span> Sincronizando...
             </div>
             <iframe id="tasy-pdf-iframe-A" style="position:absolute;inset:0;width:100%;height:100%;border:none;transition:opacity 0.1s ease-in-out;z-index:2;opacity:1;"></iframe>
             <iframe id="tasy-pdf-iframe-B" style="position:absolute;inset:0;width:100%;height:100%;border:none;transition:opacity 0.1s ease-in-out;z-index:1;opacity:0;"></iframe>
           </div>`;
         root.appendChild(body);

         // Foca a janela
         editorWindow.focus();

         // Notifica o spotlight que o editor está aberto (volta ao level 2 visualmente)
         collapseSearch();

         // Ao fechar a janela, volta o state para level 2
         editorWindow.onbeforeunload = () => {
            edState.level = 2;
            if (ctx.cancelPendingGeneration) ctx.cancelPendingGeneration();
         };

         // ── Botões do header da janela ────────────────────────────────
         wd.getElementById('win-btn-preview').addEventListener('click', () => {
            if (edState.reportCode && ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);
         });
         wd.getElementById('win-btn-close').addEventListener('click', () => {
            editorWindow.close();
            edState.level = 2;
            loadFieldsUI();
            // Reabre o spotlight no nível de campos
            nav.style.display = '';
            nav.style.opacity = '1';
            switchView('editor');
         });

         // ── Lógica de save / undo / redo (igual ao original, mas usando wd) ──
         const $ = (id) => wd.getElementById(id);
         const inputs = wd.querySelectorAll('#win-form-panel input, #win-form-panel select');
         const pdfLoading = $('tasy-pdf-loading');
         let saveTimer = null;
         const selectToDb = (val) => val === '' ? null : val;
         let lastSavedObj = { ...f };
         let isSaving = false;
         let pendingSave = false;
         let isReverting = false;

         const undoStack = [];
         const redoStack = [];
         const UNDO_LIMIT = 50;

         function pushUndo(stateSnapshot) {
            undoStack.push({ ...stateSnapshot });
            if (undoStack.length > UNDO_LIMIT) undoStack.shift();
            redoStack.length = 0;
            updateUndoRedoUI();
         }

         function updateUndoRedoUI() {
            const undoBtn = $('ed-btn-undo');
            const redoBtn = $('ed-btn-redo');
            if (undoBtn) { const can = undoStack.length > 0; undoBtn.disabled = !can; undoBtn.style.opacity = can ? '1' : '0.4'; undoBtn.style.color = can ? '#f1f5f9' : '#94a3b8'; }
            if (redoBtn) { const can = redoStack.length > 0; redoBtn.disabled = !can; redoBtn.style.opacity = can ? '1' : '0.4'; redoBtn.style.color = can ? '#f1f5f9' : '#94a3b8'; }
         }

         const colorPicker      = $('ed-inp-colorpicker');
         const labelColorPicker = $('ed-inp-labelcolorpicker');
         const bgColorPicker    = $('ed-inp-bgcolorpicker');

         function applyStateToForm(s) {
            isReverting = true;
            clearTimeout(saveTimer);
            $('ed-inp-left').value      = s.QT_ESQUERDA    || 0;
            $('ed-inp-top').value       = s.QT_TOPO        || 0;
            $('ed-inp-width').value     = s.QT_TAMANHO     || 0;
            $('ed-inp-height').value    = s.QT_ALTURA      || 0;
            $('ed-inp-fontsize').value  = s.QT_TAM_FONTE   || 0;
            $('ed-inp-text').value      = s.DS_CONTEUDO    || '';
            $('ed-inp-fontcolor').value    = s.DS_COR_FONTE  || '';
            $('ed-inp-labelcolor').value   = s.DS_COR_LABEL  || '';
            $('ed-inp-align').value        = s.IE_ALINHAMENTO || '';
            $('ed-inp-fontstyle').value    = s.DS_ESTILO_FONTE || '';
            $('ed-chk-transp').checked     = s.IE_TRANSPARENTE === 'S';
            $('ed-chk-borda-sup').checked  = s.IE_BORDA_SUP   === 'S';
            $('ed-chk-borda-inf').checked  = s.IE_BORDA_INF   === 'S';
            $('ed-chk-borda-esq').checked  = s.IE_BORDA_ESQ   === 'S';
            $('ed-chk-borda-dir').checked  = s.IE_BORDA_DIR   === 'S';
            if (colorPicker)      colorPicker.value      = ctx.tasyToHex ? ctx.tasyToHex(s.DS_COR_FONTE)  : '#000000';
            if (labelColorPicker) labelColorPicker.value = ctx.tasyToHex ? ctx.tasyToHex(s.DS_COR_LABEL)  : '#ffffff';
            if (bgColorPicker)    bgColorPicker.value    = ctx.tasyToHex ? ctx.tasyToHex(s.DS_COR_FUNDO)  : '#ffffff';
            isReverting = false;
         }

         function readFormState() {
            return {
               QT_ESQUERDA:     Number($('ed-inp-left')?.value)     || 0,
               QT_TOPO:         Number($('ed-inp-top')?.value)      || 0,
               QT_TAMANHO:      Number($('ed-inp-width')?.value)    || 0,
               QT_ALTURA:       Number($('ed-inp-height')?.value)   || 0,
               QT_TAM_FONTE:    Number($('ed-inp-fontsize')?.value) || 0,
               DS_CONTEUDO:     $('ed-inp-text')?.value      ?? '',
               DS_COR_FONTE:    $('ed-inp-fontcolor')?.value ?? '',
               DS_COR_LABEL:    $('ed-inp-labelcolor')?.value ?? '',
               DS_COR_FUNDO:    $('ed-inp-bgcolor')?.value   ?? '',
               IE_TRANSPARENTE: $('ed-chk-transp')?.checked     ? 'S' : 'N',
               IE_ALINHAMENTO:  selectToDb($('ed-inp-align')?.value     ?? ''),
               DS_ESTILO_FONTE: selectToDb($('ed-inp-fontstyle')?.value ?? ''),
               IE_BORDA_SUP:    $('ed-chk-borda-sup')?.checked ? 'S' : 'N',
               IE_BORDA_INF:    $('ed-chk-borda-inf')?.checked ? 'S' : 'N',
               IE_BORDA_ESQ:    $('ed-chk-borda-esq')?.checked ? 'S' : 'N',
               IE_BORDA_DIR:    $('ed-chk-borda-dir')?.checked ? 'S' : 'N',
            };
         }

         function isDirty(a, b) { return JSON.stringify(a) !== JSON.stringify(b); }

         const enqueueAndSave = (immediate = false) => {
            if (isReverting) return;
            clearTimeout(saveTimer);
            const run = async () => {
               if (isSaving) { pendingSave = true; return; }
               const formState = readFormState();
               const newObj = { ...f, ...formState };
               if (!isDirty(lastSavedObj, newObj)) return;
               isSaving = true;
               try {
                  pushUndo(lastSavedObj);
                  await ctx.updateFieldObj(lastSavedObj, newObj);
                  lastSavedObj = { ...newObj };
                  Object.assign(edState.activeField, newObj);
                  if (ctx.scheduleRefresh) ctx.scheduleRefresh(edState.reportCode, 0);
               } catch (err) {
                  console.error('[Studio] Save Error:', err.message);
               } finally {
                  isSaving = false;
                  if (pendingSave) { pendingSave = false; run(); }
               }
            };
            if (immediate) run();
            else saveTimer = setTimeout(run, 300);
         };

         inputs.forEach(inp => {
            if (inp.type === 'checkbox') {
               inp.addEventListener('change', () => enqueueAndSave());
            } else if (inp.tagName === 'SELECT') {
               inp.addEventListener('change', () => enqueueAndSave());
            } else {
               inp.addEventListener('blur', () => enqueueAndSave());
               let arrowTimer;
               inp.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') enqueueAndSave(true);
                  if (inp.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                     const step = e.shiftKey ? 10 : 1;
                     const val = Number(inp.value);
                     inp.value = e.key === 'ArrowUp' ? val + step : val - step;
                     e.preventDefault();
                     clearTimeout(arrowTimer);
                     arrowTimer = setTimeout(enqueueAndSave, 400);
                  }
               });
            }
         });

         // Seta valores dos color pickers após render
         if (colorPicker) {
            colorPicker.value = ctx.tasyToHex ? ctx.tasyToHex($('ed-inp-fontcolor').value) : '#000000';
            colorPicker.addEventListener('change', (e) => { $('ed-inp-fontcolor').value = e.target.value.toUpperCase(); enqueueAndSave(); });
         }
         if (labelColorPicker) {
            labelColorPicker.value = ctx.tasyToHex ? ctx.tasyToHex($('ed-inp-labelcolor').value) : '#000000';
            labelColorPicker.addEventListener('change', (e) => { $('ed-inp-labelcolor').value = e.target.value.toUpperCase(); enqueueAndSave(); });
         }
         if (bgColorPicker) {
            bgColorPicker.value = ctx.tasyToHex ? ctx.tasyToHex($('ed-inp-bgcolor').value) : '#ffffff';
            bgColorPicker.addEventListener('change', (e) => { $('ed-inp-bgcolor').value = e.target.value.toUpperCase(); enqueueAndSave(); });
         }

         // Seta estilo da fonte
         const fontStyleSel = $('ed-inp-fontstyle');
         if (fontStyleSel) {
            const valid = ['N','I','NI','S','NS','IS','NIS'];
            fontStyleSel.value = valid.includes(f.DS_ESTILO_FONTE) ? f.DS_ESTILO_FONTE : '';
         }

         // Undo
         $('ed-btn-undo')?.addEventListener('click', async () => {
            if (undoStack.length === 0) return;
            const current = { ...lastSavedObj };
            const prev = undoStack.pop();
            redoStack.push(current);
            applyStateToForm(prev);
            updateUndoRedoUI();
            const newObj = { ...lastSavedObj, ...prev };
            await ctx.updateFieldObj(lastSavedObj, newObj);
            lastSavedObj = { ...newObj };
            Object.assign(edState.activeField, newObj);
            if (ctx.scheduleRefresh) ctx.scheduleRefresh(edState.reportCode, 0);
         });

         // Redo
         $('ed-btn-redo')?.addEventListener('click', async () => {
            if (redoStack.length === 0) return;
            const current = { ...lastSavedObj };
            const next = redoStack.pop();
            undoStack.push(current);
            applyStateToForm(next);
            updateUndoRedoUI();
            const newObj = { ...lastSavedObj, ...next };
            await ctx.updateFieldObj(lastSavedObj, newObj);
            lastSavedObj = { ...newObj };
            Object.assign(edState.activeField, newObj);
            if (ctx.scheduleRefresh) ctx.scheduleRefresh(edState.reportCode, 0);
         });

         // Atalhos Ctrl+Z / Ctrl+Y na janela filha
         editorWindow.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); $('ed-btn-undo')?.click(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); $('ed-btn-redo')?.click(); }
         });

         // Botão Salvar
         $('ed-btn-save').addEventListener('click', async () => {
            const btn = $('ed-btn-save');
            btn.innerHTML = 'Aplicando...';
            await enqueueAndSave(true);
            btn.innerHTML = `${ic.save} Aplicar Alterações`;
         });

         // Integração com updateOrOpenPreview para usar os iframes da janela filha
         const _origUpdateOrOpen = ctx.updateOrOpenPreview.bind(ctx);
         ctx.updateOrOpenPreview = function(pdfUrl) {
            if (!isWinUsable()) { ctx.updateOrOpenPreview = _origUpdateOrOpen; _origUpdateOrOpen(pdfUrl); return; }
            const iA = $('tasy-pdf-iframe-A');
            const iB = $('tasy-pdf-iframe-B');
            if (!iA || !iB) { _origUpdateOrOpen(pdfUrl); return; }
            const isAVisible = iA.style.opacity !== '0';
            const active = isAVisible ? iA : iB;
            const hidden = isAVisible ? iB : iA;
            const loader = $('tasy-pdf-loading');
            const badge  = $('tasy-sync-badge');
            if (badge && (!loader || loader.style.display === 'none')) { badge.style.opacity = '1'; badge.style.transform = 'translateY(0)'; }
            hidden.onload = () => {
               hidden.style.opacity = '1'; hidden.style.zIndex = '2';
               active.style.opacity = '0'; active.style.zIndex = '1';
               if (loader) loader.style.display = 'none';
               if (badge) { badge.style.opacity = '0'; badge.style.transform = 'translateY(-10px)'; }
            };
            hidden.src = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
         };

         // Restaura updateOrOpenPreview ao fechar
         editorWindow.addEventListener('beforeunload', () => {
            ctx.updateOrOpenPreview = _origUpdateOrOpen;
         });

         // Gera PDF inicial
         if (ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);
      }

      // NAVEGAÇÃO (edBack só ativo nos levels 1 e 2 agora)
      edBack.addEventListener('click', () => {
         ctx.removeGhostField();
         if (ctx.cancelPendingGeneration) ctx.cancelPendingGeneration();
         if (edState.level === 3) {
            // Fecha janela separada se estiver aberta
            try { if (editorWindow && !editorWindow.closed) editorWindow.close(); } catch(e) {}
            edState.level = 2;
            loadFieldsUI();
         } else if (edState.level === 2) {
            edState.level = 1;
            loadBandsUI();
         } else if (edState.level === 1) {
            edState.level = 0;
            switchView('search');
         }
      });

      // ── Botão Importar (Spotlight + Studio)
      function openImportModal() {
         document.getElementById('tasy-modal-import-standalone')?.remove();
         const m = document.createElement('div');
         m.id = 'tasy-modal-import-standalone';
         Object.assign(m.style, {
            position:'fixed', inset:'0', zIndex:'2000000000',
            background:'rgba(0,0,0,0.72)', display:'flex',
            alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)'
         });
         m.innerHTML = `
           <div style="background:#1e1e2e;border:1px solid rgba(34,197,94,0.35);border-radius:14px;padding:24px;width:380px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;">
             <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
               <span style="color:#f1f5f9;font-size:15px;font-weight:700;">↑ Importar Relatório XML</span>
               <button id="imp-close" style="background:none;border:none;color:#475569;cursor:pointer;font-size:20px;line-height:1;padding:2px 6px;">✕</button>
             </div>
             <div style="color:#475569;font-size:12px;margin-bottom:18px;">Importa o relatório exatamente como exportado pelo Tasy Studio ou pelo Tasy nativo.</div>
             <label id="imp-drop-zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:32px 20px;background:#2b2b3e;border:2px dashed rgba(34,197,94,0.3);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;">
               <div style="width:48px;height:48px;background:rgba(34,197,94,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#22c55e;font-size:24px;font-weight:700;">↑</div>
               <div>
                 <div style="color:#f1f5f9;font-size:13px;font-weight:600;">Clique ou arraste o arquivo</div>
                 <div id="imp-hint" style="color:#475569;font-size:11px;margin-top:4px;">Aceita arquivos .xml exportados pelo Studio</div>
               </div>
               <input id="imp-file-input" type="file" accept=".xml" style="display:none;">
             </label>
           </div>`;
         document.body.appendChild(m);

         const closeImp = () => m.remove();
         document.getElementById('imp-close').addEventListener('click', closeImp);
         m.addEventListener('mousedown', (e) => { if (e.target === m) closeImp(); });

         const dropZone = document.getElementById('imp-drop-zone');
         const fileInput = document.getElementById('imp-file-input');
         const hint      = document.getElementById('imp-hint');

         async function runImportStandalone(file) {
            if (!file || !file.name.match(/\.xml$/i)) { ctx.showToast('Selecione um arquivo .xml válido.', 'error'); return; }
            dropZone.style.borderColor = 'rgba(34,197,94,0.8)';
            dropZone.style.background  = 'rgba(34,197,94,0.08)';
            dropZone.style.pointerEvents = 'none';
            hint.textContent = `Enviando "${file.name}"...`;
            try {
               const fd = new FormData();
               fd.append('file', file, file.name);
               const up = await fetch('/TasyAppServer/resources/files', { method: 'POST', body: fd, credentials: 'include' });
               if (!up.ok) throw new Error('Upload falhou: HTTP ' + up.status);
               const upResult = await up.json();
               const xmlPath  = Array.isArray(upResult) ? upResult[0] : upResult;
               if (!xmlPath?.startsWith('tasy-storage://')) throw new Error('Path inválido: ' + JSON.stringify(xmlPath));
               hint.textContent = 'Registrando...';
               const http = ctx.getHttpService();
               if (!http) throw new Error('Angular não está pronto.');
               await http.post('/TasyAppServer/resources/service/CorSisFQ/importXMLReportAction', [{ tipo: 'HashMap', valor: { XML_PATH: xmlPath } }], { suppressError: true, ignoreError: true });
               hint.textContent = 'Aplicando...';
               let nrSeq = null;
               try {
                  const doc = new DOMParser().parseFromString(await file.text(), 'text/xml');
                  const reg = doc.querySelector('Tabela[nm_tabela="W_RELATORIO"] registros registro');
                  if (reg) nrSeq = parseInt(reg.getAttribute('NR_SEQUENCIA'));
               } catch(e) {}
               if (!nrSeq) throw new Error('Não foi possível extrair NR_SEQUENCIA do XML.');
               const r3 = await http.post('/TasyAppServer/resources/service/CorSisFQ/atualizarBaseRelatorioImp', [{ tipo: 'HashMap', valor: { NR_SEQUENCIA: nrSeq } }], { suppressError: true, ignoreError: true });
               const newSeq = r3?.data?.dados;
               ctx.showToast(`Relatório importado! Abrindo editor...`, 'success');
               closeImp();
               if (newSeq) {
                  let cdRelatorio = '';
                  try {
                     const doc2 = new DOMParser().parseFromString(await file.text(), 'text/xml');
                     const reg2 = doc2.querySelector('Tabela[nm_tabela="W_RELATORIO"] registros registro');
                     cdRelatorio = reg2?.getAttribute('CD_RELATORIO') || '';
                  } catch(e) {}
                  edState.reportSeq  = newSeq;
                  edState.reportCode = cdRelatorio || String(newSeq);
                  edState.level      = 1;
                  await loadBandsUI();
               }
            } catch(err) {
               ctx.showToast('Erro ao importar: ' + err.message, 'error');
               console.error('[Studio] import error:', err);
               dropZone.style.borderColor   = 'rgba(34,197,94,0.3)';
               dropZone.style.background    = '#2b2b3e';
               dropZone.style.pointerEvents = '';
               hint.textContent = 'Aceita arquivos .xml exportados pelo Studio';
            }
         }

         fileInput.addEventListener('change', () => { if (fileInput.files?.[0]) runImportStandalone(fileInput.files[0]); });
         dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.style.borderColor='rgba(34,197,94,0.8)'; dropZone.style.background='rgba(34,197,94,0.08)'; });
         dropZone.addEventListener('dragleave', ()  => { dropZone.style.borderColor='rgba(34,197,94,0.3)'; dropZone.style.background='#2b2b3e'; });
         dropZone.addEventListener('drop', (e) => { e.preventDefault(); const f=e.dataTransfer?.files?.[0]; if(f) runImportStandalone(f); });
      }

      document.getElementById('tasy-spotlight-import-btn')?.addEventListener('click', openImportModal);
      document.getElementById('tasy-studio-import-btn')?.addEventListener('click', openImportModal);

      edExport.addEventListener('click', () => {
         if (!edState.reportSeq) { ctx.showToast('Abra um relatório antes de exportar.', 'error'); return; }
         openExportModal();
      });

      function openExportModal() {
         document.getElementById('tasy-modal-export')?.remove();
         const modal = document.createElement('div');
         modal.id = 'tasy-modal-export';
         Object.assign(modal.style, {
            position:'fixed', inset:'0', zIndex:'2000000000',
            background:'rgba(0,0,0,0.72)', display:'flex',
            alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)'
         });
         modal.innerHTML = `
           <div style="background:#1e1e2e;border:1px solid rgba(96,165,250,0.3);border-radius:14px;padding:24px;width:400px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;">
             <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
               <span style="color:#f1f5f9;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;">${icons.exportIcon} Exportar / Importar</span>
               <button id="exp-close" style="background:none;border:none;color:#475569;cursor:pointer;font-size:20px;line-height:1;padding:2px 6px;">✕</button>
             </div>
             <div style="color:#475569;font-size:12px;margin-bottom:18px;">Relatório <span style="color:#60a5fa;font-weight:600;">${edState.reportCode}</span></div>
             <div style="display:flex;flex-direction:column;gap:10px;">
               <button id="exp-xml" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#2b2b3e;border:1px solid rgba(96,165,250,0.2);border-radius:10px;cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.borderColor='rgba(96,165,250,0.6)';this.style.background='rgba(96,165,250,0.08)'" onmouseout="this.style.borderColor='rgba(96,165,250,0.2)';this.style.background='#2b2b3e'">
                 <div style="width:38px;height:38px;background:rgba(96,165,250,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#60a5fa;font-size:14px;font-weight:800;">XML</div>
                 <div><div style="color:#f1f5f9;font-size:13px;font-weight:600;">Estrutura Completa</div><div style="color:#475569;font-size:11px;margin-top:2px;">Bandas, campos e parâmetros — compatível com importação</div></div>
               </button>
               <button id="exp-pdf" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#2b2b3e;border:1px solid rgba(239,68,68,0.2);border-radius:10px;cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.borderColor='rgba(239,68,68,0.6)';this.style.background='rgba(239,68,68,0.08)'" onmouseout="this.style.borderColor='rgba(239,68,68,0.2)';this.style.background='#2b2b3e'">
                 <div style="width:38px;height:38px;background:rgba(239,68,68,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ef4444;font-size:14px;font-weight:800;">PDF</div>
                 <div><div style="color:#f1f5f9;font-size:13px;font-weight:600;">Gerar e Baixar PDF</div><div style="color:#475569;font-size:11px;margin-top:2px;">Gera o relatório e baixa o arquivo PDF gerado</div></div>
               </button>
               <button id="exp-json" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#2b2b3e;border:1px solid rgba(167,139,250,0.2);border-radius:10px;cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.borderColor='rgba(167,139,250,0.6)';this.style.background='rgba(167,139,250,0.08)'" onmouseout="this.style.borderColor='rgba(167,139,250,0.2)';this.style.background='#2b2b3e'">
                 <div style="width:38px;height:38px;background:rgba(167,139,250,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#a78bfa;font-size:12px;font-weight:800;">JSON</div>
                 <div><div style="color:#f1f5f9;font-size:13px;font-weight:600;">Backup Legível</div><div style="color:#475569;font-size:11px;margin-top:2px;">Estrutura completa em JSON — fácil de ler e editar</div></div>
               </button>
               <div style="height:1px;background:rgba(255,255,255,0.06);margin:4px 0;"></div>
               <label id="exp-import-label" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#2b2b3e;border:1px solid rgba(34,197,94,0.2);border-radius:10px;cursor:pointer;transition:all 0.2s;text-align:left;width:100%;box-sizing:border-box;" onmouseover="this.style.borderColor='rgba(34,197,94,0.6)';this.style.background='rgba(34,197,94,0.06)'" onmouseout="this.style.borderColor='rgba(34,197,94,0.2)';this.style.background='#2b2b3e'">
                 <div style="width:38px;height:38px;background:rgba(34,197,94,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#22c55e;font-size:18px;font-weight:700;">↑</div>
                 <div style="flex:1;"><div style="color:#f1f5f9;font-size:13px;font-weight:600;">Importar XML</div><div id="exp-import-hint" style="color:#475569;font-size:11px;margin-top:2px;">Selecione ou arraste um arquivo .xml para importar</div></div>
                 <input id="exp-import-input" type="file" accept=".xml" style="display:none;">
               </label>
             </div>
           </div>`;
         document.body.appendChild(modal);

         const closeModal = () => modal.remove();
         document.getElementById('exp-close').addEventListener('click', closeModal);
         modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

         document.getElementById('exp-xml').addEventListener('click', async () => {
            const btn = document.getElementById('exp-xml');
            btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
            btn.querySelector('div:last-child div:first-child').textContent = 'Exportando...';
            try {
               const http = ctx.getHttpService();
               if (!http) throw new Error('Angular não está pronto.');
               const r = await http.post('/TasyAppServer/resources/service/CorSisFQ/exportatAction', [{ tipo: 'HashMap', valor: { NR_SEQ_RELAT: Number(edState.reportSeq) } }], { suppressError: true, ignoreError: true });
               const xml = r?.data?.dados;
               if (!xml || !xml.includes('<?xml')) throw new Error('XML inválido na resposta');
               triggerDownload(xml, `relatorio_${edState.reportCode}_${edState.reportSeq}.xml`, 'application/xml');
               ctx.showToast(`XML exportado!`, 'success');
               closeModal();
            } catch(err) {
               ctx.showToast('Erro ao exportar XML: ' + err.message, 'error');
               btn.style.opacity = '1'; btn.style.pointerEvents = '';
               btn.querySelector('div:last-child div:first-child').textContent = 'Estrutura Completa';
            }
         });

         document.getElementById('exp-pdf').addEventListener('click', async () => {
            const btn = document.getElementById('exp-pdf');
            btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
            btn.querySelector('div:last-child div:first-child').textContent = 'Gerando PDF...';
            try {
               if (!ctx.getHttpService()) throw new Error('Angular não está pronto.');
               const param = await (async () => {
                  const r1 = await ctx.getHttpService().post('/TasyAppServer/resources/service/Report/getReportsData', ctx.buildReportsDataBody(edState.reportCode, 'CMCZ'), { suppressError: true, ignoreError: true });
                  return r1.data?.reports?.[0];
               })();
               if (!param) throw new Error('Parâmetros do relatório não encontrados');
               const r2 = await ctx.getHttpService().post('/TasyAppServer/resources/service/Report/generateReports', ctx.buildGenerateBody(param), { suppressError: true, ignoreError: true });
               const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
               if (!pdfFileName) throw new Error('PDF não gerado pelo servidor');
               const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;
               const resp = await fetch(pdfUrl, { credentials: 'include' });
               const blob = await resp.blob();
               triggerDownload(await blob.arrayBuffer(), `relatorio_${edState.reportCode}.pdf`, 'application/pdf');
               ctx.showToast('PDF baixado!', 'success');
               closeModal();
            } catch(err) {
               ctx.showToast('Erro ao gerar PDF: ' + err.message, 'error');
               btn.style.opacity = '1'; btn.style.pointerEvents = '';
               btn.querySelector('div:last-child div:first-child').textContent = 'Gerar e Baixar PDF';
            }
         });

         document.getElementById('exp-json').addEventListener('click', async () => {
            const btn = document.getElementById('exp-json');
            btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
            btn.querySelector('div:last-child div:first-child').textContent = 'Montando JSON...';
            try {
               const bands = await ctx.fetchBands(edState.reportSeq);
               const fullData = { exportedAt: new Date().toISOString(), reportCode: edState.reportCode, reportSeq: edState.reportSeq, bands: [] };
               for (const band of bands) {
                  const fields = await ctx.fetchFields(band.NR_SEQUENCIA);
                  fullData.bands.push({ ...band, fields });
               }
               const json = JSON.stringify(fullData, null, 2);
               triggerDownload(json, `relatorio_${edState.reportCode}_${edState.reportSeq}.json`, 'application/json');
               ctx.showToast(`JSON exportado — ${bands.length} bandas!`, 'success');
               closeModal();
            } catch(err) {
               ctx.showToast('Erro ao exportar JSON: ' + err.message, 'error');
               btn.style.opacity = '1'; btn.style.pointerEvents = '';
               btn.querySelector('div:last-child div:first-child').textContent = 'Backup Legível';
            }
         });

         const importInput = document.getElementById('exp-import-input');
         const importLabel = document.getElementById('exp-import-label');
         const importHint  = document.getElementById('exp-import-hint');

         async function runImport(file) {
            if (!file || !file.name.match(/\.xml$/i)) { ctx.showToast('Selecione um arquivo .xml válido.', 'error'); return; }
            importLabel.style.borderColor   = 'rgba(34,197,94,0.8)';
            importLabel.style.background    = 'rgba(34,197,94,0.1)';
            importLabel.style.pointerEvents = 'none';
            importHint.textContent = `Importando "${file.name}"...`;
            try {
               const formData = new FormData();
               formData.append('file', file, file.name);
               const uploadResp = await fetch('/TasyAppServer/resources/files', { method: 'POST', body: formData, credentials: 'include' });
               if (!uploadResp.ok) throw new Error('Falha no upload: HTTP ' + uploadResp.status);
               const uploadResult = await uploadResp.json();
               const xmlPath = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
               if (!xmlPath || !xmlPath.startsWith('tasy-storage://')) throw new Error('Resposta de upload inválida: ' + JSON.stringify(xmlPath));
               importHint.textContent = 'Registrando no servidor...';
               const http = ctx.getHttpService();
               if (!http) throw new Error('Angular não está pronto.');
               await http.post('/TasyAppServer/resources/service/CorSisFQ/importXMLReportAction', [{ tipo: 'HashMap', valor: { XML_PATH: xmlPath } }], { suppressError: true, ignoreError: true });
               importHint.textContent = 'Aplicando mudanças...';
               let nrSeqRelatorio = null;
               try {
                  const xmlText = await file.text();
                  const xmlDoc  = new DOMParser().parseFromString(xmlText, 'text/xml');
                  const reg = xmlDoc.querySelector('Tabela[nm_tabela="W_RELATORIO"] registros registro');
                  if (reg) nrSeqRelatorio = parseInt(reg.getAttribute('NR_SEQUENCIA'));
               } catch(e) {}
               if (!nrSeqRelatorio) throw new Error('Não foi possível extrair NR_SEQUENCIA do XML.');
               const r3 = await http.post('/TasyAppServer/resources/service/CorSisFQ/atualizarBaseRelatorioImp', [{ tipo: 'HashMap', valor: { NR_SEQUENCIA: nrSeqRelatorio } }], { suppressError: true, ignoreError: true });
               const newSeq = r3?.data?.dados;
               ctx.showToast(`Relatório importado! Abrindo editor...`, 'success');
               closeModal();
               if (newSeq) {
                  let cdRelatorio2 = '';
                  try {
                     const doc2 = new DOMParser().parseFromString(await file.text(), 'text/xml');
                     const reg2 = doc2.querySelector('Tabela[nm_tabela="W_RELATORIO"] registros registro');
                     cdRelatorio2 = reg2?.getAttribute('CD_RELATORIO') || '';
                  } catch(e) {}
                  edState.reportSeq  = newSeq;
                  edState.reportCode = cdRelatorio2 || String(newSeq);
                  edState.level      = 1;
                  await loadBandsUI();
               }
            } catch(err) {
               ctx.showToast('Erro ao importar: ' + err.message, 'error');
               console.error('[Studio] import error:', err);
               importLabel.style.borderColor   = 'rgba(34,197,94,0.2)';
               importLabel.style.background    = '#2b2b3e';
               importLabel.style.pointerEvents = '';
               importHint.textContent = 'Selecione ou arraste um arquivo .xml para importar';
            }
         }

         importInput.addEventListener('change', () => { if (importInput.files?.[0]) runImport(importInput.files[0]); });
         importLabel.addEventListener('dragover',  (e) => { e.preventDefault(); importLabel.style.borderColor = 'rgba(34,197,94,0.8)'; importLabel.style.background = 'rgba(34,197,94,0.08)'; });
         importLabel.addEventListener('dragleave', () => { importLabel.style.borderColor = 'rgba(34,197,94,0.2)'; importLabel.style.background = '#2b2b3e'; });
         importLabel.addEventListener('drop', (e) => { e.preventDefault(); const file = e.dataTransfer?.files?.[0]; if (file) runImport(file); });
      }

      function triggerDownload(data, filename, mimeType) {
         const blob = data instanceof ArrayBuffer ? new Blob([data], { type: mimeType }) : new Blob([data], { type: mimeType + ';charset=utf-8' });
         const url = URL.createObjectURL(blob);
         const a   = document.createElement('a');
         a.href = url; a.download = filename;
         document.body.appendChild(a); a.click();
         setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
      }

      edPreview.addEventListener('click', () => {
         if (edState.reportCode && ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);
      });

      const style = document.createElement('style');
      style.innerHTML = `
      .tasy-res-item:hover, .tasy-btn-edit:hover, .tasy-btn-gen:hover { filter: brightness(1.2); }
      .tasy-band-item:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15) !important; filter: brightness(1.1); }
      #tasy-nav-search:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
      #tasy-ed-btn-back:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.2) !important; }
      #tasy-ed-btn-preview:hover, #ed-btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .tasy-form-ctrl:focus { border-color: #3b82f6 !important; background: rgba(59,130,246,0.05) !important; }
    `;
      document.body.appendChild(style);
   };

})(window.TasyPdf);