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
                <button id="ed-btn-add-field"
                  style="width:100%; padding:10px; background:rgba(16,185,129,0.1); color:#34d399; border:1px dashed rgba(16,185,129,0.4); border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; margin-bottom:8px;"
                  onmouseover="this.style.background='rgba(16,185,129,0.18)'" onmouseout="this.style.background='rgba(16,185,129,0.1)'">
                  ${Icons.add} Novo Campo
                </button>`;

            const pasteBtn = ctx.fieldClipboard ? `
                <button id="ed-btn-paste-field"
                  style="width:100%; padding:10px; background:rgba(167,139,250,0.1); color:#a78bfa; border:1px dashed rgba(167,139,250,0.4); border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px; transition:all 0.2s;"
                  onmouseover="this.style.background='rgba(167,139,250,0.2)'" onmouseout="this.style.background='rgba(167,139,250,0.1)'">
                  ${Icons.clone} Colar "${ctx.fieldClipboard.DS_CAMPO || 'Campo'}" &nbsp;<kbd style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:1px 5px;font-size:10px;">Ctrl+V</kbd>
                </button>` : '';

            if (fields.length === 0) {
                edBody.innerHTML = addBtn + pasteBtn + `<div style="color:#a0a0b0; padding:10px; text-align:center; font-size:12px;">Banda vazia — clique em Novo Campo para começar.</div>`;
                return;
            }

            const fieldTypeLabel = {
                '1': { label: 'Texto', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                '0': { label: 'Atributo', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
                '11': { label: 'HTML', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
                '28': { label: 'Imagem', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
                '21': { label: 'Pág.', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
            };
            const getFT = (t) => fieldTypeLabel[String(t)] || { label: 'Tipo ' + t, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };

            edBody.innerHTML = addBtn + pasteBtn + `<div style="display:flex; flex-direction:column; gap:5px;">` + fields.map((f, i) => {
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
                     style="display:flex; align-items:stretch; border-radius:9px; overflow:hidden;
                            background:${isActive ? 'rgba(59,130,246,0.08)' : isCopied ? 'rgba(167,139,250,0.07)' : 'rgba(43,43,54,0.9)'};
                            border:1px solid ${isActive ? '#3b82f6' : isCopied ? 'rgba(167,139,250,0.45)' : inactive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'};
                            cursor:grab; transition:all 0.15s; position:relative;
                            box-shadow:${isActive ? '0 0 0 1px rgba(59,130,246,0.2)' : 'none'};
                            opacity:${inactive ? '0.45' : '1'};
                            user-select:none; -moz-user-select:none; -webkit-user-select:none;"
                     onmouseover="this.style.borderColor='rgba(96,165,250,0.45)';this.style.background='rgba(59,130,246,0.05)';this.style.transform='translateX(2px)';"
                     onmouseout="this.style.borderColor='${isCopied ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.06)'}';this.style.background='${isCopied ? 'rgba(167,139,250,0.07)' : 'rgba(43,43,54,0.9)'}';this.style.transform='translateX(0)';">
                  <div style="width:3px; background:${ft.color}; flex-shrink:0; opacity:0.7;"></div>
                  <div style="width:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.04);">
                    <span style="color:#334155; font-size:9px; font-weight:600;">${i + 1}</span>
                  </div>
                  <div style="flex:1; padding:8px 10px; display:flex; flex-direction:column; gap:5px; min-width:0;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="color:#e2e8f0; font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${f.DS_CAMPO || '—'}</span>
                      ${isCopied ? `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;">COPIADO</span>` : ''}
                      ${inactive ? `<span style="background:rgba(239,68,68,0.12);color:#ef4444;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;">INATIVO</span>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                      <span style="background:${ft.bg};color:${ft.color};border-radius:4px;padding:1px 6px;font-size:9px;font-weight:600;">${ft.label}</span>
                      <span style="background:rgba(129,140,248,0.08);color:#818cf8;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">X:${f.QT_ESQUERDA || 0}</span>
                      <span style="background:rgba(52,211,153,0.08);color:#34d399;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">Y:${f.QT_TOPO || 0}</span>
                      <span style="background:rgba(251,191,36,0.08);color:#fbbf24;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">W:${f.QT_TAMANHO || 0}</span>
                      <span style="background:rgba(248,113,113,0.08);color:#f87171;border-radius:4px;padding:1px 5px;font-size:9px;font-family:monospace;">H:${f.QT_ALTURA || 0}</span>
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
                      ${Icons.clone}
                    </button>
                    <button class="tasy-btn-delete-field" data-seq="${f.NR_SEQUENCIA}" title="Deletar campo"
                      style="border:none;background:rgba(239,68,68,0.06);color:#7f3f3f;width:26px;height:26px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s;flex-shrink:0;"
                      onmouseover="this.style.background='rgba(239,68,68,0.22)';this.style.color='#ef4444'"
                      onmouseout="this.style.background='rgba(239,68,68,0.06)';this.style.color='#7f3f3f'">
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
                    el.style.border = '1px dashed #3b82f6';
                    el.style.transform = 'translateX(2px)';
                });
                el.addEventListener('dragleave', (e) => {
                    const inactive = el.style.opacity === '0.45';
                    const isCopied = String(ctx.fieldClipboard?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
                    el.style.border = isCopied ? '1px solid rgba(167,139,250,0.45)' : inactive ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.06)';
                    el.style.transform = 'none';
                });
                el.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    const dropTargetIndex = parseInt(el.getAttribute('data-index'));
                    const inactive = el.style.opacity === '0.45';
                    const isCopied = String(ctx.fieldClipboard?.NR_SEQUENCIA) === String(el.getAttribute('data-seq'));
                    el.style.border = isCopied ? '1px solid rgba(167,139,250,0.45)' : inactive ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.06)';
                    el.style.transform = 'none';

                    if (dragSourceIndex !== null && dragSourceIndex !== dropTargetIndex) {
                        this.handleReorder(dragSourceIndex, dropTargetIndex);
                    }
                    setTimeout(() => { window._tasyIsDragging = false; }, 100);
                    return false;
                });
                el.addEventListener('dragend', () => {
                    el.style.opacity = el.innerHTML.includes('INATIVO') ? '0.45' : '1';
                    setTimeout(() => { window._tasyIsDragging = false; }, 100);
                });
            });
        },

        handleReorder: function (fromIdx, toIdx) {
            const fields = [...state.rawFields];
            const [movedItem] = fields.splice(fromIdx, 1);
            fields.splice(toIdx, 0, movedItem);
            state.rawFields = fields;
            this.render();
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
              <div style="background:#1e1e2e;border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:28px;width:340px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;text-align:center;">
                <div style="color:#f1f5f9;font-size:16px;font-weight:700;margin-bottom:8px;">Deletar campo?</div>
                <div style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Você está prestes a deletar permanentemente:</div>
                <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 14px;margin-bottom:12px;color:#fca5a5;font-size:13px;font-weight:600;font-family:monospace;">${nome}</div>
                <div style="color:#475569;font-size:11px;margin-bottom:20px;">Esta ação não pode ser desfeita.</div>
                <div style="display:flex;gap:10px;">
                  <button id="md-cancel" style="flex:1;padding:12px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Cancelar</button>
                  <button id="md-confirm" style="flex:1;padding:12px;background:#ef4444;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.3);">${Icons.trash} Deletar</button>
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
              <div style="background:#1e1e2e;border:1px solid rgba(167,139,250,0.3);border-radius:14px;padding:24px;width:420px;max-width:95vw;box-shadow:0 30px 80px rgba(0,0,0,0.6);font-family:system-ui,sans-serif;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                  <span style="color:#f1f5f9;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;">${Icons.add} Novo Campo</span>
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
                  <button id="mc-confirm" style="flex:2;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(59,130,246,0.3);">${Icons.add} Criar Campo</button>
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
