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

            // Reset do body
            wd.body.innerHTML = '';
            Object.assign(wd.body.style, {
                margin: '0', padding: '0', background: '#0f0f13',
                color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif',
                height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            });

            const root = wd.createElement('div');
            root.style.cssText = 'display:flex;flex-direction:column;height:100%;';
            wd.body.appendChild(root);

            // Header da janela
            const header = wd.createElement('div');
            header.style.cssText = 'height:50px;min-height:50px;background:#16161d;border-bottom:1px solid #2b2b36;display:flex;align-items:center;justify-content:space-between;padding:0 20px;';
            header.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:32px;height:32px;background:rgba(59,130,246,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#3b82f6;">${ic.field}</div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${f.DS_CAMPO}</div>
                    <div style="font-size:10px;color:#64748b;font-weight:500;">Editando campo na banda ${state.bandName}</div>
                  </div>
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
