window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    ctx.state = {
        level: 0,
        reportCode: null,
        reportSeq: null,
        bandSeq: null,
        bandName: null,
        activeField: null,
        rawBands: [],
        rawFields: [],
        fullReportData: null
    };

    ctx.historyData = [];
    ctx.bandClipboard = null;
    ctx.fieldClipboard = null;

    ctx.updateState = function (newState) {
        ctx.state = { ...ctx.state, ...newState };
    };

    ctx.resetState = function () {
        ctx.state = {
            level: 0,
            reportCode: null,
            reportSeq: null,
            bandSeq: null,
            bandName: null,
            activeField: null,
            rawBands: [],
            rawFields: [],
            fullReportData: null
        };
    };

})(window.TasyPdf);
