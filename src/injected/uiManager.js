window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
   let previewWindow = null;

   ctx.updateOrOpenPreview = function (pdfUrl) {
      const windowName = '__pdf_preview__';

      // Helper p/ check se podemos mexer na janela sem tomar SecurityError
      const isWindowUsable = () => {
         try {
            return previewWindow && !previewWindow.closed && previewWindow.document;
         } catch (e) {
            return false;
         }
      };

      // 1. Caso SEM Double Buffering
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

      // 2. Double Buffering: Window HTML Shell Layout
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

      // 3. Double Buffering: Swap Mechanism
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
         // se der Cross-Origin no meio do swap, reseta p/ o simples
         previewWindow.location.replace(pdfUrl);
      }
   };

   ctx.injectFloatingActionButton = function () {
      if (!ctx.prefs.extEnabled) return;
      if (document.getElementById('tasy-pdf-fab')) return;

      const btn = document.createElement('div');
      btn.id = 'tasy-pdf-fab';
      btn.title = "Gerar PDF Instantâneo";
      btn.innerHTML = `<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>`;

      Object.assign(btn.style, {
         position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px',
         backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center',
         justifyContent: 'center', cursor: 'grab', zIndex: '999999',
         boxShadow: '0 4px 14px rgba(0,0,0,0.4)', transition: 'background-color 0.2s ease-in-out'
      });

      let isDragging = false;
      let startX, startY;

      btn.addEventListener('mousedown', (e) => {
         isDragging = false;
         startX = e.clientX;
         startY = e.clientY;
         btn.style.cursor = 'grabbing';

         const onMouseMove = (moveEvent) => {
            if (Math.abs(moveEvent.clientX - startX) > 5 || Math.abs(moveEvent.clientY - startY) > 5) {
               isDragging = true;
            }
            btn.style.bottom = 'auto';
            btn.style.right = 'auto';
            btn.style.left = (moveEvent.clientX - 28) + 'px';
            btn.style.top = (moveEvent.clientY - 28) + 'px';
         };

         const onMouseUp = () => {
            btn.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
         };

         document.addEventListener('mousemove', onMouseMove);
         document.addEventListener('mouseup', onMouseUp);
      });

      btn.addEventListener('click', (e) => {
         if (isDragging) {
            e.preventDefault();
            return;
         }
         console.log('[Tasy PDF] FAB Clicado - Gerando sob demanda nativamente');
         if (ctx.runAfterSave) ctx.runAfterSave();

         // Efeito visual de clique rapido
         btn.style.backgroundColor = '#10b981'; // verde
         setTimeout(() => btn.style.backgroundColor = '#3b82f6', 600);
      });

      document.body.appendChild(btn);
   };

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

      // Anima a entrada
      requestAnimationFrame(() => {
         toast.style.opacity = '1';
         toast.style.transform = 'translateX(0)';
      });

      // Destrói depois de 4 segundos
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
         backgroundColor: '#2b2b36', zIndex: '999999', borderRadius: '12px', border: '1px solid #3f3f5a',
         boxShadow: '0 10px 40px rgba(0,0,0,0.6)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      });

      const icons = {
         search: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
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
        <input type="text" id="tasy-nav-search" placeholder="Digite o Código do Relatório..." autocomplete="off" style="width: 100%; padding: 14px 16px 14px 44px; border-radius: 12px; border: none; background: transparent; color: white; font-size: 15px; outline: none; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      </div>
      <div id="tasy-nav-results" style="display: none; border-top: 1px solid #3f3f5a; max-height: 350px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; background: #22222b; border-radius: 0 0 12px 12px;"></div>
      
      <div id="tasy-nav-editor" style="display: none; padding: 16px; border-top: 1px solid #3f3f5a; background: #22222b; border-radius: 0 0 12px 12px; flex-direction: column;">
         <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <button id="tasy-ed-btn-back" style="border:1px solid #3f3f5a; background:transparent; color:#e2e8f0; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:4px;">${icons.arrowLeft} Voltar</span></button>
              <span id="tasy-ed-title" style="color:#e2e8f0; font-weight:600; font-size:14px; letter-spacing: 0.3px; display:flex; align-items:center; gap:6px;">Studio</span>
            </div>
            <button id="tasy-ed-btn-preview" style="border:none; background:rgba(16, 185, 129, 0.15); color:#34d399; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${icons.print} PDF Preview</span></button>
         </div>
         <div id="tasy-editor-body" style="max-height: 420px; overflow-y: auto; scrollbar-width: thin; padding-right: 4px;"></div>
      </div>
    `;

      document.body.appendChild(nav);

      const input = document.getElementById('tasy-nav-search');
      const results = document.getElementById('tasy-nav-results');
      const editor = document.getElementById('tasy-nav-editor');
      const edBody = document.getElementById('tasy-editor-body');
      const edTitle = document.getElementById('tasy-ed-title');
      const edBack = document.getElementById('tasy-ed-btn-back');
      const edPreview = document.getElementById('tasy-ed-btn-preview');

      // --- LÓGICA DE MINIMIZAÇÃO/CLIQUE FORA ---
      const collapseSearch = () => {
         results.style.display = 'none';
         editor.style.display = 'none';
         document.getElementById('tasy-nav-header').style.display = 'flex'; // Garante presença visual ao minimizar
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
         if (!nav.contains(e.target)) {
            collapseSearch();
         } else {
            expandSearch();
         }
      });

      window.addEventListener('keydown', (e) => {
         if (e.key === 'Escape') collapseSearch();
      });

      input.addEventListener('focus', expandSearch);
      // ----------------------------------------

      let debounceTimer;

      // Estado do Editor
      let edState = {
         level: 0,
         reportCode: null, reportSeq: null,
         bandSeq: null, bandName: null,
         activeField: null,
         rawBands: [], rawFields: []
      };

      function switchView(mode) {
         if (mode === 'search') {
            document.getElementById('tasy-nav-header').style.display = 'flex';
            editor.style.display = 'none';
            if (input.value.trim() !== '') results.style.display = 'block';
         } else {
            document.getElementById('tasy-nav-header').style.display = 'none';
            results.style.display = 'none';
            editor.style.display = 'flex';
         }
      }

      function renderLoading(target, msg) {
         target.innerHTML = `<div style="padding: 14px; color: #a0a0b0; font-size: 14px; text-align: center;">${msg}... aguarde</div>`;
      }

      // LISTAGEM DE BUSCA
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
         e.target.value = e.target.value.replace(/\D/g, ''); // Somente números
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

      // -------- LEVEL 2: CAMPOS (DIVS) --------
      async function loadFieldsUI() {
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
                   <div style="color:#64748b; display:flex; align-items:center; justify-content:center; padding: 4px;">
                      ${icons.edit}
                   </div>
                </div>

             </div>
          `).join('') + `</div>`;
         } catch (err) {
            edBody.innerHTML = `<div style="color:#ef4444;">Erro DB: ${err.message}</div>`;
         }
      }

      // -------- LEVEL 3: FORMULÁRIO DE EDIÇÃO --------
      function loadEditFormUI() {
         const f = edState.activeField;
         edTitle.innerHTML = `<span style="color:#cbd5e1">${icons.edit}</span> Propriedades <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${f.DS_CAMPO || 'Componente'}</span>`;
         edBody.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:20px; background:#1e1e24; padding:20px; border-radius:10px; border:1px solid rgba(255,255,255,0.02); box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);">
             <!-- Row Geometria -->
             <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px;">
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição X</label>
                <input type="number" id="ed-inp-left" value="${f.QT_ESQUERDA || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;"></div>
                
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição Y</label>
                <input type="number" id="ed-inp-top" value="${f.QT_TOPO || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;"></div>

                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Largura</label>
                <input type="number" id="ed-inp-width" value="${f.QT_TAMANHO || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;"></div>

                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Altura</label>
                <input type="number" id="ed-inp-height" value="${f.QT_ALTURA || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;"></div>
             </div>

             <!-- Row Conteúdo e Estilo -->
             <div style="display:grid; grid-template-columns: 2fr 1fr 1.5fr; gap:12px;">
                <div style="grid-column: span 3;"><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">String de Conteúdo (DS_CONTEUDO)</label>
                <input type="text" id="ed-inp-text" value="${f.DS_CONTEUDO || ''}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;"></div>

                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Tam. Fonte</label>
                <input type="number" id="ed-inp-fontsize" value="${f.QT_TAM_FONTE || 0}" class="tasy-form-ctrl" style="width:100%; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;"></div>

                <div style="grid-column: span 2;"><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Fonte (Aceita Paleta Hex ou clBlack)</label>
                <div style="display:flex; gap:8px;">
                   <input type="color" id="ed-inp-colorpicker" value="#ffffff" style="width:40px; height:38px; padding:0; background:transparent; border:none; border-radius:6px; cursor:pointer;" title="Paleta de Cores">
                   <input type="text" id="ed-inp-fontcolor" value="${f.DS_COR_FONTE || ''}" class="tasy-form-ctrl" style="flex:1; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;" placeholder="clWindowText">
                </div>
                </div>
             </div>
             <!-- Row Alinhamento + Estilo Fonte -->
             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Alinhamento</label>
                <select id="ed-inp-align" style="width:100%; height:38px; padding:0 10px; background:#2b2b36; border:1px solid #3f3f5a; color:#f8fafc; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; color-scheme: dark;">
                   <option value="" style="background:#2b2b36;color:#f8fafc;" ${!f.IE_ALINHAMENTO ? 'selected' : ''}>Padrão</option>
                   <option value="E" style="background:#2b2b36;color:#f8fafc;" ${f.IE_ALINHAMENTO === 'E' ? 'selected' : ''}>Esquerda</option>
                   <option value="C" style="background:#2b2b36;color:#f8fafc;" ${f.IE_ALINHAMENTO === 'C' ? 'selected' : ''}>Centro</option>
                   <option value="D" style="background:#2b2b36;color:#f8fafc;" ${f.IE_ALINHAMENTO === 'D' ? 'selected' : ''}>Direita</option>
                   <option value="J" style="background:#2b2b36;color:#f8fafc;" ${f.IE_ALINHAMENTO === 'J' ? 'selected' : ''}>Justificado</option>
                </select></div>

                <div><label style="color:#94a3b8;font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Estilo da Fonte</label>
                <select id="ed-inp-fontstyle" style="width:100%; height:38px; padding:0 10px; background:#2b2b36; border:1px solid #3f3f5a; color:#f8fafc; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; color-scheme: dark;">
                   <option value="" style="background:#2b2b36;color:#f8fafc;" ${!f.DS_ESTILO_FONTE ? 'selected' : ''}>Normal</option>
                   <option value="B" style="background:#2b2b36;color:#f8fafc;" ${f.DS_ESTILO_FONTE === 'B' ? 'selected' : ''}>Negrito</option>
                   <option value="I" style="background:#2b2b36;color:#f8fafc;" ${f.DS_ESTILO_FONTE === 'I' ? 'selected' : ''}>Itálico</option>
                   <option value="BI" style="background:#2b2b36;color:#f8fafc;" ${f.DS_ESTILO_FONTE === 'BI' ? 'selected' : ''}>Negrito + Itálico</option>
                   <option value="U" style="background:#2b2b36;color:#f8fafc;" ${f.DS_ESTILO_FONTE === 'U' ? 'selected' : ''}>Sublinhado</option>
                </select></div>
             </div>

             <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <label style="color:#94a3b8;font-size:11px;font-weight:500;">Cor do Label (DS_COR_LABEL)</label>
                  </div>
                  <div style="display:flex; gap:8px;">
                   <input type="color" id="ed-inp-labelcolorpicker" value="#ffffff" style="width:40px; height:38px; padding:0; background:transparent; border:none; border-radius:6px; cursor:pointer;">
                   <input type="text" id="ed-inp-labelcolor" value="${f.DS_COR_LABEL || ''}" class="tasy-form-ctrl" style="flex:1; padding:10px; background:#2b2b36; border:1px solid #3f3f5a; color:white; border-radius:6px; box-sizing:border-box; font-size:13px; outline:none; transition: border 0.2s;" placeholder="clWhite">
                </div>
                </div>
             </div>

             <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px; margin-top:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <label style="color:#94a3b8;font-size:11px;font-weight:500;">Ativar Bordas</label>
                  <label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:#f87171; font-size:11px;" title="SE marcado, o componente fica completamente transparente ignorando TODAS as cores">
                    <span>Componente Transparente</span>
                    <input type="checkbox" id="ed-chk-transp" ${f.IE_TRANSPARENTE === 'S' ? 'checked' : ''}>
                  </label>
                </div>
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                   <label style="color:white; font-size:12px; border:1px solid #3f3f5a; padding:6px 10px; border-radius:6px; background:#2b2b36; cursor:pointer; display:flex; align-items:center; gap:6px;"><input type="checkbox" id="ed-chk-borda-sup" ${f.IE_BORDA_SUP === 'S' ? 'checked' : ''}> Superior</label>
                   <label style="color:white; font-size:12px; border:1px solid #3f3f5a; padding:6px 10px; border-radius:6px; background:#2b2b36; cursor:pointer; display:flex; align-items:center; gap:6px;"><input type="checkbox" id="ed-chk-borda-inf" ${f.IE_BORDA_INF === 'S' ? 'checked' : ''}> Inferior</label>
                   <label style="color:white; font-size:12px; border:1px solid #3f3f5a; padding:6px 10px; border-radius:6px; background:#2b2b36; cursor:pointer; display:flex; align-items:center; gap:6px;"><input type="checkbox" id="ed-chk-borda-esq" ${f.IE_BORDA_ESQ === 'S' ? 'checked' : ''}> Esq.</label>
                   <label style="color:white; font-size:12px; border:1px solid #3f3f5a; padding:6px 10px; border-radius:6px; background:#2b2b36; cursor:pointer; display:flex; align-items:center; gap:6px;"><input type="checkbox" id="ed-chk-borda-dir" ${f.IE_BORDA_DIR === 'S' ? 'checked' : ''}> Dir.</label>
                </div>
             </div>
             
             <button id="ed-btn-save" style="margin-top:8px; width:100%; padding:12px; background:#3b82f6; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; font-size:14px; transition: all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px;">
               ${icons.save} Aplicar Alterações
             </button>
          </div>
       `;

         // Sync Picker <-> Text Input
         const colorPicker = document.getElementById('ed-inp-colorpicker');
         const colorText = document.getElementById('ed-inp-fontcolor');
         colorPicker.value = ctx.tasyToHex ? ctx.tasyToHex(colorText.value) : '#000000';

         colorPicker.addEventListener('input', (e) => colorText.value = e.target.value.toUpperCase());
         colorText.addEventListener('input', (e) => {
            if (e.target.value.startsWith('#') && e.target.value.length === 7) {
               colorPicker.value = e.target.value.toLowerCase();
            }
         });

         const labelPicker = document.getElementById('ed-inp-labelcolorpicker');
         const labelText = document.getElementById('ed-inp-labelcolor');
         labelPicker.value = ctx.tasyToHex ? ctx.tasyToHex(labelText.value) : '#ffffff';
         labelPicker.addEventListener('input', (e) => labelText.value = e.target.value.toUpperCase());
         labelText.addEventListener('input', (e) => { if (e.target.value.startsWith('#') && e.target.value.length === 7) labelPicker.value = e.target.value.toLowerCase(); });

         document.getElementById('ed-btn-save').addEventListener('click', async () => {
            const btn = document.getElementById('ed-btn-save');
            btn.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;gap:8px;">Transmitindo...</span>`;
            btn.style.opacity = '0.7';

            let newObj = { ...f };
            // Força as propriedades vitais pra nulas se não houver pra bater com o Oracle DB Tasy
            newObj.QT_ESQUERDA = Number(document.getElementById('ed-inp-left').value) || 0;
            newObj.QT_TOPO = Number(document.getElementById('ed-inp-top').value) || 0;
            newObj.QT_TAMANHO = Number(document.getElementById('ed-inp-width').value) || 0;
            newObj.QT_ALTURA = Number(document.getElementById('ed-inp-height').value) || 0;
            newObj.QT_TAM_FONTE = Number(document.getElementById('ed-inp-fontsize').value) || 0;
            newObj.DS_CONTEUDO = document.getElementById('ed-inp-text').value;
            newObj.DS_COR_FONTE = document.getElementById('ed-inp-fontcolor').value;

            newObj.IE_TRANSPARENTE = document.getElementById('ed-chk-transp').checked ? 'S' : 'N';

            newObj.IE_ALINHAMENTO = document.getElementById('ed-inp-align').value || null;
            newObj.DS_ESTILO_FONTE = document.getElementById('ed-inp-fontstyle').value || null;
            newObj.DS_COR_LABEL = document.getElementById('ed-inp-labelcolor').value;
            newObj.IE_BORDA_SUP = document.getElementById('ed-chk-borda-sup').checked ? 'S' : 'N';
            newObj.IE_BORDA_INF = document.getElementById('ed-chk-borda-inf').checked ? 'S' : 'N';
            newObj.IE_BORDA_ESQ = document.getElementById('ed-chk-borda-esq').checked ? 'S' : 'N';
            newObj.IE_BORDA_DIR = document.getElementById('ed-chk-borda-dir').checked ? 'S' : 'N';

            try {
               await ctx.updateFieldObj(f, newObj);
               if (ctx.showToast) ctx.showToast("Bypass Executado! Salvo no DB Mestre.", "success");

               // Atualiza memória cache
               Object.assign(edState.activeField, newObj);

               btn.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;gap:8px;">Salvo! Gerando PDF...</span>`;
               btn.style.background = "#10b981";
               btn.style.opacity = '1';

               // Auto-PDF!
               if (ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);

               setTimeout(() => {
                  btn.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;gap:8px;">${icons.save} Aplicar Alterações</span>`;
                  btn.style.background = "#3b82f6";
               }, 2500);
            } catch (err) {
               if (ctx.showToast) ctx.showToast("Falha ao salvar: " + err.message, "error");
               btn.innerHTML = "Erro ao salvar"; btn.style.background = "#ef4444";
            }
         });
      }

      // NAVEGAÇÃO
      edBack.addEventListener('click', () => {
         if (edState.level === 3) { edState.level = 2; loadFieldsUI(); }
         else if (edState.level === 2) { edState.level = 1; loadBandsUI(); }
         else if (edState.level === 1) { edState.level = 0; switchView('search'); }
      });

      edPreview.addEventListener('click', () => {
         if (edState.reportCode) {
            if (ctx.generateManualPdf) ctx.generateManualPdf(edState.reportCode);
         }
      });

      // Animações sutis
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
