// Live Production Server: App Download Page Only (Browser Play Disabled)
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 10000;
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
setInterval(updateDuckDNS, 10 * 60 * 1000);

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
            downloadUrl: `http://${DUCKDNS_DOMAIN}.duckdns.org/Lodu_Master_Reward_Game.apk`,
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

    // Browser play disabled: redirect any attempt to access /play or /index.html back to /
    if (cleanUrl === '/play' || cleanUrl === '/index.html') {
        res.writeHead(302, { 'Location': '/' });
        res.end();
        return;
    }

    // Root / or /download serves Download Landing Page
    if (cleanUrl === '/' || cleanUrl === '/download') {
        const landingPath = path.join(__dirname, 'landing.html');
        if (fs.existsSync(landingPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(landingPath).pipe(res);
            return;
        }
    }

    // Static Assets (CSS, JS, images)
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
        // Fallback redirect to home download page
        res.writeHead(302, { 'Location': '/' });
        res.end();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`📱 LUDO KING APP DOWNLOAD SERVER LIVE ON PORT ${PORT}`);
    console.log(`🌐 Download Landing: http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}`);
    console.log(`📦 Direct APK URL:   http://${DUCKDNS_DOMAIN}.duckdns.org:${PORT}/Lodu_Master_Reward_Game.apk`);
    console.log(`🔒 Browser Play:     DISABLED (App Download Only)`);
    console.log(`=======================================================`);
});
