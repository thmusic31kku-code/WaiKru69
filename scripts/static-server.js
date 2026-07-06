const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || process.env.PORT || 8000);
const baseDir = path.resolve(process.argv[3] || process.env.DIR || 'public');

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    try {
        const reqUrl = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(baseDir, reqUrl);
        if (reqUrl.endsWith('/')) filePath = path.join(baseDir, reqUrl, 'index.html');
        if (!filePath.startsWith(baseDir)) {
            res.writeHead(403); res.end('Forbidden'); return;
        }
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(404); res.end('Not found'); return;
            }
            if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');
            const ext = path.extname(filePath).toLowerCase();
            const cType = mime[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': cType });
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            stream.on('error', () => { res.writeHead(500); res.end('Server error'); });
        });
    } catch (e) {
        res.writeHead(500); res.end('Server error');
    }
});

res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

server.listen(port, () => {
    console.log(`Static server serving ${baseDir} at http://localhost:${port}/`);
});

process.on('SIGINT', () => { console.log('Shutting down'); process.exit(0); });