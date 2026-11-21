// Live OTA Patch Server & DuckDNS Updater
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const DUCKDNS_DOMAIN = 'lodutake';
const DUCKDNS_TOKEN = 'e4e86164-a489-442f-b08c-0f6ff9981a21';

// 1. DuckDNS IP Auto-Updater
function updateDuckDNS() {
    const url = `https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`[DuckDNS] IP Update Response: ${data.trim()} (http://${DUCKDNS_DOMAIN}.duckdns.org)`);
        });
    }).on('error', (err) => {
        console.warn('[DuckDNS] Update error:', err.message);
    });
}

// Initial update and periodic every 15 minutes
updateDuckDNS();
setInterval(updateDuckDNS, 15 * 60 * 1000);

// MIME Types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.apk': 'application/vnd.android.package-archive'
};

// 2. HTTP Server
const server = http.createServer((req, res) => {
    // CORS headers for Live OTA
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // OTA API Check
    if (req.url === '/api/ota/check') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            liveDomain: `http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}`,
            version: '1.0.2',
            otaEnabled: true,
            patchDate: new Date().toISOString()
        }));
        return;
    }

    let filePath = path.join(__dirname, 'www', req.url === '/' ? 'index.html' : req.url);

    // Fallback if not in www
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Live OTA Server running on port ${PORT}`);
    console.log(`🌐 Local Access:    http://localhost:${PORT}`);
    console.log(`🌐 DuckDNS Access:  http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}`);
    console.log(`📡 Live OTA API:    http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}/api/ota/check`);
    console.log(`=======================================================`);
});
