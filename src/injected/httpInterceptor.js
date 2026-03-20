window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
  ctx.running = false;
  ctx.pendingRun = false;
  ctx.$httpGlobal = null;

  let saveDebounceTimer = null;
  let initAttempts = 0;

  ctx.runAfterSave = async function () {
    if (ctx.running) {
      ctx.pendingRun = true;
      return;
    }
    if (!ctx.$httpGlobal) {
      console.warn('[Tasy PDF] Operação abortada: Dependências Angular ainda não prontas.');
      return;
    }

    ctx.running = true;

    try {
      const reportInfo = ctx.getReportCodeFromScope();
      if (!reportInfo) {
        console.log('[Auto] relatório não encontrado no scope');
        return;
      }

      let param = ctx.getCachedReportParam();
      if (!param || param.code !== reportInfo.code) {
        const r1 = await ctx.$httpGlobal.post(
          '/TasyAppServer/resources/service/Report/getReportsData',
          ctx.buildReportsDataBody(reportInfo.code, reportInfo.type)
        );

        param = r1.data?.reports?.[0];
        ctx.setCachedReportParam(param);
        if (!param) {
          throw new Error('relatório não encontrado em getReportsData');
        }
      }

      const r2 = await ctx.$httpGlobal.post(
        '/TasyAppServer/resources/service/Report/generateReports',
        ctx.buildGenerateBody(param)
      );

      const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
      if (!pdfFileName) throw new Error('pdfFileName não encontrado');

      const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;

      // Chama a UI do Drawer
      ctx.updateOrOpenPreview(pdfUrl);

      // Despacha p/ ContentScript salvar histórico
      window.postMessage({
        type: 'TASY_PDF_HISTORY_ADD',
        payload: {
          url: pdfUrl,
          code: reportInfo.code,
          date: new Date().toLocaleString('pt-BR')
        }
      }, '*');

    } catch (e) {
      console.log('[Erro]', e.message);
    } finally {
      ctx.running = false;

      if (ctx.pendingRun) {
        ctx.pendingRun = false;
        setTimeout(() => ctx.runAfterSave(), 0);
      }
    }
  };

  ctx.generateManualPdf = async function (code) {
    if (ctx.running) return;
    if (!ctx.$httpGlobal) {
      if (ctx.showToast) ctx.showToast('A extensão ainda não identificou o Angular.', 'error');
      console.warn('[Tasy PDF] Operação manual abortada: Angular não pronto.');
      return;
    }

    ctx.running = true;
    if (ctx.showToast) ctx.showToast(`Gerando relatório ${code}...`, 'info');

    try {
      const r1 = await ctx.$httpGlobal.post(
        '/TasyAppServer/resources/service/Report/getReportsData',
        ctx.buildReportsDataBody(code, 'CMCZ')
      );

      const param = r1.data?.reports?.[0];
      if (!param) throw new Error('Código inexistente no banco');

      const r2 = await ctx.$httpGlobal.post(
        '/TasyAppServer/resources/service/Report/generateReports',
        ctx.buildGenerateBody(param)
      );

      const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
      if (!pdfFileName) throw new Error('Falha ao instanciar URL de PDF');

      const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;

      ctx.updateOrOpenPreview(pdfUrl);
      if (ctx.showToast) ctx.showToast(`Relatório ${code} gerado na tela!`, 'success');

      window.postMessage({
        type: 'TASY_PDF_HISTORY_ADD',
        payload: { url: pdfUrl, code: code, date: new Date().toLocaleString('pt-BR') }
      }, '*');
    } catch (err) {
      if (ctx.showToast) ctx.showToast(`Erro: ${err.message}`, 'error');
      console.error('[Tasy Manual Preview Failed]', err);
    } finally {
      ctx.running = false;
    }
  };

  ctx.checkExactReportFallback = async function (code) {
    try {
      const r = await ctx.$httpGlobal.post(
        '/TasyAppServer/resources/service/Report/getReportsData',
        ctx.buildReportsDataBody(code, 'CMCZ')
      );
      const p = r.data?.reports?.[0];
      if (p) return [{ CD_RELATORIO: p.code, DS_TITULO: p.title || 'Relatório sem Título', NR_SEQUENCIA: p.sequenceId }];
    } catch (e) { }
    return [];
  };

  ctx.prefetchAllReports = async function () {
    if (ctx.allReports) return;
    try {
      const payload = [{
        "tipo": "RequisicaoDataSource",
        "@class": "br.com.wheb.vo.componentes.metaData.RequisicaoDataSource",
        "page": 1,
        "fieldActivators": {},
        "selectFirstRecord": false,
        "paramsByName": {
          "_schematicObjCode": 1038025,
          "isToReloadActivationParameters": true,
          "cdSetorAtendimento": 0,
          "_filterCode": 990959,
          "_checkoutFilters": [],
          "_dimensionValues": {}
        },
        "legendDef": {},
        "functionVariables": {},
        "tableName": "RELATORIO",
        "nrSeqVisao": 96218,
        "nrSeqAtivacao": 0,
        "featureCode": 260,
        "tableDescription": "RELATORIO_260_96218_dg",
        "schematicsObj": 1038025,
        "tipoAtivacao": 9,
        "inicioPagina": 1,
        "actionName": "WDBPanelWithFilterAction",
        "qtRegistrosPagina": 3000,
        "qtMaxRegistros": 0,
        "unificarCountRegistros": true,
        "withoutCache": false,
        "allAttributes": ["NR_SEQUENCIA", "CD_CLASSIF_RELAT", "IE_FILTRO_TEXTO", "IE_ETIQUETA", "BTN_AVISO_CUSTOMIZADO", "CD_CLASSIF_RELAT_WHEB", "QT_MARGEM_SUP", "QT_ALTURA", "DS_ACTION_NAME", "IE_ESPACO_BRANCO", "CD_CGC_CLIENTE", "IE_ESPACO_ENTRE_LINHAS", "IE_BORDA_ESQ", "IE_IMPRIME_VAZIO", "IE_BORDA_DIR", "IE_FILTRO_EXCEL", "IE_TIPO_RELATORIO", "IE_FILTRO_WORD", "NR_VERSAO", "IE_GERAR_BASE", "NR_SEQ_ORDEM_SERV", "CD_RELATORIO_PAIS", "IE_BORDA_INF", "DS_SQL", "DS_COR_FUNDO", "IE_ESPACO_BRANCO_2", "QT_MARGEM_ESQ", "DS_REGRA", "IE_CHAMADA_DIRETA", "CD_CLASSIF_RELAT_PAIS", "DS_TITULO", "IE_FILTRO_HTML", "QT_MARGEM_DIR", "QT_COLUNA", "NR_SEQ_MODULO", "CD_PAIS", "QT_LARGURA", "IE_ORIENTACAO", "IE_TIPO_PAPEL", "IE_GERAR_RELATORIO", "IE_BORDA_SUP", "DS_MODULO", "IE_BASE_WHEB", "IE_AJUSTAR_TAMANHO", "DS_REPORT_TITLE_CUSTOM", "DT_ATUALIZACAO", "QT_ESPACO_COLUNA", "DS_PROCEDURE", "NM_USUARIO", "NR_SEQ_MOD_IMPL", "NM_TABELA", "CD_VERSION", "CD_RELATORIO_WHEB", "DT_LAST_MODIFICATION", "DS_CLIENTE", "CD_RELATORIO", "QT_MARGEM_INF", "CD_RELATORIO_WHEB_LCB"],
        "ieLibera": false,
        "filterValues": {
          "_dimensionValues": {},
          "IE_TIPO_RELATORIO": "CMCZ",
          "CD_CLASSIF_RELAT": null,
          "NR_SEQ_MODULO": null,
          "CD_PAIS": null,
          "_filterCode": 990959,
          "_checkoutFilters": []
        },
        "isAutomaticPagination": true,
        "saveOrderBy": true
      }];

      const r = await ctx.$httpGlobal.post('/TasyAppServer/resources/service/DataSourceProvider/getDataSource', payload, { suppressError: true, ignoreError: true });

      function extractList(obj) {
        if (Array.isArray(obj) && obj.length > 0 && obj[0].CD_RELATORIO !== undefined) return obj;
        if (obj && typeof obj === 'object') {
          for (const key of Object.keys(obj)) {
            const arr = extractList(obj[key]);
            if (arr) return arr;
          }
        }
        return null;
      }

      const list = extractList(r.data);
      if (list) {
        // Garantia dupla local, se o banco ignorar o filtro
        ctx.allReports = list.filter(r => r.IE_TIPO_RELATORIO === 'CMCZ');
      }
    } catch (e) {
      console.warn('[Tasy PDF] Erro ao cachear relatórios. Usando fallback via rede (debounced).', e);
    }
  };

  ctx.fetchBands = async function (nrSeqRelatorio) {
    if (!nrSeqRelatorio) throw new Error("PK (NR_SEQUENCIA) ausente no cache do relatório.");
    const payload = [{ "tipo": "RequisicaoDataSource", "@class": "br.com.wheb.vo.componentes.metaData.RequisicaoDataSource", "page": 1, "fieldActivators": {}, "selectFirstRecord": true, "paramsByName": { "_schematicObjCode": 1037907, "NR_SEQ_RELATORIO": Number(nrSeqRelatorio), "isToReloadActivationParameters": true, "cdSetorAtendimento": 0 }, "legendDef": {}, "functionVariables": {}, "tableName": "BANDA_RELATORIO", "nrSeqVisao": 96201, "nrSeqAtivacao": 57005, "featureCode": 260, "tableDescription": "BANDA_RELATORIO_260_96201_dg", "schematicsObj": 1037907, "tipoAtivacao": 3, "inicioPagina": 1, "qtRegistrosPagina": 20, "qtMaxRegistros": 0, "unificarCountRegistros": false, "withoutCache": false, "allAttributes": ["IE_ALTERNA_COR_FUNDO", "DS_OBSERVACAO", "DS_COR_HEADER", "DS_REGRA", "QT_ALTURA", "DS_EXPRESSAO", "IE_FUNDO_TRANSPARENTE", "QT_MAX_REGISTRO", "IE_BORDA_ESQ", "IE_IMPRIME_VAZIO", "IE_SITUACAO", "DS_COR_FOOTER", "IE_BORDA_SUP", "IE_BORDA_DIR", "IE_BANDA_PADRAO", "IE_QUEBRA_PAGINA", "NR_SEQ_RELATORIO", "DT_ATUALIZACAO", "DS_BANDA_SUPERIORA", "NR_SEQ_BANDA_SUPERIOR", "IE_TIPO_BANDA", "NM_USUARIO", "DS_COR_QUEBRA", "NM_TABELA", "DS_BANDA", "IE_IMPRIME_PRIMEIRO", "IE_BORDA_INF", "NR_SEQUENCIA", "DS_SQL", "IE_DIRECTION", "DS_COR_FUNDO", "IE_REIMPRIME_NOVA_PAGINA", "NR_SEQ_APRESENTACAO"], "ieLibera": false, "isAutomaticPagination": true, "saveOrderBy": true }];
    const r = await ctx.$httpGlobal.post('/TasyAppServer/resources/service/DataSourceProvider/getDataSource', payload, { suppressError: true, ignoreError: true });

    let arr = r.data?.dados?.linhasResultSet;
    if (!arr && r.data?.dados?.DataSource) arr = r.data.dados.DataSource;
    if (!arr && r.data?.dados?.BANDA_RELATORIO) arr = r.data.dados.BANDA_RELATORIO;
    if (!arr && Array.isArray(r.data?.dados)) arr = r.data.dados;
    if (!arr) arr = extractListFromWhatever(r.data);

    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error("Zero Bandas. DUMP do Server: " + JSON.stringify(r.data?.dados || {}));
    }
    return arr;
  };

  ctx.fetchFields = async function (nrSeqBanda) {
    if (!nrSeqBanda) throw new Error("PK (NR_SEQ_BANDA) ausente.");
    const payload = [{ "tipo": "RequisicaoDataSource", "@class": "br.com.wheb.vo.componentes.metaData.RequisicaoDataSource", "page": 1, "fieldActivators": {}, "selectFirstRecord": true, "paramsByName": { "_schematicObjCode": 1037895, "NR_SEQ_BANDA": Number(nrSeqBanda), "isToReloadActivationParameters": true, "cdSetorAtendimento": 0 }, "legendDef": {}, "functionVariables": {}, "tableName": "BANDA_RELAT_CAMPO", "nrSeqVisao": 96200, "nrSeqAtivacao": 57048, "featureCode": 260, "tableDescription": "BANDA_RELAT_CAMPO_260_96200_dg", "schematicsObj": 1037895, "tipoAtivacao": 3, "inicioPagina": 1, "qtRegistrosPagina": 150, "unificarCountRegistros": false, "withoutCache": false, "allAttributes": ["NR_SEQUENCIA", "NR_SEQ_BANDA", "DS_CAMPO", "DS_LABEL", "DS_CONTEUDO", "QT_ALTURA", "QT_TAMANHO", "QT_TOPO", "QT_ESQUERDA", "QT_TAM_FONTE", "DS_COR_FONTE", "DS_TIPO_FONTE", "DS_ESTILO_FONTE", "NM_ATRIBUTO", "IE_TIPO_CAMPO", "IE_ALINHAMENTO", "DS_ALINHAMENTO", "IE_BORDA_ESQ", "IE_BORDA_SUP", "IE_BORDA_DIR", "IE_BORDA_INF", "DS_COR_FUNDO", "DS_COR_LABEL", "IE_FUNDO_TRANSPARENTE", "IE_AJUSTAR_TAMANHO", "IE_TRANSPARENTE", "IE_SITUACAO", "DT_ATUALIZACAO", "NM_USUARIO"], "ieLibera": false, "isAutomaticPagination": true, "saveOrderBy": true }];
    const r = await ctx.$httpGlobal.post('/TasyAppServer/resources/service/DataSourceProvider/getDataSource', payload, { suppressError: true, ignoreError: true });

    let arr = r.data?.dados?.linhasResultSet;
    if (!arr && r.data?.dados?.DataSource) arr = r.data.dados.DataSource;
    if (!arr && Array.isArray(r.data?.dados)) arr = r.data.dados;
    if (!arr) arr = extractListFromWhatever(r.data);

    if (!Array.isArray(arr)) arr = [];
    return arr;
  };

  ctx.updateFieldObj = async function (oldObj, newObj) {
    // Garante que os campos de cor estão presentes explicitamente no DTO
    newObj.DS_COR_FUNDO = newObj.DS_COR_FUNDO !== undefined ? newObj.DS_COR_FUNDO : (oldObj.DS_COR_FUNDO || null);
    // NOTA: IE_FUNDO_TRANSPARENTE NÃO EXISTE em BANDA_RELAT_CAMPO (só em BANDA_RELATORIO) - não enviar
    newObj.IE_TRANSPARENTE = newObj.IE_TRANSPARENTE !== undefined ? newObj.IE_TRANSPARENTE : (oldObj.IE_TRANSPARENTE || 'N');

    // Converte cores HTML → Delphi BGR antes de mandar pro Tasy
    newObj.DS_COR_FUNDO = ctx.hexToTasy(newObj.DS_COR_FUNDO);
    newObj.DS_COR_FONTE = ctx.hexToTasy(newObj.DS_COR_FONTE);
    newObj.DS_COR_LABEL = ctx.hexToTasy(newObj.DS_COR_LABEL);

    const payload = [
      { "tipo": "RequisicaoDataSource", "@class": "br.com.wheb.vo.componentes.metaData.RequisicaoDataSource", "tableName": "BANDA_RELAT_CAMPO", "nrSeqVisao": 96200, "featureCode": 260, "schematicsObj": 1037895 },
      { "tipo": "dsActionParams", "valor": { "acao": "UPDATE", "shouldClean": true, "registro": newObj, "registroOld": oldObj } }
    ];
    console.log('[Tasy Studio] DTO enviado:', JSON.stringify({ DS_COR_FUNDO: newObj.DS_COR_FUNDO, IE_TRANSPARENTE: newObj.IE_TRANSPARENTE }));
    const r = await ctx.$httpGlobal.post('/TasyAppServer/resources/service/WebNativeDataSource/performAction', payload);
    console.log('[Tasy Studio] performAction resposta:', r.data);
    return r;
  };



  // Converte HTML hex (#RRGGBB) → Delphi BGR ($00BBGGRR)
  // Se já for formato Tasy (clXxx ou $...) retorna sem alterar.
  ctx.hexToTasy = function (hex) {
    if (!hex || !hex.startsWith('#')) return hex; // clBlack, clWhite etc. passam direto
    const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7);
    return '$00' + b.toUpperCase() + g.toUpperCase() + r.toUpperCase();
  };

  // Converte Delphi BGR ($00BBGGRR) → HTML hex (#RRGGBB) para o Color Picker
  ctx.tasyToHex = function (tasy) {
    if (!tasy) return '#ffffff';
    if (tasy.startsWith('#') && tasy.length === 7) return tasy.toLowerCase();
    if (tasy.startsWith('$00') && tasy.length === 9) {
      const b = tasy.slice(3, 5), g = tasy.slice(5, 7), r = tasy.slice(7, 9);
      return '#' + r + g + b;
    }
    // Named colors
    const map = {
      'clblack': '#000000', 'clwhite': '#ffffff', 'clred': '#ff0000', 'clblue': '#0000ff',
      'clgreen': '#008000', 'clyellow': '#ffff00', 'clgray': '#808080', 'clsilver': '#c0c0c0'
    };
    return map[tasy.toLowerCase()] || '#ffffff';
  };

  function extractListFromWhatever(obj) {
    if (Array.isArray(obj) && obj.length > 0) return obj;
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
        const nested = extractListFromWhatever(obj[key]);
        if (nested && nested.length > 0) return nested;
      }
    }
    return null;
  }

  ctx.triggerDebounced = function () {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => ctx.runAfterSave(), 0);
  };

  ctx.initAngularDependencies = function () {
    if (typeof angular === 'undefined') {
      if (++initAttempts > 20) return; // Fail smoothly on non-tasy sites
      setTimeout(ctx.initAngularDependencies, 500);
      return;
    }

    const injector = angular.element(document.body).injector();
    if (!injector) {
      if (++initAttempts > 20) return;
      setTimeout(ctx.initAngularDependencies, 500);
      return;
    }

    ctx.$httpGlobal = injector.get('$http');
    const _oldPost = ctx.$httpGlobal.post.bind(ctx.$httpGlobal);

    ctx.$httpGlobal.post = function (url, data, config) {
      const promise = _oldPost(url, data, config);

      if (url.includes('WebNativeDataSource/performAction')) {
        promise.then(res => {
          const acao = res.data?.dados?.acao;
          if (acao === 'UPDATE' || acao === 'INSERT') {
            ctx.triggerDebounced();
          }
        }).catch(() => { });
      }

      return promise;
    };

    ctx.startPrefetchRoutine();

    // Apenas prefetcha se for usar a Spotlight (ou para cache de uso geral)
    if (ctx.prefs.spotlightSearch !== false) {
      ctx.prefetchAllReports();
    }

    // Como o angular e $http carregaram com sucesso nesta aba/frame:
    if (ctx.injectFloatingActionButton) ctx.injectFloatingActionButton();
    if (ctx.prefs.spotlightSearch !== false && ctx.injectSpotlightSearch) {
      ctx.injectSpotlightSearch();
    }
  };

})(window.TasyPdf);
