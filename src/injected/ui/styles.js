window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    ctx.Styles = {
        inject: function () {
            if (document.getElementById('tasy-pdf-styles')) return;
            const style = document.createElement('style');
            style.id = 'tasy-pdf-styles';
            style.innerHTML = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                :root {
                    --tasy-bg-base: #09090b;
                    --tasy-bg-surface: rgba(24, 24, 27, 0.85);
                    --tasy-bg-surface-solid: #18181b;
                    --tasy-bg-hover: #27272a;
                    --tasy-border: #27272a;
                    --tasy-border-hover: #3f3f46;
                    --tasy-text-main: #fafafa;
                    --tasy-text-muted: #a1a1aa;
                    --tasy-accent: #ffffff;
                    --tasy-accent-text: #09090b;
                    --tasy-accent-hover: #e4e4e7;
                    --tasy-danger: #ef4444;
                    --tasy-danger-bg: rgba(239, 68, 68, 0.1);
                    --tasy-success: #10b981;
                    --tasy-success-bg: rgba(16, 185, 129, 0.1);
                    --tasy-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.4);
                    --tasy-shadow-lg: 0 20px 50px rgba(0, 0, 0, 0.7);
                    --tasy-radius-lg: 16px;
                    --tasy-radius: 12px;
                    --tasy-radius-sm: 8px;
                    --tasy-spring: cubic-bezier(0.16, 1, 0.3, 1);
                }

                #tasy-pdf-navbar, #tasy-modal-export, #tasy-modal-import-standalone, #tasy-modal-delete, #tasy-modal-create, #tasy-modal-delete-band, #tasy-pdf-toasts {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                }

                .tasy-res-item:hover, .tasy-hist-item:hover { background: var(--tasy-bg-hover) !important; }
                .tasy-band-item:hover { transform: translateY(-2px); box-shadow: var(--tasy-shadow-sm); border-color: var(--tasy-border-hover) !important; }
                .tasy-field-item:hover { transform: translateX(2px); border-color: var(--tasy-border-hover) !important; background: var(--tasy-bg-hover) !important; }
                
                #tasy-nav-search:focus { box-shadow: 0 0 0 2px rgba(255,255,255,0.1); }
                #tasy-ed-btn-back:hover { background: var(--tasy-bg-hover) !important; }
                #tasy-ed-btn-preview:hover, #ed-btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
                .tasy-form-ctrl:focus { border-color: var(--tasy-text-muted) !important; }
                
                select { 
                    color-scheme: dark !important; 
                    background: var(--tasy-bg-surface-solid) !important; 
                    color: var(--tasy-text-main) !important; 
                    border: 1px solid var(--tasy-border) !important; 
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23fafafa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 5 3 3 3-3'/%3E%3C/svg%3E") !important;
                    background-repeat: no-repeat !important;
                    background-position: right 12px center !important;
                    background-size: 16px !important;
                    padding-right: 32px !important;
                }
                select option { background: var(--tasy-bg-surface-solid) !important; color: var(--tasy-text-main) !important; }
                
                input[type="checkbox"] {
                    appearance: none !important; -webkit-appearance: none !important;
                    width: 16px !important; height: 16px !important;
                    background: var(--tasy-bg-surface-solid) !important;
                    border: 1px solid var(--tasy-border) !important;
                    border-radius: 4px !important; cursor: pointer !important;
                    display: inline-flex !important; align-items: center !important; justify-content: center !important;
                    transition: all 0.2s !important; position: relative !important; vertical-align: middle !important;
                    margin-right: 6px !important;
                }
                input[type="checkbox"]:checked { background: var(--tasy-text-main) !important; border-color: var(--tasy-text-main) !important; }
                input[type="checkbox"]:checked::after {
                    content: "" !important; width: 4px !important; height: 8px !important;
                    border: solid var(--tasy-bg-base) !important; border-width: 0 2px 2px 0 !important;
                    transform: rotate(45deg) !important; margin-bottom: 2px !important;
                }

                /* Premium Buttons */
                .tasy-btn-ghost {
                    background: transparent; color: var(--tasy-text-muted); padding: 6px 12px; border-radius: var(--tasy-radius-sm); font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent;
                }
                .tasy-btn-ghost:hover { background: var(--tasy-bg-hover); color: var(--tasy-text-main); border-color: var(--tasy-border); }

                /* Animações utilitárias */
                .tasy-fade-in { animation: tasyFadeIn 0.2s ease forwards; }
                @keyframes tasyFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .tasy-slide-up { animation: tasySlideUp 0.35s var(--tasy-spring) forwards; }
                @keyframes tasySlideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

                /* Modais: entrada suave */
                #tasy-modal-import-standalone > div,
                #tasy-modal-export > div,
                #tasy-modal-delete > div,
                #tasy-modal-delete-band > div,
                #tasy-modal-create > div {
                    animation: tasySlideUp 0.35s var(--tasy-spring) forwards;
                }

                /* Resultados do spotlight: fade in */
                #tasy-nav-results { transition: opacity 0.15s ease; }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                }

                /* Custom Scrollbar Premium */
                #tasy-pdf-navbar ::-webkit-scrollbar, 
                [id^="tasy-modal-"] ::-webkit-scrollbar,
                #tasy-editor-body::-webkit-scrollbar {
                    width: 7px !important;
                    height: 7px !important;
                }
                #tasy-pdf-navbar ::-webkit-scrollbar-track, 
                [id^="tasy-modal-"] ::-webkit-scrollbar-track,
                #tasy-editor-body::-webkit-scrollbar-track {
                    background: transparent !important;
                }
                #tasy-pdf-navbar ::-webkit-scrollbar-thumb, 
                [id^="tasy-modal-"] ::-webkit-scrollbar-thumb,
                #tasy-editor-body::-webkit-scrollbar-thumb {
                    background: var(--tasy-border) !important;
                    border-radius: 20px !important;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                #tasy-pdf-navbar ::-webkit-scrollbar-thumb:hover, 
                [id^="tasy-modal-"] ::-webkit-scrollbar-thumb:hover,
                #tasy-editor-body::-webkit-scrollbar-thumb:hover {
                    background: var(--tasy-text-muted) !important;
                    background-clip: content-box;
                }
                
                /* Firefox Support */
                #tasy-pdf-navbar, [id^="tasy-modal-"], #tasy-editor-body {
                    scrollbar-width: thin !important;
                    scrollbar-color: var(--tasy-border) transparent !important;
                }
            `;
            document.body.appendChild(style);
        }
    };
})(window.TasyPdf);
