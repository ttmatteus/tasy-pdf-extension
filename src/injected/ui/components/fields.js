window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts, Navbar } = ctx;

    ctx.Fields = {
        load: async function () {
            this.renderLoading(document.getElementById('tasy-editor-body'), "Analisando Componentes");
            const fields = await ctx.fetchFields(state.bandSeq).catch(err => {
                document.getElementById('tasy-editor-body').innerHTML = `<div style="color:#ef4444;">Erro DB: ${err.message}</div>`;
                return null;
            });
            if (!fields) return;
            state.rawFields = fields;
            this.render();
        },

        render: function () {
            Navbar.switchView('editor');
            const edTitle = document.getElementById('tasy-ed-title');
            const edBody = document.getElementById('tasy-editor-body');
            edTitle.innerHTML = `<span style="color:#cbd5e1">${Icons.field}</span> Estrutura <span style="color:#64748b; margin:0 4px;">/</span> <span style="color:#3b82f6">${state.bandName}</span>`;
            
            const fields = state.rawFields;

            const addBtn = `
                <button id="ed-btn-add-field" class="tasy-btn-ghost"
                  style="width:100%; padding:10px; border:1px dashed var(--tasy-border); border-radius:var(--tasy-radius-sm); font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px;">
                  <span style="display:flex;color:var(--tasy-text-muted);">${Icons.add}</span> Novo Campo
                </button>`;

            const pasteBtn = ctx.fieldClipboard ? `
                <button id="ed-btn-paste-field" class="tasy-btn-ghost"
                  style="width:100%; padding:10px; border:1px dashed var(--tasy-border); border-radius:var(--tasy-radius-sm); font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px;">
                  <span style="display:flex;color:var(--tasy-text-muted);">${Icons.clone}</span> Colar "${ctx.fieldClipboard.DS_CAMPO || 'Campo'}" &nbsp;<kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:1px 5px;font-size:10px;color:var(--tasy-text-muted);">Ctrl+V</kbd>
                </button>` : '';

            if (fields.length === 0) {
                edBody.innerHTML = addBtn + pasteBtn + `<div style="color:#a0a0b0; padding:10px; text-align:center; font-size:12px;">Banda vazia — clique em Novo Campo para começar.</div>`;
                return;
            }

            const fieldTypeLabel = {
                '1': { label: 'Texto', color: 'var(--tasy-text-main)' },
                '0': { label: 'Atributo', color: 'var(--tasy-text-main)' },
                '11': { label: 'HTML', color: 'var(--tasy-text-muted)' },
                '28': { label: 'Imagem', color: 'var(--tasy-text-muted)' },
                '21': { label: 'Pág.', color: 'var(--tasy-text-muted)' },
            };
            const getFT = (t) => fieldTypeLabel[String(t)] || { label: 'Tipo ' + t, color: 'var(--tasy-text-muted)' };

            edBody.innerHTML = addBtn + pasteBtn + `<div style="display:flex; flex-direction:column; gap:6px;">` + fields.map((f, i) => {
                const isActive = state.activeField?.NR_SEQUENCIA === f.NR_SEQUENCIA;
                const isCopied = ctx.fieldClipboard?.NR_SEQUENCIA === f.NR_SEQUENCIA;
                const ft = getFT(f.IE_TIPO_CAMPO);
                const inactive = f.IE_SITUACAO === 'I';
                const hasColor = f.DS_COR_FONTE && f.DS_COR_FONTE !== 'clBlack' && f.DS_COR_FONTE !== '#000000';
                const fontColor = hasColor ? f.DS_COR_FONTE : null;
                const hasBg = f.DS_COR_FUNDO && f.DS_COR_FUNDO !== 'clWhite' && f.IE_TRANSPARENTE !== 'S';
                const bgColor = hasBg ? f.DS_COR_FUNDO : null;
                return `
                <div class="tasy-field-item" data-seq="${f.NR_SEQUENCIA}" data-index="${i}" draggable="true"
                     style="display:flex; align-items:stretch; border-radius:var(--tasy-radius-sm);
                             background:${isActive ? 'var(--tasy-bg-hover)' : isCopied ? 'var(--tasy-bg-hover)' : 'var(--tasy-bg-base)'};
                             border:1px solid ${isActive ? 'var(--tasy-text-main)' : isCopied ? 'var(--tasy-text-main)' : 'var(--tasy-border)'};
                             box-shadow:${isActive ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'};
                             z-index:${isActive ? '10' : '1'};
                             cursor:grab; transition:all 0.15s; position:relative;
                             opacity:${inactive ? '0.5' : '1'};
                             user-select:none; -moz-user-select:none; -webkit-user-select:none;">
                  <div style="width:36px; display:flex; align-items:center; justify-content:center; flex-shrink:0; border-right:1px solid var(--tasy-border); background:var(--tasy-bg-hover);">
                    <span style="color:var(--tasy-text-muted); font-size:10px; font-weight:500;" title="Ordem de Apresentação">${f.NR_SEQ_APRESENTACAO || (i + 1)}</span>
                  </div>
                  <div style="flex:1; padding:10px 12px; display:flex; flex-direction:column; gap:6px; min-width:0;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="color:var(--tasy-text-main); font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${f.DS_CAMPO || '—'}</span>
                      ${isCopied ? `<span style="background:var(--tasy-text-main);color:var(--tasy-bg-base);font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;flex-shrink:0;">COPIADO</span>` : ''}
                      ${inactive ? `<span style="background:var(--tasy-danger-bg);color:var(--tasy-danger);font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;flex-shrink:0;">INATIVO</span>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                      <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);color:${ft.color};border-radius:4px;padding:2px 6px;font-size:9px;font-weight:500;">${ft.label}</span>
                       <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);color:var(--tasy-text-muted);border-radius:4px;padding:2px 6px;font-size:9px;font-family:monospace;"><span style="opacity:0.6">X:</span>${f.QT_ESQUERDA || 0}</span>
                       <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);color:var(--tasy-text-muted);border-radius:4px;padding:2px 6px;font-size:9px;font-family:monospace;"><span style="opacity:0.6">Y:</span>${f.QT_TOPO || 0}</span>
                       <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);color:var(--tasy-text-muted);border-radius:4px;padding:2px 6px;font-size:9px;font-family:monospace;"><span style="opacity:0.6">W:</span>${f.QT_TAMANHO || 0}</span>
                       <span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);color:var(--tasy-text-muted);border-radius:4px;padding:2px 6px;font-size:9px;font-family:monospace;"><span style="opacity:0.6">H:</span>${f.QT_ALTURA || 0}</span>
                       ${fontColor ? `<span style="display:flex;align-items:center;gap:4px;background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 6px;"><span style="width:8px;height:8px;border-radius:50%;background:${fontColor};border:1px solid var(--tasy-border);flex-shrink:0;"></span><span style="color:var(--tasy-text-muted);font-size:9px;">fonte</span></span>` : ''}
                       ${bgColor ? `<span style="display:flex;align-items:center;gap:4px;background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 6px;"><span style="width:8px;height:8px;border-radius:2px;background:${bgColor};border:1px solid var(--tasy-border);flex-shrink:0;"></span><span style="color:var(--tasy-text-muted);font-size:9px;">fundo</span></span>` : ''}
                       ${f.QT_TAM_FONTE ? `<span style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);color:var(--tasy-text-muted);border-radius:4px;padding:2px 6px;font-size:9px;font-family:monospace;">${f.QT_TAM_FONTE}pt</span>` : ''}
                    </div>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:6px 10px; border-left:1px solid var(--tasy-border);">
                    <button class="tasy-btn-clone-field" data-seq="${f.NR_SEQUENCIA}" title="Clonar campo"
                      style="border:none;background:transparent;color:var(--tasy-text-muted);width:28px;height:28px;border-radius:var(--tasy-radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;"
                      onmouseover="this.style.background='var(--tasy-bg-hover)';this.style.color='var(--tasy-text-main)'"
                      onmouseout="this.style.background='transparent';this.style.color='var(--tasy-text-muted)'">
                      ${Icons.clone}
                    </button>
                    <button class="tasy-btn-delete-field" data-seq="${f.NR_SEQUENCIA}" title="Deletar campo"
                      style="border:none;background:transparent;color:var(--tasy-text-muted);width:28px;height:28px;border-radius:var(--tasy-radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;"
                      onmouseover="this.style.background='var(--tasy-danger)';this.style.color='white'"
                      onmouseout="this.style.background='transparent';this.style.color='var(--tasy-text-muted)'">
                      ${Icons.trash}
                    </button>
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
            edBody.querySelectorAll('.tasy-field-item').forEach(el => {
                el.addEventListener('dragstart', (e) => {
                    window._tasyIsDragging = true;
                    e.dataTransfer.effectAllowed = 'move';
                    dragSourceIndex = parseInt(el.getAttribute('data-index'));
                    el.style.opacity = '0.5';
                });
                el.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    el.style.border = '1px solid var(--tasy-text-main)';
                    el.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
                    el.style.transform = 'translateY(-2px)';
                    el.style.zIndex = '20';
                });
                el.addEventListener('dragleave', (e) => {
                    const isActive = state.activeField?.NR_SEQUENCIA === parseInt(el.getAttribute('data-seq'));
                    el.style.border = isActive ? '1px solid var(--tasy-text-main)' : '1px solid var(--tasy-border)';
                    el.style.boxShadow = isActive ? '0 4px 12px rgba(0,0,0,0.5)' : 'none';
                    el.style.transform = 'none';
                    el.style.zIndex = isActive ? '10' : '1';
                });
                el.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    const dropTargetIndex = parseInt(el.getAttribute('data-index'));
                    const isActive = state.activeField?.NR_SEQUENCIA === parseInt(el.getAttribute('data-seq'));
                    el.style.border = isActive ? '1px solid var(--tasy-text-main)' : '1px solid var(--tasy-border)';
                    el.style.transform = 'none';

                    if (dragSourceIndex !== null && dragSourceIndex !== dropTargetIndex) {
                        this.handleReorder(dragSourceIndex, dropTargetIndex);
                    }
                    setTimeout(() => { window._tasyIsDragging = false; }, 100);
                    return false;
                });
                el.addEventListener('dragend', () => {
                    const isActive = state.activeField?.NR_SEQUENCIA === parseInt(el.getAttribute('data-seq'));
                    el.style.border = isActive ? '1px solid var(--tasy-text-main)' : '1px solid var(--tasy-border)';
                    el.style.boxShadow = isActive ? '0 4px 12px rgba(0,0,0,0.5)' : 'none';
                    el.style.zIndex = isActive ? '10' : '1';
                    el.style.opacity = el.innerHTML.includes('INATIVO') ? '0.5' : '1';
                    setTimeout(() => { window._tasyIsDragging = false; }, 100);
                });
            });
        },

        handleReorder: async function (fromIdx, toIdx) {
            // Snapshot imutável de todos os campos ANTES de qualquer mutação
            const snapshots = state.rawFields.map(f => ({ ...f }));
            const fields = state.rawFields.map(f => ({ ...f }));

            // Captura os valores de ordem atuais para redistribuir
            const seqValues = fields.map((f, i) => f.NR_SEQ_APRESENTACAO || (i + 1)).sort((a, b) => a - b);

            const [movedItem] = fields.splice(fromIdx, 1);
            fields.splice(toIdx, 0, movedItem);

            const updates = [];
            fields.forEach((f, i) => {
                const newSeq = seqValues[i];
                // Usa o snapshot original para pegar o oldSeq correto
                const oldObjOriginal = snapshots.find(s => s.NR_SEQUENCIA === f.NR_SEQUENCIA);
                const oldSeq = oldObjOriginal?.NR_SEQ_APRESENTACAO;
                if (oldSeq !== newSeq) {
                    f.NR_SEQ_APRESENTACAO = newSeq;
                    updates.push({ oldField: { ...oldObjOriginal }, newField: { ...f } });
                }
            });

            state.rawFields = fields;
            this.render();

            if (updates.length > 0) {
                try {
                    // Executa updates em série com pequeno atraso para estabilidade do Tasy
                    for (let u of updates) {
                        await ctx.updateFieldObj(u.oldField, u.newField);
                        await new Promise(r => setTimeout(r, 100)); // Sleep 100ms
                    }
                    Toasts.show('Ordem atualizada com sucesso no banco!', 'success');
                } catch (err) {
                    Toasts.show('Tasy recusou atualização de ordem. Tente novamente.', 'error');
                    console.error('[Tasy PDF] Erro na reordenação:', err);
                    this.load(); 
                }
            }
        },

        paste: async function () {
            if (!ctx.fieldClipboard) return;
            const btn = document.getElementById('ed-btn-paste-field');
            if (btn) { btn.textContent = 'Colando...'; btn.disabled = true; }
            try {
                await ctx.cloneFieldObj(ctx.fieldClipboard);
                Toasts.show(`"${ctx.fieldClipboard.DS_CAMPO || 'Campo'}" colado!`, 'success');
                this.load();
            } catch (err) {
                Toasts.show('Erro ao colar campo: ' + err.message, 'error');
                this.render();
            }
        },

        openDeleteModal: function (fieldObj) {
            document.getElementById('tasy-modal-delete')?.remove();
            const modal = document.createElement('div');
            modal.id = 'tasy-modal-delete';
            Object.assign(modal.style, {
                position: 'fixed', inset: '0', zIndex: '2000000000',
                background: 'rgba(0,0,0,0.72)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
            });
            const nome = fieldObj.DS_CAMPO || `Campo #${fieldObj.NR_SEQUENCIA}`;
            modal.innerHTML = `
              <div style="background:var(--tasy-bg-surface-solid);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-lg);padding:28px;width:340px;max-width:95vw;box-shadow:var(--tasy-shadow-lg);font-family:system-ui,sans-serif;text-align:center;">
                <div style="color:var(--tasy-text-main);font-size:16px;font-weight:700;margin-bottom:8px;">Deletar campo?</div>
                <div style="color:var(--tasy-text-muted);font-size:13px;margin-bottom:12px;">Você está prestes a deletar permanentemente:</div>
                <div style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);padding:10px 14px;margin-bottom:12px;color:var(--tasy-text-main);font-size:13px;font-weight:600;font-family:monospace;">${nome}</div>
                <div style="color:var(--tasy-text-muted);font-size:11px;margin-bottom:24px;">Esta ação não pode ser desfeita.</div>
                <div style="display:flex;gap:12px;">
                  <button id="md-cancel" style="flex:1;padding:12px;background:transparent;color:var(--tasy-text-main);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">Cancelar</button>
                  <button id="md-confirm" style="flex:1;padding:12px;background:var(--tasy-danger);color:white;border:none;border-radius:var(--tasy-radius-sm);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><span style="display:flex;">${Icons.trash}</span> Deletar</button>
                </div>
              </div>`;
            document.body.appendChild(modal);

            const closeModal = () => modal.remove();
            document.getElementById('md-cancel').addEventListener('click', closeModal);
            modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

            document.getElementById('md-confirm').addEventListener('click', async () => {
                if (!ctx.deleteFieldObj) { Toasts.show('deleteFieldObj não disponível.', 'error'); return; }
                const btn = document.getElementById('md-confirm');
                btn.textContent = 'Deletando...';
                btn.disabled = true;
                try {
                    await ctx.deleteFieldObj(fieldObj);
                    Toasts.show(`"${nome}" deletado.`, 'success');
                    closeModal();
                    this.load();
                } catch (err) {
                    Toasts.show('Erro ao deletar: ' + err.message, 'error');
                    btn.innerHTML = `${Icons.trash} Tentar novamente`;
                    btn.disabled = false;
                }
            });
        },

        openCreateModal: function () {
            document.getElementById('tasy-modal-create')?.remove();
            const modal = document.createElement('div');
            modal.id = 'tasy-modal-create';
            Object.assign(modal.style, {
                position: 'fixed', inset: '0', zIndex: '2000000000',
                background: 'rgba(0,0,0,0.72)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
            });
            modal.innerHTML = `
              <div style="background:var(--tasy-bg-surface-solid);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-lg);padding:32px;width:460px;max-width:95vw;box-shadow:var(--tasy-shadow-lg);font-family:system-ui,sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
                  <span style="color:var(--tasy-text-main);font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;">${Icons.add} Novo Campo</span>
                  <button id="mc-close" style="background:none;border:none;color:var(--tasy-text-muted);cursor:pointer;font-size:20px;line-height:1;transition:all 0.2s;" onmouseover="this.style.color='var(--tasy-text-main)'" onmouseout="this.style.color='var(--tasy-text-muted)'">✕</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:16px;">
                  <div>
                    <label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">NOME DO CAMPO</label>
                    <input id="mc-nome" type="text" value="NOVO_CAMPO" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'" />
                  </div>
                  <div>
                    <label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">CONTEÚDO</label>
                    <input id="mc-conteudo" type="text" placeholder="Conteúdo textual" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--tasy-text-muted)'" onblur="this.style.borderColor='var(--tasy-border)'" />
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;">
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">X (Left)</label>
                    <input id="mc-x" type="number" value="5" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;" /></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">Y (Top)</label>
                    <input id="mc-y" type="number" value="1" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;" /></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">L (Width)</label>
                    <input id="mc-w" type="number" value="50" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;" /></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">A (Height)</label>
                    <input id="mc-h" type="number" value="17" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;" /></div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">Tamanho Fonte</label>
                    <input id="mc-fontsize" type="number" value="8" style="width:100%;box-sizing:border-box;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;" /></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">Estilo</label>
                    <select id="mc-fontstyle" style="width:100%;height:45px;padding:0 12px;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;color-scheme:dark;">
                      <option value="">Normal</option><option value="N">Negrito</option>
                      <option value="I">Itálico</option><option value="NI">Negrito + Itálico</option>
                      <option value="S">Sublinhado</option>
                    </select></div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">Cor da Fonte</label>
                    <div style="display:flex;gap:8px;align-items:center;">
                      <input type="color" id="mc-fontcolor-picker" value="#000000" style="width:40px;height:40px;padding:0;border:none;background:transparent;cursor:pointer;border-radius:6px;flex-shrink:0;" />
                      <input id="mc-fontcolor" type="text" value="clBlack" style="flex:1;min-width:0;padding:12px;background:transparent;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;" />
                    </div></div>
                    <div><label style="color:var(--tasy-text-muted);font-size:11px;font-weight:500;display:block;margin-bottom:6px;">Alinhamento</label>
                    <select id="mc-align" style="width:100%;height:45px;padding:0 12px;border:1px solid var(--tasy-border);color:var(--tasy-text-main);border-radius:var(--tasy-radius-sm);font-size:13px;outline:none;color-scheme:dark;">
                      <option value="E">Esquerda</option><option value="C">Centro</option><option value="D">Direita</option>
                    </select></div>
                  </div>
                </div>
                <div style="display:flex;gap:12px;margin-top:32px;">
                  <button id="mc-cancel" style="flex:1;padding:12px;background:transparent;color:var(--tasy-text-main);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">Cancelar</button>
                  <button id="mc-confirm" style="flex:2;padding:12px;background:var(--tasy-text-main);color:var(--tasy-bg-base);border:none;border-radius:var(--tasy-radius-sm);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><span style="display:flex;">${Icons.add}</span> Criar Campo</button>
                </div>
              </div>`;
            document.body.appendChild(modal);

            const closeModal = () => modal.remove();
            document.getElementById('mc-close').addEventListener('click', closeModal);
            document.getElementById('mc-cancel').addEventListener('click', closeModal);
            modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

            const picker = document.getElementById('mc-fontcolor-picker');
            const txt = document.getElementById('mc-fontcolor');
            picker.addEventListener('input', () => { txt.value = ctx.hexToTasy ? ctx.hexToTasy(picker.value) : picker.value.toUpperCase(); });
            txt.addEventListener('blur', () => { picker.value = ctx.tasyToHex ? ctx.tasyToHex(txt.value) : '#000000'; });

            document.getElementById('mc-confirm').addEventListener('click', async () => {
                if (!ctx.insertFieldObj) { Toasts.show('insertFieldObj não disponível.', 'error'); return; }
                const btn = document.getElementById('mc-confirm');
                btn.textContent = 'Criando...';
                btn.disabled = true;
                const overrides = {
                    DS_CAMPO: document.getElementById('mc-nome').value.trim() || 'NOVO_CAMPO',
                    DS_CONTEUDO: document.getElementById('mc-conteudo').value || null,
                    QT_ESQUERDA: Number(document.getElementById('mc-x').value) || 5,
                    QT_TOPO: Number(document.getElementById('mc-y').value) || 1,
                    QT_TAMANHO: Number(document.getElementById('mc-w').value) || 50,
                    QT_ALTURA: Number(document.getElementById('mc-h').value) || 17,
                    QT_TAM_FONTE: Number(document.getElementById('mc-fontsize').value) || 8,
                    DS_ESTILO_FONTE: document.getElementById('mc-fontstyle').value || null,
                    DS_COR_FONTE: ctx.hexToTasy ? ctx.hexToTasy(txt.value) : txt.value,
                    IE_ALINHAMENTO: document.getElementById('mc-align').value || 'E',
                };
                try {
                    await ctx.insertFieldObj(state.bandSeq, overrides);
                    Toasts.show(`Campo "${overrides.DS_CAMPO}" criado!`, 'success');
                    closeModal();
                    this.load();
                } catch (err) {
                    Toasts.show('Erro ao criar: ' + err.message, 'error');
                    btn.innerHTML = `${Icons.add} Tentar novamente`;
                    btn.disabled = false;
                }
            });

            setTimeout(() => document.getElementById('mc-nome')?.select(), 60);
        }
    };
})(window.TasyPdf);
