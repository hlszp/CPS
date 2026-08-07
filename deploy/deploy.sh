#!/bin/bash
set -e

echo "=========================================="
echo "  CPS Portal - 部署脚本"
echo "=========================================="

APP_DIR="/var/www/cps-portal"
APP_PORT=3000

# 1. 更新系统 & 安装依赖
echo "[1/8] 更新系统并安装基础依赖..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget git build-essential python3 nginx ufw > /dev/null 2>&1

# 2. 安装 Node.js 22.x
echo "[2/8] 安装 Node.js 22.x..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1
fi
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"

# 3. 安装 PM2
echo "[3/8] 安装 PM2..."
npm install -g pm2 > /dev/null 2>&1
echo "  PM2: $(pm2 --version)"

# 4. 创建应用目录 & 解压文件
echo "[4/8] 部署应用文件..."
mkdir -p $APP_DIR
cd /tmp
tar xzf cps-portal.tar.gz -C $APP_DIR

# 5. 安装项目依赖
echo "[5/8] 安装项目依赖..."
cd $APP_DIR/server
npm install --production 2>&1 | tail -3

# 6. 初始化数据库
echo "[6/8] 初始化数据库..."
node seed.js 2>&1 | tail -5

# 7. 配置 PM2
echo "[7/8] 启动应用服务..."
pm2 delete cps-portal 2>/dev/null || true
pm2 start index.js --name cps-portal
pm2 save 2>/dev/null
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1

# 8. 配置 Nginx
echo "[8/8] 配置 Nginx 反向代理..."
cp /tmp/nginx-cps-portal.conf /etc/nginx/sites-available/cps-portal
ln -sf /etc/nginx/sites-available/cps-portal /etc/nginx/sites-enabled/cps-portal
rm -f /etc/nginx/sites-enabled/default
nginx -t 2>&1
systemctl restart nginx
systemctl enable nginx

# 防火墙
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
echo "y" | ufw enable 2>/dev/null || true

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "  前端: http://$(curl -s ifconfig.me)"
echo "  后台: http://$(curl -s ifconfig.me)/admin"
echo "  API:  http://$(curl -s ifconfig.me)/api/health"
echo ""
echo "  PM2 状态:"
pm2 list
echo ""
