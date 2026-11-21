// Live Production Server: Game Download Landing, APK Direct Distribution & DuckDNS IP Auto-Sync
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
        console.warn('[DuckDNS] IP sync warning:', err.message);
    });
}

updateDuckDNS();
setInterval(updateDuckDNS, 10 * 60 * 1000); // Sync every 10 mins

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

// 2. HTTP Server Router
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const cleanUrl = req.url.split('?')[0];

    // API: Live OTA Check
    if (cleanUrl === '/api/ota/check') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            domain: `${DUCKDNS_DOMAIN}.duckdns.org`,
            version: '1.0.3',
            downloadUrl: `http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}/Lodu_Master_Reward_Game.apk`,
            updatedAt: new Date().toISOString()
        }));
        return;
    }

    // Direct APK Download route
    if (cleanUrl === '/Lodu_Master_Reward_Game.apk' || cleanUrl === '/download-apk') {
        const apkPath = path.join(__dirname, 'Lodu_Master_Reward_Game.apk');
        if (fs.existsSync(apkPath)) {
            const stat = fs.statSync(apkPath);
            res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename="Lodu_Master_Reward_Game.apk"'
            });
            fs.createReadStream(apkPath).pipe(res);
            return;
        }
    }

    // Route: Landing & Download Page (Root / or /download)
    if (cleanUrl === '/' || cleanUrl === '/download') {
        const landingPath = path.join(__dirname, 'landing.html');
        if (fs.existsSync(landingPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(landingPath).pipe(res);
            return;
        }
    }

    // Route: Play Game in Web (/play)
    if (cleanUrl === '/play') {
        const gamePath = path.join(__dirname, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(gamePath).pipe(res);
        return;
    }

    // Static Assets
    let filePath = path.join(__dirname, cleanUrl);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'www', cleanUrl);
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 LUDO KING DOWNLOAD & GAME SERVER LIVE ON PORT ${PORT}`);
    console.log(`🌐 Live Download Page: http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}`);
    console.log(`🎮 Play in Browser:    http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}/play`);
    console.log(`📦 Direct APK URL:     http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}/Lodu_Master_Reward_Game.apk`);
    console.log(`=======================================================`);
});
