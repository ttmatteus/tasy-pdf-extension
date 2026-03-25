window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
  ctx.$httpGlobal = null;

  let refreshTimer = null;
  let refreshGen = 0;
  let isGenerating = false;
  let pendingGenerationCode = null;
  let pendingGenerationGen = 0;
  let saveDebounceTimer = null;
  let initAttempts = 0;

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
        const types = ctx.prefs?.reportTypes?.length ? ctx.prefs.reportTypes : ['CMCZ'];
        for (const t of types) {
          try {
            const r1 = await http.post(
              '/TasyAppServer/resources/service/Report/getReportsData',
              ctx.buildReportsDataBody(code, t)
            );
            param = r1.data?.reports?.[0];
            if (param) { reportParamCache[code] = param; break; }
          } catch(e) {}
        }
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

      // Adiciona ao histórico (com SeqId do main)
      window.postMessage({
        type: 'TASY_PDF_HISTORY_ADD',
        payload: { 
          url: pdfUrl, 
          code: code, 
          seq: param.sequenceId,
          date: new Date().toLocaleString('pt-BR') 
        }
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
    const types = ctx.prefs?.reportTypes?.length ? ctx.prefs.reportTypes : ['CMCZ'];
    for (const t of types) {
      try {
        const r = await http.post(
          '/TasyAppServer/resources/service/Report/getReportsData',
          ctx.buildReportsDataBody(Number(code), t)
        );
        const p = r.data?.reports?.[0];
        if (p) return [{ CD_RELATORIO: p.code, DS_TITULO: p.title || 'Relatório sem Título', NR_SEQUENCIA: p.sequenceId }];
      } catch (e) { }
    }
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
        const activeTypes = ctx.prefs?.reportTypes?.length ? ctx.prefs.reportTypes : ['CMCZ'];
        ctx.allReports = list.filter(r => activeTypes.includes(r.IE_TIPO_RELATORIO));
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: ctx.allReports
        }));
        console.log('[Tasy PDF] Cache de relatórios atualizado:', ctx.allReports.length, 'itens (tipos:', activeTypes.join(', '), ')');
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

  // ─────────────────────────────────────────────────────────────────────────
  // Header de RequisicaoDataSource compartilhado — evita repetir o bloco
  // gigante em insert, delete, clone e update tanto de campos quanto bandas.
  // ─────────────────────────────────────────────────────────────────────────
  function buildDatasourceHeader(tableName, opts) {
    const CAMPO = {
      schematicsObj: 1037895, nrSeqVisao: 96200, nrSeqAtivacao: 57048,
      tableDescription: 'BANDA_RELAT_CAMPO_260_96200_dg',
      paramKey: 'NR_SEQ_BANDA',
      allAttributes: [
        'DS_MASCARA','IE_HUMANO_BARCODE','DS_OBSERVACAO','NR_SEQ_LOGO',
        'IE_ZERA_APOS_IMPRIMIR','QT_ALTURA','DS_EXPRESSAO','IE_TRANSPARENTE',
        'IE_CAMPO_QUEBRA','PR_ALTURA_BARCODE','IE_INFO_PACIENTE','IE_BORDA_ESQ',
        'IE_POSICAO_LEGENDA','QT_FONTE_BARCODE','DS_ESTILO_FONTE','IE_BORDA_DIR',
        'IE_TIPO_BARCODE','DS_CONTEUDO_RICH','IE_MARCADOR','IE_TOTALIZAR',
        'IE_ALINHAMENTO','IE_METODO_ESTENDER','IE_DATAMATRIX_MODULE','IE_TIPO_DESENHO',
        'IE_TIPO_CAMPO','NM_TIME_ZONE_ATTRIBUTE','IE_SENSIVEL','DS_COR_LABEL',
        'IE_BORDA_INF','NR_SEQUENCIA','DS_SQL','DS_COR_FUNDO','IE_ALTERA_VALOR',
        'DS_ALINHAMENTO','IE_ESTENDER','QT_TAM_FONTE','DS_TEXTO_BARRAS','QT_TOPO',
        'NR_SEQ_BANDA','QT_TAMANHO','NM_ATRIBUTO','DS_CONTEUDO','IE_ALINHAR_BANDA',
        'IE_SITUACAO','IE_BORDA_SUP','DS_COR_FONTE','IE_DATE_TYPE','DS_TIPO_FONTE',
        'IE_QUEBRA_PAGINA','IE_AJUSTAR_TAMANHO','DS_CAMPO','DT_ATUALIZACAO',
        'QT_ESQUERDA','IE_TIPO_CHART','NM_USUARIO','QT_POS_ESQUERDA','DS_LABEL',
        'NR_SEQ_APRESENTACAO'
      ]
    };
    const BANDA = {
      schematicsObj: 1037907, nrSeqVisao: 96201, nrSeqAtivacao: 57005,
      tableDescription: 'BANDA_RELATORIO_260_96201_dg',
      paramKey: 'NR_SEQ_RELATORIO',
      allAttributes: [
        'IE_ALTERNA_COR_FUNDO','DS_OBSERVACAO','DS_COR_HEADER','DS_REGRA',
        'QT_ALTURA','DS_EXPRESSAO','IE_FUNDO_TRANSPARENTE','QT_MAX_REGISTRO',
        'IE_BORDA_ESQ','IE_IMPRIME_VAZIO','IE_SITUACAO','DS_COR_FOOTER',
        'IE_BORDA_SUP','IE_BORDA_DIR','IE_BANDA_PADRAO','IE_QUEBRA_PAGINA',
        'NR_SEQ_RELATORIO','DT_ATUALIZACAO','DS_BANDA_SUPERIORA',
        'NR_SEQ_BANDA_SUPERIOR','IE_TIPO_BANDA','NM_USUARIO','DS_COR_QUEBRA',
        'NM_TABELA','DS_BANDA','IE_IMPRIME_PRIMEIRO','IE_BORDA_INF','NR_SEQUENCIA',
        'DS_SQL','IE_DIRECTION','DS_COR_FUNDO','IE_REIMPRIME_NOVA_PAGINA',
        'NR_SEQ_APRESENTACAO'
      ]
    };
    const meta = tableName === 'BANDA_RELATORIO' ? BANDA : CAMPO;
    return {
      'tipo': 'RequisicaoDataSource',
      '@class': 'br.com.wheb.vo.componentes.metaData.RequisicaoDataSource',
      'page': 1,
      'fieldActivators': {},
      'selectFirstRecord': true,
      'paramsByName': {
        '_schematicObjCode': meta.schematicsObj,
        [meta.paramKey]: Number(opts.pkValue),
        'isToReloadActivationParameters': true,
        'cdSetorAtendimento': 0
      },
      'legendDef': {},
      'functionVariables': {},
      'tableName': tableName,
      'nrSeqVisao': meta.nrSeqVisao,
      'nrSeqAtivacao': meta.nrSeqAtivacao,
      'featureCode': 260,
      'tableDescription': meta.tableDescription,
      'schematicsObj': meta.schematicsObj,
      'tipoAtivacao': 3,
      'inicioPagina': opts.inicioPagina !== undefined ? opts.inicioPagina : 1,
      'qtRegistrosPagina': 150,
      'qtMaxRegistros': 0,
      'unificarCountRegistros': false,
      'withoutCache': false,
      'allAttributes': meta.allAttributes,
      'ieLibera': false,
      'isAutomaticPagination': true,
      'saveOrderBy': true,
      'utilizaInfiniteScroll': false
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER interno: executa NEW_RECORD → INSERT para qualquer tabela.
  // Usado por insertFieldObj e insertBandObj.
  // ─────────────────────────────────────────────────────────────────────────
  async function performInsert(tableName, pkValue, overrides, fieldDefaults) {
    const http = ctx.getHttpService();
    if (!http) throw new Error('Angular não está pronto.');

    const headerNew = buildDatasourceHeader(tableName, { pkValue });

    // Passo 1 — NEW_RECORD: servidor devolve template com defaults
    const r1 = await http.post(
      '/TasyAppServer/resources/service/WebNativeDataSource/performAction',
      [headerNew, { 'tipo': 'dsActionParams', 'valor': { 'acao': 'NEW_RECORD', 'aborted': false, 'isSaveAndAdd': false, 'msgCode': '' } }],
      { suppressError: true, ignoreError: true }
    );
    const template = r1.data?.dados?.registro || r1.data?.dados?.registros?.[0] || r1.data?.dados;
    if (!template || !template.NR_SEQUENCIA) {
      throw new Error('[performInsert] NEW_RECORD não devolveu template. Dump: ' + JSON.stringify(r1.data));
    }

    // Passo 2 — monta registro final: template + defaults fixos + overrides do caller
    const registroOld = { ...template, _NEW_RECORD: true };
    const registro = { ...template, ...fieldDefaults, ...overrides };

    const headerIns = buildDatasourceHeader(tableName, { pkValue });
    const r2 = await http.post(
      '/TasyAppServer/resources/service/WebNativeDataSource/performAction',
      [
        headerIns,
        {
          'tipo': 'dsActionParams',
          'valor': {
            'acao': 'INSERT', 'shouldClean': true,
            'registro': registro, 'registroOld': registroOld,
            'camposLog': {}, 'attachedFile': {},
            'aborted': false, 'isSaveAndAdd': false, 'msgCode': ''
          }
        }
      ],
      { suppressError: true, ignoreError: true }
    );
    const saved = r2.data?.dados?.registro || r2.data?.dados?.registros?.[0] || registro;
    console.log('[Tasy PDF] INSERT OK —', tableName, '— NR_SEQUENCIA:', saved.NR_SEQUENCIA);
    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER: sanitiza um objeto antes de mandar pro Tasy.
  // Remove campos do frontend (_hashCode, PAGING_RN, FRAMEWORK_ORDER_INDEX, etc.)
  // e converte DT_ATUALIZACAO para o formato java.time.Instant esperado pelo servidor.
  // ─────────────────────────────────────────────────────────────────────────
  const FRONTEND_FIELDS = new Set([
    '_hashCode', 'PAGING_RN', 'FRAMEWORK_ORDER_INDEX',
  ]);

  function sanitizeForServer(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (FRONTEND_FIELDS.has(k)) continue;
      if (k === 'DT_ATUALIZACAO' && v) {
        // Já no formato correto
        if (typeof v === 'object' && v['@class'] === 'java.time.Instant') {
          out[k] = v;
        } else {
          // Garante que a string está em ISO 8601 — o servidor rejeita qualquer outro formato
          // Ex: "Sun Mar 22 2026 13:12:18 GMT-0300" → "2026-03-22T16:12:18.000Z"
          let isoStr = String(v);
          if (!isoStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
            // Não é ISO — tenta parsear via Date()
            const parsed = new Date(isoStr);
            isoStr = isNaN(parsed.getTime()) ? isoStr : parsed.toISOString();
          }
          out[k] = { '@class': 'java.time.Instant', 'type': 'INSTANT', 'value': isoStr };
        }
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER interno: executa DELETE para qualquer tabela.
  // ─────────────────────────────────────────────────────────────────────────
  async function performDelete(tableName, pkValue, obj) {
    const http = ctx.getHttpService();
    if (!http) throw new Error('Angular não está pronto.');
    if (!obj?.NR_SEQUENCIA) throw new Error('[performDelete] obj sem NR_SEQUENCIA.');

    const registro = sanitizeForServer(obj);
    // records mantém _hashCode pois o sniffer mostrou que ele manda junto
    const records  = [{ ...registro, _hashCode: obj._hashCode, PAGING_RN: obj.PAGING_RN }];

    const header = buildDatasourceHeader(tableName, { pkValue, inicioPagina: 0 });
    const body = JSON.stringify([
      header,
      {
        'tipo': 'dsActionParams',
        'valor': {
          'acao': 'DELETE', 'shouldClean': true,
          'registro': registro,
          'registroOld': null,
          'records': records,
          'aborted': false, 'isSaveAndAdd': false, 'msgCode': ''
        }
      }
    ]);

    // Usa fetch nativo para ter controle total da resposta —
    // o Angular $http explode com SyntaxError quando o servidor retorna texto puro.
    const resp = await fetch('/TasyAppServer/resources/service/WebNativeDataSource/performAction', {
      method: 'POST',
      credentials: 'include',  // envia cookies de sessão do Tasy
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/plain, */*' },
      body
    });

    const raw = await resp.text();

    if (!resp.ok) {
      throw new Error('HTTP ' + resp.status + ': ' + raw.slice(0, 200));
    }

    // Tenta parsear como JSON — se falhar, o servidor mandou mensagem de erro em texto
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) {
      throw new Error('Servidor retornou texto inesperado: ' + raw.slice(0, 300));
    }

    const dadosAcao = parsed?.dados?.acao;
    if (dadosAcao && dadosAcao !== 'DELETE') {
      throw new Error('Servidor rejeitou DELETE. Resposta: ' + JSON.stringify(parsed?.dados));
    }

    console.log('[Tasy PDF] DELETE OK —', tableName, '— NR_SEQUENCIA:', obj.NR_SEQUENCIA);
  }
  // ═══════════════════════════════════════════════════════════════════════
  //  CAMPOS  (BANDA_RELAT_CAMPO)
  // ═══════════════════════════════════════════════════════════════════════

  // Cria um campo em branco na banda nrSeqBanda.
  // overrides: qualquer campo que queira definir antes de salvar.
  // ex: { DS_CAMPO: 'NM_PACIENTE', QT_TOPO: 40, QT_ESQUERDA: 10 }
  ctx.insertFieldObj = async function (nrSeqBanda, overrides = {}) {
    return performInsert('BANDA_RELAT_CAMPO', nrSeqBanda, overrides, {
      DS_CONTEUDO_RICH: '<html tasy="html5"><body><p style="text-align:left; font-size:12pt;"><span style="font-size:12pt;"></span></p></body></html>',
      IE_TIPO_CAMPO: '1',
      DS_SQL: '',
      NM_ATRIBUTO: ''
    });
  };

  // Deleta o campo. Precisa do objeto completo (como retornado por fetchFields).
  ctx.deleteFieldObj = async function (fieldObj) {
    return performDelete('BANDA_RELAT_CAMPO', fieldObj.NR_SEQ_BANDA, fieldObj);
  };

  // Clona um campo — cria cópia idêntica logo abaixo do original.
  ctx.cloneFieldObj = async function (fieldObj) {
    if (!fieldObj?.NR_SEQ_BANDA) throw new Error('[cloneFieldObj] fieldObj sem NR_SEQ_BANDA.');
    const SKIP = new Set(['NR_SEQUENCIA','DT_ATUALIZACAO','NM_USUARIO','QT_POS_ESQUERDA','DS_ALINHAMENTO','_hashCode','PAGING_RN']);
    const overrides = {};
    for (const [k, v] of Object.entries(fieldObj)) {
      if (!SKIP.has(k)) overrides[k] = v;
    }
    overrides.QT_TOPO  = (Number(fieldObj.QT_TOPO)   || 0) + (Number(fieldObj.QT_ALTURA) || 17);
    if (fieldObj.DS_CAMPO) overrides.DS_CAMPO = fieldObj.DS_CAMPO + '_COPIA';
    const cloned = await ctx.insertFieldObj(fieldObj.NR_SEQ_BANDA, overrides);
    console.log('[Tasy PDF] CLONE campo:', fieldObj.NR_SEQUENCIA, '→', cloned.NR_SEQUENCIA);
    return cloned;
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  BANDAS  (BANDA_RELATORIO)
  // ═══════════════════════════════════════════════════════════════════════

  // Cria uma banda no relatório nrSeqRelatorio.
  // overrides: campos opcionais a definir antes de salvar.
  // ex: { DS_BANDA: 'Cabeçalho Novo', IE_TIPO_BANDA: 'H', QT_ALTURA: 30 }
  ctx.insertBandObj = async function (nrSeqRelatorio, overrides = {}) {
    return performInsert('BANDA_RELATORIO', nrSeqRelatorio, overrides, {
      IE_SITUACAO:            'A',
      IE_TIPO_BANDA:          'D',   // D = Detalhe (tipo mais comum)
      IE_BANDA_PADRAO:        'N',
      IE_QUEBRA_PAGINA:       'N',
      IE_IMPRIME_VAZIO:       'N',
      IE_IMPRIME_PRIMEIRO:    'N',
      IE_REIMPRIME_NOVA_PAGINA: 'N',
      IE_FUNDO_TRANSPARENTE:  'S',
      IE_ALTERNA_COR_FUNDO:   'N',
      IE_BORDA_SUP:           'N',
      IE_BORDA_INF:           'N',
      IE_BORDA_ESQ:           'N',
      IE_BORDA_DIR:           'N',
      IE_DIRECTION:           'H',
      DS_COR_FUNDO:           'clWhite',
      DS_COR_HEADER:          'clWhite',
      DS_COR_FOOTER:          'clWhite',
      DS_COR_QUEBRA:          'clWhite',
      QT_ALTURA:              20,
      QT_MAX_REGISTRO:        0,
      DS_SQL:                 '',
      DS_BANDA:               overrides.DS_BANDA || 'Nova Banda'
    });
  };

  // Deleta a banda. Precisa do objeto completo (como retornado por fetchBands).
  // ⚠️  O Tasy bloqueia delete de banda que ainda tenha campos — use deleteBandWithFields.
  ctx.deleteBandObj = async function (bandObj) {
    return performDelete('BANDA_RELATORIO', bandObj.NR_SEQ_RELATORIO, bandObj);
  };

  // Deleta a banda E todos os seus campos (em sequência).
  // Retorna { deletedFields: N }
  ctx.deleteBandWithFields = async function (bandObj, onProgress) {
    if (!bandObj?.NR_SEQUENCIA) throw new Error('[deleteBandWithFields] bandObj sem NR_SEQUENCIA.');

    // 1. Busca todos os campos da banda
    let fields = [];
    try { fields = await ctx.fetchFields(bandObj.NR_SEQUENCIA); } catch (e) {}

    // 2. Deleta cada campo sequencialmente
    for (let i = 0; i < fields.length; i++) {
      if (onProgress) onProgress(i + 1, fields.length);
      await ctx.deleteFieldObj(fields[i]);
    }

    // 3. Deleta a banda
    await ctx.deleteBandObj(bandObj);

    console.log('[Tasy PDF] deleteBandWithFields OK — banda:', bandObj.NR_SEQUENCIA, '| campos deletados:', fields.length);
    return { deletedFields: fields.length };
  };

  // Clona uma banda inteira — cria cópia da banda E de todos os seus campos.
  // Se fetchFields não retornar campos, clona só a banda.
  ctx.cloneBandObj = async function (bandObj) {
    if (!bandObj?.NR_SEQ_RELATORIO) throw new Error('[cloneBandObj] bandObj sem NR_SEQ_RELATORIO.');
    const SKIP = new Set(['NR_SEQUENCIA','DT_ATUALIZACAO','NM_USUARIO','_hashCode','PAGING_RN','NR_SEQ_APRESENTACAO']);

    // Cria a banda clone
    const bandOverrides = {};
    for (const [k, v] of Object.entries(bandObj)) {
      if (!SKIP.has(k)) bandOverrides[k] = v;
    }
    bandOverrides.DS_BANDA = (bandObj.DS_BANDA || 'Banda') + '_COPIA';
    const newBand = await ctx.insertBandObj(bandObj.NR_SEQ_RELATORIO, bandOverrides);

    // Clona os campos da banda original para a nova banda
    let fields = [];
    try { fields = await ctx.fetchFields(bandObj.NR_SEQUENCIA); } catch (e) {}

    const SKIP_FIELD = new Set(['NR_SEQUENCIA','DT_ATUALIZACAO','NM_USUARIO','QT_POS_ESQUERDA','DS_ALINHAMENTO','_hashCode','PAGING_RN','NR_SEQ_BANDA']);
    for (const f of fields) {
      const fo = {};
      for (const [k, v] of Object.entries(f)) {
        if (!SKIP_FIELD.has(k)) fo[k] = v;
      }
      fo.NR_SEQ_BANDA = newBand.NR_SEQUENCIA;  // aponta pro clone
      await ctx.insertFieldObj(newBand.NR_SEQUENCIA, fo);
    }

    console.log('[Tasy PDF] CLONE banda:', bandObj.NR_SEQUENCIA, '→', newBand.NR_SEQUENCIA, '| campos clonados:', fields.length);
    return newBand;
  };

  // Atualiza campos de uma banda existente (equivalente ao updateFieldObj para campos).
  // ex: await TasyPdf.updateBandObj(oldBand, { ...oldBand, QT_ALTURA: 40 })
  ctx.updateBandObj = async function (oldObj, newObj) {
    newObj.DS_COR_FUNDO   = ctx.hexToTasy(newObj.DS_COR_FUNDO   || oldObj.DS_COR_FUNDO);
    newObj.DS_COR_HEADER  = ctx.hexToTasy(newObj.DS_COR_HEADER  || oldObj.DS_COR_HEADER);
    newObj.DS_COR_FOOTER  = ctx.hexToTasy(newObj.DS_COR_FOOTER  || oldObj.DS_COR_FOOTER);
    newObj.DS_COR_QUEBRA  = ctx.hexToTasy(newObj.DS_COR_QUEBRA  || oldObj.DS_COR_QUEBRA);

    const header = buildDatasourceHeader('BANDA_RELATORIO', { pkValue: oldObj.NR_SEQ_RELATORIO });
    const http = ctx.getHttpService();
    if (!http) throw new Error('Angular não está pronto.');
    return http.post(
      '/TasyAppServer/resources/service/WebNativeDataSource/performAction',
      [header, { 'tipo': 'dsActionParams', 'valor': { 'acao': 'UPDATE', 'shouldClean': true, 'registro': newObj, 'registroOld': oldObj } }]
    );
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
          if (acao === 'UPDATE' || acao === 'INSERT' || acao === 'DELETE' || url.includes('saveInlineEdit')) {
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