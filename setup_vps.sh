#!/bin/bash
# Ludo King - Automated VPS Deployment Script
# Supports: Ubuntu, Debian, CentOS, Rocky Linux

echo "=========================================================="
echo "🚀 Setting up Ludo King Download Page & Game on VPS..."
echo "=========================================================="

# 1. Update packages
sudo apt-get update -y || sudo yum update -y

# 2. Install Node.js 20 & Git & curl if missing
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs git || sudo yum install -y nodejs git
fi

# 3. Install PM2 for 24/7 background service
sudo npm install -g pm2

# 4. Create App Directory
APP_DIR="/var/www/lodutake"
sudo mkdir -p $APP_DIR
cd $APP_DIR

# 5. Clone or pull from GitHub
if [ -d ".git" ]; then
    echo "🔄 Pulling latest updates from GitHub..."
    sudo git pull origin main
else
    echo "📥 Cloning project from GitHub..."
    sudo git clone https://github.com/tanvir210111/lodu-take.git .
fi

# 6. Install dependencies
sudo npm install --production

# 7. Start/Restart with PM2 on Port 80 (Standard Web Port)
export PORT=80
sudo PORT=80 pm2 start server.js --name "lodutake" --update-env || sudo PORT=80 pm2 restart "lodutake"
sudo pm2 save
sudo pm2 startup

echo "=========================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "🌐 Live Download Page: http://lodutake.duckdns.org"
echo "🎮 Play Online Game:   http://lodutake.duckdns.org/play"
echo "📦 Direct APK Link:    http://lodutake.duckdns.org/Lodu_Master_Reward_Game.apk"
echo "=========================================================="
