#!/usr/bin/env node

/**
 * Simple HTTP server for PMTwin POC
 * Handles SPA routing by serving index.html for all routes
 * 
 * Usage: node server.js [port]
 * Default port: 5500
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.argv[2] || 5500;
const ROOT_DIR = __dirname;
/** URL prefix when the app is opened as /POC/... while files live at server root (override with PMTWIN_MOUNT). */
const MOUNT_PREFIX = (() => {
  const fromEnv = process.env.PMTWIN_MOUNT;
  if (fromEnv === '' || fromEnv === '/') return '';
  if (fromEnv) return fromEnv.startsWith('/') ? fromEnv.replace(/\/$/, '') : '/' + fromEnv.replace(/\/$/, '');
  const base = path.basename(ROOT_DIR);
  return base ? '/' + base : '';
})();

function splitMountPrefix(pathname) {
  if (!MOUNT_PREFIX || MOUNT_PREFIX === '/') {
    return { filePath: pathname, mountUsed: false };
  }
  if (pathname === MOUNT_PREFIX || pathname.startsWith(MOUNT_PREFIX + '/')) {
    const rest = pathname.slice(MOUNT_PREFIX.length) || '/';
    return { filePath: rest.startsWith('/') ? rest : '/' + rest, mountUsed: true };
  }
  return { filePath: pathname, mountUsed: false };
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(filePath, res, options = {}) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const mimeType = getMimeType(filePath);
    const headers = { 'Content-Type': mimeType };
    let body = data;
    // Match index.html meta CSP so devtools / favicon loads are not blocked when only HTTP headers apply.
    if (mimeType === 'text/html') {
      let html = data.toString('utf8');
      let htmlChanged = false;

      if (options.injectSpaMeta) {
        if (!html.includes('name="pmtwin-spa-server"')) {
          html = html.replace(/<head(\s[^>]*)?>/i, '$&\n    <meta name="pmtwin-spa-server" content="1">');
          htmlChanged = true;
        }
        const mountBase = options.mountBase || '/';
        if (!html.includes('name="pmtwin-mount"')) {
          html = html.replace(
            /(<meta name="pmtwin-spa-server"[^>]*>)/i,
            `$1\n    <meta name="pmtwin-mount" content="${mountBase}">`
          );
          htmlChanged = true;
        }
      }

      if (!html.includes('extension-noise-filter.js')) {
        html = html.replace(
          /<head(\s[^>]*)?>/i,
          '$&\n    <script src="src/core/init/extension-noise-filter.js"></script>'
        );
        htmlChanged = true;
      }

      if (htmlChanged) {
        body = Buffer.from(html, 'utf8');
      }
      headers['Cache-Control'] = 'no-cache, must-revalidate';
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://cdn.quilljs.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com https://cdn.quilljs.com",
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https: wss: ws:",
        "frame-src 'self' https:",
        "worker-src 'self' blob:"
      ].join('; ');
    }
    res.writeHead(200, headers);
    res.end(body);
  });
}

function isAppIndex(filePath) {
  return path.basename(filePath).toLowerCase() === 'index.html'
    && path.resolve(filePath) === path.join(ROOT_DIR, 'index.html');
}

function pathnameToDiskPath(pathname) {
  let p = pathname;
  if (p.startsWith('/')) p = p.substring(1);
  if (!p || p === '') p = 'index.html';
  return p;
}

function serveSpaIndex(res, mountUsed) {
  const indexPath = path.join(ROOT_DIR, 'index.html');
  const mountBase = mountUsed && MOUNT_PREFIX ? MOUNT_PREFIX + '/' : '/';
  serveFile(indexPath, res, { injectSpaMeta: true, mountBase });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { filePath: routedPath, mountUsed } = splitMountPrefix(parsedUrl.pathname || '/');
  const diskPath = pathnameToDiskPath(routedPath);
  const filePath = path.join(ROOT_DIR, diskPath);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      serveSpaIndex(res, mountUsed);
      return;
    }
    fs.stat(filePath, (err, stats) => {
      if (err) {
        serveSpaIndex(res, mountUsed);
        return;
      }
      if (stats.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        const mountBase = mountUsed && MOUNT_PREFIX ? MOUNT_PREFIX + '/' : '/';
        serveFile(indexPath, res, {
          injectSpaMeta: isAppIndex(indexPath),
          mountBase: isAppIndex(indexPath) ? mountBase : undefined
        });
        return;
      }
      const mountBase = mountUsed && MOUNT_PREFIX ? MOUNT_PREFIX + '/' : '/';
      serveFile(filePath, res, {
        injectSpaMeta: isAppIndex(filePath),
        mountBase: isAppIndex(filePath) ? mountBase : undefined
      });
    });
  });
});

server.listen(PORT, () => {
  const rootUrl = `http://127.0.0.1:${PORT}/`;
  const mountUrl = MOUNT_PREFIX ? `http://127.0.0.1:${PORT}${MOUNT_PREFIX}/` : null;
  console.log(`PMTwin POC server running at ${rootUrl}`);
  if (mountUrl) {
    console.log(`Also available under mount: ${mountUrl}`);
  }
  console.log(`Access login at: ${rootUrl}login`);
});
