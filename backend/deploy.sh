#!/bin/bash
# Script de deploy do backend na VM Hostinger
# Execute na VM: bash deploy.sh

set -e

echo "==> Atualizando código..."
git pull origin main

echo "==> Instalando dependências..."
npm ci --omit=dev

echo "==> Compilando..."
npm run build

echo "==> Criando pasta de logs..."
mkdir -p logs

echo "==> Reiniciando com PM2..."
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

echo "==> Salvando lista de processos PM2..."
pm2 save

echo "==> Deploy concluído!"
pm2 status
