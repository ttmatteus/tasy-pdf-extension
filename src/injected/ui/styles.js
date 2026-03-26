window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    ctx.Styles = {
        inject: function () {
            if (document.getElementById('tasy-pdf-styles')) return;
            const style = document.createElement('style');
            style.id = 'tasy-pdf-styles';
            style.innerHTML = `
                .tasy-res-item:hover, .tasy-btn-edit:hover, .tasy-btn-gen:hover { filter: brightness(1.2); }
                .tasy-band-item:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15) !important; filter: brightness(1.1); }
                #tasy-nav-search:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
                #tasy-ed-btn-back:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.2) !important; }
                #tasy-ed-btn-preview:hover, #ed-btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
                .tasy-form-ctrl:focus { border-color: #3b82f6 !important; background: rgba(59,130,246,0.05) !important; }
                
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                }
            `;
            document.body.appendChild(style);
        }
    };
})(window.TasyPdf);
