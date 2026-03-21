window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
  ctx.$httpGlobal = null;

  // AbortQueue: monotonically-increasing counter cancels stale PDF generations
  let refreshTimer = null;
  let refreshGen = 0;
  let isGenerating = false;
  let pendingGenerationCode = null;
  let pendingGenerationGen = 0;
  let saveDebounceTimer = null;
  let initAttempts = 0;

  // Schedules a PDF refresh, cancelling any pending one.
  // delay=0 starts immediately (used when firing in parallel with save).
  ctx.scheduleRefresh = function (code, delay) {
    if (delay === undefined) delay = 400;
    clearTimeout(refreshTimer);
    const myGen = ++refreshGen;
    if (delay === 0) {
      ctx._doGenerate(code, myGen);
    } else {
      refreshTimer = setTimeout(() => ctx._doGenerate(code, myGen), delay);
    }
  };

  ctx._doGenerate = async function (code, gen) {
    if (isGenerating) {
      pendingGenerationCode = code;
      pendingGenerationGen = gen;
      return;
    }

    // Se já existe uma geração mais recente agendada/chamada, descarta esta logo no início
    if (gen !== refreshGen) return;

    isGenerating = true;
    const http = ctx.getHttpService ? ctx.getHttpService() : ctx.$httpGlobal;
    if (!http) return;
    try {
      let param = reportParamCache[code];
      if (!param) {
        const r1 = await http.post(
          '/TasyAppServer/resources/service/Report/getReportsData',
          ctx.buildReportsDataBody(code, 'CMCZ')
        );
        param = r1.data?.reports?.[0];
        if (param) reportParamCache[code] = param;
      }
      if (!param) return;
      const r2 = await http.post(
        '/TasyAppServer/resources/service/Report/generateReports',
        ctx.buildGenerateBody(param)
      );
      if (gen !== refreshGen) return; // stale — uma geração mais recente já existe
      const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
      if (!pdfFileName) return;
      const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;
      ctx.updateOrOpenPreview(pdfUrl);
      window.postMessage({
        type: 'TASY_PDF_HISTORY_ADD',
        payload: { url: pdfUrl, code: code, date: new Date().toLocaleString('pt-BR') }
      }, '*');
    } catch (e) {
      console.error('[Tasy PDF] Geração falhou:', e.message);
    } finally {
      isGenerating = false;
      if (pendingGenerationCode) {
        const nextCode = pendingGenerationCode;
        const nextGen = pendingGenerationGen;
        pendingGenerationCode = null;
        pendingGenerationGen = 0;
        // Roda a próxima da fila se não for stale
        if (nextGen === refreshGen) {
           ctx._doGenerate(nextCode, nextGen);
        }
      }
    }
  };

  ctx.cancelPendingGeneration = function () {
    clearTimeout(refreshTimer);
    refreshGen++; // invalida qualquer geração em voo
    pendingGenerationCode = null; // limpa a fila
  };

  // runAfterSave: mantido para compatibilidade com o interceptor de $http.post
  ctx.runAfterSave = function () {
    const reportInfo = ctx.getReportCodeFromScope ? ctx.getReportCodeFromScope() : null;
    if (!reportInfo) return;
    ctx.scheduleRefresh(reportInfo.code);
  };

  let reportParamCache = {};

  ctx.generateManualPdf = function (code) {
    if (!ctx.getHttpService()) {
      if (ctx.showToast) ctx.showToast('A extensão ainda não identificou o Angular.', 'error');
      return;
    }
    ctx.scheduleRefresh(code, 0);
  };

  ctx.checkExactReportFallback = async function (code) {
    const http = ctx.getHttpService();
    if (!http) return [];
    try {
      const r = await http.post(
        '/TasyAppServer/resources/service/Report/getReportsData',
        ctx.buildReportsDataBody(code, 'CMCZ')
      );
      const p = r.data?.reports?.[0];
      if (p) return [{ CD_RELATORIO: p.code, DS_TITULO: p.title || 'Relatório sem Título', NR_SEQUENCIA: p.sequenceId }];
    } catch (e) { }
    return [];
  };

  ctx.prefetchAllReports = async function (force = false) {
    const CACHE_KEY = 'tasy_pdf_reports_cache';
    const CACHE_TTL = 3600000; // 1 hora

    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            ctx.allReports = data;
            console.log('[Tasy PDF] Relatórios carregados do cache local (Domínio:', data.length, 'itens)');
            return;
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }

    if (ctx.prefetching) return;
    ctx.prefetching = true;

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

      const r = await http.post('/TasyAppServer/resources/service/DataSourceProvider/getDataSource', payload, { suppressError: true, ignoreError: true });

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
        ctx.allReports = list.filter(r => r.IE_TIPO_RELATORIO === 'CMCZ');
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: ctx.allReports
        }));
        console.log('[Tasy PDF] Cache de relatórios atualizado:', ctx.allReports.length, 'itens');
      }
    } catch (e) {
      console.warn('[Tasy PDF] Erro ao cachear relatórios. Usando fallback via rede (debounced).', e);
    } finally {
      ctx.prefetching = false;
    }
  };

  ctx.fetchBands = async function (nrSeqRelatorio) {
    if (!nrSeqRelatorio) throw new Error("PK (NR_SEQUENCIA) ausente no cache do relatório.");
    const payload = [{ "tipo": "RequisicaoDataSource", "@class": "br.com.wheb.vo.componentes.metaData.RequisicaoDataSource", "page": 1, "fieldActivators": {}, "selectFirstRecord": true, "paramsByName": { "_schematicObjCode": 1037907, "NR_SEQ_RELATORIO": Number(nrSeqRelatorio), "isToReloadActivationParameters": true, "cdSetorAtendimento": 0 }, "legendDef": {}, "functionVariables": {}, "tableName": "BANDA_RELATORIO", "nrSeqVisao": 96201, "nrSeqAtivacao": 57005, "featureCode": 260, "tableDescription": "BANDA_RELATORIO_260_96201_dg", "schematicsObj": 1037907, "tipoAtivacao": 3, "inicioPagina": 1, "qtRegistrosPagina": 20, "qtMaxRegistros": 0, "unificarCountRegistros": false, "withoutCache": false, "allAttributes": ["IE_ALTERNA_COR_FUNDO", "DS_OBSERVACAO", "DS_COR_HEADER", "DS_REGRA", "QT_ALTURA", "DS_EXPRESSAO", "IE_FUNDO_TRANSPARENTE", "QT_MAX_REGISTRO", "IE_BORDA_ESQ", "IE_IMPRIME_VAZIO", "IE_SITUACAO", "DS_COR_FOOTER", "IE_BORDA_SUP", "IE_BORDA_DIR", "IE_BANDA_PADRAO", "IE_QUEBRA_PAGINA", "NR_SEQ_RELATORIO", "DT_ATUALIZACAO", "DS_BANDA_SUPERIORA", "NR_SEQ_BANDA_SUPERIOR", "IE_TIPO_BANDA", "NM_USUARIO", "DS_COR_QUEBRA", "NM_TABELA", "DS_BANDA", "IE_IMPRIME_PRIMEIRO", "IE_BORDA_INF", "NR_SEQUENCIA", "DS_SQL", "IE_DIRECTION", "DS_COR_FUNDO", "IE_REIMPRIME_NOVA_PAGINA", "NR_SEQ_APRESENTACAO"], "ieLibera": false, "isAutomaticPagination": true, "saveOrderBy": true }];
    const http = ctx.getHttpService();
    if (!http) throw new Error("Angular não está pronto.");
    const r = await http.post('/TasyAppServer/resources/service/DataSourceProvider/getDataSource', payload, { suppressError: true, ignoreError: true });

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
    const http = ctx.getHttpService();
    if (!http) throw new Error("Angular não está pronto.");
    const r = await http.post('/TasyAppServer/resources/service/DataSourceProvider/getDataSource', payload, { suppressError: true, ignoreError: true });

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
    newObj.DS_COR_FONTE = newObj.DS_COR_FONTE !== undefined ? newObj.DS_COR_FONTE : (oldObj.DS_COR_FONTE || null);
    newObj.DS_COR_LABEL = newObj.DS_COR_LABEL !== undefined ? newObj.DS_COR_LABEL : (oldObj.DS_COR_LABEL || null);
    newObj.IE_TRANSPARENTE = newObj.IE_TRANSPARENTE !== undefined ? newObj.IE_TRANSPARENTE : (oldObj.IE_TRANSPARENTE || 'N');

    // Converte cores HTML → Delphi BGR antes de mandar pro Tasy
    newObj.DS_COR_FUNDO = ctx.hexToTasy(newObj.DS_COR_FUNDO);
    newObj.DS_COR_FONTE = ctx.hexToTasy(newObj.DS_COR_FONTE);
    newObj.DS_COR_LABEL = ctx.hexToTasy(newObj.DS_COR_LABEL);

    const payload = [
      { "tipo": "RequisicaoDataSource", "@class": "br.com.wheb.vo.componentes.metaData.RequisicaoDataSource", "tableName": "BANDA_RELAT_CAMPO", "nrSeqVisao": 96200, "featureCode": 260, "schematicsObj": 1037895 },
      { "tipo": "dsActionParams", "valor": { "acao": "UPDATE", "shouldClean": true, "registro": newObj, "registroOld": oldObj } }
    ];
    const http = ctx.getHttpService();
    if (!http) throw new Error("Angular não está pronto.");
    return http.post('/TasyAppServer/resources/service/WebNativeDataSource/performAction', payload);
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

  ctx.getHttpService = function () {
    if (ctx.$httpGlobal) return ctx.$httpGlobal;
    if (typeof angular === 'undefined') return null;

    // Busca o injector de forma agressiva em vários elementos comuns no Tasy
    const targets = ['[ng-app]', '#tasy-main', 'body', '.ng-scope'];
    for (const sel of targets) {
      const el = document.querySelector(sel);
      if (el) {
        const injector = angular.element(el).injector();
        if (injector) {
          ctx.$httpGlobal = injector.get('$http');
          console.log('[Tasy PDF] Angular $http encontrado via:', sel);
          return ctx.$httpGlobal;
        }
      }
    }
    return null;
  };

  ctx.initAngularDependencies = function () {
    if (!ctx.getHttpService()) {
      if (++initAttempts > 30) {
          console.warn('[Tasy PDF] Desistindo de encontrar Angular após 30 tentativas.');
          return;
      }
      setTimeout(ctx.initAngularDependencies, 1000);
      return;
    }

    // Se já foi inicializado (post já é o nosso), não re-adiciona o wrapper
    if (ctx.$httpGlobal.post.__tasyWrapped) return;

    const _oldPost = ctx.$httpGlobal.post.bind(ctx.$httpGlobal);
    ctx.$httpGlobal.post = function (url, data, config) {
      const promise = _oldPost(url, data, config);

      if (url.includes('WebNativeDataSource/performAction') || url.includes('saveInlineEdit')) {
        promise.then(res => {
          const acao = res.data?.dados?.acao;
          if (acao === 'UPDATE' || acao === 'INSERT' || url.includes('saveInlineEdit')) {
            ctx.triggerDebounced();
          }
        }).catch(() => { });
      }

      return promise;
    };
    ctx.$httpGlobal.post.__tasyWrapped = true;

    ctx.startPrefetchRoutine();

    if (ctx.prefs.spotlightSearch !== false && ctx.injectSpotlightSearch) {
      ctx.injectSpotlightSearch();
    }
  };

})(window.TasyPdf);
