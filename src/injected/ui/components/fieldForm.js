window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts, Navbar } = ctx;

    ctx.FieldForm = {
        open: function (fieldObj) {
            state.level = 3;
            state.activeField = fieldObj;
            
            const f = fieldObj;
            const ic = Icons;
            
            // Centraliza a janela
            const w = 1100, h = 750;
            const left = (window.screen.width / 2) - (w / 2);
            const top = (window.screen.height / 2) - (h / 2);
            
            const editorWindow = window.open('', 'TasyPdfEditor', `width=${w},height=${h},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no`);
            if (!editorWindow) {
                Toasts.show('Popup bloqueado! Permita popups para abrir o editor.', 'error');
                return;
            }

            ctx.editorWindow = editorWindow;
            const wd = editorWindow.document;
            wd.title = `Editando: ${f.DS_CAMPO} [${state.reportCode}]`;

            // Setup head & CSS vars
            wd.head.innerHTML = `
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
              <style>
                :root {
                    --tasy-bg-base: #09090b;
                    --tasy-bg-surface-solid: #18181b;
                    --tasy-border: #27272a;
                    --tasy-text-main: #fafafa;
                    --tasy-text-muted: #a1a1aa;
                    --tasy-bg-hover: #27272a;
                    --tasy-danger: #ef4444;
                    --tasy-danger-bg: rgba(239, 68, 68, 0.1);
                    --tasy-radius-sm: 6px;
                    --tasy-radius-md: 8px;
                    --tasy-radius-lg: 12px;
                    --tasy-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                }
                * { box-sizing: border-box; }
                body { margin:0; font-family:'Inter', system-ui, sans-serif; background:var(--tasy-bg-base); color:var(--tasy-text-main); height:100vh; display:flex; flex-direction:column; overflow:hidden; }
                input, select, button { font-family: inherit; }
                select { 
                    color-scheme: dark; 
                    background: var(--tasy-bg-base); 
                    color: var(--tasy-text-main); 
                    border: 1px solid var(--tasy-border);
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23fafafa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 5 3 3 3-3'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 16px;
                    padding-right: 32px !important;
                }
                select option { background: var(--tasy-bg-surface-solid); color: var(--tasy-text-main); }
                input[type="checkbox"] {
                    appearance: none; -webkit-appearance: none;
                    width: 16px; height: 16px;
                    background: var(--tasy-bg-surface-solid);
                    border: 1px solid var(--tasy-border);
                    border-radius: 4px; cursor: pointer;
                    display: inline-flex; align-items: center; justify-content: center;
                    transition: all 0.2s; position: relative; vertical-align: middle;
                }
                input[type="checkbox"]:checked { background: var(--tasy-text-main); border-color: var(--tasy-text-main); }
                input[type="checkbox"]:checked::after {
                    content: ""; width: 4px; height: 8px;
                    border: solid var(--tasy-bg-base); border-width: 0 2px 2px 0;
                    transform: rotate(45deg); margin-bottom: 2px;
                }
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--tasy-border); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: var(--tasy-text-muted); }
              </style>
            `;

            wd.body.innerHTML = '';
            
            const root = wd.createElement('div');
            root.style.cssText = 'display:flex;flex-direction:column;height:100%;';
            wd.body.appendChild(root);

            // Header da janela
            const header = wd.createElement('div');
            header.style.cssText = 'height:50px;min-height:50px;background:var(--tasy-bg-base);border-bottom:1px solid var(--tasy-border);display:flex;align-items:center;justify-content:space-between;padding:0 20px;';
            header.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:32px;height:32px;background:var(--tasy-bg-hover);border-radius:var(--tasy-radius-sm);display:flex;align-items:center;justify-content:center;color:var(--tasy-text-main);border:1px solid var(--tasy-border);">${ic.field}</div>
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--tasy-text-main);">${f.DS_CAMPO}</div>
                    <div style="font-size:10px;color:var(--tasy-text-muted);font-weight:500;">Banda: ${state.bandName}</div>
                  </div>
                </div>
                <div style="display:flex;gap:8px;">
                  <button id="win-btn-preview" style="border:1px solid var(--tasy-border);background:transparent;color:var(--tasy-text-main);padding:6px 12px;border-radius:var(--tasy-radius-sm);font-weight:500;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'"><span style="display:flex;color:var(--tasy-text-muted);">${ic.print}</span> PDF Preview</button>
                  <button id="win-btn-close" style="border:1px solid transparent;background:var(--tasy-danger-bg);color:var(--tasy-danger);padding:6px 12px;border-radius:var(--tasy-radius-sm);font-weight:600;font-size:12px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-danger)';this.style.color='white'" onmouseout="this.style.background='var(--tasy-danger-bg)';this.style.color='var(--tasy-danger)'">✕ Fechar</button>
                </div>`;
            root.appendChild(header);

            // Corpo principal
            const body = wd.createElement('div');
            body.style.cssText = 'display:flex;flex:1;overflow:hidden;';
            body.innerHTML = `
                <div id="win-form-panel" style="width:380px;min-width:380px;background:var(--tasy-bg-surface-solid);border-right:1px solid var(--tasy-border);display:flex;flex-direction:column;gap:16px;padding:24px;overflow-y:auto;scrollbar-width:thin;">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição X</label>
                    <input type="number" id="ed-inp-left" value="${f.QT_ESQUERDA||0}" style="width:100%;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'"></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Posição Y</label>
                    <input type="number" id="ed-inp-top" value="${f.QT_TOPO||0}" style="width:100%;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'"></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Largura</label>
                    <input type="number" id="ed-inp-width" value="${f.QT_TAMANHO||0}" style="width:100%;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'"></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Altura</label>
                    <input type="number" id="ed-inp-height" value="${f.QT_ALTURA||0}" style="width:100%;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'"></div>
                  </div>
                  <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Conteúdo (Texto ou Valor Fixo)</label>
                  <input type="text" id="ed-inp-text" value="${f.DS_CONTEUDO||''}" style="width:100%;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'"></div>
                  <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;">
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Fonte Sec</label>
                    <input type="number" id="ed-inp-fontsize" value="${f.QT_TAM_FONTE||0}" style="width:100%;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'"></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Fonte</label>
                    <div style="display:flex;gap:8px;">
                      <input type="color" id="ed-inp-colorpicker" value="#ffffff" style="width:38px;height:38px;padding:0;background:transparent;border:none;border-radius:var(--tasy-radius-sm);cursor:pointer;">
                      <input type="text" id="ed-inp-fontcolor" value="${f.DS_COR_FONTE||''}" style="flex:1;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" placeholder="clBlack" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'">
                    </div></div>
                  </div>
                  <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:6px;display:block;">Cor da Label</label>
                  <div style="display:flex;gap:8px;">
                    <input type="color" id="ed-inp-labelcolorpicker" value="#ffffff" style="width:38px;height:38px;padding:0;background:transparent;border:none;border-radius:var(--tasy-radius-sm);cursor:pointer;">
                    <input type="text" id="ed-inp-labelcolor" value="${f.DS_COR_LABEL||''}" style="flex:1;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" placeholder="clBlack" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'">
                  </div></div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <select id="ed-inp-align" style="width:100%;height:40px;padding:0 10px;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:12px;outline:none;color-scheme:dark;">
                      <option value="" ${!f.IE_ALINHAMENTO?'selected':''}>Alinh. Padrão</option>
                      <option value="E" ${f.IE_ALINHAMENTO==='E'?'selected':''}>Esquerda</option>
                      <option value="C" ${f.IE_ALINHAMENTO==='C'?'selected':''}>Centro</option>
                      <option value="D" ${f.IE_ALINHAMENTO==='D'?'selected':''}>Direita</option>
                    </select>
                    <select id="ed-inp-fontstyle" style="width:100%;height:40px;padding:0 10px;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:12px;outline:none;color-scheme:dark;">
                      <option value="">Nenhum</option>
                      <option value="N">Negrito</option>
                      <option value="I">Itálico</option>
                      <option value="NI">Negrito e Itálico</option>
                      <option value="S">Sublinhado</option>
                      <option value="NS">Negrito e Sublinhado</option>
                      <option value="IS">Itálico e sublinhado</option>
                      <option value="NIS">Negrito, Itálico e Sublinhado</option>
                    </select>
                  </div>
                  <div style="border-top:1px solid var(--tasy-border);padding-top:16px;">
                    <label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:8px;display:block;">Cor de Fundo</label>
                    <div style="display:flex;gap:8px;margin-bottom:12px;">
                      <input type="color" id="ed-inp-bgcolorpicker" value="#ffffff" style="width:38px;height:38px;padding:0;background:transparent;border:none;border-radius:var(--tasy-radius-sm);cursor:pointer;">
                      <input type="text" id="ed-inp-bgcolor" value="${f.DS_COR_FUNDO||''}" style="flex:1;padding:10px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:border 0.2s;" placeholder="clWhite" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'">
                    </div>
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--tasy-text-main);font-size:12px;padding:8px 10px;background:transparent;border:1px dashed var(--tasy-border);border-radius:var(--tasy-radius-sm);font-weight:500;">
                      <input type="checkbox" id="ed-chk-transp" ${f.IE_TRANSPARENTE==='S'?'checked':''}> Fundo Transparente
                    </label>
                  </div>
                  <div style="border-top:1px solid var(--tasy-border);padding-top:16px;">
                    <label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;margin-bottom:8px;display:block;">Bordas Manuais</label>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                      <label style="color:var(--tasy-text-main);font-size:11px;font-weight:500;border:1px solid var(--tasy-border);padding:6px;border-radius:var(--tasy-radius-sm);background:transparent;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="ed-chk-borda-sup" ${f.IE_BORDA_SUP==='S'?'checked':''}> Topo</label>
                      <label style="color:var(--tasy-text-main);font-size:11px;font-weight:500;border:1px solid var(--tasy-border);padding:6px;border-radius:var(--tasy-radius-sm);background:transparent;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="ed-chk-borda-inf" ${f.IE_BORDA_INF==='S'?'checked':''}> Base</label>
                      <label style="color:var(--tasy-text-main);font-size:11px;font-weight:500;border:1px solid var(--tasy-border);padding:6px;border-radius:var(--tasy-radius-sm);background:transparent;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="ed-chk-borda-esq" ${f.IE_BORDA_ESQ==='S'?'checked':''}> Esq</label>
                      <label style="color:var(--tasy-text-main);font-size:11px;font-weight:500;border:1px solid var(--tasy-border);padding:6px;border-radius:var(--tasy-radius-sm);background:transparent;display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="ed-chk-borda-dir" ${f.IE_BORDA_DIR==='S'?'checked':''}> Dir</label>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;margin-top:auto;">
                    <button id="ed-btn-undo" title="Desfazer (Ctrl+Z)" style="padding:14px 10px;background:transparent;color:var(--tasy-text-muted);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);cursor:pointer;display:flex;align-items:center;transition:all 0.2s;" disabled>${ic.undo}</button>
                    <button id="ed-btn-redo" title="Refazer (Ctrl+Y)" style="padding:14px 10px;background:transparent;color:var(--tasy-text-muted);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);cursor:pointer;display:flex;align-items:center;transition:all 0.2s;" disabled>${ic.redo}</button>
                    <button id="ed-btn-save" style="flex:1;padding:14px;background:var(--tasy-text-main);color:var(--tasy-bg-base);border:none;border-radius:var(--tasy-radius-sm);font-weight:600;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--tasy-shadow-sm);transition:all 0.2s;">${ic.save} Salvar (Auto)</button>
                  </div>
                </div>
                <div style="flex:1;background:var(--tasy-bg-hover);display:flex;flex-direction:column;position:relative;overflow:hidden;">
                  <div id="tasy-pdf-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--tasy-bg-hover);color:var(--tasy-text-main);z-index:10;">
                    <div style="text-align:center;">
                      <div style="font-size:16px;font-weight:600;margin-bottom:10px;">Renderizando Preview...</div>
                      <div style="color:var(--tasy-text-muted);font-size:13px;">O relatório real Tasy está sendo carregado.</div>
                    </div>
                  </div>
                  <div id="tasy-sync-badge" style="position:absolute;top:20px;right:20px;background:var(--tasy-text-main);color:var(--tasy-bg-base);padding:6px 12px;border-radius:20px;font-size:11px;font-weight:600;z-index:20;opacity:0;transform:translateY(-10px);transition:all 0.3s;pointer-events:none;box-shadow:var(--tasy-shadow-sm);">
                    <span style="display:inline-block;width:8px;height:8px;background:var(--tasy-bg-base);border-radius:50%;margin-right:6px;animation:pulse 1s infinite;box-shadow:0 0 4px var(--tasy-bg-base);"></span> Sincronizando...
                  </div>
                  <iframe id="tasy-pdf-iframe-A" style="position:absolute;inset:0;width:100%;height:100%;border:none;transition:opacity 0.1s ease-in-out;z-index:2;opacity:1;"></iframe>
                  <iframe id="tasy-pdf-iframe-B" style="position:absolute;inset:0;width:100%;height:100%;border:none;transition:opacity 0.1s ease-in-out;z-index:1;opacity:0;"></iframe>
                </div>`;
            root.appendChild(body);

            editorWindow.focus();

            // Ao fechar a janela, volta o state para level 2
            editorWindow.onbeforeunload = () => {
                state.level = 2;
                if (ctx.cancelPendingGeneration) ctx.cancelPendingGeneration();
            };

            // Setup de eventos e integração (similar ao original)
            this.setupEvents(wd, f, editorWindow);
            
            // PDF Inicial
            if (ctx.generateManualPdf) ctx.generateManualPdf(state.reportCode);
        },

        setupEvents: function (wd, f, editorWindow) {
            const ic = Icons;
            const $ = (id) => wd.getElementById(id);
            const inputs = wd.querySelectorAll('#win-form-panel input, #win-form-panel select');
            let saveTimer = null;
            let lastSavedObj = { ...f };
            let isSaving = false;
            let pendingSave = false;
            let isReverting = false;

            const undoStack = [];
            const redoStack = [];
            const UNDO_LIMIT = 50;

            const updateUndoRedoUI = () => {
                const uBtn = $('ed-btn-undo'), rBtn = $('ed-btn-redo');
                if (uBtn) { const can = undoStack.length > 0; uBtn.disabled = !can; uBtn.style.opacity = can ? '1' : '0.4'; uBtn.style.color = can ? '#f1f5f9' : '#94a3b8'; }
                if (rBtn) { const can = redoStack.length > 0; rBtn.disabled = !can; rBtn.style.opacity = can ? '1' : '0.4'; rBtn.style.color = can ? '#f1f5f9' : '#94a3b8'; }
            };

            const pushUndo = (snapshot) => {
                undoStack.push({ ...snapshot });
                if (undoStack.length > UNDO_LIMIT) undoStack.shift();
                redoStack.length = 0;
                updateUndoRedoUI();
            };

            const applyStateToForm = (s) => {
                isReverting = true; clearTimeout(saveTimer);
                $('ed-inp-left').value = s.QT_ESQUERDA || 0;
                $('ed-inp-top').value = s.QT_TOPO || 0;
                $('ed-inp-width').value = s.QT_TAMANHO || 0;
                $('ed-inp-height').value = s.QT_ALTURA || 0;
                $('ed-inp-fontsize').value = s.QT_TAM_FONTE || 0;
                $('ed-inp-text').value = s.DS_CONTEUDO || '';
                $('ed-inp-fontcolor').value = s.DS_COR_FONTE || '';
                $('ed-inp-labelcolor').value = s.DS_COR_LABEL || '';
                $('ed-inp-align').value = s.IE_ALINHAMENTO || '';
                $('ed-inp-fontstyle').value = s.DS_ESTILO_FONTE || '';
                $('ed-chk-transp').checked = s.IE_TRANSPARENTE === 'S';
                $('ed-chk-borda-sup').checked = s.IE_BORDA_SUP === 'S';
                $('ed-chk-borda-inf').checked = s.IE_BORDA_INF === 'S';
                $('ed-chk-borda-esq').checked = s.IE_BORDA_ESQ === 'S';
                $('ed-chk-borda-dir').checked = s.IE_BORDA_DIR === 'S';
                if ($('ed-inp-colorpicker')) $('ed-inp-colorpicker').value = ctx.tasyToHex ? ctx.tasyToHex(s.DS_COR_FONTE) : '#000000';
                isReverting = false;
            };

            const readFormState = () => ({
                QT_ESQUERDA: Number($('ed-inp-left').value) || 0,
                QT_TOPO: Number($('ed-inp-top').value) || 0,
                QT_TAMANHO: Number($('ed-inp-width').value) || 0,
                QT_ALTURA: Number($('ed-inp-height').value) || 0,
                QT_TAM_FONTE: Number($('ed-inp-fontsize').value) || 0,
                DS_CONTEUDO: $('ed-inp-text').value || '',
                DS_COR_FONTE: $('ed-inp-fontcolor').value || '',
                DS_COR_LABEL: $('ed-inp-labelcolor').value || '',
                DS_COR_FUNDO: $('ed-inp-bgcolor').value || '',
                IE_TRANSPARENTE: $('ed-chk-transp').checked ? 'S' : 'N',
                IE_ALINHAMENTO: $('ed-inp-align').value || null,
                DS_ESTILO_FONTE: $('ed-inp-fontstyle').value || null,
                IE_BORDA_SUP: $('ed-chk-borda-sup').checked ? 'S' : 'N',
                IE_BORDA_INF: $('ed-chk-borda-inf').checked ? 'S' : 'N',
                IE_BORDA_ESQ: $('ed-chk-borda-esq').checked ? 'S' : 'N',
                IE_BORDA_DIR: $('ed-chk-borda-dir').checked ? 'S' : 'N',
            });

            const enqueueAndSave = (immediate = false) => {
                if (isReverting) return;
                clearTimeout(saveTimer);
                const run = async () => {
                    if (isSaving) { pendingSave = true; return; }
                    const formState = readFormState();
                    const newObj = { ...f, ...formState };
                    if (JSON.stringify(lastSavedObj) === JSON.stringify(newObj)) return;
                    isSaving = true;
                    try {
                        pushUndo(lastSavedObj);
                        await ctx.updateFieldObj(lastSavedObj, newObj);
                        lastSavedObj = { ...newObj };
                        Object.assign(state.activeField, newObj);
                        if (ctx.scheduleRefresh) ctx.scheduleRefresh(state.reportCode, 0);
                    } catch (err) {
                        console.error('[Studio] Save Error:', err.message);
                    } finally {
                        isSaving = false;
                        if (pendingSave) { pendingSave = false; run(); }
                    }
                };
                if (immediate) run(); else saveTimer = setTimeout(run, 300);
            };

            inputs.forEach(inp => {
                if (inp.type === 'checkbox' || inp.tagName === 'SELECT') {
                    inp.addEventListener('change', () => enqueueAndSave());
                } else {
                    inp.addEventListener('blur', () => enqueueAndSave());
                    inp.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') enqueueAndSave(true);
                        if (inp.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                            const step = e.shiftKey ? 10 : 1;
                            inp.value = Number(inp.value) + (e.key === 'ArrowUp' ? step : -step);
                            e.preventDefault();
                            clearTimeout(saveTimer); saveTimer = setTimeout(enqueueAndSave, 400);
                        }
                    });
                }
            });

            $('win-btn-preview').addEventListener('click', () => {
                if (state.reportCode && ctx.generateManualPdf) ctx.generateManualPdf(state.reportCode);
            });

            $('win-btn-close').addEventListener('click', () => {
                editorWindow.close();
                state.level = 2;
                ctx.Fields.load();
                Navbar.switchView('editor');
            });

            $('ed-btn-save').addEventListener('click', async () => {
                const btn = $('ed-btn-save'); btn.innerHTML = 'Aplicando...';
                await enqueueAndSave(true);
                btn.innerHTML = `${ic.save} Aplicar Alterações`;
            });

            $('ed-btn-undo').addEventListener('click', async () => {
                if (undoStack.length === 0) return;
                redoStack.push({ ...lastSavedObj });
                const prev = undoStack.pop();
                applyStateToForm(prev);
                updateUndoRedoUI();
                await ctx.updateFieldObj(lastSavedObj, { ...f, ...prev });
                lastSavedObj = { ...f, ...prev };
                if (ctx.scheduleRefresh) ctx.scheduleRefresh(state.reportCode, 0);
            });

            $('ed-btn-redo').addEventListener('click', async () => {
                if (redoStack.length === 0) return;
                undoStack.push({ ...lastSavedObj });
                const next = redoStack.pop();
                applyStateToForm(next);
                updateUndoRedoUI();
                await ctx.updateFieldObj(lastSavedObj, { ...f, ...next });
                lastSavedObj = { ...f, ...next };
                if (ctx.scheduleRefresh) ctx.scheduleRefresh(state.reportCode, 0);
            });

            // Color pickers sync
            const cpFont = $('ed-inp-colorpicker'), tfFont = $('ed-inp-fontcolor');
            if (cpFont && tfFont) {
                cpFont.value = ctx.tasyToHex ? ctx.tasyToHex(tfFont.value) : '#000000';
                cpFont.addEventListener('change', () => { tfFont.value = cpFont.value.toUpperCase(); enqueueAndSave(); });
            }

            // Preview Redirection Logic
            const _origUpdateOrOpen = ctx.updateOrOpenPreview?.bind(ctx);
            ctx.updateOrOpenPreview = (pdfUrl) => {
                if (!editorWindow || editorWindow.closed) { 
                    ctx.updateOrOpenPreview = _origUpdateOrOpen; 
                    if (_origUpdateOrOpen) _origUpdateOrOpen(pdfUrl);
                    return; 
                }
                const iA = $('tasy-pdf-iframe-A'), iB = $('tasy-pdf-iframe-B');
                if (!iA || !iB) return;
                const isAVisible = iA.style.opacity !== '0';
                const active = isAVisible ? iA : iB, hidden = isAVisible ? iB : iA;
                const loader = $('tasy-pdf-loading'), badge = $('tasy-sync-badge');
                if (badge && (!loader || loader.style.display === 'none')) { badge.style.opacity = '1'; badge.style.transform = 'translateY(0)'; }
                hidden.onload = () => {
                    hidden.style.opacity = '1'; hidden.style.zIndex = '2';
                    active.style.opacity = '0'; active.style.zIndex = '1';
                    if (loader) loader.style.display = 'none';
                    if (badge) { badge.style.opacity = '0'; badge.style.transform = 'translateY(-10px)'; }
                };
                hidden.src = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
            };

            editorWindow.addEventListener('beforeunload', () => {
                ctx.updateOrOpenPreview = _origUpdateOrOpen;
            });
        }
    };
})(window.TasyPdf);
