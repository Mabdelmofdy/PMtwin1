/**
 * Suppress known browser-extension promise noise in the console.
 * Extensions (password managers, Grammarly, devtools helpers, etc.) inject
 * content scripts that reject with "message channel closed" when the tab navigates
 * or the extension reloads. This is not PMTwin application code.
 */
(function installExtensionNoiseFilter(global) {
    if (global.__pmtwinExtensionNoiseFilterInstalled) return;
    global.__pmtwinExtensionNoiseFilterInstalled = true;

    var EXTENSION_NOISE = /message channel closed|asynchronous response by returning true|Extension context invalidated|Receiving end does not exist/i;

    function rejectionText(reason) {
        if (reason == null) return '';
        if (typeof reason === 'string') return reason;
        if (typeof reason.message === 'string' && reason.message) return reason.message;
        try {
            return String(reason);
        } catch (e) {
            return '';
        }
    }

    function isExtensionNoise(value) {
        return EXTENSION_NOISE.test(rejectionText(value));
    }

    function onUnhandledRejection(event) {
        if (!isExtensionNoise(event.reason)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    global.addEventListener('unhandledrejection', onUnhandledRejection, true);
    if (global.document && global.document !== global) {
        global.document.addEventListener('unhandledrejection', onUnhandledRejection, true);
    }
})(typeof window !== 'undefined' ? window : globalThis);
