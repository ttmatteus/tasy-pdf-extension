window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
   let previewWindow = null;
   let ghostField = null;
   let ghostScale = 1.2; // Escala padrão um pouco maior para visibilidade

   ctx.updateGhostField = () => { };
   ctx.removeGhostField = () => { };

   ctx.updateOrOpenPreview = function (pdfUrl) {
      // 0. Double Buffering no Studio Fullscreen
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
         position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '550px',
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
         arrowLeft: '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'
      };

      nav.innerHTML = `
      <div id="tasy-nav-header" style="position: relative; width: 100%; display: flex; align-items: center;">
        <div style="position: absolute; left: 16px; color: #3b82f6; display: flex;">${icons.search}</div>
        <input type="text" id="tasy-nav-search" placeholder="Buscar Relatórios..." autocomplete="off" style="width: 100%; padding: 14px 44px; border-radius: 12px; border: none; background: transparent; color: white; font-size: 15px; outline: none; font-family: 'Inter', system-ui, sans-serif;">
        <div id="tasy-nav-refresh" title="Atualizar Cache" style="position: absolute; right: 16px; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex;">${icons.refresh}</div>
      </div>
      <div id="tasy-nav-results" style="display: none; border-top: 1px solid rgba(63, 63, 90, 0.5); max-height: 350px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; background: rgba(34, 34, 43, 0.7); border-radius: 0 0 12px 12px;"></div>

      <div id="tasy-nav-editor" style="display: none; padding: 16px; border-top: 1px solid #3f3f5a; background: #22222b; border-radius: 0 0 12px 12px; flex-direction: column;">
         <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <button id="tasy-ed-btn-back" style="border:1px solid #3f3f5a; background:transparent; color:#e2e8f0; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:4px;">${icons.arrowLeft} Voltar</span></button>
              <span id="tasy-ed-title" style="color:#e2e8f0; font-weight:600; font-size:14px; letter-spacing: 0.3px; display:flex; align-items:center; gap:6px;">Studio</span>
            </div>
            <button id="tasy-ed-btn-preview" style="border:none; background:rgba(16, 185, 129, 0.15); color:#34d399; padding:6px 12px; border-radius:6px; font-weight:600; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${icons.print} PDF Preview</span></button>
         </div>
         <div id="tasy-editor-body" style="max-height: 420px; overflow-y: auto; scrollbar-width: thin; padding-right: 4px;"></div>
      </div>
    `;

      document.body.appendChild(nav);

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

      const collapseSearch = () => {
         ctx.removeGhostField();
         results.style.display = 'none';
         editor.style.display = 'none';
         document.getElementById('tasy-nav-header').style.display = 'flex';
         nav.style.opacity = '0.7';
         nav.style.transform = 'translateX(-50%) scale(0.98)';
      };

      const expandSearch = () => {
         nav.style.opacity = '1';
         nav.style.transform = 'translateX(-50%) scale(1)';
         if (edState.level > 0) {
            editor.style.display = 'flex';
            results.style.display = 'none';
            document.getElementById('tasy-nav-header').style.display = 'none';
         } else if (input.value.trim() !== '') {
            results.style.display = 'block';
            document.getElementById('tasy-nav-header').style.display = 'flex';
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
            if (edState.level === 3) {
               Object.assign(nav.style, {
                  width: '100vw', height: '100vh', top: '0', left: '0',
                  transform: 'none', borderRadius: '0', boxShadow: 'none'
               });
               Object.assign(editor.style, { padding: '10px 0 0 0', background: '#111116', borderTop: 'none' });
               edBody.style.maxHeight = '100vh';
               edBody.style.height = 'calc(100vh - 50px)';
            } else {
               Object.assign(nav.style, {
                  width: '550px', height: 'auto', top: '20px', left: '50%',
                  transform: 'translateX(-50%)', borderRadius: '12px',
                  position: 'fixed', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
               });
               editor.style.padding = '16px';
               edBody.style.maxHeight = '420px';
               edBody.style.height = 'auto';
            }
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
         if (!item) return;
         const code = item.getAttribute('data-code');
         const seq = item.getAttribute('data-seq');
         if (e.target.closest('.tasy-btn-gen')) {
            input.value = ''; results.style.display = 'none'; input.blur();
            if (ctx.generateManualPdf) ctx.generateManualPdf(code);
         } else if (e.target.closest('.tasy-btn-edit')) {
            edState.level = 1; edState.reportCode = code; edState.reportSeq = seq;
            loadBandsUI();
         }
      });

      // -------- LEVEL 1: BANDAS --------
      async function loadBandsUI() {
         switchView('editor');
         edTitle.innerHTML = `<span style="color:#cbd5e1">${icons.band}</span> Bandas <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${edState.reportCode}</span>`;
         renderLoading(edBody, "Carregando Bandas");
         try {
            const bands = await ctx.fetchBands(edState.reportSeq);
            edState.rawBands = bands;
            if (bands.length === 0) { edBody.innerHTML = `<div style="color:#ef4444;">Nenhuma banda encontrada (XML corrompido?)</div>`; return; }
            edBody.innerHTML = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">` +
               bands.map(b => `
                <div class="tasy-band-item" data-seq="${b.NR_SEQUENCIA}" data-name="${b.DS_BANDA}" style="background:#2b2b36; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:all 0.15s; display:flex; flex-direction:column; gap:4px;">
                   <div style="color:#f8fafc; font-weight:500; font-size:13px; display:flex; align-items:center; gap:6px;"><span style="color:#94a3b8">${icons.band}</span> ${b.DS_BANDA}</div>
                   <div style="color:#94a3b8; font-size:11px; padding-left: 22px;">A: ${b.QT_ALTURA || 0}px • Fundo: ${b.DS_COR_FUNDO || 'T'}</div>
                </div>
             `).join('') + `</div>`;
         } catch (err) {
            edBody.innerHTML = `<div style="color:#ef4444;">Erro ao ler Bd: ${err.message}</div>`;
         }
      }

      edBody.addEventListener('click', (e) => {
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
            loadEditFormUI();
         }
      });

      // -------- LEVEL 2: CAMPOS --------
      async function loadFieldsUI() {
         switchView('editor');
         edTitle.innerHTML = `<span style="color:#cbd5e1">${icons.field}</span> Estrutura <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${edState.bandName}</span>`;
         renderLoading(edBody, "Analisando Componentes");
         try {
            const fields = await ctx.fetchFields(edState.bandSeq);
            edState.rawFields = fields;
            if (fields.length === 0) { edBody.innerHTML = `<div style="color:#a0a0b0; padding:10px;">Banda vazia. Nenhum componente injetado.</div>`; return; }
            edBody.innerHTML = `<div style="display:flex; flex-direction:column; gap:8px;">` + fields.map(f => `
             <div class="tasy-field-item" data-seq="${f.NR_SEQUENCIA}"
                  style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:#2b2b36; border-radius:8px; border:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:all 0.15s;"
                  onmouseover="this.style.background='rgba(59,130,246,0.05)'; this.style.borderColor='rgba(59,130,246,0.5)';"
                  onmouseout="this.style.background='#2b2b36'; this.style.borderColor='rgba(255,255,255,0.05)';">
                <div style="display:flex; flex-direction:column; gap:4px; max-width:180px;">
                   <span style="color:#f8fafc; font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:6px;">
                      <span style="color:#60a5fa">${icons.field}</span> ${f.DS_CAMPO || 'Texto / Linha'}
                   </span>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                   <div style="display:flex; gap:6px; font-size:11px; font-family:monospace; margin-right:8px;">
                      <div style="background:rgba(129, 140, 248, 0.1); color:#818cf8; padding:4px 8px; border-radius:4px;" title="X (Esquerda)">X: ${f.QT_ESQUERDA || 0}</div>
                      <div style="background:rgba(52, 211, 153, 0.1); color:#34d399; padding:4px 8px; border-radius:4px;" title="Y (Topo)">Y: ${f.QT_TOPO || 0}</div>
                      <div style="background:rgba(251, 191, 36, 0.1); color:#fbbf24; padding:4px 8px; border-radius:4px;" title="L (Largura)">W: ${f.QT_TAMANHO || 0}</div>
                      <div style="background:rgba(248, 113, 113, 0.1); color:#f87171; padding:4px 8px; border-radius:4px;" title="A (Altura)">H: ${f.QT_ALTURA || 0}</div>
                   </div>
                   <div style="color:#64748b; display:flex; align-items:center; justify-content:center; padding: 4px;">${icons.edit}</div>
                </div>
             </div>
          `).join('') + `</div>`;
         } catch (err) {
            edBody.innerHTML = `<div style="color:#ef4444;">Erro DB: ${err.message}</div>`;
         }
      }

      // -------- LEVEL 3: FORMULÁRIO DE EDIÇÃO --------
      async function loadEditFormUI() {
         const f = edState.activeField;
         switchView('editor');
         edTitle.innerHTML = `<span style="color:#cbd5e1">${icons.edit}</span> Propriedades <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${f.DS_CAMPO || 'Componente'}</span>`;

         edBody.innerHTML = `
          <div style="display:flex; width:100%; height:100%; min-height: calc(100vh - 60px); background:#111116;">
           <div style="width:380px; min-width:380px; background:#1e1e24; border-right:1px solid #2b2b36; display:flex; flex-direction:column; gap:16px; padding:20px; overflow-y:auto; scrollbar-width:thin;">
             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição X</label>
                <input type="number" id="ed-inp-left" value="${f.QT_ESQUERDA || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;"></div>
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição Y</label>
                <input type="number" id="ed-inp-top" value="${f.QT_TOPO || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;"></div>
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Largura</label>
                <input type="number" id="ed-inp-width" value="${f.QT_TAMANHO || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;"></div>
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Altura</label>
                <input type="number" id="ed-inp-height" value="${f.QT_ALTURA || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;"></div>
             </div>
             <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">String de Conteúdo (DS_CONTEUDO)</label>
             <input type="text" id="ed-inp-text" value="${f.DS_CONTEUDO || ''}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;"></div>
             <div style="display:grid; grid-template-columns: 1fr 2fr; gap:12px;">
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Fonte</label>
                <input type="number" id="ed-inp-fontsize" value="${f.QT_TAM_FONTE || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;"></div>
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Fonte</label>
                <div style="display:flex; gap:8px;">
                   <input type="color" id="ed-inp-colorpicker" value="#ffffff" style="width:38px; height:38px; padding:0; background:transparent; border:none; border-radius:6px; cursor:pointer;" title="Paleta de Cores">
                   <input type="text" id="ed-inp-fontcolor" value="${f.DS_COR_FONTE || ''}" class="tasy-form-ctrl" style="flex:1; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;" placeholder="clBlack">
                </div></div>
             </div>
             <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Label</label>
             <div style="display:flex; gap:8px;">
                <input type="color" id="ed-inp-labelcolorpicker" value="#ffffff" style="width:38px; height:38px; padding:0; background:transparent; border:none; border-radius:6px; cursor:pointer;" title="Paleta de Cores Label">
                <input type="text" id="ed-inp-labelcolor" value="${f.DS_COR_LABEL || ''}" class="tasy-form-ctrl" style="flex:1; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;" placeholder="clBlack">
             </div></div>
             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <select id="ed-inp-align" style="width:100%; height:38px; padding:0 10px; background:#2b2b36; border:1px solid #3f3f5a; color:#f8fafc; border-radius:6px; font-size:12px; outline:none; color-scheme: dark;">
                   <option value="" ${!f.IE_ALINHAMENTO ? 'selected' : ''}>Alinh. Padrão</option>
                   <option value="E" ${f.IE_ALINHAMENTO === 'E' ? 'selected' : ''}>Esquerda</option>
                   <option value="C" ${f.IE_ALINHAMENTO === 'C' ? 'selected' : ''}>Centro</option>
                   <option value="D" ${f.IE_ALINHAMENTO === 'D' ? 'selected' : ''}>Direita</option>
                </select>
                <select id="ed-inp-fontstyle" style="width:100%; height:38px; padding:0 10px; background:#2b2b36; border:1px solid #3f3f5a; color:#f8fafc; border-radius:6px; font-size:12px; outline:none; color-scheme: dark;">
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
             <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                <label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:8px;display:block;">Fundo</label>
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                   <input type="color" id="ed-inp-bgcolorpicker" value="#ffffff" style="width:38px; height:38px; padding:0; background:transparent; border:none; border-radius:6px; cursor:pointer;" title="Cor de Fundo">
                   <input type="text" id="ed-inp-bgcolor" value="${f.DS_COR_FUNDO || ''}" class="tasy-form-ctrl" style="flex:1; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; font-size:13px; outline:none;" placeholder="clWhite">
                </div>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#f8fafc; font-size:12px; padding:8px 10px; background:#2b2b36; border:1px solid #3f3f5a; border-radius:6px;">
                  <input type="checkbox" id="ed-chk-transp" ${f.IE_TRANSPARENTE === 'S' ? 'checked' : ''}> Fundo Transparente
                </label>
             </div>
             <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                <label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:8px;display:block;">Bordas</label>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px;">
                   <label style="color:white; font-size:11px; border:1px solid #3f3f5a; padding:6px; border-radius:4px; background:#2b2b36; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="ed-chk-borda-sup" ${f.IE_BORDA_SUP === 'S' ? 'checked' : ''}> Topo</label>
                   <label style="color:white; font-size:11px; border:1px solid #3f3f5a; padding:6px; border-radius:4px; background:#2b2b36; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="ed-chk-borda-inf" ${f.IE_BORDA_INF === 'S' ? 'checked' : ''}> Base</label>
                   <label style="color:white; font-size:11px; border:1px solid #3f3f5a; padding:6px; border-radius:4px; background:#2b2b36; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="ed-chk-borda-esq" ${f.IE_BORDA_ESQ === 'S' ? 'checked' : ''}> Esq.</label>
                   <label style="color:white; font-size:11px; border:1px solid #3f3f5a; padding:6px; border-radius:4px; background:#2b2b36; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="ed-chk-borda-dir" ${f.IE_BORDA_DIR === 'S' ? 'checked' : ''}> Dir.</label>
                </div>
             </div>
             <button id="ed-btn-save" style="margin-top:auto; width:100%; padding:14px; background:#3b82f6; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 15px rgba(59,130,246,0.3); transition:all 0.2s;">
                ${icons.save} Aplicar Alterações
             </button>
           </div>

           <div style="flex:1; background:#525659; display:flex; flex-direction:column; position:relative; overflow:hidden;">
              <div id="tasy-pdf-loading" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#525659; color:white; z-index:10;">
                 <div style="text-align:center;">
                    <div style="font-size:18px; font-weight:600; margin-bottom:10px;">Gerando PDF Real...</div>
                    <div style="color:#94a3b8; font-size:13px;">Aguardando resposta do Tasy</div>
                 </div>
              </div>
              <div id="tasy-sync-badge" style="position:absolute; top:20px; right:20px; background:rgba(59,130,246,0.9); color:white; padding:6px 12px; border-radius:20px; font-size:11px; font-weight:600; z-index:20; opacity:0; transform:translateY(-10px); transition:all 0.3s; pointer-events:none; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
                 <span style="display:inline-block; width:8px; height:8px; background:white; border-radius:50%; margin-right:6px; animation: pulse 1s infinite; box-shadow: 0 0 4px white;"></span> Sincronizando...
              </div>
              <iframe id="tasy-pdf-iframe-A" style="position:absolute; inset:0; width:100%; height:100%; border:none; transition: opacity 0.1s ease-in-out; z-index:2; opacity:1;"></iframe>
              <iframe id="tasy-pdf-iframe-B" style="position:absolute; inset:0; width:100%; height:100%; border:none; transition: opacity 0.1s ease-in-out; z-index:1; opacity:0;"></iframe>
           </div>
          </div>
        `;

         const inputs = edBody.querySelectorAll('input, select');
         const pdfLoading = document.getElementById('tasy-pdf-loading');
         let saveTimer = null;

         // ── FIX RAIZ: o updateFieldObj do Tasy converte "" → "N" internamente.
         // A solução é nunca mandar "" — a opção "sem estilo" deve ser null (valor nativo do banco).
         // Regra:  select value ""        → null   (sem estilo = null no banco)
         //         select value "B"/"I"/"BI" → valor literal
         //         select value "E"/"C"/"D"  → valor literal (alinhamento)
         //         select value "" (align)   → null
         const selectToDb = (val) => val === '' ? null : val;

         let lastSavedObj = { ...f };

         let isSaving = false;
         let pendingSave = false;

         function readFormState() {
            return {
               QT_ESQUERDA: Number(document.getElementById('ed-inp-left')?.value) || 0,
               QT_TOPO: Number(document.getElementById('ed-inp-top')?.value) || 0,
               QT_TAMANHO: Number(document.getElementById('ed-inp-width')?.value) || 0,
               QT_ALTURA: Number(document.getElementById('ed-inp-height')?.value) || 0,
               QT_TAM_FONTE: Number(document.getElementById('ed-inp-fontsize')?.value) || 0,
               DS_CONTEUDO: document.getElementById('ed-inp-text')?.value ?? '',
               DS_COR_FONTE: document.getElementById('ed-inp-fontcolor')?.value ?? '',
               DS_COR_LABEL: document.getElementById('ed-inp-labelcolor')?.value ?? '',
               DS_COR_FUNDO: document.getElementById('ed-inp-bgcolor')?.value ?? '',
               IE_TRANSPARENTE: document.getElementById('ed-chk-transp')?.checked ? 'S' : 'N',
               // ── "" → null: nunca mandar string vazia pro updateFieldObj do Tasy
               IE_ALINHAMENTO: selectToDb(document.getElementById('ed-inp-align')?.value ?? ''),
               DS_ESTILO_FONTE: selectToDb(document.getElementById('ed-inp-fontstyle')?.value ?? ''),
               IE_BORDA_SUP: document.getElementById('ed-chk-borda-sup')?.checked ? 'S' : 'N',
               IE_BORDA_INF: document.getElementById('ed-chk-borda-inf')?.checked ? 'S' : 'N',
               IE_BORDA_ESQ: document.getElementById('ed-chk-borda-esq')?.checked ? 'S' : 'N',
               IE_BORDA_DIR: document.getElementById('ed-chk-borda-dir')?.checked ? 'S' : 'N',
            };
         }

         function isDirty(a, b) {
            return JSON.stringify(a) !== JSON.stringify(b);
         }

         const enqueueAndSave = (immediate = false) => {
            clearTimeout(saveTimer);
            const run = async () => {
               if (isSaving) { pendingSave = true; return; }
               const formState = readFormState();
               const newObj = { ...f, ...formState };
               if (!isDirty(lastSavedObj, newObj)) return;

               isSaving = true;
               try {
                  await ctx.updateFieldObj(lastSavedObj, newObj);
                  lastSavedObj = { ...newObj };
                  Object.assign(edState.activeField, newObj);
                  
                  // ── FIX: gerar PDF apenas APÓS o save terminar (Tasy lê do Banco!)
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

         const updatePdfIframeFallback = () => {
            const iframeA = document.getElementById('tasy-pdf-iframe-A');
            const iframeB = document.getElementById('tasy-pdf-iframe-B');
            if (!iframeA || !iframeB) return;
            const active = iframeA.style.opacity !== '0' ? iframeA : iframeB;
            if (active.src && active.src !== 'about:blank' && (!pdfLoading || pdfLoading.style.display === 'none')) return;
            const frame = document.querySelector('iframe[id="__pdf_preview__"]') || (window.previewWindow && !window.previewWindow.closed && window.previewWindow.document.querySelector('iframe'));
            if (frame && frame.src && frame.src !== 'about:blank') ctx.updateOrOpenPreview(frame.src);
         };

         const pollInterval = setInterval(updatePdfIframeFallback, 2000);
         setTimeout(() => clearInterval(pollInterval), 20000);

         if (ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);

         // ── FIX: seta o valor do select após renderizar
         const fontStyleSel = document.getElementById('ed-inp-fontstyle');
         if (fontStyleSel) {
            const estiloAtual = f.DS_ESTILO_FONTE;
            const valid = ['N', 'I', 'NI', 'S', 'NS', 'IS', 'NIS'];
            fontStyleSel.value = valid.includes(estiloAtual) ? estiloAtual : '';
         }

         const colorPicker = document.getElementById('ed-inp-colorpicker');
         const colorText = document.getElementById('ed-inp-fontcolor');
         if (colorPicker && colorText) {
            colorPicker.value = ctx.tasyToHex ? ctx.tasyToHex(colorText.value) : '#000000';
            colorPicker.addEventListener('change', (e) => { colorText.value = e.target.value.toUpperCase(); enqueueAndSave(); });
         }

         const labelColorPicker = document.getElementById('ed-inp-labelcolorpicker');
         const labelColorText = document.getElementById('ed-inp-labelcolor');
         if (labelColorPicker && labelColorText) {
            labelColorPicker.value = ctx.tasyToHex ? ctx.tasyToHex(labelColorText.value) : '#000000';
            labelColorPicker.addEventListener('change', (e) => { labelColorText.value = e.target.value.toUpperCase(); enqueueAndSave(); });
         }

         const bgColorPicker = document.getElementById('ed-inp-bgcolorpicker');
         const bgColorText = document.getElementById('ed-inp-bgcolor');
         if (bgColorPicker && bgColorText) {
            bgColorPicker.value = ctx.tasyToHex ? ctx.tasyToHex(bgColorText.value) : '#ffffff';
            bgColorPicker.addEventListener('change', (e) => { bgColorText.value = e.target.value.toUpperCase(); enqueueAndSave(); });
         }

         document.getElementById('ed-btn-save').addEventListener('click', async () => {
            const btn = document.getElementById('ed-btn-save');
            btn.innerHTML = `Aplicando...`;
            await enqueueAndSave();
            btn.innerHTML = `${icons.save} Aplicar Alterações`;
         });
      }

      // NAVEGAÇÃO
      edBack.addEventListener('click', () => {
         ctx.removeGhostField();
         if (ctx.cancelPendingGeneration) ctx.cancelPendingGeneration();
         if (edState.level === 3) { edState.level = 2; loadFieldsUI(); }
         else if (edState.level === 2) { edState.level = 1; loadBandsUI(); }
         else if (edState.level === 1) { edState.level = 0; switchView('search'); }
      });

      edPreview.addEventListener('click', () => {
         if (edState.reportCode && ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);
      });

      const style = document.createElement('style');
      style.innerHTML = `
      .tasy-res-item:hover, .tasy-btn-edit:hover, .tasy-btn-gen:hover { filter: brightness(1.2); }
      .tasy-band-item:hover { transform: translateY(-2px); border-color: rgba(59,130,246,0.5) !important; background: rgba(59,130,246,0.05) !important; }
      #tasy-nav-search:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
      #tasy-ed-btn-back:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.2) !important; }
      #tasy-ed-btn-preview:hover, #ed-btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .tasy-form-ctrl:focus { border-color: #3b82f6 !important; background: rgba(59,130,246,0.05) !important; }
    `;
      document.body.appendChild(style);
   };

})(window.TasyPdf);