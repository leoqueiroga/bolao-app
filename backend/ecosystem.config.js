module.exports = {
  apps: [
    {
      name: 'bolao-backend',
      script: 'dist/main.js',
      cwd: '/root/bolao-app/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      env_production: {
        NODE_ENV: 'production',
        PORT: 3334,
      },

      // Logs
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
