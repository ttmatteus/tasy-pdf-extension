window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts, Navbar } = ctx;

    ctx.Bands = {
        load: async function () {
            const bands = await ctx.fetchBands(state.reportSeq).catch(() => null);
            state.rawBands = bands || [];
            this.render();
        },

        render: function () {
            Navbar.switchView('editor');
            const edTitle = document.getElementById('tasy-ed-title');
            const edBody = document.getElementById('tasy-editor-body');
            
            edTitle.innerHTML = `<span style="color:#cbd5e1">${Icons.band}</span> Bandas <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${state.reportCode}</span>`;

            const bands = state.rawBands;
            if (!bands) { this.renderLoading(edBody, "Carregando Bandas"); return; }
            if (bands.length === 0) { edBody.innerHTML = `<div style="color:#ef4444; padding:10px;">Nenhuma banda encontrada.</div>`; return; }

            const pasteBtn = ctx.bandClipboard ? `
                <button id="ed-btn-paste-band"
                  style="width:100%; padding:10px; background:rgba(167,139,250,0.1); color:#a78bfa; border:1px dashed rgba(167,139,250,0.4); border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:10px; transition:all 0.2s;"
                  onmouseover="this.style.background='rgba(167,139,250,0.2)'" onmouseout="this.style.background='rgba(167,139,250,0.1)'">
                  ${Icons.clone} Colar "${ctx.bandClipboard.bandObj.DS_BANDA}" (${ctx.bandClipboard.fieldCount} campo${ctx.bandClipboard.fieldCount !== 1 ? 's' : ''}) &nbsp;<kbd style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;font-size:10px;">Ctrl+V</kbd>
                </button>` : '';

            const pastelTypeMap = {
                'C': { label: 'Cabeçalho', color: 'var(--tasy-text-main)' },
                'R': { label: 'Rodapé', color: 'var(--tasy-text-muted)' },
                'S': { label: 'Detalhe', color: 'var(--tasy-text-main)' },
                'T': { label: 'Título', color: 'var(--tasy-text-muted)' },
            };
            const getBandStyle = (tipo) => pastelTypeMap[tipo] || { label: tipo || '?', color: 'var(--tasy-text-muted)' };

            edBody.innerHTML = pasteBtn + `<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">` +
                bands.map((b, i) => {
                    const isActive = state.activeBand?.NR_SEQUENCIA === b.NR_SEQUENCIA;
                    const isCopied = ctx.bandClipboard?.bandObj?.NR_SEQUENCIA === b.NR_SEQUENCIA;
                    const bs = getBandStyle(b.IE_TIPO_BANDA);
                    const fundo = b.DS_COR_FUNDO && b.DS_COR_FUNDO !== 'clWhite' ? b.DS_COR_FUNDO : null;
                    return `
                    <div class="tasy-band-item" draggable="true" data-index="${i}" data-seq="${b.NR_SEQUENCIA}" data-name="${b.DS_BANDA}"
                         style="background:${isActive ? 'var(--tasy-bg-hover)' : isCopied ? 'var(--tasy-bg-hover)' : 'var(--tasy-bg-base)'};
                                border:1px solid ${isActive ? 'var(--tasy-text-muted)' : isCopied ? 'var(--tasy-text-main)' : 'var(--tasy-border)'};
                                border-radius:var(--tasy-radius); cursor:grab; transition:all 0.2s var(--tasy-spring);
                                display:flex; flex-direction:column; gap:0; position:relative; overflow:hidden;
                                user-select:none; -moz-user-select:none; -webkit-user-select:none;">
                       <div style="padding:14px;">
                         <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:6px; margin-bottom:10px;">
                           <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                             <span style="color:var(--tasy-text-main); font-weight:600; font-size:13px; line-height:1.3; word-break:break-word;">${b.DS_BANDA}</span>
                           </div>
                           ${isCopied ? `<span style="background:var(--tasy-text-main);color:var(--tasy-bg-base);font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;letter-spacing:0.5px;flex-shrink:0;">COPIADA</span>` : ''}
                         </div>
                         <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                           <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:3px 8px;font-size:10px;color:${bs.color};font-weight:500;">${bs.label}</span>
                           <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:3px 8px;font-size:10px;color:var(--tasy-text-muted);">H: ${b.QT_ALTURA || 0}px</span>
                           ${fundo ? `<span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 6px;font-size:10px;color:var(--tasy-text-muted);display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:${fundo};border:1px solid var(--tasy-border);"></span>${fundo}</span>` : ''}
                           <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:3px 8px;font-size:10px;color:var(--tasy-text-muted);">#${i + 1}</span>
                         </div>
                         <div style="display:flex; align-items:center; justify-content:space-between;">
                           <kbd class="tasy-band-copy-hint" style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 6px;font-size:10px;color:var(--tasy-text-muted);opacity:0;transition:opacity 0.2s;">Ctrl+C</kbd>
                           <button class="tasy-btn-delete-band" data-seq="${b.NR_SEQUENCIA}"
                             style="border:none; background:transparent; color:var(--tasy-text-muted); padding:4px 6px; border-radius:4px; cursor:pointer; font-size:12px; display:flex; align-items:center; transition:all 0.2s; opacity:0;"
                             onmouseover="this.style.background='var(--tasy-danger)';this.style.color='white';this.style.opacity='1'"
                             onmouseout="this.style.background='transparent';this.style.color='var(--tasy-text-muted)';this.style.opacity='0'"
                             title="Deletar banda e todos os campos">
                             ${Icons.trash}
                           </button>
                         </div>
                       </div>
                    </div>`;
                }).join('') + `</div>`;

            this.setupDragAndDrop(edBody);
        },

        renderLoading: function (target, msg) {
            target.innerHTML = `<div style="padding: 14px; color: #a0a0b0; font-size: 14px; text-align: center;">${msg}... aguarde</div>`;
        },

        setupDragAndDrop: function (edBody) {
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
                    if (delBtn) { delBtn.style.opacity = '0'; delBtn.style.background = 'transparent'; delBtn.style.color = 'var(--tasy-text-muted)'; }
                });

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
                    const isCopied = String(ctx.bandClipboard?.bandObj?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
                    el.style.border = isCopied ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.07)';
                    el.style.transform = 'none';
                });
                el.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    const dropTargetIndex = parseInt(el.getAttribute('data-index'));
                    const isCopied = String(ctx.bandClipboard?.bandObj?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
                    el.style.border = isCopied ? '1px solid rgba(167,139,250,0.6)' : '1px solid rgba(255,255,255,0.07)';
                    el.style.transform = 'none';

                    if (dragSourceIndex !== null && dragSourceIndex !== dropTargetIndex) {
                        this.handleReorder(dragSourceIndex, dropTargetIndex);
                    }
                    setTimeout(() => { window._tasyIsDragging = false; }, 100);
                    return false;
                });
                el.addEventListener('dragend', () => {
                    el.style.opacity = '1';
                    setTimeout(() => { window._tasyIsDragging = false; }, 100);
                });
            });
        },

        handleReorder: async function (fromIdx, toIdx) {
            const bands = [...state.rawBands];
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

            state.rawBands = bands;
            this.render();

            if (updates.length > 0) {
                try {
                    for (let u of updates) {
                        await ctx.updateBandObj(u.oldBand, u.newBand);
                    }
                    Toasts.show('Ordem das bandas atualizada com sucesso!', 'success');
                } catch (err) {
                    Toasts.show('Erro ao atualizar ordem. Recarregando...', 'error');
                    this.load();
                }
            }
        },

        paste: async function () {
            if (!ctx.bandClipboard) return;
            const btn = document.getElementById('ed-btn-paste-band');
            if (btn) { btn.textContent = 'Colando...'; btn.disabled = true; }
            try {
                await ctx.cloneBandObj(ctx.bandClipboard.bandObj);
                Toasts.show(`"${ctx.bandClipboard.bandObj.DS_BANDA}" colada com ${ctx.bandClipboard.fieldCount} campo(s)!`, 'success');
                this.load();
            } catch (err) {
                Toasts.show('Erro ao colar banda: ' + err.message, 'error');
                this.render();
            }
        },

        openDeleteModal: function (bandObj) {
            document.getElementById('tasy-modal-delete-band')?.remove();
            const modal = document.createElement('div');
            modal.id = 'tasy-modal-delete-band';
            Object.assign(modal.style, {
                position: 'fixed', inset: '0', zIndex: '2000000000',
                background: 'rgba(0,0,0,0.72)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
            });
            const nome = bandObj.DS_BANDA || `Banda #${bandObj.NR_SEQUENCIA}`;
            modal.innerHTML = `
              <div style="background:var(--tasy-bg-surface-solid);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-lg);padding:28px;width:360px;max-width:95vw;box-shadow:var(--tasy-shadow-lg);font-family:system-ui,sans-serif;text-align:center;">
                <div style="color:var(--tasy-text-main);font-size:16px;font-weight:700;margin-bottom:8px;">Deletar banda?</div>
                <div style="color:var(--tasy-text-muted);font-size:13px;margin-bottom:12px;">Você está prestes a deletar permanentemente:</div>
                <div style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);padding:10px 14px;margin-bottom:12px;color:var(--tasy-text-main);font-size:13px;font-weight:600;font-family:monospace;">${nome}</div>
                <div style="color:var(--tasy-danger);font-size:12px;font-weight:500;margin-bottom:4px;">Todas os campos dentro dela também serão deletados.</div>
                <div style="color:var(--tasy-text-muted);font-size:11px;margin-bottom:24px;">Esta ação não pode ser desfeita.</div>
                <div id="mdb-progress" style="display:none;margin-bottom:20px;">
                  <div style="color:var(--tasy-text-muted);font-size:12px;margin-bottom:8px;" id="mdb-progress-text">Deletando campos...</div>
                  <div style="background:var(--tasy-bg-hover);border-radius:4px;height:6px;overflow:hidden;">
                    <div id="mdb-progress-bar" style="background:var(--tasy-text-main);height:100%;width:0%;transition:width 0.2s;"></div>
                  </div>
                </div>
                <div style="display:flex;gap:12px;" id="mdb-buttons">
                  <button id="mdb-cancel" style="flex:1;padding:12px;background:transparent;color:var(--tasy-text-main);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);font-size:13px;font-weight:500;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">Cancelar</button>
                  <button id="mdb-confirm" style="flex:1;padding:12px;background:var(--tasy-danger);color:white;border:none;border-radius:var(--tasy-radius-sm);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><span style="display:flex;">${Icons.trash}</span> Deletar</button>
                </div>
              </div>`;
            document.body.appendChild(modal);

            const closeModal = () => modal.remove();
            document.getElementById('mdb-cancel').addEventListener('click', closeModal);
            modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

            document.getElementById('mdb-confirm').addEventListener('click', async () => {
                if (!ctx.deleteBandWithFields) { Toasts.show('deleteBandWithFields não disponível.', 'error'); return; }
                document.getElementById('mdb-buttons').style.display = 'none';
                document.getElementById('mdb-progress').style.display = 'block';
                const progressText = document.getElementById('mdb-progress-text');
                const progressBar = document.getElementById('mdb-progress-bar');
                try {
                    await ctx.deleteBandWithFields(bandObj, (done, total) => {
                        progressText.textContent = `Deletando campos... ${done}/${total}`;
                        progressBar.style.width = Math.round((done / total) * 100) + '%';
                    });
                    Toasts.show(`Banda "${nome}" deletada.`, 'success');
                    closeModal();
                    if (ctx.bandClipboard?.bandObj?.NR_SEQUENCIA === bandObj.NR_SEQUENCIA) ctx.bandClipboard = null;
                    this.load();
                } catch (err) {
                    Toasts.show('Erro ao deletar banda: ' + err.message, 'error');
                    closeModal();
                    this.render();
                }
            });
        }
    };
})(window.TasyPdf);
