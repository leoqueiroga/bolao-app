# Bolão App

Monorepo com frontend (Vue 3 + Vite) e backend (NestJS).

- **Frontend** → Netlify
- **Backend** → VM Hostinger via PM2

---

## Estrutura

```
bolao-app/
├── frontend/   # Vue 3 + Vite → deploy no Netlify
└── backend/    # NestJS → deploy na VM com PM2
```

---

## Frontend — Netlify

### Variáveis de ambiente (configurar no painel da Netlify)

```env
VITE_API_URL=https://<seu-dominio-ou-ip>/api
VITE_SUPABASE_URL=https://jrirsdusbcckyyrmfilb.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_NAME="Bolão App"
VITE_APP_ENV=production
```

### Configurações de build (já no `netlify.toml`)

| Campo       | Valor         |
|-------------|---------------|
| Base dir    | `frontend`    |
| Build cmd   | `npm run build` |
| Publish dir | `frontend/dist` |

> No painel da Netlify: **Site settings → Build & deploy → Edit settings** e defina o **Base directory** como `frontend`.

---

## Backend — VM Hostinger com PM2

### 1. Configuração inicial (apenas na primeira vez)

```bash
# Instalar Node.js 20 LTS via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Instalar PM2 globalmente
npm install -g pm2

# Clonar o repositório
git clone git@github.com:leoqueiroga/bolao-app.git
cd bolao-app/backend

# Criar .env com as variáveis de produção
cp .env.example .env
nano .env

# Primeiro deploy
bash deploy.sh

# Configurar PM2 para iniciar com o sistema
pm2 startup
# (execute o comando que o PM2 mostrar)
pm2 save
```

### 2. Variáveis de ambiente no `.env` da VM

```env
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>

PORT=3000
NODE_ENV=production
FRONTEND_URL=https://<seu-site>.netlify.app
```

### 3. Deploy de atualizações

```bash
cd ~/bolao-app/backend
bash deploy.sh
```

O script faz: `git pull` → `npm ci` → `npm run build` → `pm2 reload`.

### 4. Comandos PM2 úteis

```bash
pm2 status              # ver processos rodando
pm2 logs bolao-backend  # ver logs em tempo real
pm2 restart bolao-backend
pm2 stop bolao-backend
```

### 5. Nginx como proxy reverso (recomendado)

Se quiser expor o backend na porta 80/443 sem passar a porta na URL, configure o Nginx:

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Depois, use Certbot para SSL:
```bash
sudo certbot --nginx -d api.seu-dominio.com
```
