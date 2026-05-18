/**
 * Live Server has no SPA fallback; deep links like /POC/matches 404 unless a physical
 * folder exists. Each route folder includes index.html that loads this script.
 */
(function () {
    var script = document.currentScript;
    var route = (script && script.getAttribute('data-route')) || '/';
    if (!route.startsWith('/')) route = '/' + route;
    var escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var base = location.pathname.replace(new RegExp(escaped + '(\\/.*)?$'), '');
    if (!base.endsWith('/')) base += '/';
    var target = base + 'index.html#' + route + (location.search || '');
    location.replace(target);
})();
